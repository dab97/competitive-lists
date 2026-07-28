import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Program } from "@/types";
import { Progress } from "@/components/ui/progress";
import { cn, formatScore } from "@/lib/utils";
import { useAdmissionsStore } from "@/stores/admissions";

interface ProgramCardProps {
  program: Program;
  onClick: () => void;
}

export function ProgramCard({ program, onClick }: ProgramCardProps) {
  const { competitionLists } = useAdmissionsStore();
  const programApplicants = competitionLists[program.id] || [];
  const admittedApplicants = programApplicants.filter(
    (a) => a.status === "admitted"
  );
  const admittedCount = admittedApplicants.length;
  const totalApplicants = programApplicants.length;

  const minScore =
    admittedApplicants.length > 0
      ? Math.min(...admittedApplicants.map((a) => a.totalScore))
      : null;

  const percentFilled = (admittedCount / program.places) * 100;
  const applicantsPerPlace =
    totalApplicants > 0 ? (totalApplicants / program.places).toFixed(1) : "0.0";

  return (
    <div className="fade-in">
      <Card
        className={cn(
          "card-hover cursor-pointer border shadow-sm bg-gradient-to-br from-card to-card/50 backdrop-blur-sm",
          percentFilled >= 100
            ? "border-0 ring-1 ring-accent-500/20 bg-gradient-to-br from-accent/10 to-card dark:from-green-950/20"
            : ""
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-2xl text-muted-foreground">
                {program.name}
              </h3>
              <div className="rounded-full bg-accent/15 text-accent px-3 text-xs font-normal border border-primary/20 transform -translate-y-px">
                {program.form}
              </div>
            </div>
            {percentFilled >= 100 && (
              <div className="rounded-full ring-1 ring-green-300 bg-green-100 text-green-700 px-2 py-1 text-xs font-normal dark:bg-green-900/30 dark:text-green-400">
                Заполнено
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                Заполнено мест
              </span>
              <span className="font-bold font-bebas text-primary text-xl">
                {admittedCount} / {program.places}
              </span>
            </div>

            <div className="space-y-2">
              <Progress
                value={percentFilled}
                className={cn(
                  "h-3 progress-glow",
                  percentFilled >= 100
                    ? "bg-green-100 dark:bg-green-900/20"
                    : "bg-muted"
                )}
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">
                  {percentFilled.toFixed(1)}% заполнено
                </span>
                <span className="font-semibold text-primary">
                  {applicantsPerPlace} чел/место
                </span>
              </div>
            </div>

            {minScore !== null && (
              <div className="flex items-center justify-between py-1 px-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-sm text-muted-foreground font-medium">
                  Проходной балл
                </span>
                <span className="font-bold text-primary text-3xl font-bebas">
                  {formatScore(minScore)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="w-full text-center">
            <div className="text-sm font-medium text-primary bg-primary/5 rounded-lg py-2 px-3 border border-primary/10">
              {totalApplicants} заявлений подано
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
