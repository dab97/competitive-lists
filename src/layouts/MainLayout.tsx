import { ReactNode, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  UserIcon,
  Settings02Icon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  Menu01Icon,
  Mortarboard02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItemProps {
  icon: ReactNode;
  label: string;
  active: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
  closeSheet?: () => void;
}

const NavItem = ({
  icon,
  label,
  active,
  isCollapsed = false,
  onClick,
  closeSheet,
}: NavItemProps) => {
  const handleClick = () => {
    onClick();
    if (closeSheet) {
      closeSheet();
    }
  };

  const buttonContent = (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-200",
        isCollapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      )}
    >
      <div className="shrink-0 flex items-center justify-center">{icon}</div>
      {!isCollapsed && <span className="truncate">{label}</span>}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium text-xs shadow-md">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent;
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
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  const Navigation = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <div className="space-y-1">
      <NavItem
        icon={<HugeiconsIcon icon={DashboardSquare01Icon} className="h-5 w-5" />}
        label="Панель управления"
        active={activePage === "dashboard"}
        isCollapsed={isCollapsed}
        onClick={() => setActivePage("dashboard")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<HugeiconsIcon icon={UserGroupIcon} className="h-5 w-5" />}
        label="Конкурсные списки"
        active={activePage === "lists"}
        isCollapsed={isCollapsed}
        onClick={() => setActivePage("lists")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<HugeiconsIcon icon={UserIcon} className="h-5 w-5" />}
        label="Список абитуриентов"
        active={activePage === "applicants"}
        isCollapsed={isCollapsed}
        onClick={() => setActivePage("applicants")}
        closeSheet={() => setIsSheetOpen(false)}
      />
      <NavItem
        icon={<HugeiconsIcon icon={Settings02Icon} className="h-5 w-5" />}
        label="Настройки (КЦП)"
        active={activePage === "settings"}
        isCollapsed={isCollapsed}
        onClick={() => setActivePage("settings")}
        closeSheet={() => setIsSheetOpen(false)}
      />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* Top Header */}
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm no-print">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile sheet menu trigger */}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10"
                  >
                    <HugeiconsIcon icon={Menu01Icon} className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-64 bg-gradient-to-b from-background to-muted/20 p-2 lg:p-6"
                >
                  <div className="flex items-center gap-3 py-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <HugeiconsIcon icon={Mortarboard02Icon} className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-bold text-lg">РГСУ</span>
                  </div>
                  <div className="px-1 py-4">
                    <Navigation />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Main Logo & Title (FIRST) */}
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => setActivePage("dashboard")}
              >
                <img
                  src="/favicon-96x96.png"
                  className="h-9 w-9 object-contain"
                  alt="РГСУ Logo"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xl leading-6 hidden sm:inline text-primary dark:text-primary-foreground border-b">
                    РГСУ
                  </span>
                  <span className="font-bold text-lg sm:hidden">Списки</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Конкурсные списки
                  </span>
                </div>
              </div>

              {/* Desktop Sidebar Collapse Button (AFTER logo) */}
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className="hidden lg:flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-primary/10 ml-1"
                  >
                    {isCollapsed ? (
                      <HugeiconsIcon icon={SidebarRight01Icon} className="h-5 w-5" />
                    ) : (
                      <HugeiconsIcon icon={SidebarLeft01Icon} className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isCollapsed ? "Развернуть меню" : "Свернуть меню"}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-4">
              <ModeToggle />
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Collapsible Desktop Sidebar */}
          <aside
            className={cn(
              "hidden lg:flex flex-col border-r bg-gradient-to-b from-background to-muted/10 no-print transition-all duration-300 ease-in-out relative",
              isCollapsed ? "w-16" : "w-64"
            )}
          >
            <ScrollArea className="flex-1">
              <div className={cn("py-4 transition-all", isCollapsed ? "px-2" : "px-3")}>
                {!isCollapsed && (
                  <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Основное меню
                  </div>
                )}

                <Navigation isCollapsed={isCollapsed} />

                <Separator className="my-6" />

                {/* System status */}
                {!isCollapsed ? (
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
                ) : (
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div className="flex justify-center py-2 cursor-default">
                        <div className="w-3 h-3 bg-green-500 rounded-full pulse-animation"></div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">Статус: Система активна</TooltipContent>
                  </Tooltip>
                )}
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
    </TooltipProvider>
  );
}
