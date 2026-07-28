import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ProgramCard } from '@/components/ProgramCard';
import CompetitionList from '@/components/CompetitionList';
import { Button } from '@/components/ui/button';
import { useAdmissionsStore } from '@/stores/admissions';

export default function CompetitionLists() {
  const { competitionLists, programs } = useAdmissionsStore();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  if (!competitionLists || Object.keys(competitionLists).length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <h3 className="text-4xl font-semibold">Нет данных для отображения</h3>
          <p className="text-sm text-muted-foreground">
            Импортируйте список поступающих через панель управления для просмотра конкурсных списков
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
            
            <h3 className="text-3xl font-semibold text-center text-accent md:text-left">
              {programs.find(p => p.id === selectedProgram)?.name} (
              {programs.find(p => p.id === selectedProgram)?.form})
            </h3>
          </div>
          <CompetitionList 
            applicants={competitionLists[selectedProgram] || []} 
            program={programs.find(p => p.id === selectedProgram)!}
          />
        </>
      )}
    </div>
  );
}
