import { useAgendas, useCamps, useParticipations, useLieux, getSchoolYearFromDate, deriveSchoolYears } from "@/hooks/useSupabaseData";
import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { CalendarDays, Clock, MapPin, Users, Plus, Pencil, Trash2, Copy, CalendarCheck2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { formatSchoolYear } from "@/lib/school-year";
import { formatDateLongTahiti, getDayOfWeekTahiti, MONTH_NAMES, parseDateTahiti, todayTahiti } from "@/lib/tahiti-date";

function formatPeriod(debut: string | null, fin: string | null): string {
  if (!debut || !fin) return "—";
  const d = parseDateTahiti(debut);
  const f = parseDateTahiti(fin);
  if (!d || !f) return "—";
  const dMonth = MONTH_NAMES[d.getMonth()];
  const fMonth = MONTH_NAMES[f.getMonth()];
  if (d.getMonth() === f.getMonth() && d.getFullYear() === f.getFullYear()) {
    return `${dMonth} ${d.getFullYear()}`;
  }
  return `${dMonth} ${d.getFullYear()} → ${fMonth} ${f.getFullYear()}`;
}

interface AgendaFormData {
  id_camp: string; debut: string; fin: string; heure_debut: string; heure_fin: string; id_lieu: string; place_max: string; info: string; actif: string;
}
interface CampFormData {
  nom: string; nom_court: string; intitule: string; duree: string; age: string;
}

const emptyAgendaForm: AgendaFormData = { id_camp: "", debut: "", fin: "", heure_debut: "", heure_fin: "", id_lieu: "", place_max: "", info: "", actif: "1" };
const emptyCampForm: CampFormData = { nom: "", nom_court: "", intitule: "", duree: "", age: "" };

const CampsPage = () => {
  const { currentYear } = useSchoolYear();
  const { data: agendas = [], isLoading } = useAgendas();
  const { data: allCamps = [] } = useCamps();
  const { data: participations = [] } = useParticipations();
  const { data: lieux = [] } = useLieux();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [showStages, setShowStages] = useState(true);
  const [showAteliers, setShowAteliers] = useState(true);
  const [periodeFilter, setPeriodeFilter] = useState<"actif" | "passe">("actif");

  const [anneeActiveSaving, setAnneeActiveSaving] = useState(false);
  const [anneeActiveLocal, setAnneeActiveLocal] = useState<string | null>(null);

  const { data: pageConfigRow, isLoading: pcLoading } = useQuery({
    queryKey: ["page_config_ateliers"],
    queryFn: async () => {
      const { data } = await supabase.from("data_page_config").select("id, annee_active, id_camp").eq("page", "ateliers-periscolaires").maybeSingle();
      return data || null;
    },
  });

  const displayedAnneeActive = anneeActiveLocal ?? (pageConfigRow?.annee_active ?? "");

  const campForYear = (() => {
    if (!displayedAnneeActive) return null;
    const [sy] = displayedAnneeActive.split("-").map(Number);
    const found = agendas.find(a =>
      a.camp?.duree === "Hors vacances scolaires" &&
      a.debut && a.debut >= `${sy}-08-01` && a.debut < `${sy + 1}-08-01`
    );
    return found?.id_camp ?? null;
  })();

  const handleSaveAnneeActive = async () => {
    setAnneeActiveSaving(true);
    try {
      const payload: Record<string, unknown> = { annee_active: displayedAnneeActive || null };
      if (campForYear) payload.id_camp = campForYear;
      if (pageConfigRow?.id) {
        await supabase.from("data_page_config").update(payload).eq("id", pageConfigRow.id);
      } else {
        await supabase.from("data_page_config").insert({ page: "ateliers-periscolaires", ...payload });
      }
      await queryClient.invalidateQueries({ queryKey: ["page_config_ateliers"] });
      toast({ title: "Année active mise à jour" });
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setAnneeActiveSaving(false);
  };

  const [agendaOpen, setAgendaOpen] = useState(false);
  const [agendaForm, setAgendaForm] = useState<AgendaFormData>(emptyAgendaForm);
  const [editingAgendaId, setEditingAgendaId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [campOpen, setCampOpen] = useState(false);
  const [campForm, setCampForm] = useState<CampFormData>(emptyCampForm);
  const [editingCampId, setEditingCampId] = useState<number | null>(null);

  const isAtelier = (a: any) => a.camp?.duree === "Hors vacances scolaires";
  const isMoorea = (a: any) => !isAtelier(a) && (
    /moorea/i.test(a.lieu || "") || /moorea/i.test(a.camp?.nom || "")
  );

  const today = todayTahiti();

  const yearAgendas = agendas
    .filter(a => getSchoolYearFromDate(a.debut) === currentYear)
    .filter(a => (showStages && !isAtelier(a)) || (showAteliers && isAtelier(a)))
    .filter(a => periodeFilter === "actif" ? (a.fin || "") >= today : (a.fin || "") < today)
    .sort((a, b) => periodeFilter === "passe"
      ? (b.fin || "").localeCompare(a.fin || "")
      : (a.debut || "").localeCompare(b.debut || ""));

  const handleToggleActif = async (e: React.MouseEvent, agendaId: number, current: number | null) => {
    e.stopPropagation();
    const next = current === 1 ? 0 : 1;
    await supabase.from("data_agenda").update({ actif: next }).eq("id_agenda", agendaId);
    await queryClient.invalidateQueries({ queryKey: ["data_agenda_with_camp"] });
  };
  const sortedCamps = [...allCamps].sort((a, b) => b.id_camp - a.id_camp);

  const openNewAgenda = () => { setAgendaForm(emptyAgendaForm); setEditingAgendaId(null); setAgendaOpen(true); };
  const openEditAgenda = (a: any) => {
    setAgendaForm({ id_camp: a.id_camp ? String(a.id_camp) : "", debut: a.debut || "", fin: a.fin || "", heure_debut: a.heure_debut || "", heure_fin: a.heure_fin || "", id_lieu: a.lieu_id ? String(a.lieu_id) : "", place_max: a.place_max ? String(a.place_max) : "", info: a.info || "", actif: a.actif != null ? String(a.actif) : "1" });
    setEditingAgendaId(a.id_agenda); setAgendaOpen(true);
  };

  const handleSaveAgenda = async () => {
    setSaving(true);
    try {
      const selectedLieu = agendaForm.id_lieu ? lieux.find((l: any) => String(l.id) === agendaForm.id_lieu) : null;
      const payload = { id_camp: agendaForm.id_camp ? parseInt(agendaForm.id_camp) : null, debut: agendaForm.debut || null, fin: agendaForm.fin || null, heure_debut: agendaForm.heure_debut || null, heure_fin: agendaForm.heure_fin || null, lieu: selectedLieu?.nom || null, lieu_id: agendaForm.id_lieu ? parseInt(agendaForm.id_lieu) : null, place_max: agendaForm.place_max ? parseInt(agendaForm.place_max) : null, info: agendaForm.info || null, actif: parseInt(agendaForm.actif) };
      if (editingAgendaId) {
        await supabase.from("data_agenda").update(payload).eq("id_agenda", editingAgendaId);
      } else {
        const { data: max } = await supabase.from("data_agenda").select("id_agenda").order("id_agenda", { ascending: false }).limit(1);
        await supabase.from("data_agenda").insert({ ...payload, id_agenda: (max?.[0]?.id_agenda || 0) + 1 });
      }
      await queryClient.invalidateQueries({ queryKey: ["data_agenda_with_camp"] });
      toast({ title: editingAgendaId ? "Agenda modifié" : "Agenda créé" });
      setAgendaOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const openNewCamp = () => { setCampForm(emptyCampForm); setEditingCampId(null); setCampOpen(true); };
  const openEditCamp = (c: any) => { setCampForm({ nom: c.nom || "", nom_court: c.nom_court || "", intitule: c.intitule || "", duree: c.duree || "", age: c.age || "" }); setEditingCampId(c.id_camp); setCampOpen(true); };
  const openDuplicateCamp = (c: any) => { setCampForm({ nom: (c.nom || "") + " (copie)", nom_court: c.nom_court || "", intitule: c.intitule || "", duree: c.duree || "", age: c.age || "" }); setEditingCampId(null); setCampOpen(true); };

  const handleSaveCamp = async () => {
    setSaving(true);
    try {
      if (editingCampId) {
        await supabase.from("data_camp").update({ nom: campForm.nom, nom_court: campForm.nom_court, intitule: campForm.intitule, duree: campForm.duree, age: campForm.age || null }).eq("id_camp", editingCampId);
      } else {
        const { data: max } = await supabase.from("data_camp").select("id_camp").order("id_camp", { ascending: false }).limit(1);
        await supabase.from("data_camp").insert({ id_camp: (max?.[0]?.id_camp || 0) + 1, nom: campForm.nom, nom_court: campForm.nom_court, intitule: campForm.intitule, duree: campForm.duree, age: campForm.age || null });
      }
      await queryClient.invalidateQueries({ queryKey: ["data_camp"] });
      await queryClient.invalidateQueries({ queryKey: ["data_agenda_with_camp"] });
      toast({ title: editingCampId ? "Camp modifié" : "Camp créé" });
      setCampOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  const handleDeleteCamp = async (id: number) => {
    if (!confirm("Supprimer ce camp ?")) return;
    await supabase.from("data_camp").delete().eq("id_camp", id);
    await queryClient.invalidateQueries({ queryKey: ["data_camp"] });
    await queryClient.invalidateQueries({ queryKey: ["data_agenda_with_camp"] });
    toast({ title: "Camp supprimé" });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Camps / Agenda</h1>
        <p className="page-subtitle">{formatSchoolYear(currentYear)}</p>
      </div>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agenda">Agenda ({yearAgendas.length}{periodeFilter === "passe" ? " passés" : ""})</TabsTrigger>
          <TabsTrigger value="camps">Camps ({allCamps.length})</TabsTrigger>
          <TabsTrigger value="annee-active" className="flex items-center gap-1.5">
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Année active
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtre période */}
              <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
                <button
                  onClick={() => setPeriodeFilter("actif")}
                  className={`px-3 py-1.5 transition-colors ${periodeFilter === "actif" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  En cours &amp; à venir
                </button>
                <button
                  onClick={() => setPeriodeFilter("passe")}
                  className={`px-3 py-1.5 border-l border-border transition-colors ${periodeFilter === "passe" ? "bg-muted-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                  Passés
                </button>
              </div>

              {/* Filtre type */}
              {[
                { key: "stages", label: "Stages vacances", val: showStages, set: setShowStages, activeClass: "bg-primary/10 border-primary/40 text-primary", checkClass: "bg-primary border-primary" },
                { key: "ateliers", label: "Ateliers à l'année", val: showAteliers, set: setShowAteliers, activeClass: "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400", checkClass: "bg-blue-500 border-blue-500" },
              ].map(({ key, label, val, set, activeClass, checkClass }) => (
                <button key={key} onClick={() => set(v => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${val ? activeClass : "bg-muted border-border text-muted-foreground"}`}>
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${val ? checkClass : "border-muted-foreground/40"}`}>
                    {val && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 fill-white"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <Button onClick={openNewAgenda} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter agenda</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {yearAgendas.map(agenda => {
              const nb = participations.filter(p => p.id_agenda === agenda.id_agenda).length;
              const dayName = getDayOfWeekTahiti(agenda.debut);
              const atelier = isAtelier(agenda);
              const moorea = isMoorea(agenda);
              const ouvert = agenda.actif === 1;
              // Couleurs : atelier=bleu, moorea=orange, stage=vert
              const cardCls = atelier
                ? "border-blue-400/40 dark:border-blue-500/30 hover:ring-2 hover:ring-blue-400/40 bg-blue-500/5"
                : moorea
                  ? "border-orange-400/40 dark:border-orange-500/30 hover:ring-2 hover:ring-orange-400/40 bg-orange-500/5"
                  : "border-emerald-400/40 dark:border-emerald-500/30 hover:ring-2 hover:ring-emerald-400/40 bg-emerald-500/5";
              const accentText = atelier
                ? "text-blue-600 dark:text-blue-400"
                : moorea ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400";
              const accentBg = atelier
                ? "bg-blue-500/10"
                : moorea ? "bg-orange-500/10" : "bg-emerald-500/10";
              const accentBorder = atelier
                ? "border-blue-400/30"
                : moorea ? "border-orange-400/30" : "border-emerald-400/30";
              return (
                <div key={agenda.id_agenda}
                  className={`stat-card space-y-3 cursor-pointer transition-all ${cardCls}`}
                  onClick={() => navigate(`/inscrits?agenda=${agenda.id_agenda}`)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-sm">{agenda.camp?.nom || "Camp"}</h3>
                        {atelier && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${accentBg} ${accentText} border ${accentBorder} uppercase tracking-wide`}>Annuel</span>
                        )}
                        {moorea && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${accentBg} ${accentText} border ${accentBorder} uppercase tracking-wide`}>Moorea</span>
                        )}
                      </div>
                      {dayName && (
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded mt-1 uppercase ${accentBg} ${accentText}`}>{dayName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!atelier && (
                        <button
                          onClick={e => handleToggleActif(e, agenda.id_agenda, agenda.actif)}
                          title={ouvert ? "Cliquer pour fermer aux inscriptions" : "Cliquer pour ouvrir aux inscriptions"}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                            ouvert
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}>
                          {ouvert ? "Ouvert" : "Fermé"}
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); openEditAgenda(agenda); }} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground">{agenda.camp?.intitule || agenda.info || ""}</p>
                    {agenda.camp?.age && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${accentBg} ${accentText}`}>{agenda.camp.age}</span>
                    )}
                  </div>
                  {(agenda.heure_debut || agenda.heure_fin) && (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${accentBg} ${accentText} border ${accentBorder}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {agenda.heure_debut || "—"} → {agenda.heure_fin || "—"}
                    </div>
                  )}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDateLongTahiti(agenda.debut)}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground/70">→ {formatDateLongTahiti(agenda.fin)}</div>
                    {agenda.lieu && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(agenda.lieu)}`} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()} className="hover:text-primary hover:underline">{agenda.lieu}</a>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {nb}/{agenda.place_max || "∞"}</div>
                  </div>
                </div>
              );
            })}
            {yearAgendas.length === 0 && <p className="text-sm text-muted-foreground col-span-3">Aucun agenda pour cette année scolaire.</p>}
          </div>
        </TabsContent>

        <TabsContent value="camps" className="space-y-4">
          <div className="flex justify-end"><Button onClick={openNewCamp} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter camp</Button></div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs w-16">#</TableHead>
                  <TableHead className="font-semibold text-xs">Nom</TableHead>
                  <TableHead className="font-semibold text-xs">Nom court</TableHead>
                  <TableHead className="font-semibold text-xs">Intitulé</TableHead>
                  <TableHead className="font-semibold text-xs">Type</TableHead>
                  <TableHead className="font-semibold text-xs">Âge</TableHead>
                  <TableHead className="font-semibold text-xs w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCamps.map(c => (
                  <TableRow key={c.id_camp} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono text-muted-foreground">{c.id_camp}</TableCell>
                    <TableCell className="font-medium text-sm">{c.nom || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.nom_court || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.intitule || "—"}</TableCell>
                    <TableCell>
                      {c.duree === "Hors vacances scolaires" ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-400/30">Atelier à l'année</span>
                      ) : c.duree ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-400/30">Stage vacances</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.age || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditCamp(c)} className="p-1 hover:bg-muted rounded" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => openDuplicateCamp(c)} className="p-1 hover:bg-muted rounded" title="Dupliquer"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteCamp(c.id_camp)} className="p-1 hover:bg-destructive/10 text-destructive rounded" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="annee-active" className="space-y-4">
          <div className="max-w-lg space-y-5">
            <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-4">
              <div>
                <h3 className="font-display font-semibold text-sm mb-1">Groupes affichés sur le site SmartClub (page Tarifs & horaires)</h3>
                <p className="text-xs text-muted-foreground">
                  Sélectionne l'année scolaire dont les créneaux doivent apparaître dans le planning public.
                  Seules les séances de l'année choisie (actives) seront visibles aux familles.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Année scolaire active</label>
                {pcLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {deriveSchoolYears(agendas).map(yr => (
                      <button
                        key={yr}
                        onClick={() => setAnneeActiveLocal(yr)}
                        className={`px-4 py-2 rounded-lg border text-sm font-display font-bold transition-all ${
                          displayedAnneeActive === yr
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {yr.replace("-", " → ")}
                      </button>
                    ))}
                    {deriveSchoolYears(agendas).length === 0 && (
                      <p className="text-sm text-muted-foreground">Aucune année disponible (aucun agenda créé).</p>
                    )}
                  </div>
                )}
              </div>
              {displayedAnneeActive && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-700 dark:text-emerald-400">
                  <CalendarCheck2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <div>
                      Le planning affichera les ateliers de l'année scolaire&nbsp;
                      <strong>{displayedAnneeActive.replace("-", " → ")}</strong>
                    </div>
                    {campForYear ? (
                      <div className="mt-1 text-emerald-600 dark:text-emerald-500">
                        Camp détecté : <strong>#{campForYear} — {allCamps.find(c => c.id_camp === campForYear)?.nom || "…"}</strong>
                      </div>
                    ) : (
                      <div className="mt-1 text-amber-600 dark:text-amber-400">
                        Aucun atelier annuel trouvé pour cette année — vérifiez les agendas.
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Button onClick={handleSaveAnneeActive} disabled={anneeActiveSaving || !displayedAnneeActive} size="sm">
                {anneeActiveSaving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={agendaOpen} onOpenChange={setAgendaOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAgendaId ? "Modifier l'agenda" : "Nouvel agenda"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Camp associé</Label>
              <Select value={agendaForm.id_camp} onValueChange={v => setAgendaForm(f => ({ ...f, id_camp: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un camp…" /></SelectTrigger>
                <SelectContent>{allCamps.map(c => (
                  <SelectItem key={c.id_camp} value={String(c.id_camp)}>{c.nom}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date début</Label><Input type="date" value={agendaForm.debut} onChange={e => setAgendaForm(f => ({ ...f, debut: e.target.value }))} /></div>
              <div><Label>Date fin</Label><Input type="date" value={agendaForm.fin} onChange={e => setAgendaForm(f => ({ ...f, fin: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Heure début</Label><Input value={agendaForm.heure_debut} onChange={e => setAgendaForm(f => ({ ...f, heure_debut: e.target.value }))} placeholder="08:00" /></div>
              <div><Label>Heure fin</Label><Input value={agendaForm.heure_fin} onChange={e => setAgendaForm(f => ({ ...f, heure_fin: e.target.value }))} placeholder="16:00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lieu</Label>
                <Select value={agendaForm.id_lieu} onValueChange={v => setAgendaForm(f => ({ ...f, id_lieu: v }))}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un lieu…" /></SelectTrigger>
                  <SelectContent>{lieux.map((l: any) => (
                    <SelectItem key={l.id} value={String(l.id)}>{l.nom}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div><Label>Capacité max</Label><Input type="number" value={agendaForm.place_max} onChange={e => setAgendaForm(f => ({ ...f, place_max: e.target.value }))} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={agendaForm.info} onChange={e => setAgendaForm(f => ({ ...f, info: e.target.value }))} rows={3} /></div>
            <div>
              <Label>Statut inscriptions (stages)</Label>
              <Select value={agendaForm.actif} onValueChange={v => setAgendaForm(f => ({ ...f, actif: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ouvert</SelectItem>
                  <SelectItem value="0">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveAgenda} disabled={saving} className="w-full">{saving ? "Enregistrement…" : editingAgendaId ? "Modifier" : "Créer"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={campOpen} onOpenChange={setCampOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCampId ? "Modifier le camp" : "Nouveau camp"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Nom</Label><Input value={campForm.nom} onChange={e => setCampForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div><Label>Nom court</Label><Input value={campForm.nom_court} onChange={e => setCampForm(f => ({ ...f, nom_court: e.target.value }))} /></div>
            <div><Label>Intitulé</Label><Input value={campForm.intitule} onChange={e => setCampForm(f => ({ ...f, intitule: e.target.value }))} /></div>
            <div>
              <Label>Type</Label>
              <Select value={campForm.duree} onValueChange={v => setCampForm(f => ({ ...f, duree: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le type…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hors vacances scolaires">Atelier à l'année</SelectItem>
                  <SelectItem value="Stage vacances">Stage vacances</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Âge</Label><Input value={campForm.age} onChange={e => setCampForm(f => ({ ...f, age: e.target.value }))} placeholder="ex : 9 à 16 ans" /></div>
            <Button onClick={handleSaveCamp} disabled={saving || !campForm.nom} className="w-full">{saving ? "Enregistrement…" : editingCampId ? "Modifier" : "Créer"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampsPage;
