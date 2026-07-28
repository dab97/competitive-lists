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
import { AlertCircle, FileSpreadsheet, Upload, CheckCircle2 } from 'lucide-react';
import { parseExcelOrCSV } from '@/lib/csv-parser';
import { Applicant } from '@/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (applicants: Applicant[]) => void;
}

export default function ImportDialog({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles((prev) => {
        const prevNames = new Set(prev.map((f) => f.name));
        const newUnique = selected.filter((f) => !prevNames.has(f.name));
        return [...prev, ...newUnique];
      });
      setError(null);
      e.target.value = '';
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setError('Пожалуйста, выберите файлы для импорта');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const applicantMap = new Map<string, Applicant>();

      for (const file of files) {
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

      // Sort each applicant's priorities by the priorityRank stored in programScores
      // (parsed from the "Приоритет" column in the source file)
      const mergedApplicants = Array.from(applicantMap.values()).map((applicant) => {
        const sortedPriorities = [...applicant.priorities].sort((pidA, pidB) => {
          const rankA = applicant.programScores[pidA]?.priorityRank ?? 999;
          const rankB = applicant.programScores[pidB]?.priorityRank ?? 999;
          return rankA - rankB;
        });
        return { ...applicant, priorities: sortedPriorities };
      });

      onImport(mergedApplicants);
      onOpenChange(false);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при импорте файлов');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className='text-2xl'>Импорт списков поступающих</DialogTitle>
          <DialogDescription>
            Вы можете выбрать напрямую файлы **.XLS**, **.XLSX** или **.CSV**. Принимаются выгрузки 1С / приемной комиссии. Название файла автоматически привязывается к направлению. Приоритеты берутся из столбца «Приоритет» в каждом файле.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/30">
              <FileSpreadsheet className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium leading-none">
                {files.length > 0
                  ? `Выбрано файлов: ${files.length}`
                  : 'Выберите файлы XLS / XLSX / CSV'}
              </p>
              {files.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-muted-foreground border rounded p-2 bg-muted/20">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="truncate max-w-[280px]">{f.name}</span>
                      <span>{(f.size / 1024).toFixed(1)} КБ</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".xls,.xlsx,.csv,.txt,.tsv"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file')?.click()}
                  className="mt-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Выбрать файлы
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1">
            <div className="font-semibold text-blue-900 dark:text-blue-300">💡 Прямой импорт XLS / XLSX</div>
            <div>Загружайте файлы выгрузки **.XLS** напрямую из 1С / ПК. Столбец «Приоритет» из каждого файла используется автоматически для определения порядка поступления.</div>
          </div>

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
            disabled={files.length === 0 || isLoading}
            onClick={handleImport}
          >
            {isLoading ? (
              'Импортирую...'
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Импортировать ({files.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}