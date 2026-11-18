import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { useAgendas, useInscriptions, useParticipations, useContacts, getSchoolYearFromDate, deriveSchoolYears } from "@/hooks/useSupabaseData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, CalendarDays, UserPlus, Phone, MessageSquare, ClipboardList, Monitor, ChevronRight, Star, Send } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatSchoolYear, getSchoolYearMonths } from "@/lib/school-year";
import { getDayOfWeekTahiti, MONTH_NAMES, todayTahiti, formatDateTahiti } from "@/lib/tahiti-date";
import { Link, useNavigate } from "react-router-dom";

function GenderIcon({ genre }: { genre: string | null | undefined }) {
  if (genre === "9") return <span title="Fille">👧</span>;
  if (genre === "10") return <span title="Garçon">👦</span>;
  return <span className="text-muted-foreground">—</span>;
}

const Dashboard = () => {
  const { currentYear } = useSchoolYear();
  const navigate = useNavigate();
  const { data: agendas = [] } = useAgendas();
  const { data: inscriptions = [] } = useInscriptions();
  const { data: participations = [] } = useParticipations();
  const { data: contacts = [] } = useContacts();

  const { data: pendingAvis = [] } = useQuery({
    queryKey: ["data_avis_pending_count"],
    queryFn: async () => {
      const { data } = await supabase.from("data_avis").select("id, nom, message, note, created_at").neq("approuve", 1);
      return data || [];
    },
  });

  const { data: pendingDemandes = [] } = useQuery({
    queryKey: ["kids_demandes_pending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kids_demandes")
        .select("id, id_inscription, id_agenda, message, created_at")
        .eq("statut", "pending")
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];

      const inscIds = [...new Set(data.map((d: any) => d.id_inscription))];
      const agendaIds = [...new Set(data.map((d: any) => d.id_agenda))];

      const [inscRes, agendaRes, campRes] = await Promise.all([
        supabase.from("data_inscription").select("id_inscription, prenom, nom").in("id_inscription", inscIds),
        supabase.from("data_agenda").select("id_agenda, id_camp, debut, fin").in("id_agenda", agendaIds),
        supabase.from("data_camp").select("id_camp, nom, nom_court"),
      ]);

      const inscMap = new Map((inscRes.data || []).map((i: any) => [i.id_inscription, i]));
      const campMap = new Map((campRes.data || []).map((c: any) => [c.id_camp, c]));
      const agendaMap = new Map((agendaRes.data || []).map((a: any) => [a.id_agenda, { ...a, camp: campMap.get(a.id_camp) }]));

      return data.map((d: any) => ({
        ...d,
        inscription: inscMap.get(d.id_inscription),
        agenda: agendaMap.get(d.id_agenda),
      }));
    },
  });

  const yearAgendas = agendas.filter(a => getSchoolYearFromDate(a.debut) === currentYear);
  const yearAgendaIds = new Set(yearAgendas.map(a => a.id_agenda));
  const yearParticipations = participations.filter(p => p.id_agenda && yearAgendaIds.has(p.id_agenda));
  const uniqueInscriptionIds = new Set(yearParticipations.map(p => p.id_inscription).filter(Boolean));
  const yearContacts = contacts.filter(c => getSchoolYearFromDate(c.date_formulaire) === currentYear);

  const yearFormulaires = inscriptions.filter(i => getSchoolYearFromDate(i.date_formulaire) === currentYear);
  const totalFormulaires = yearFormulaires.length;

  const months = getSchoolYearMonths(currentYear);

  const partEvolution = months.map(m => {
    const count = yearParticipations.filter(p => {
      const agenda = agendas.find(a => a.id_agenda === p.id_agenda);
      return agenda?.debut && agenda.debut.slice(0, 7) === m.key;
    }).length;
    return { month: m.label.split(" ")[0], participations: count };
  });

  const monthlyInscData = months.map(m => {
    const count = yearFormulaires.filter(i => i.date_formulaire && i.date_formulaire.slice(0, 7) === m.key).length;
    return { month: m.label.split(" ")[0], inscriptions: count };
  });

  const allYears = deriveSchoolYears(agendas);
  const yearlyComp = allYears.slice(0, 5).map(y => {
    const yInscs = inscriptions.filter(i => getSchoolYearFromDate(i.date_formulaire) === y);
    return { year: y, inscriptions: yInscs.length };
  }).reverse();

  const today = todayTahiti();

  // Widget agendas en cours / à venir
  const agendaActiveData = yearAgendas
    .filter(a => (a.fin || "") >= today)
    .map(a => {
      const nb = participations.filter(p => p.id_agenda === a.id_agenda && p.inscrit !== 1).length;
      const isAtelier = a.camp?.duree === "Hors vacances scolaires";
      const label = isAtelier
        ? getDayOfWeekTahiti(a.debut)
        : a.debut ? MONTH_NAMES[new Date(a.debut + "T12:00:00").getMonth()] : null;
      const isOngoing = (a.debut || "") <= today;
      return { ...a, nb, isAtelier, label, isOngoing };
    })
    .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));

  // Taux de remplissage
  const agendaFillData = yearAgendas
    .map(a => {
      const nb = participations.filter(p => p.id_agenda === a.id_agenda && p.inscrit !== 1).length;
      const max = a.place_max || 0;
      const pct = max > 0 ? Math.min(100, Math.round((nb / max) * 100)) : null;
      const isAtelier = a.camp?.duree === "Hors vacances scolaires";
      const label = isAtelier
        ? getDayOfWeekTahiti(a.debut)
        : a.debut ? MONTH_NAMES[new Date(a.debut + "T12:00:00").getMonth()] : null;
      const isPast = (a.fin || "") < today;
      return { ...a, nb, max, pct, isAtelier, label, isPast };
    })
    .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));

  // Ateliers du jour (filtrés par jour de la semaine pour les ateliers hebdomadaires)
  const todayDayName = getDayOfWeekTahiti(today);
  const todayAteliers = agendas.filter(
    a => a.actif === 1 && a.debut && a.fin && a.debut <= today && a.fin >= today
      && getDayOfWeekTahiti(a.debut) === todayDayName
  );
  const inscMap = new Map(inscriptions.map(i => [i.id_inscription, i]));
  const todayAteliersData = todayAteliers.map(agenda => {
    const agendaParticipations = participations.filter(p => p.id_agenda === agenda.id_agenda && p.inscrit !== 1);
    const children = agendaParticipations
      .map(p => {
        const insc = p.id_inscription ? inscMap.get(p.id_inscription) : null;
        if (!insc) return null;
        return { ...insc, ordinateur: p.ordinateur ?? null, pcNum: (insc as any).pc ?? null };
      })
      .filter(Boolean) as any[];
    const pcAFournir = agendaParticipations.filter(p => p.ordinateur === 2).length;
    return { agenda, totalEnfants: children.length, pcAFournir, children };
  });


  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Vue d'ensemble — {formatSchoolYear(currentYear)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Link to="/inscrits" className="stat-card hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inscrits</p>
              <p className="text-2xl font-bold font-display text-foreground">{uniqueInscriptionIds.size}</p>
              <p className="text-xs text-muted-foreground">participations</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
          </div>
        </Link>
        <Link to="/inscrits" className="stat-card hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formulaires</p>
              <p className="text-2xl font-bold font-display text-foreground">{totalFormulaires}</p>
              <p className="text-xs text-muted-foreground">inscriptions</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardList className="h-5 w-5" /></div>
          </div>
        </Link>
        <Link to="/camps" className="stat-card hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Camps</p>
              <p className="text-2xl font-bold font-display text-foreground">{yearAgendas.length}</p>
              <p className="text-xs text-muted-foreground">programmés</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><CalendarDays className="h-5 w-5" /></div>
          </div>
        </Link>
        <Link to="/avis" className="stat-card hover:ring-2 hover:ring-amber-400/30 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avis</p>
              <p className={`text-2xl font-bold font-display ${pendingAvis.length > 0 ? "text-amber-500" : "text-foreground"}`}>{pendingAvis.length}</p>
              <p className="text-xs text-muted-foreground">{pendingAvis.length > 0 ? "à valider" : "en attente"}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pendingAvis.length > 0 ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"}`}><Star className="h-5 w-5" /></div>
          </div>
        </Link>
        <Link to="/messagerie" className="stat-card hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacts</p>
              <p className="text-2xl font-bold font-display text-foreground">{yearContacts.length}</p>
              <p className="text-xs text-muted-foreground">formulaires</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserPlus className="h-5 w-5" /></div>
          </div>
        </Link>
        <Link to="/demandes-stages" className={`stat-card hover:ring-2 hover:ring-blue-400/30 transition-all cursor-pointer`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Demandes stages</p>
              <p className={`text-2xl font-bold font-display ${pendingDemandes.length > 0 ? "text-blue-500" : "text-foreground"}`}>{pendingDemandes.length}</p>
              <p className="text-xs text-muted-foreground">{pendingDemandes.length > 0 ? "en attente" : "aucune"}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pendingDemandes.length > 0 ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"}`}><Send className="h-5 w-5" /></div>
          </div>
        </Link>
      </div>

      {/* Widget agendas en cours / à venir */}
      {agendaActiveData.length > 0 && (
        <div className="stat-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              En cours &amp; à venir
            </h3>
            <Link to="/ateliers-actifs" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {agendaActiveData.map(a => (
              <Link
                key={a.id_agenda}
                to={`/inscrits?agenda=${a.id_agenda}`}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center hover:bg-muted/50 transition-colors ${a.isOngoing ? "bg-primary/5 border-primary/20" : "bg-muted/20"}`}
              >
                <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${a.isAtelier ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30" : "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30"}`}>
                  {a.isAtelier ? "Cursus" : "Stage"}
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-2">{a.camp?.nom_court || a.camp?.nom || "Agenda"}</span>
                <div className={`flex flex-col items-center justify-center rounded-md px-2 py-0.5 w-full ${a.isAtelier ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-primary/10 text-primary"}`}>
                  <span className="text-[11px] font-bold uppercase">{a.label || "—"}</span>
                  {a.heure_debut && <span className="text-[9px] opacity-70">{a.heure_debut}</span>}
                </div>
                <span className="text-2xl font-bold font-display text-foreground leading-none">{a.nb}</span>
                <span className="text-[10px] text-muted-foreground">inscrits</span>
                {a.isOngoing && <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wide">En cours</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Widget ateliers du jour */}
      {todayAteliersData.length > 0 && (
        <div className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              Ateliers aujourd'hui — PC à prévoir
              <span className="text-muted-foreground font-normal">({todayDayName})</span>
            </h3>
            <Link to="/ateliers-actifs" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {todayAteliersData.map(({ agenda, totalEnfants, pcAFournir, children }) => {
            const dayName = getDayOfWeekTahiti(agenda.debut);
            const pcPersonnel = totalEnfants - pcAFournir;
            return (
              <div key={agenda.id_agenda} className="space-y-3">
                <div className="flex items-center gap-3">
                  {dayName && (
                    <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg px-3 py-1.5 shrink-0 min-w-[58px] text-center">
                      <span className="text-xs font-bold font-display uppercase leading-tight">{dayName}</span>
                      {agenda.heure_debut && <span className="text-[10px] text-primary/70 leading-tight">{agenda.heure_debut}</span>}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">{agenda.camp?.nom_court || agenda.camp?.nom || "Atelier"}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" /> {totalEnfants} inscrits</span>
                      <span className="flex items-center gap-1 text-xs font-semibold"><Monitor className="h-3 w-3" /> {totalEnfants} PC à prévoir</span>
                      {pcAFournir > 0 && <span className="flex items-center gap-1 text-xs font-bold text-emerald-600"><Monitor className="h-3 w-3" /> {pcAFournir} à fournir</span>}
                      {pcPersonnel > 0 && <span className="text-xs text-destructive font-medium">{pcPersonnel} perso</span>}
                    </div>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {children.map((child: any) => {
                      const needsPC = child.ordinateur === 2;
                      const hasOwnPC = child.ordinateur === 1;
                      const pcNumber = child.pcNum;
                      const showPc = pcNumber != null && pcNumber >= 0;
                      return (
                        <Link
                          to={`/inscrits/${child.id_inscription}`}
                          key={child.id_inscription}
                          className="flex flex-col items-center gap-1 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-center cursor-pointer"
                        >
                          {showPc && (
                            <span className={`text-3xl font-bold font-display ${needsPC ? "text-emerald-600" : hasOwnPC ? "text-destructive" : "text-foreground"}`}>
                              {pcNumber}
                            </span>
                          )}
                          <span className="font-semibold text-sm">{child.prenom} {child.nom}</span>
                          {child.telephone ? (
                            <a href={`tel:${child.telephone}`} className="text-xs text-primary flex items-center gap-1 hover:underline" onClick={e => e.stopPropagation()}>
                              <Phone className="h-3 w-3" /> {child.telephone}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Taux de remplissage */}
      {agendaFillData.length > 0 && (
        <div className="stat-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm">Taux de remplissage — {formatSchoolYear(currentYear)}</h3>
            <Link to="/statistiques" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              Voir tout <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {agendaFillData.map(a => {
              const fillColor = a.pct === null ? "bg-muted" : a.pct >= 80 ? "bg-emerald-500" : a.pct >= 50 ? "bg-amber-400" : "bg-red-400";
              return (
                <Link
                  key={a.id_agenda}
                  to={`/inscrits?agenda=${a.id_agenda}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors ${a.isPast ? "bg-muted/10 opacity-70" : "bg-muted/20"}`}
                >
                  <div className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 shrink-0 min-w-[52px] text-center ${a.isAtelier ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-primary/10 text-primary"}`}>
                    <span className="text-[11px] font-bold font-display uppercase leading-tight">{a.label || "—"}</span>
                    {a.heure_debut && <span className="text-[9px] opacity-70 leading-tight">{a.heure_debut}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold truncate leading-tight">{a.camp?.nom_court || a.camp?.nom || "Agenda"}</span>
                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded border uppercase tracking-wide shrink-0 ${a.isAtelier ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30" : "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30"}`}>
                        {a.isAtelier ? "Cursus" : "Stage"}
                      </span>
                      {a.isPast && <span className="text-[9px] text-muted-foreground border border-border rounded px-1 py-0.5 uppercase">Passé</span>}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${a.pct ?? 0}%` }} />
                      </div>
                      <span className="text-lg font-bold font-display leading-none text-foreground shrink-0">{a.nb}</span>
                      {a.max > 0 && <span className="text-[10px] text-muted-foreground shrink-0">/ {a.max}</span>}
                      {a.pct !== null && <span className="text-[10px] text-muted-foreground shrink-0">{a.pct}%</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-3">Évolution des participations</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={partEvolution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="participations" name="Participations" fill="hsl(152, 60%, 40%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-3">Formulaires par mois</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyInscData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="inscriptions" name="Formulaires" fill="hsl(199, 89%, 48%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-3">Comparaison annuelle</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={yearlyComp} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="inscriptions" name="Formulaires" fill="hsl(280, 60%, 55%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Widget demandes de stages en attente */}
      {pendingDemandes.length > 0 && (
        <div className="stat-card border-blue-400/40 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Send className="h-4 w-4" />
              {pendingDemandes.length} demande{pendingDemandes.length > 1 ? "s" : ""} de stage en attente
            </h3>
          </div>
          <div className="space-y-2">
            {(pendingDemandes as any[]).slice(0, 5).map((d: any) => (
              <Link
                key={d.id}
                to={`/inscrits/${d.id_inscription}`}
                className="flex items-start gap-3 text-sm hover:bg-blue-500/5 rounded-md p-1 -mx-1 transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-xs">
                    {d.inscription ? `${d.inscription.prenom} ${d.inscription.nom}` : `#${d.id_inscription}`}
                  </span>
                  <span className="text-muted-foreground text-xs"> — {d.agenda?.camp?.nom_court || d.agenda?.camp?.nom || `Agenda #${d.id_agenda}`}</span>
                  {d.message && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.message}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {d.created_at ? formatDateTahiti(d.created_at) : ""}
                </span>
              </Link>
            ))}
            {pendingDemandes.length > 5 && (
              <p className="text-xs text-muted-foreground">+ {pendingDemandes.length - 5} autre(s)…</p>
            )}
          </div>
        </div>
      )}

      {/* Widget avis en attente */}
      {pendingAvis.length > 0 && (
        <div className="stat-card border-amber-400/40 bg-amber-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Star className="h-4 w-4" />
              {pendingAvis.length} avis en attente de validation
            </h3>
            <Link to="/avis" className="text-xs text-primary flex items-center gap-0.5 hover:underline">
              Valider <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(pendingAvis as any[]).slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < a.note ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-xs">{a.nom}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.message}</p>
                </div>
              </div>
            ))}
            {pendingAvis.length > 3 && (
              <p className="text-xs text-muted-foreground">+ {pendingAvis.length - 3} autre(s)…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
