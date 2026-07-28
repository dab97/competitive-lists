import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImportDialog from '@/components/ImportDialog';
import { ProgramCard } from '@/components/ProgramCard';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FileUploadIcon,
  RotateLeftIcon,
  UserGroupIcon,
  Analytics01Icon,
  Mortarboard02Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompetitionList from '@/components/CompetitionList';
import CompetitionLists from '@/pages/CompetitionLists';
import { useAdmissionsStore } from '@/stores/admissions';
import { Applicant } from '@/types';

export default function Dashboard() {
  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { applicants, competitionLists, programs, setApplicants, clearApplicants } = useAdmissionsStore();

  const handleImport = (importedApplicants: Applicant[]) => {
    setApplicants(importedApplicants);

    toast({
      title: 'Импорт успешно завершен',
      description: `Импортировано ${importedApplicants.length} поступающих`,
    });
  };

  const handleReset = () => {
    clearApplicants();
    setSelectedProgram(null);
    toast({
      title: 'Списки сброшены',
      description: 'Все загруженные поступающие и конкурсные списки очищены',
    });
  };

  const totalApplicants = applicants.length;
  const totalApplications = applicants.reduce((acc, a) => acc + (a.priorities?.length || 1), 0);
  const totalAdmitted = Object.values(competitionLists).reduce(
    (acc, list) => acc + list.filter(a => a.status === 'admitted').length,
    0
  );

  const selectedProgramObj = programs.find((p) => p.id === selectedProgram);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner (hidden on print) */}
      <div className="no-print bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border border-white/15">
        {/* Subtle glowing radial gradient background behind elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none select-none">
          <HugeiconsIcon icon={Mortarboard02Icon} className="w-96 h-96 text-white" />
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="space-y-3 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Конкурсные списки
            </h2>
            <p className="text-blue-100/90 text-base md:text-lg font-normal leading-relaxed">
              Управление конкурсными списками поступающих в РГСУ
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs md:text-sm font-medium text-white shadow-sm">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full pulse-animation"></div>
                <span>Система активна</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs md:text-sm font-medium text-blue-100 shadow-sm">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-blue-300" />
                <span>{totalApplicants} поступающих</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-xs md:text-sm font-medium text-blue-100 shadow-sm">
                <HugeiconsIcon icon={Analytics01Icon} className="h-4 w-4 text-blue-300" />
                <span>{totalApplications} заявлений</span>
              </div>
            </div>
          </div>

          {/* Clean Stacked Action Buttons with Thin Crisp Borders */}
          <div className="flex flex-col gap-3 w-full sm:w-64 shrink-0">
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl h-28 flex flex-col items-center justify-center gap-1.5 shadow-xl border border-white/50 hover:border-white transition-all duration-300 hover:scale-[1.03]"
            >
              <HugeiconsIcon icon={FileUploadIcon} className="h-8 w-8 text-white" />
              <div className="text-center leading-tight">
                <div className="text-sm font-bold">Импортировать</div>
                <div className="text-sm font-bold">список</div>
              </div>
            </Button>

            {totalApplicants > 0 && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full bg-red-500/5 hover:bg-red-500/30 text-red-100 hover:text-white border border-red-300/60 hover:border-red-300/60 rounded-2xl h-11 backdrop-blur-md transition-all text-xs font-semibold flex items-center justify-center gap-2 shadow-sm"
              >
                <HugeiconsIcon icon={RotateLeftIcon} className="h-4 w-4 text-red-200" />
                <span>Сбросить списки</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 no-print">
        <Card className="card-hover stats-card border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Всего поступающих</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-primary mb-1 font-bebas">{totalApplicants}</div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Подано заявлений: <span className="font-bold text-primary">{totalApplications}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              Актуальные данные
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover stats-card border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Зачислено</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <HugeiconsIcon icon={Mortarboard02Icon} className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-1 font-bebas">
              {totalAdmitted}
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Из <span className="font-bold">{totalApplicants}</span> поступивших
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
              На бюджетную форму
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover stats-card border shadow-sm md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Направления</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <HugeiconsIcon icon={Analytics01Icon} className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-blue-600 dark:text-blue-400 mb-1 font-bebas">
              {programs.length}
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Всего бюджетных мест:{' '}
              <span className="font-bold text-primary">
                {programs.reduce((acc, p) => acc + p.places, 0)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full inline-block"></span>
              Очередность приоритетов
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="no-print">
          <TabsTrigger value="overview">Обзор направлений</TabsTrigger>
          <TabsTrigger value="lists">Конкурсные списки</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {selectedProgram && selectedProgramObj ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setSelectedProgram(null)}
                className="mb-4 no-print"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 h-4 w-4" />
                Назад к списку направлений
              </Button>
              <CompetitionList
                applicants={competitionLists[selectedProgram] || []}
                program={selectedProgramObj}
              />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onClick={() => {
                    setSelectedProgram(program.id);
                    setActiveTab('lists');
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lists">
          <CompetitionLists />
        </TabsContent>
      </Tabs>

      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  );
}
