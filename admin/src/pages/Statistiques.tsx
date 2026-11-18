import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { useAgendas, useInscriptions, useParticipations, useFacturations, usePaiements, useCommunications, getSchoolYearFromDate, deriveSchoolYears } from "@/hooks/useSupabaseData";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend, LineChart, Line } from "recharts";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { formatXPF } from "@/lib/currency";
import { formatSchoolYear, getSchoolYearMonths } from "@/lib/school-year";
import { useEffect, useRef, useState } from "react";
import { MapPin, Globe, TrendingUp, Eye, BarChart2, ExternalLink } from "lucide-react";
import { getDayOfWeekTahiti, MONTH_NAMES, todayTahiti } from "@/lib/tahiti-date";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import "leaflet/dist/leaflet.css";

const LOCATIONS: Record<string, [number, number]> = {
  "papeete": [-17.5350, -149.5696], "faaa": [-17.5525, -149.6000], "faa'a": [-17.5525, -149.6000],
  "punaauia": [-17.5789, -149.6068], "pirae": [-17.5206, -149.5542], "arue": [-17.5068, -149.5330],
  "mahina": [-17.4967, -149.4935], "paea": [-17.6125, -149.6028], "papara": [-17.6563, -149.5550],
  "taravao": [-17.7600, -149.2800], "teva i uta": [-17.7000, -149.5000], "mataiea": [-17.7083, -149.4508],
  "moorea": [-17.5350, -149.8300], "teavaro": [-17.4830, -149.8166], "haapiti": [-17.5300, -149.9100],
  "afareaitu": [-17.5500, -149.7800], "paopao": [-17.4970, -149.8280], "papetoai": [-17.4850, -149.8660],
  "tahiti": [-17.5900, -149.4500], "papeari": [-17.7300, -149.4300], "hitiaa": [-17.5900, -149.2800],
  "tiarei": [-17.5600, -149.3200], "toahotu": [-17.7700, -149.2700], "teahupoo": [-17.8500, -149.2600],
  "afaahiti": [-17.7500, -149.2900],
};

function geocodeChild(child: any): [number, number] | null {
  const ville = (child.ville || "").toLowerCase().trim();
  const ile = (child.ile || "").toLowerCase().trim();
  const isTahitiMoorea = !ile || ile.includes("tahiti") || ile.includes("moorea") ||
    Object.keys(LOCATIONS).some(k => ville.includes(k));
  if (!isTahitiMoorea && ile && !["", "tahiti", "moorea"].includes(ile)) return null;
  if (ville && LOCATIONS[ville]) return LOCATIONS[ville];
  for (const [key, coords] of Object.entries(LOCATIONS)) {
    if (ville.includes(key) || key.includes(ville)) return coords;
  }
  if (ile.includes("moorea")) return LOCATIONS["moorea"];
  return [-17.535 + (Math.random() - 0.5) * 0.05, -149.57 + (Math.random() - 0.5) * 0.05];
}

const COLORS = [
  "hsl(234, 62%, 50%)", "hsl(14, 90%, 58%)", "hsl(152, 60%, 40%)",
  "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(199, 89%, 48%)", "hsl(340, 65%, 50%)"
];

// Supabase/PostgREST plafonne chaque requête à 1000 lignes par défaut : au-delà
// il faut paginer explicitement (avec un tri stable) sous peine de tronquer
// silencieusement les données les plus récentes.
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

