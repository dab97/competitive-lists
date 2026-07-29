import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  UserCheck01Icon,
  Cancel01Icon,
  Mortarboard02Icon,
  InformationCircleIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { Applicant } from "@/types";
import { programs } from "@/data/programs";
import { useAdmissionsStore } from "@/stores/admissions";
import { formatScore } from "@/lib/utils";

const maleAvatar = '/avatars/avatar-01.png';
const femaleAvatar = '/avatars/avatar-03.png';

const getGenderFromName = (fullName: string): 'male' | 'female' | 'unknown' => {
  const parts = fullName.toLowerCase().split(' ');
  const lastName = parts[0];
  const firstName = parts[1];

  if (lastName && (lastName.endsWith('ова') || lastName.endsWith('ева') || lastName.endsWith('ина') || lastName.endsWith('ая'))) {
    return 'female';
  }
  if (firstName && (firstName.endsWith('а') || firstName.endsWith('я'))) {
    return 'female';
  }
  if (lastName && (lastName.endsWith('ов') || lastName.endsWith('ев') || lastName.endsWith('ин') || lastName.endsWith('ый'))) {
    return 'male';
  }
  if (firstName && (firstName.endsWith('й') || firstName.endsWith('р') || firstName.endsWith('л'))) {
    return 'male';
  }
  return 'unknown';
};

const getAvatarForStudent = (studentName: string) => {
  const gender = getGenderFromName(studentName);
  return gender === 'female' ? femaleAvatar : maleAvatar;
};

interface StudentCardProps {
  student: Applicant;
  onBack: () => void;
}

