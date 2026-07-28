import { ReactNode, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, GraduationCap, UserRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  closeSheet?: () => void;
}

const NavItem = ({ icon, label, active, onClick, closeSheet }: NavItemProps) => {
  const handleClick = () => {
    onClick();
    if (closeSheet) {
      closeSheet();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-primary hover:text-accent-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

interface MainLayoutProps {
  children: ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function MainLayout({
  children,
  activePage,
  setActivePage,
}: MainLayoutProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const Navigation = () => (
    <div className="space-y-1">
      <NavItem
        icon={<LayoutDashboard className="h-4 w-4" />}
        label="Панель управления"
        active={activePage === "dashboard"}
        onClick={() => setActivePage("dashboard")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<Users className="h-4 w-4" />}
        label="Конкурсные списки"
        active={activePage === "lists"}
        onClick={() => setActivePage("lists")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<UserRound className="h-4 w-4" />}
        label="Список абитуриентов"
        active={activePage === "applicants"}
        onClick={() => setActivePage("applicants")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<Settings className="h-4 w-4" />}
        label="Настройки (КЦП)"
        active={activePage === "settings"}
        onClick={() => setActivePage("settings")}
        closeSheet={() => setIsSheetOpen(false)}
      />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm no-print">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:bg-primary/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 bg-gradient-to-b from-background to-muted/20 p-2 lg:p-6"
              >
                <div className="flex items-center gap-3 py-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-lg">РГСУ</span>
                </div>
                <div className="px-1 py-4">
                  <Navigation />
                </div>
              </SheetContent>
            </Sheet>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActivePage("dashboard")}
            >
              <img src="/favicon-96x96.png" className="h-10 w-10 object-contain" alt="РГСУ Logo" />              
              <div className="flex flex-col">
                <span className="font-bold text-2xl leading-7 hidden sm:inline text-primary dark:text-primary-foreground border-b">
                  РГСУ
                </span>
                <span className="font-bold text-lg sm:hidden">Списки</span>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Конкурсные списки
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden lg:block lg:w-64 border-r bg-gradient-to-b from-background to-muted/10 no-print">
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="px-3 py-6">
              <div className="mb-6 px-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg">РГСУ</span>
                  <span className="text-xs text-muted-foreground">
                    Система управления
                  </span>
                </div>
              </div>
              <div className="mb-3 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Основное меню
              </div>
              <Navigation />
              <Separator className="my-6" />
              <div className="px-4 py-3 bg-primary/5 rounded-lg border border-primary/10">
                <div className="text-xs text-muted-foreground mb-1">
                  Статус системы
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse-animation"></div>
                  <span className="text-sm font-medium text-green-600">
                    Активна
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="flex justify-center min-h-full">
            <div className="w-full max-w-7xl px-4 py-6 sm:px-6 fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
