import { useState, Fragment } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Search, CheckCircle2, XCircle, Printer, Ban } from 'lucide-react';
import { Applicant, Program } from '@/types';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/lib/csv-parser';
import StudentCard from '@/components/StudentCard';
import { formatScore } from '@/lib/utils';
import { useAdmissionsStore } from '@/stores/admissions';

interface CompetitionListProps {
  applicants: Applicant[];
  program: Program;
}

export default function CompetitionList({ applicants, program }: CompetitionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Applicant | null>(null);
  const { programs: allPrograms } = useAdmissionsStore();

  // Таблица: полный конкурсный рейтинг, кроме тех кто принят на другое направление
  // Учёт согласия применяется только к подсчёту бюджетных мест (на уровне алгоритма)
  const visibleApplicants = applicants.filter(a => a.status !== 'admitted_elsewhere');

  const filteredApplicants = visibleApplicants.filter(
    (applicant) =>
      applicant.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Скрытые строки (принятые на другое направление)
  const hiddenElsewhere = applicants.filter(a => a.status === 'admitted_elsewhere').length;
  const hiddenCount = hiddenElsewhere;

  const admittedApplicants = applicants.filter(a => a.status === 'admitted');
  const admittedCount = admittedApplicants.length;
  const minScore = admittedApplicants.length > 0
    ? Math.min(...admittedApplicants.map(a => a.totalScore))
    : null;

  // Индекс последнего зачисленного в рейтинге — после него рисуется черта
  const lastAdmittedIndex = visibleApplicants.reduce(
    (lastIdx, a, idx) => (a.status === 'admitted' ? idx : lastIdx),
    -1
  );

  const handleExport = () => {
    exportToCSV(applicants, `${program.name}_${program.form}_список`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (selectedStudent) {
    return (
      <StudentCard
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
      />
    );
  }

  const currentDateStr = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="space-y-4 print-container">
      {/* Printable Header - Visible only when printing / saving to PDF */}
      <div className="print-only mb-6 text-black space-y-2 border-b-2 border-black pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon-96x96.png" className="h-12 w-12 object-contain" alt="РГСУ Logo" />
            <div>
              <div className="font-bold text-xl leading-none">РГСУ</div>
              <div className="text-[10px] text-gray-600 tracking-tight mt-0.5">Российский государственный социальный университет</div>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-base font-bold uppercase tracking-wide">Конкурсный список поступающих</h1>
            <p className="text-xs font-semibold text-gray-700">Направление: {program.name} ({program.form})</p>
          </div>
        </div>
        <div className="flex justify-between text-xs mt-3 pt-2 border-t border-gray-300">
          <div>
            <p><strong>Всего мест (бюджет):</strong> {program.places}</p>
            <p><strong>Зачислено:</strong> {admittedCount} из {program.places}</p>
          </div>
          <div className="text-right">
            <p><strong>Проходной балл:</strong> {minScore !== null ? formatScore(minScore) : '—'}</p>
            <p><strong>Дата формирования:</strong> {currentDateStr}</p>
          </div>
        </div>
      </div>

      {/* Screen Controls - Hidden during print */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center no-print">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ФИО..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleExport} className="flex-1 md:flex-none">
            <Download className="mr-2 h-4 w-4" />
            Экспорт списка (CSV)
          </Button>
          <Button variant="default" onClick={handlePrint} className="flex-1 md:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
            <Printer className="mr-2 h-4 w-4" />
            Печать / PDF
          </Button>
        </div>
      </div>

      {/* Screen Program Summary Card - Hidden during print */}
      <div className="rounded-md border bg-muted/40 p-4 text-sm flex flex-col md:flex-row justify-between gap-2 no-print">
        <div>
          <p><span className="font-semibold">Направление:</span> {program.name} ({program.form})</p>
          <p><span className="font-semibold">Всего бюджетных мест:</span> {program.places}</p>
        </div>
        <div className="text-left md:text-right">
          <p>
            <span className="font-semibold">Зачислено:</span> {admittedCount} из {program.places} (
            {((admittedCount / program.places) * 100).toFixed(1)}%)
          </p>
          {minScore !== null && (
            <p className="text-xs text-primary font-bold mt-0.5">
              Проходной балл: {formatScore(minScore)}
            </p>
          )}
        </div>
      </div>

      {/* Info banner: hidden rows */}
      {hiddenCount > 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-2 text-xs text-blue-700 dark:text-blue-300 no-print flex items-center gap-2">
          <span className="font-semibold">{hiddenCount}</span> абитурент(-ов) скрыто — зачислен(-ы) на другое направление.
        </div>
      )}

      {/* Competitive Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead className="w-12 text-center">№</TableHead>
              <TableHead className="min-w-[180px]">ФИО</TableHead>
              <TableHead className="text-center font-bold text-primary">Общий балл</TableHead>
              <TableHead className="text-center">Инд. дост.</TableHead>
              <TableHead className="text-center">Сумма ВИ</TableHead>
              <TableHead className="text-center">Предмет 1</TableHead>
              <TableHead className="text-center">Предмет 2</TableHead>
              <TableHead className="text-center">Предмет 3</TableHead>
              <TableHead className="text-center">Согласие</TableHead>
              <TableHead className="text-center">Приоритет</TableHead>
              <TableHead className="text-right pr-4">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length > 0 ? (
              filteredApplicants.map((applicant, index) => {
                const s1 = applicant.subjects?.[0];
                const s2 = applicant.subjects?.[1];
                const s3 = applicant.subjects?.[2];
                const priorityIndex = applicant.priorities.findIndex(p => p === program.id) + 1;
                // Позиция этого абитуриента в полном (нефильтрованном) рейтинге
                const originalIndex = visibleApplicants.indexOf(applicant);
                const showBudgetLine = lastAdmittedIndex >= 0 && originalIndex === lastAdmittedIndex;

                return (
                  <Fragment key={`${applicant.fullName}-${index}`}>
                    <TableRow>
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedStudent(applicant)}
                          className="text-left font-semibold hover:text-primary hover:underline transition-colors"
                        >
                          {applicant.fullName}
                        </button>
                      </TableCell>
                      <TableCell className="text-center font-black text-lg text-primary">
                        {formatScore(applicant.totalScore)}
                      </TableCell>
                      <TableCell className="text-center font-medium text-amber-600 dark:text-amber-400">
                        +{formatScore(applicant.achievementScore)}
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-700 dark:text-slate-300">
                        {formatScore(applicant.subjectsSum)}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s1 ? (
                          <div>
                            <div className="text-muted-foreground">{s1.name}</div>
                            <div className="font-semibold">{formatScore(s1.score)}</div>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s2 ? (
                          <div>
                            <div className="text-muted-foreground">{s2.name}</div>
                            <div className="font-semibold">{formatScore(s2.score)}</div>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {s3 ? (
                          <div>
                            <div className="text-muted-foreground">{s3.name}</div>
                            <div className="font-semibold">{formatScore(s3.score)}</div>
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="print:hidden">
                          {applicant.hasRefusal ? (
                            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-semibold" title="Отказ от зачисления">
                              <Ban className="w-4 h-4" />
                              Отказ
                            </span>
                          ) : applicant.hasConsent ? (
                            <span className="inline-flex items-center text-green-600 dark:text-green-400 font-bold" title="Согласие подано">
                              <CheckCircle2 className="w-5 h-5" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-slate-300 dark:text-slate-600" title="Согласие отсутствует">
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <span className="hidden print:inline font-bold text-xs text-black">
                          {applicant.hasRefusal ? "Отказ" : applicant.hasConsent ? "Да" : "Нет"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="print:hidden">
                          <Badge variant="outline" className="rounded-full px-2 py-0.5">
                            {priorityIndex > 0 ? priorityIndex : 1}
                          </Badge>
                        </span>
                        <span className="hidden print:inline font-semibold text-xs text-black">
                          {priorityIndex > 0 ? priorityIndex : 1}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="print:hidden">
                          {applicant.status === 'admitted' ? (
                            <Badge className="font-normal whitespace-nowrap bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-400">
                              Зачислен
                            </Badge>
                          ) : applicant.status === 'admitted_elsewhere' ? (() => {
                            const admProg = allPrograms.find(p => p.id === applicant.admittedToProgramId);
                            const label = admProg ? `${admProg.name} (${admProg.form})` : 'Другое направление';
                            return (
                              <Badge className="font-normal bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900 dark:text-blue-400 max-w-[160px] truncate">
                                {label}
                              </Badge>
                            );
                          })() : (
                            <Badge className="font-normal whitespace-nowrap bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-400">
                              Не зачислен
                            </Badge>
                          )}
                        </div>
                        <span className="hidden print:inline font-bold text-xs text-black">
                          {applicant.status === 'admitted'
                            ? "Зачислен"
                            : applicant.status === 'admitted_elsewhere'
                              ? (() => {
                                  const admProg = allPrograms.find(p => p.id === applicant.admittedToProgramId);
                                  return admProg ? `Зачислен (${admProg.name})` : "Зачислен (другое)";
                                })()
                              : "Не зачислен"}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Граница бюджетных мест */}
                    {showBudgetLine && (
                      <TableRow className="print:hidden hover:bg-transparent">
                        <TableCell colSpan={11} className="p-0 border-0">
                          <div className="relative flex items-center py-1">
                            <div className="flex-1 border-t-2 border-green-500" />
                            <span className="px-3 py-0.5 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/60 border border-green-300 dark:border-green-700 rounded-full whitespace-nowrap mx-2">
                              ✓ Граница бюджетных мест · {program.places} мест
                            </span>
                            <div className="flex-1 border-t-2 border-green-500" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {searchQuery ? `Не найдено результатов для "${searchQuery}"` : 'Нет данных'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Printable Footer / Signature Block - Visible only when printing */}
      <div className="print-only mt-12 pt-6 border-t border-black text-xs text-black space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <p><strong>Ответственный секретарь приёмной комиссии:</strong></p>
            <p className="mt-6">___________________________ / ___________________________</p>
          </div>
          <div className="text-right">
            <p><strong>Дата утверждения:</strong> «_____» ________________ 2026 г.</p>
            <p className="mt-2">М.П.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
