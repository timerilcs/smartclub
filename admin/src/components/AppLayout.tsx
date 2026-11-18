import { ReactNode, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SchoolYearSelector } from "@/components/SchoolYearSelector";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo-icone.png";
import {
  LayoutDashboard, Users, CalendarDays, CreditCard, Settings,
  Menu, ChevronLeft, LogOut, Laptop, Clock, MapPin, BarChart3, MessageSquare,
  FileEdit, ImageIcon, Tag, Star, Trophy, Send, Monitor, ClipboardCheck, Timer, Wallet
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, path: "/" },
  { label: "Élèves & inscriptions", icon: Users, path: "/inscrits" },
  { label: "Formules & groupes", icon: CalendarDays, path: "/formules" },
  { label: "Encaissements", icon: CreditCard, path: "/encaissements" },
  { label: "Tarifs", icon: Tag, path: "/tarifs" },
  { label: "Avis", icon: Star, path: "/avis" },
  { label: "Messagerie", icon: MessageSquare, path: "/messagerie" },
  { label: "Modèles messages", icon: FileEdit, path: "/modeles-messages" },
  { label: "Personnaliser le site", icon: ImageIcon, path: "/personnaliser" },
  { label: "Statistiques", icon: BarChart3, path: "/statistiques" },
  { label: "Paramètres", icon: Settings, path: "/parametres" },
];

function CopyCode({ code }: { code: string }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ description: `Code ${code} copié !`, duration: 1500 });
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copier le code"
      className={cn(
        "font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors leading-tight",
        copied
          ? "bg-green-500/20 text-green-400"
          : "bg-sidebar-accent/40 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      {copied ? "✓" : code}
    </button>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut, user } = useAuth();

  return (
    <div className="flex min-h-screen w-full">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Link to="/" className={cn("flex items-center gap-3 px-4 h-16 border-b border-sidebar-border", collapsed && "justify-center")}>
          <img src={logo} alt="SmartClub" className="h-9 w-9 rounded-lg object-contain shrink-0" />
          {!collapsed && (
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-bold text-sm leading-tight">SmartClub</span>
              <span className="text-[11px] text-sidebar-muted">Administration</span>
            </div>
          )}
        </Link>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => {
            const active = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border">
          {!collapsed && user?.email && (
            <div className="px-4 py-2 text-[11px] text-sidebar-muted truncate">
              {user.email}
            </div>
          )}
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 text-[13px] font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
              collapsed && "justify-center px-2"
            )}
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full h-10 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>
      </aside>

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-[240px]"
      )}>
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-secondary">
              <Menu className="h-5 w-5" />
            </button>
            <SchoolYearSelector />
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
