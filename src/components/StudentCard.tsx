import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserCheck, UserRoundX, Trophy, AlertCircle, Award, CheckCircle2, XCircle, BookOpen } from "lucide-react";
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
    for (const [programId, applicants] of Object.entries(competitionLists)) {
      const applicant = applicants.find((a) => a.fullName === student.fullName);
      if (applicant && applicant.status === "admitted") {
        const program = programs.find((p) => p.id === programId);
        const priorityIndex = student.priorities.indexOf(programId);
        return {
          admitted: true,
          program,
          priority: priorityIndex + 1,
        };
      }
    }
    return { admitted: false, program: null, priority: null };
  };

  const admissionStatus = getAdmissionStatus();

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 card-hover"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к списку
        </Button>
      </div>

      <div className="gradient-border">
        <Card className="border-0">
          <CardHeader className="pb-6 pt-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5">
              <Avatar className="h-20 w-20 flex-shrink-0 border-2 border-primary/20">
                <AvatarImage src={getAvatarForStudent(student.fullName)} alt={student.fullName}/>
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl font-semibold">
                  {student.fullName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left space-y-2">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {student.fullName}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-card border border-primary/30 px-4 py-2 text-sm font-semibold">
                    <Trophy className="h-5 w-5 text-primary mr-2" />
                    <span className="text-muted-foreground text-sm mr-1">
                      Общий балл:
                    </span>
                    <strong className="text-primary text-base font-black">
                      {formatScore(student.totalScore)}
                    </strong>
                  </Badge>

                  {student.hasConsent ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 px-3 py-2 text-sm font-semibold border-green-300">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-600"/>
                      Согласие подано
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-3 py-2 text-sm font-semibold">
                      <XCircle className="h-4 w-4 mr-1 text-slate-400"/>
                      Без согласия
                    </Badge>
                  )}

                  {admissionStatus.admitted ? (
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 px-4 py-2 text-sm font-semibold">
                      <UserCheck className="h-5 w-5 mr-2 text-green-600"/>
                      Зачислен
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400 px-4 py-2 text-sm font-semibold">
                      <UserRoundX className="h-5 w-5 mr-2 text-red-700"/>
                      Не зачислен
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Subject Scores & Achievements Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {student.subjects && student.subjects.length > 0 ? (
                student.subjects.map((sub, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span>Предмет {idx + 1}</span>
                    </div>
                    <div className="font-semibold text-sm truncate">{sub.name}</div>
                    <div className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                      {formatScore(sub.score)}
                    </div>
                  </div>
                ))
              ) : null}

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
                  <Award className="h-3.5 w-3.5 text-amber-600" />
                  <span>Инд. достижения</span>
                </div>
                <div className="font-semibold text-sm text-amber-800 dark:text-amber-300">Баллы за ИД</div>
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">
                  +{formatScore(student.achievementScore)}
                </div>
              </div>
            </div>

            {admissionStatus.admitted && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-6 w-6 text-green-600" />
                  <h3 className="font-semibold text-xl text-green-800 dark:text-green-400">
                    Поздравляем! Студент зачислен
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-300 text-base">
                  <strong>{admissionStatus.program?.name}</strong> ({admissionStatus.program?.form})
                </p>
                <p className="font-normal text-sm text-green-600 dark:text-green-400 mt-1">
                  Зачислен по {admissionStatus.priority}-му приоритету
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Приоритеты поступления
              </h3>

              <div className="space-y-2 text-xl">
                {student.priorities.map((programId, index) => {
                  const program = programs.find((p) => p.id === programId);
                  const isAdmittedHere =
                    admissionStatus.admitted &&
                    admissionStatus.program?.id === programId;

                  if (!program) return null;

                  const admittedApplicants = competitionLists[programId]?.filter((a) => a.status === "admitted");
                  const minScore =
                    admittedApplicants && admittedApplicants.length > 0
                      ? Math.min(...admittedApplicants.map((a) => a.totalScore))
                      : null;

                  return (
                    <div key={programId} className="relative">
                      <Card
                        className={`transition-all ${
                          isAdmittedHere
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20 shadow-sm"
                            : "shadow-sm hover:shadow-md"
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                                  isAdmittedHere
                                    ? "bg-green-600 text-white"
                                    : "bg-primary/10 text-primary"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium leading-5">{program.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {program.form}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {isAdmittedHere ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 font-normal">
                                  Зачислен
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="font-normal">
                                  {index + 1}-й приоритет
                                </Badge>
                              )}
                              {minScore !== null && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Проходной балл:{" "}
                                  <strong className="text-foreground">
                                    {formatScore(minScore)}
                                  </strong>
                                </p>
                              )}
                            </div>
                          </div>
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