// ── Hook stats de visites ──────────────────────────────────────────────────
function useWebStats() {
  return useQuery({
    queryKey: ["web_page_views"],
    queryFn: async () => {
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const since7d  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString();

      const sb = supabase as any;
      const [{ count: total30d }, { count: total7d }, byPage, byDay] = await Promise.all([
        sb.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", since30d),
        sb.from("page_views").select("*", { count: "exact", head: true }).gte("created_at", since7d),
        fetchAllRows<{ page: string }>((from, to) =>
          sb.from("page_views").select("page").gte("created_at", since30d).order("id", { ascending: true }).range(from, to)
        ),
        fetchAllRows<{ created_at: string }>((from, to) =>
          sb.from("page_views").select("created_at").gte("created_at", since30d).order("id", { ascending: true }).range(from, to)
        ),
      ]);

      // Pages les plus visitées
      const pageMap = new Map<string, number>();
      (byPage || []).forEach(r => { pageMap.set(r.page, (pageMap.get(r.page) || 0) + 1); });
      const topPages = Array.from(pageMap.entries())
        .map(([page, views]) => ({ page: page === "/" ? "Accueil" : page.replace(/^\//, ""), views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 8);

      // Visites par jour (30 derniers jours) — regroupées par jour calendaire Tahiti (UTC-10),
      // pas UTC, sinon les visites de l'après-midi/soir basculent dans la case du lendemain.
      const TAHITI_OFFSET_MS = 10 * 60 * 60 * 1000;
      const tahitiDateKey = (isoStr: string) => new Date(new Date(isoStr).getTime() - TAHITI_OFFSET_MS).toISOString().slice(0, 10);

      const dayMap = new Map<string, number>();
      (byDay || []).forEach(r => {
        const d = tahitiDateKey(r.created_at);
        dayMap.set(d, (dayMap.get(d) || 0) + 1);
      });
      // Remplir les jours manquants (calendrier Tahiti)
      const nowTahiti = new Date(Date.now() - TAHITI_OFFSET_MS);
      const dailyViews = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(nowTahiti.getTime() - (29 - i) * 86400000);
        const key = d.toISOString().slice(0, 10);
        return { day: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`, views: dayMap.get(key) || 0 };
      });

      return { total30d: total30d || 0, total7d: total7d || 0, topPages, dailyViews };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

const StatistiquesPage = () => {
  const { currentYear } = useSchoolYear();
  const { data: webStats } = useWebStats();
  const { data: agendas = [] } = useAgendas();
  const { data: inscriptions = [] } = useInscriptions();
  const { data: participations = [] } = useParticipations();
  const { data: facturations = [] } = useFacturations();
  const { data: paiements = [] } = usePaiements();
  const { data: communications = [] } = useCommunications();

  const yearAgendas = agendas.filter(a => getSchoolYearFromDate(a.debut) === currentYear);
  const yearAgendaIds = new Set(yearAgendas.map(a => a.id_agenda));
  const yearParticipations = participations.filter(p => p.id_agenda && yearAgendaIds.has(p.id_agenda));
  const yearFacts = facturations.filter(f => getSchoolYearFromDate(f.date_facturation) === currentYear);
  const yearPaiements = paiements.filter(p => getSchoolYearFromDate(p.date_paiement) === currentYear);
  const totalCA = yearFacts.reduce((s, f) => s + (f.montant || 0), 0);
  const totalEncaisse = yearPaiements.reduce((s, p) => s + (p.montant || 0), 0);

  const commMap = new Map(communications.map(c => [c.id_communication, c]));
  const sourceCountMap = new Map<string, number>();
  yearParticipations.forEach(p => {
    const insc = inscriptions.find(i => i.id_inscription === p.id_inscription);
    const comm = insc ? commMap.get(insc.id_communication || 0) : null;
    const source = comm?.information || comm?.information_courte || "Autre";
    sourceCountMap.set(source, (sourceCountMap.get(source) || 0) + 1);
  });
  const sourceStats = Array.from(sourceCountMap.entries()).map(([source, count]) => ({ source, inscriptions: count })).sort((a, b) => b.inscriptions - a.inscriptions);

  const months = getSchoolYearMonths(currentYear);
  const revenueData = months.map(m => {
    const facture = yearFacts.filter(f => f.date_facturation && f.date_facturation.slice(0, 7) === m.key).reduce((s, f) => s + (f.montant || 0), 0);
    const encaisse = yearPaiements.filter(p => p.date_paiement && p.date_paiement.slice(0, 7) === m.key).reduce((s, p) => s + (p.montant || 0), 0);
    return { month: m.label.split(" ")[0], facture, encaisse };
  });

  const campFill = yearAgendas.map(a => ({
    name: a.camp?.nom_court || a.infocourte || `#${a.id_agenda}`,
    inscrits: participations.filter(p => p.id_agenda === a.id_agenda).length,
    capacite: a.place_max || 0,
  })).sort((a, b) => b.inscrits - a.inscrits).slice(0, 10);

  const payTypeMap = new Map<string, number>();
  yearPaiements.forEach(p => { const t = p.type || "Autre"; payTypeMap.set(t, (payTypeMap.get(t) || 0) + (p.montant || 0)); });
  const payTypeData = Array.from(payTypeMap.entries()).map(([type, montant]) => ({ type, montant }));

  // ALL inscription forms including incomplete/drafts
  const allInscForms = inscriptions;
  const yearInscOnline = allInscForms.filter(i => getSchoolYearFromDate(i.date_formulaire) === currentYear);
  const monthlyInscData = months.map(m => {
    const count = yearInscOnline.filter(i => i.date_formulaire && i.date_formulaire.slice(0, 7) === m.key).length;
    return { month: m.label.split(" ")[0], inscriptions: count };
  });
  const totalInscOnline = yearInscOnline.length;
  const draftCount = yearInscOnline.filter(i => i.is_draft === true).length;
  const completeCount = totalInscOnline - draftCount;
  const avgPerMonth = totalInscOnline > 0 ? (totalInscOnline / 12).toFixed(1) : "0";
  const moisRecord = monthlyInscData.reduce((best, m) => m.inscriptions > best.inscriptions ? m : best, { month: "—", inscriptions: 0 });


  const inscWithPart = yearInscOnline.filter(i => participations.some(p => p.id_inscription === i.id_inscription)).length;
  const inscWithoutPart = totalInscOnline - inscWithPart;

  const allYears = deriveSchoolYears(agendas);
  const yearlyComp = allYears.slice(0, 4).map(y => {
    const yInscs = allInscForms.filter(i => getSchoolYearFromDate(i.date_formulaire) === y);
    return { year: y, inscriptions: yInscs.length };
  }).reverse();

  // Carte
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const [, setMapReady] = useState(false);
  const geoChildren = inscriptions
    .map(c => ({ ...c, coords: geocodeChild(c) }))
    .filter(c => c.coords !== null) as (typeof inscriptions[0] & { coords: [number, number] })[];

  useEffect(() => {
    if (!mapRef.current || geoChildren.length === 0) return;
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }
    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
      const map = L.map(mapRef.current!, { scrollWheelZoom: true }).setView([-17.55, -149.57], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);
      geoChildren.forEach(child => {
        L.marker(child.coords).addTo(map).bindPopup(`
          <div style="min-width:150px">
            <strong>${child.prenom} ${child.nom}</strong><br/>
            <span style="font-size:12px;color:#666">${child.ville || ""} ${child.ile || ""}</span><br/>
            ${child.telephone ? `<a href="tel:${child.telephone}" style="font-size:12px">${child.telephone}</a>` : ""}
            ${child.communication?.information_courte ? `<br/><span style="font-size:11px;color:#999">${child.communication.information_courte}</span>` : ""}
          </div>`);
      });
      leafletMap.current = map;
      setMapReady(true);
    });
    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [geoChildren.length]);

  const yearlyCA = allYears.slice(0, 4).map(y => {
    const yFacts = facturations.filter(f => getSchoolYearFromDate(f.date_facturation) === y);
    return { year: y, ca: yFacts.reduce((s, f) => s + (f.montant || 0), 0) };
  }).reverse();

  const today = todayTahiti();
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

  const partEvolution = months.map(m => {
    const count = yearParticipations.filter(p => {
      const agenda = agendas.find(a => a.id_agenda === p.id_agenda);
      return agenda?.debut && agenda.debut.slice(0, 7) === m.key;
    }).length;
    return { month: m.label.split(" ")[0], participations: count };
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Statistiques</h1>
        <p className="page-subtitle">Analyse détaillée — {formatSchoolYear(currentYear)}</p>
      </div>

      {/* ── Google Analytics ── */}
      <div className="stat-card space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-orange-500" />
            <h2 className="font-display font-bold text-base">Google Analytics</h2>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">G-KMHBKML5ED</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href="https://analytics.google.com/analytics/web/#/p472563800/reports/intelligenthome"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-400/30 text-xs font-medium hover:bg-orange-500/20 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ouvrir GA4
            </a>
            <a
              href="https://analytics.google.com/analytics/web/#/p472563800/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..startRow%3D0%26_r.explorerCard..rowsPerPage%3D10&r=all-pages-and-screens&ruid=all-pages-and-screens,life-cycle,engagement&collectionId=life-cycle"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs font-medium hover:bg-muted/80 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Pages vues
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div className="rounded-lg border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Intégration active</p>
            <p className="text-xs">Le tag GA4 est installé sur le site SmartClub. Les données sont collectées en temps réel.</p>
          </div>
          <div className="rounded-lg border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Événements suivis</p>
            <p className="text-xs">page_view à chaque navigation · scroll · clic · session_start · first_visit</p>
          </div>
          <div className="rounded-lg border bg-muted/10 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1">Rapports recommandés</p>
            <p className="text-xs">Engagement → Pages vues · Acquisition → Sources de trafic · Temps réel</p>
          </div>
        </div>
      </div>

      {/* ── Statistiques de visites web ── */}
      <div className="stat-card space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-display font-bold text-base">Visites site web</h2>
          <span className="text-xs text-muted-foreground ml-1">(site SmartClub — 30 derniers jours)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1"><Eye className="h-3 w-3" /> Pages vues / 30j</p>
            <p className="text-2xl font-bold font-display mt-1">{webStats?.total30d ?? "—"}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" /> Pages vues / 7j</p>
            <p className="text-2xl font-bold font-display mt-1">{webStats?.total7d ?? "—"}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Moy. / jour (30j)</p>
            <p className="text-2xl font-bold font-display mt-1">
              {webStats ? Math.round(webStats.total30d / 30) : "—"}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pages distinctes</p>
            <p className="text-2xl font-bold font-display mt-1">{webStats?.topPages.length ?? "—"}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Visites quotidiennes (30j)</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={webStats?.dailyViews || []} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="views" name="Pages vues" stroke="hsl(234, 62%, 50%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pages les plus visitées (30j)</p>
            {webStats?.topPages.length ? (
              <div className="space-y-1.5">
                {webStats.topPages.map((p, i) => {
                  const max = webStats.topPages[0].views;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-28 truncate text-muted-foreground shrink-0">{p.page}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round((p.views / max) * 100)}%` }} />
                      </div>
                      <span className="font-semibold w-8 text-right shrink-0">{p.views}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée encore — les visites s'accumuleront après déploiement.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Camps</p><p className="text-2xl font-bold font-display mt-1">{yearAgendas.length}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Participations</p><p className="text-2xl font-bold font-display mt-1">{yearParticipations.length}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avec participation</p><p className="text-2xl font-bold font-display mt-1">{inscWithPart}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CA Facturé</p><CurrencyDisplay amount={totalCA} size="lg" layout="stacked" className="mt-1 items-center" /></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Encaissé</p><CurrencyDisplay amount={totalEncaisse} size="lg" layout="stacked" className="mt-1 items-center" /></div>
      </div>

      {/* Taux de remplissage */}
      {agendaFillData.length > 0 && (
        <div className="stat-card space-y-3">
          <h3 className="font-display font-semibold text-sm">Taux de remplissage — {formatSchoolYear(currentYear)}</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Évolution CA / Encaissements</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatXPF(v)} /><Legend />
              <Bar dataKey="facture" name="Facturé" fill="hsl(234, 62%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="encaisse" name="Encaissé" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Répartition par source</h3>
          {sourceStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={sourceStats} dataKey="inscriptions" nameKey="source" cx="50%" cy="45%" outerRadius={90}
                  label={({ source, percent, inscriptions }) => `${source} ${(percent * 100).toFixed(0)}% (${inscriptions})`} labelLine={true} fontSize={10}>
                  {sourceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} inscriptions`, name]} /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Aucune donnée</p>}
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Remplissage des camps</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={campFill} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
              <Tooltip /><Bar dataKey="inscrits" name="Inscrits" fill="hsl(234, 62%, 50%)" radius={[0, 4, 4, 0]} /><Bar dataKey="capacite" name="Capacité" fill="hsl(220, 13%, 85%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Modes de paiement</h3>
          {payTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={payTypeData} dataKey="montant" nameKey="type" cx="50%" cy="50%" outerRadius={100}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {payTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatXPF(v)} /><Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground">Aucune donnée</p>}
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Évolution CA par année</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearlyCA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis dataKey="year" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatXPF(v)} /><Bar dataKey="ca" name="CA" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Évolution des participations</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={partEvolution} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Bar dataKey="participations" name="Participations" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <h2 className="font-display font-bold text-lg pt-4">Formulaires d'inscription (tous, y compris incomplets)</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total formulaires</p><p className="text-2xl font-bold font-display mt-1">{totalInscOnline}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Complets</p><p className="text-2xl font-bold font-display mt-1 text-emerald-600">{completeCount}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Brouillons</p><p className="text-2xl font-bold font-display mt-1 text-amber-500">{draftCount}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mois record</p><p className="text-2xl font-bold font-display mt-1">{moisRecord.month}</p><p className="text-xs text-muted-foreground">{moisRecord.inscriptions} formulaires</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sans participation</p><p className="text-2xl font-bold font-display mt-1">{inscWithoutPart}</p></div>
        <div className="stat-card text-center"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moyenne/mois</p><p className="text-2xl font-bold font-display mt-1">{avgPerMonth}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Formulaires par mois</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyInscData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Bar dataKey="inscriptions" name="Formulaires" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stat-card">
          <h3 className="font-display font-semibold text-sm mb-4">Comparaison annuelle</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearlyComp} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" /><XAxis dataKey="year" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} />
              <Tooltip /><Bar dataKey="inscriptions" name="Formulaires" fill="hsl(280, 60%, 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Carte — Tahiti & Moorea
          <span className="text-xs font-normal text-muted-foreground ml-1">{geoChildren.length} enfant(s) localisé(s)</span>
        </h3>
        <div className="rounded-lg border overflow-hidden" style={{ height: 420 }}>
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default StatistiquesPage;
