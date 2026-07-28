import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Search, CheckCircle2, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdmissionsStore } from '@/stores/admissions';
import { Applicant } from '@/types';
import StudentCard from '@/components/StudentCard';
import { compareApplicants } from '@/lib/admissions';
import { formatScore } from '@/lib/utils';

const ApplicantsList: React.FC = () => {
  const { applicants, competitionLists, programs } = useAdmissionsStore();
  const [selectedStudent, setSelectedStudent] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allStudents: Applicant[] = applicants;

  // Фильтрация студентов по поисковому запросу
  const filteredStudents = allStudents.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Сортировка по общим баллам, предметам, согласию и алфавиту
  const sortedStudents = [...filteredStudents].sort(compareApplicants);

  // Функция для определения статуса зачисления студента
  const getAdmissionStatus = (student: Applicant) => {
    for (const [programId, admittedApplicants] of Object.entries(competitionLists)) {
      const foundApplicant = admittedApplicants.find(a => a.fullName === student.fullName);
      if (foundApplicant && foundApplicant.status === 'admitted') {
        const program = programs.find(p => p.id === programId);
        const priorityIndex = student.priorities.indexOf(programId);
        return {
          admitted: true,
          programName: program?.name,
          programForm: program?.form,
          priority: priorityIndex + 1
        };
      }
    }
    return { admitted: false, programName: null, programForm: null, priority: null };
  };

  const handleViewStudent = (student: Applicant) => {
    setSelectedStudent(student);
  };

  const handleCloseDialog = () => {
    setSelectedStudent(null);
  };

  return (
    <div className="p-4">
      <Dialog open={!!selectedStudent} onOpenChange={handleCloseDialog} >
        <DialogContent className="sm:max-w-[800px] h-[94vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className='text-4xl'>Информация об абитуриенте</DialogTitle>
            <DialogDescription>
              Подробная информация о выбранном абитуриенте.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 pb-6">
            {selectedStudent && <StudentCard student={selectedStudent} onBack={handleCloseDialog} />}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-4xl font-bold">Список абитуриентов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск по имени..."
              className="w-full rounded-lg bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>ФИО</TableHead>
                <TableHead className="text-center">Сумма ВИ</TableHead>
                <TableHead className="text-center">Инд. дост.</TableHead>
                <TableHead className="text-center font-bold text-primary">Общий балл</TableHead>
                <TableHead className="text-center">Согласие</TableHead>
                <TableHead className="text-center">Приоритет</TableHead>
                <TableHead className="text-center">Статус</TableHead>
                <TableHead className="text-right w-[50px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStudents.map((student, index) => {
                const admissionStatus = getAdmissionStatus(student);
                return (
                  <TableRow key={student.fullName}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.fullName}</TableCell>
                    <TableCell className="text-center">{formatScore(student.subjectsSum)}</TableCell>
                    <TableCell className="text-center text-amber-600 dark:text-amber-400 font-semibold">
                      +{formatScore(student.achievementScore)}
                    </TableCell>
                    <TableCell className="text-center font-black text-primary text-base">
                      {formatScore(student.totalScore)}
                    </TableCell>
                    <TableCell className="text-center">
                      {student.hasConsent ? (
                        <CheckCircle2 className="w-5 h-5 mx-auto text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 mx-auto text-slate-300 dark:text-slate-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        {admissionStatus.priority && (
                          <Badge
                            variant={admissionStatus.priority === 1 ? 'default' : 'outline'}
                            className="rounded-full w-5 h-5 px-0.5 py-0.5 flex items-center justify-center"
                          >
                            {admissionStatus.priority}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {admissionStatus.admitted ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge className="bg-green-50 hover:bg-green-200 text-green-700 hover:text-green-900 dark:bg-green-900 dark:text-green-400 font-normal">
                                {`Зачислен по ${admissionStatus.priority}-му приоритету`}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{`${admissionStatus.programName} (${admissionStatus.programForm})`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-900 dark:bg-red-900 dark:text-red-400">
                          Не зачислен
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicantsList;
