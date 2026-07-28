import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Save, RotateCcw, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import { useAdmissionsStore } from '@/stores/admissions';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const { programs, updateProgramPlaces, resetProgramPlaces } = useAdmissionsStore();
  const [placesMap, setPlacesMap] = useState<Record<string, number>>(() =>
    programs.reduce((acc, p) => ({ ...acc, [p.id]: p.places }), {})
  );

  const handlePlacesChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setPlacesMap((prev) => ({
      ...prev,
      [id]: isNaN(num) ? 1 : Math.max(1, num),
    }));
  };

  const handleSaveProgram = (id: string, name: string, form: string) => {
    const newPlaces = placesMap[id] || 1;
    updateProgramPlaces(id, newPlaces);
    toast({
      title: 'Количество мест обновлено',
      description: `Для направления «${name} (${form})» установлено мест: ${newPlaces}`,
    });
  };

  const handleSaveAll = () => {
    Object.entries(placesMap).forEach(([id, places]) => {
      updateProgramPlaces(id, places);
    });
    toast({
      title: 'Все настройки сохранены',
      description: 'Конкурсные списки автоматически пересчитаны с новыми местами',
    });
  };

  const handleReset = () => {
    resetProgramPlaces();
    const defaultMap = programs.reduce((acc, p) => ({ ...acc, [p.id]: p.places }), {});
    setPlacesMap(defaultMap);
    toast({
      title: 'Настройки сброшены',
      description: 'Восстановлены стандартные значения контрольных цифр приёма',
    });
  };

  const totalPlaces = Object.values(placesMap).reduce((acc, count) => acc + (count || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Настройки контрольных цифр приёма</h1>
              <p className="text-muted-foreground text-sm">
                Управление количеством бюджетных мест по направлениям подготовки
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Сбросить к исходным
          </Button>
          <Button onClick={handleSaveAll} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Сохранить всё
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Суммарное количество бюджетных мест:</span>
        </div>
        <Badge variant="default" className="text-lg px-4 py-1 font-bold">
          {totalPlaces} мест
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {programs.map((program) => {
          const currentInput = placesMap[program.id] ?? program.places;
          const isChanged = currentInput !== program.places;

          return (
            <Card key={program.id} className="border transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-primary">
                      {program.name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Форма обучения: <span className="font-semibold text-foreground">{program.form}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Текущие: {program.places} мест
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 pt-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`places-${program.id}`} className="text-xs text-muted-foreground">
                      Количество мест (КЦП)
                    </Label>
                    <Input
                      id={`places-${program.id}`}
                      type="number"
                      min={1}
                      max={500}
                      value={currentInput}
                      onChange={(e) => handlePlacesChange(program.id, e.target.value)}
                      className="font-bold text-lg"
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveProgram(program.id, program.name, program.form)}
                    size="default"
                    variant={isChanged ? 'default' : 'outline'}
                    className="flex items-center gap-1.5"
                  >
                    {isChanged ? (
                      <>
                        <Save className="h-4 w-4" />
                        Сохранить
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Сохранено
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
