import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SchoolYearProvider } from "@/contexts/SchoolYearContext";
import { AppLayout } from "@/components/AppLayout";
import AuthPage from "./pages/Auth";
import Index from "./pages/Index";
import InscriptionsPage from "./pages/Inscriptions";
import InscriptionDetail from "./pages/InscriptionDetail";
import EncaissementsPage from "./pages/Encaissements";
import CampsPage from "./pages/Camps";
import BannieresPage from "./pages/Bannieres";
import ParametresPage from "./pages/Parametres";
import StatistiquesPage from "./pages/Statistiques";
import MessageriePage from "./pages/Messagerie";
import ModelesMessagesPage from "./pages/ModelesMessages";
import GestionTarifsPage from "./pages/GestionTarifs";
import AvisPage from "./pages/Avis";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function HashPathRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { pathname, search, hash, origin } = window.location;

    if (!hash && pathname !== "/") {
      window.location.replace(`${origin}/#${pathname}${search}`);
    }
  }, []);

  return null;
}

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SchoolYearProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/inscrits" element={<InscriptionsPage />} />
          <Route path="/inscrits/:id" element={<InscriptionDetail />} />
          <Route path="/formules" element={<CampsPage />} />
          <Route path="/encaissements" element={<EncaissementsPage />} />
          <Route path="/factures" element={<Navigate to="/encaissements" replace />} />
          <Route path="/tarifs" element={<GestionTarifsPage />} />
          <Route path="/avis" element={<AvisPage />} />
          <Route path="/messagerie" element={<MessageriePage />} />
          <Route path="/modeles-messages" element={<ModelesMessagesPage />} />
          <Route path="/personnaliser" element={<BannieresPage />} />
          <Route path="/statistiques" element={<StatistiquesPage />} />
          <Route path="/parametres" element={<ParametresPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </SchoolYearProvider>
  );
}

function AuthGuard() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <HashPathRedirect />
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthGuard />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </AuthProvider>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