export default function StudentCard({ student, onBack }: StudentCardProps) {
  const { competitionLists } = useAdmissionsStore();

  const getAdmissionStatus = () => {
    let admittedProgram = null;
    let admittedPriority = null;
    let isRefused = student.status === 'rejected' || Boolean(student.hasRefusal);

    for (const [programId, applicants] of Object.entries(competitionLists)) {
      const applicant = applicants.find((a) =>
        (student.id && a.id ? a.id === student.id : a.fullName === student.fullName)
      );
      if (applicant) {
        if (applicant.status === "admitted") {
          const program = programs.find((p) => p.id === programId);
          const priorityIndex = student.priorities.indexOf(programId);
          admittedProgram = program;
          admittedPriority = priorityIndex + 1;
        } else if (applicant.status === "rejected" || Boolean(applicant.hasRefusal)) {
          isRefused = true;
        }
      }
    }

    if (admittedProgram) {
      return { status: 'admitted' as const, program: admittedProgram, priority: admittedPriority };
    }
    if (isRefused) {
      return { status: 'rejected' as const, program: null, priority: null };
    }
    return { status: 'not_admitted' as const, program: null, priority: null };
  };

  const admissionStatus = getAdmissionStatus();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-4 no-print">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 card-hover rounded-xl"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          Назад к списку
        </Button>
      </div>

      <div className="gradient-border">
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-6 pt-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
              <Avatar className="h-20 w-20 flex-shrink-0 border-2 border-primary/20 shadow-xs">
                <AvatarImage src={getAvatarForStudent(student.fullName)} alt={student.fullName}/>
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl font-semibold">
                  {student.fullName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {student.fullName}
                </CardTitle>
                {student.uniqueCode && (
                  <p className="text-xs text-muted-foreground font-mono">
                    Код: <span className="font-semibold text-foreground/70">{student.uniqueCode}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {/* Scores Badge */}
                  {(() => {
                    const scores = Object.values(student.programScores ?? {}).map(ps => ps.totalScore);
                    const uniqueScores = [...new Set(scores)];
                    const minScore = uniqueScores.length > 0 ? Math.min(...uniqueScores) : student.totalScore;
                    const maxScore = uniqueScores.length > 0 ? Math.max(...uniqueScores) : student.totalScore;
                    const hasRange = minScore !== maxScore;
                    return (
                      <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-card border border-primary/30">
                        <HugeiconsIcon icon={Mortarboard02Icon} className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">
                          {hasRange ? 'Баллы:' : 'Балл:'}
                        </span>
                        <strong className="text-primary font-bold">
                          {hasRange
                            ? `${formatScore(minScore)} – ${formatScore(maxScore)}`
                            : formatScore(maxScore)}
                        </strong>
                      </Badge>
                    );
                  })()}

                  {/* Consent Badge (matches table column 1: Согласие / Отказ / Без согласия) */}
                  {student.hasRefusal || student.status === 'rejected' ? (
                    <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300/80">
                      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                      Отказ
                    </Badge>
                  ) : student.hasConsent ? (
                    <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300/80">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Согласие подано
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/70">
                      <HugeiconsIcon icon={CancelCircleIcon} className="h-4 w-4 text-slate-400 shrink-0" />
                      Без согласия
                    </Badge>
                  )}

                  {/* Admission Status Badge (matches table column 2: Зачислен / Не зачислен) */}
                  {admissionStatus.status === 'admitted' ? (
                    <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-400/80">
                      <HugeiconsIcon icon={UserCheck01Icon} className="h-4 w-4 text-emerald-700 dark:text-emerald-400 shrink-0"/>
                      Зачислен
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-9 px-3.5 py-1.5 text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-rose-100/90 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 border-rose-300/80">
                      <HugeiconsIcon icon={CancelCircleIcon} className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0"/>
                      Не зачислен
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {admissionStatus.status === 'admitted' && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <HugeiconsIcon icon={Mortarboard02Icon} className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-semibold text-lg text-emerald-900 dark:text-emerald-300">
                    Поздравляем! Студент зачислен
                  </h3>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 text-base">
                  <strong>{admissionStatus.program?.name}</strong> ({admissionStatus.program?.form})
                </p>
                <p className="font-normal text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  Зачислен по {admissionStatus.priority}-му приоритету
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold tracking-tight mb-3 flex items-center gap-2 text-foreground">
                <HugeiconsIcon icon={InformationCircleIcon} className="h-5 w-5 text-primary" />
                Приоритеты поступления
              </h3>

              <div className="space-y-2.5">
                {student.priorities.map((programId, index) => {
                  const program = programs.find((p) => p.id === programId);
                  const isAdmittedHere =
                    admissionStatus.status === 'admitted' &&
                    admissionStatus.program?.id === programId;

                  if (!program) return null;

                  const admittedApplicants = competitionLists[programId]?.filter((a) => a.status === "admitted");
                  const minScore =
                    admittedApplicants && admittedApplicants.length > 0
                      ? Math.min(...admittedApplicants.map((a) => a.totalScore))
                      : null;

                  const programScore = student.programScores?.[programId] ?? null;

                  return (
                    <div key={programId} className="relative">
                      <Card
                        className={`transition-all rounded-xl ${
                          isAdmittedHere
                            ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30 shadow-xs"
                            : "shadow-xs hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isAdmittedHere
                                    ? "bg-emerald-600 text-white"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-bold text-base leading-5 text-foreground">{program.name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {program.form}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {isAdmittedHere ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-semibold rounded-lg">
                                  Зачислен
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-medium text-xs rounded-lg">
                                  {index + 1}-й приоритет
                                </Badge>
                              )}
                              <p className="text-sm font-bold text-primary mt-1">
                                Мой балл: {programScore !== null ? formatScore(programScore.totalScore) : '—'}
                              </p>
                              {minScore !== null && (
                                <p className="text-xs text-muted-foreground">
                                  Проходной:{" "}
                                  <strong className={programScore !== null && programScore.totalScore >= minScore ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}>
                                    {formatScore(minScore)}
                                  </strong>
                                </p>
                              )}
                            </div>
                          </div>

                          {programScore && programScore.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                              {programScore.subjects.map((sub, si) => (
                                <div key={si} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg px-2.5 py-1">
                                  <span className="text-muted-foreground truncate max-w-[120px]">{sub.name}:</span>
                                  <span className="font-bold text-foreground">{formatScore(sub.score)}</span>
                                </div>
                              ))}
                              {programScore.achievementScore > 0 && (
                                <div className="flex items-center gap-1.5 text-xs bg-amber-100/80 dark:bg-amber-900/40 rounded-lg px-2.5 py-1">
                                  <span className="text-amber-800 dark:text-amber-300 font-medium">ИД:</span>
                                  <span className="font-bold text-amber-800 dark:text-amber-300">+{formatScore(programScore.achievementScore)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
