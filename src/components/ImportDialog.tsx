import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileSpreadsheet, Upload, CheckCircle2, X, Ban } from 'lucide-react';
import { parseExcelOrCSV, parseRefusalsFile, normalizeName } from '@/lib/csv-parser';
import { Applicant } from '@/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (applicants: Applicant[], stats?: { matchedRefusals: number; totalRefusals: number }) => void;
}

export default function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [listFiles, setListFiles] = useState<File[]>([]);
  const [refusalFile, setRefusalFile] = useState<File | null>(null);
  const [refusalFileCount, setRefusalFileCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleListFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setListFiles((prev) => {
        const prevNames = new Set(prev.map((f) => f.name));
        const newUnique = selected.filter((f) => !prevNames.has(f.name));
        return [...prev, ...newUnique];
      });
      setError(null);
      e.target.value = '';
    }
  };

  const handleRefusalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setRefusalFile(file);
      setRefusalFileCount(null);
      setError(null);
      e.target.value = '';
      // Parse immediately to get count preview
      try {
        const buf = await file.arrayBuffer();
        const { names, codes } = parseRefusalsFile(buf, file.name);
        // show whichever set is larger (codes preferred if available)
        setRefusalFileCount(codes.size > 0 ? codes.size : names.size);
      } catch {
        // silently ignore preview parse errors
      }
    }
  };

  const removeListFile = (name: string) => {
    setListFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const removeRefusalFile = () => {
    setRefusalFile(null);
    setRefusalFileCount(null);
  };

  const handleImport = async () => {
    if (listFiles.length === 0) {
      setError('Пожалуйста, выберите файлы списков для импорта');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // ── 1. Parse refusal names & codes ─────────────────────────────────────
      let refusalNames = new Set<string>();
      let refusalCodes = new Set<string>();
      if (refusalFile) {
        const refBuf = await refusalFile.arrayBuffer();
        const parsed = parseRefusalsFile(refBuf, refusalFile.name);
        refusalNames = parsed.names;
        refusalCodes = parsed.codes;
      }

      // ── 2. Parse & merge main list files ────────────────────────────────────
      const applicantMap = new Map<string, Applicant>();

      for (const file of listFiles) {
        const buffer = await file.arrayBuffer();
        const fileApplicants = parseExcelOrCSV(buffer, file.name);

        for (const app of fileApplicants) {
          const existing = applicantMap.get(app.fullName);
          if (existing) {
            const combinedPriorities = Array.from(new Set([...existing.priorities, ...app.priorities]));
            const betterSubjects = app.subjectsSum > existing.subjectsSum ? app : existing;
            const mergedSubjectsSum = Math.max(existing.subjectsSum, app.subjectsSum);
            const mergedAchievementScore = Math.max(existing.achievementScore, app.achievementScore);

            const mergedProgramScores = { ...existing.programScores };
            for (const [pid, ps] of Object.entries(app.programScores)) {
              const existingPs = mergedProgramScores[pid];
              if (!existingPs || ps.subjectsSum > existingPs.subjectsSum) {
                mergedProgramScores[pid] = ps;
              }
            }

            applicantMap.set(app.fullName, {
              ...existing,
              totalScore: mergedSubjectsSum + mergedAchievementScore,
              subjectsSum: mergedSubjectsSum,
              achievementScore: mergedAchievementScore,
              hasConsent: existing.hasConsent || app.hasConsent,
              hasRefusal: existing.hasRefusal || app.hasRefusal,
              hasPreference: existing.hasPreference || app.hasPreference,
              uniqueCode: existing.uniqueCode || app.uniqueCode,
              subjects: betterSubjects.subjects.length > 0 ? betterSubjects.subjects : (existing.subjects.length > 0 ? existing.subjects : app.subjects),
              russianScore: betterSubjects.russianScore,
              priorities: combinedPriorities,
              programScores: mergedProgramScores,
            });
          } else {
            applicantMap.set(app.fullName, app);
          }
        }
      }

      // ── 3. Sort priorities by priorityRank ───────────────────────────────────
      const mergedApplicants = Array.from(applicantMap.values()).map((applicant) => {
        const sortedPriorities = [...applicant.priorities].sort((pidA, pidB) => {
          const rankA = applicant.programScores[pidA]?.priorityRank ?? 999;
          const rankB = applicant.programScores[pidB]?.priorityRank ?? 999;
          return rankA - rankB;
        });
        return { ...applicant, priorities: sortedPriorities };
      });

      // ── 4. Apply refusals from separate file ─────────────────────────────────
      // Code match (exact, unambiguous) takes priority over normalised ФИО match
      let matchedRefusals = 0;
      const withRefusals = mergedApplicants.map((applicant) => {
        const matchedByCode = !!(applicant.uniqueCode && refusalCodes.has(applicant.uniqueCode));
        const matchedByName = refusalNames.has(normalizeName(applicant.fullName));
        if (matchedByCode || matchedByName) {
          matchedRefusals++;
          return { ...applicant, hasRefusal: true, hasConsent: false };
        }
        return applicant;
      });

      onImport(
        withRefusals,
        (refusalNames.size > 0 || refusalCodes.size > 0)
          ? { matchedRefusals, totalRefusals: Math.max(refusalNames.size, refusalCodes.size) }
          : undefined
      );
      onOpenChange(false);
      setListFiles([]);
      setRefusalFile(null);
      setRefusalFileCount(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при импорте файлов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setError(null);
    }
    onOpenChange(isOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className='text-2xl'>Импорт списков поступающих</DialogTitle>
          <DialogDescription>
            Загрузите файлы конкурсных списков и, при необходимости, файл отказов от поступления.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">

          {/* ── Блок 1: Конкурсные списки ─────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Конкурсные списки</span>
              <span className="text-xs text-muted-foreground">.XLS / .XLSX / .CSV</span>
            </div>

            <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-2">
              {listFiles.length > 0 ? (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {listFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-background rounded px-2 py-1 border">
                      <span className="truncate max-w-[280px] text-muted-foreground">{f.name}</span>
                      <button
                        onClick={() => removeListFile(f.name)}
                        className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Файлы не выбраны
                </p>
              )}

              <div>
                <Input
                  id="file-lists"
                  type="file"
                  accept=".xls,.xlsx,.csv,.txt,.tsv"
                  multiple
                  onChange={handleListFilesChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-lists')?.click()}
                  className="w-full"
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {listFiles.length > 0 ? `Добавить ещё (выбрано: ${listFiles.length})` : 'Выбрать файлы'}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="font-semibold text-blue-900 dark:text-blue-300">💡 </span>
              Название файла автоматически привязывается к направлению. Столбец «Приоритет» определяет порядок поступления.
            </div>
          </div>

          {/* ── Блок 2: Файл отказов ──────────────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-rose-500" />
              <span className="text-sm font-semibold">Файл отказов</span>
              <span className="text-xs text-muted-foreground">необязательно</span>
              {refusalFileCount !== null && (
                <span className="ml-auto text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-700">
                  {refusalFileCount} записей
                </span>
              )}
            </div>

            <div className={`rounded-lg border border-dashed p-3 space-y-2 transition-colors ${
              refusalFile
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-muted/20'
            }`}>
              {refusalFile ? (
                <div className="flex items-center justify-between text-xs bg-background rounded px-2 py-1.5 border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <Ban className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="truncate text-muted-foreground">{refusalFile.name}</span>
                    <span className="text-muted-foreground/60 shrink-0">
                      {(refusalFile.size / 1024).toFixed(1)} КБ
                    </span>
                  </div>
                  <button
                    onClick={removeRefusalFile}
                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Файл не выбран
                </p>
              )}

              <div>
                <Input
                  id="file-refusal"
                  type="file"
                  accept=".xls,.xlsx,.csv,.txt,.tsv"
                  onChange={handleRefusalFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-refusal')?.click()}
                  className={`w-full ${refusalFile ? 'border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30' : ''}`}
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {refusalFile ? 'Заменить файл отказов' : 'Выбрать файл отказов'}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-rose-50 dark:bg-rose-950/30 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800">
              <span className="font-semibold text-rose-700 dark:text-rose-400">🚫 </span>
              Абитуриенты из этого файла получат статус «Отказ» и будут исключены из конкурса на всех направлениях.
            </div>
          </div>

          {/* ── Ошибка ────────────────────────────────────────────────────── */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            disabled={listFiles.length === 0 || isLoading}
            onClick={handleImport}
          >
            {isLoading ? (
              'Импортирую...'
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Импортировать
                {refusalFile ? ` (${listFiles.length} + отказы)` : ` (${listFiles.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}