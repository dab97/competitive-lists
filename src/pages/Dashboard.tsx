import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImportDialog from '@/components/ImportDialog';
import { ProgramCard } from '@/components/ProgramCard';
import { ArrowLeft, BarChart, GraduationCap, FileUp as FileUpload, Users, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Program } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CompetitionList from '@/components/CompetitionList';
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

  return (
    <div className="space-y-6">
      <div className="hero-pattern rounded-xl p-8 text-white mb-8 fade-in no-print">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div className="space-y-0">
            <h2 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Конкурсные списки
            </h2>
            <p className="text-blue-100 text-lg font-medium">
              Управление конкурсными списками поступающих в РГСУ
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-200 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full pulse-animation"></div>
                <span>Система активна</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{totalApplicants} поступающих (человек)</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>{totalApplications} поданных заявлений</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {totalApplicants > 0 && (
              <Button 
                onClick={handleReset} 
                variant="outline"
                className="w-full sm:w-auto bg-red-500/20 hover:bg-red-500/35 text-white border-red-300/40 backdrop-blur-sm transition-all shadow-md"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Сбросить списки
              </Button>
            )}
            <Button 
              onClick={() => setImportDialogOpen(true)} 
              variant="secondary"
              className="w-full sm:w-auto bg-white/15 hover:bg-white/25 border-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <FileUpload className="mr-2 h-4 w-4" />
              Импортировать список
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 no-print">
        <Card className="card-hover stats-card border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Всего поступающих</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-black text-primary mb-1 font-bebas">{totalApplicants}</div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Подано заявлений: <span className="font-bold text-primary">{totalApplications}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
              {totalAdmitted} зачислено
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover stats-card border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Направлений подготовки</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary mb-1 font-bebas">{programs.length}</div>
            <p className="text-sm text-muted-foreground">
              Активных программ
            </p>
          </CardContent>
        </Card>
        
        <Card className="card-hover stats-card border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-2xl font-semibold text-primary">Заполнено мест</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary mb-1 font-bebas">
              {totalAdmitted} / {programs.reduce((acc, p) => acc + p.places, 0)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-2 progress-glow">
                <div 
                  className="bg-gradient-to-r from-primary to-accent/80 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(((totalAdmitted / programs.reduce((acc, p) => acc + p.places, 0)) * 100), 100)}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-primary">
                {((totalAdmitted / programs.reduce((acc, p) => acc + p.places, 0)) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-center no-print">
          <TabsList>
            <TabsTrigger value="overview">Обзор направлений</TabsTrigger>
            <TabsTrigger value="lists">
              Конкурсные списки
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        </TabsContent>
        <TabsContent value="lists" className="space-y-4">
          {!selectedProgram ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onClick={() => setSelectedProgram(program.id)}
                />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <Button variant="outline" onClick={() => setSelectedProgram(null)} className="flex items-center gap-2 no-print">
                  <ArrowLeft className="h-4 w-4" />
                    Назад к направлениям
                </Button>

                <h3 className="text-xl font-semibold text-center md:text-left no-print">
                  {programs.find(p => p.id === selectedProgram)?.name} (
                  {programs.find(p => p.id === selectedProgram)?.form})
                </h3>
              </div>
              <CompetitionList 
                applicants={competitionLists[selectedProgram] || []} 
                program={programs.find(p => p.id === selectedProgram) as Program}
              />
            </>
          )}
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
