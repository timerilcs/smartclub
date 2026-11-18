import { usePaiements, useFacturations, useAgendas, useParticipations, useInscriptions, useEcole, useForfaits, useLieux, getSchoolYearFromDate } from "@/hooks/useSupabaseData";
import { getFactureHeuresLabel } from "@/lib/facture-heures";
import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { formatXPF } from "@/lib/currency";
import { formatSchoolYear, getSchoolYearMonths, getMonthKeyFromDate, getMonthKeyFromMois } from "@/lib/school-year";
import { CreditCard, Banknote, Building2, Plus, MessageSquare, Download, Send, Mail, FileText, TrendingUp, AlertCircle, Eye, EyeOff, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { generateFacturePdf, getFacturePdfBase64 } from "@/lib/facture-pdf";
import { getDayOfWeekTahiti, MONTH_NAMES, todayTahiti, formatDateTahiti } from "@/lib/tahiti-date";
import { sendEmail } from "@/lib/sendEmail";

const MONTH_NAMES_SHORT = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];

function ConsentImageIcon({ consent }: { consent: boolean | null | undefined }) {
  if (consent === true) return <Eye className="h-3 w-3 text-emerald-500 shrink-0" title="Droit à l'image : Autorisé" />;
  if (consent === false) return <EyeOff className="h-3 w-3 text-destructive shrink-0" title="Droit à l'image : Refusé" />;
  return <Eye className="h-3 w-3 text-muted-foreground/30 shrink-0" title="Droit à l'image : Non défini" />;
}

const EncaissementsPage = () => {
  const { currentYear } = useSchoolYear();
  const { data: paiements = [], isLoading } = usePaiements();
  const { data: facturations = [] } = useFacturations();
  const { data: agendas = [] } = useAgendas();
  const { data: participations = [] } = useParticipations();
  const { data: inscriptions = [] } = useInscriptions();
  const { data: ecole } = useEcole();
  const { data: forfaits = [] } = useForfaits();
  const { data: lieux = [] } = useLieux();
  const queryClient = useQueryClient();

  const [encOpen, setEncOpen] = useState(false);
  const [encForm, setEncForm] = useState({ id_facturation: "", montant: "", date_paiement: "", type: "", numero: "", info: "", id_inscription: "", date_depot: "" });
  const [saving, setSaving] = useState(false);

  // Création rapide d'une facture depuis une case vide du tableau
  const [factOpen, setFactOpen] = useState(false);
  const [factForm, setFactForm] = useState({ id_participation: "", id_inscription: "", montant: "", date_facturation: "", objet: "", id_mois: "" });
  const [factContext, setFactContext] = useState<{ enfant: string; campName: string; moisLabel: string } | null>(null);
  const [factSaving, setFactSaving] = useState(false);

  const [smsOpen, setSmsOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [smsRecipientName, setSmsRecipientName] = useState("");
  const [smsContext, setSmsContext] = useState<{ insc: any; montantFacture: number; campName: string; dayOrMonth: string } | null>(null);

  // Email dialog state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipientName, setEmailRecipientName] = useState("");
  const [emailSubject, setEmailSubject] = useState("Facture SmartClub");
  const [emailContext, setEmailContext] = useState<{ insc: any; montantFacture: number; campName: string; dayOrMonth: string; fact: any; agenda: any } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailAttachFacture, setEmailAttachFacture] = useState(true);

  const { data: smsTemplates = [] } = useQuery({
    queryKey: ["data_message_templates_sms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_message_templates")
        .select("*")
        .eq("channel", "sms")
        .order("label");
      if (error) throw error;
      return (data || []) as { id: number; label: string; body: string }[];
    },
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ["data_message_templates_email"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_message_templates")
        .select("*")
        .eq("channel", "email")
        .order("label");
      if (error) throw error;
      return (data || []) as { id: number; label: string; subject: string | null; body: string }[];
    },
  });

  const MSG_VARIABLES = [
    { tag: "{Prénom}", desc: "Prénom enfant" },
    { tag: "{Nom}", desc: "Nom enfant" },
    { tag: "{Prénom_légal}", desc: "Prénom responsable" },
    { tag: "{Nom_légal}", desc: "Nom responsable" },
    { tag: "{Ville}", desc: "Ville" },
    { tag: "{Montant_facture}", desc: "Montant de la facture" },
    { tag: "{Montant_dû}", desc: "Solde restant dû" },
    { tag: "{Programme}", desc: "Nom du programme" },
    { tag: "{Mois}", desc: "Mois / jour du programme" },
    { tag: "{Mois_facture}", desc: "Mois de la facture" },
    { tag: "{ID_Inscription}", desc: "N° d'inscription" },
  ];

  const yearAgendas = agendas
    .filter(a => getSchoolYearFromDate(a.debut) === currentYear)
    .sort((a, b) => (a.debut || "").localeCompare(b.debut || ""));
  const yearPaiements = paiements.filter(p => getSchoolYearFromDate(p.date_paiement) === currentYear);
  const totalEncaisse = yearPaiements.reduce((s, p) => s + (p.montant || 0), 0);

  // Charges de salle : 5 000 F par séance d'atelier (2 H, 3 séances/mois de sept à juin) et 45 000 F par stage vacances (forfait, indépendant du lieu)
  const CHARGE_SALLE_ATELIER_SEANCE = 5000; // par séance de 2 H
  const CHARGE_SALLE_STAGE = 45000; // par stage, forfaitaire
  const SEANCES_PAR_MOIS_ATELIER = 3; // 3 x 2 H par mois
  const MOIS_CURSUS_ACTIFS = 10; // sept à juin

  const lieuMap = new Map(lieux.map((l: any) => [l.id, l]));
  const costsByLieu = new Map<number, { cursusCount: number; stageCount: number; heures: number }>();
  yearAgendas.forEach(a => {
    if (!a.lieu_id) return;
    const isAtelierA = a.camp?.duree === "Hors vacances scolaires";
    const heures = isAtelierA ? 60 : 20;
    const cur = costsByLieu.get(a.lieu_id) || { cursusCount: 0, stageCount: 0, heures: 0 };
    cur.heures += heures;
    if (isAtelierA) cur.cursusCount += 1; else cur.stageCount += 1;
    costsByLieu.set(a.lieu_id, cur);
  });
  const lieuRows = Array.from(costsByLieu.entries()).map(([lieuId, c]) => {
    const lieu = lieuMap.get(lieuId) as any;
    const coutTotal = c.cursusCount * SEANCES_PAR_MOIS_ATELIER * MOIS_CURSUS_ACTIFS * CHARGE_SALLE_ATELIER_SEANCE + c.stageCount * CHARGE_SALLE_STAGE;
    return { lieuId, nom: lieu?.nom || `Lieu #${lieuId}`, ...c, coutTotal };
  }).sort((a, b) => a.nom.localeCompare(b.nom));
  const grandTotalCoutSalles = lieuRows.reduce((s, r) => s + (r.coutTotal || 0), 0);
  const byCheque = yearPaiements.filter(p => p.type === "Chèque").reduce((s, p) => s + (p.montant || 0), 0);
  const byVirement = yearPaiements.filter(p => p.type === "Virement").reduce((s, p) => s + (p.montant || 0), 0);

  const months = getSchoolYearMonths(currentYear);

  // Charges de salle par mois : Cursus = 3 séances de 2H/mois x 5 000 F de sept à juin. Stage = 45 000 F le mois de la date de début.
  const chargeSalleParMois = months.map(m => {
    const isSeptToJuin = m.monthIndex !== 7 && m.monthIndex !== 6; // exclut Août(7) et Juillet(6)
    return yearAgendas.reduce((total, a) => {
      if (!a.lieu_id) return total;
      const isAtelierA = a.camp?.duree === "Hors vacances scolaires";
      if (isAtelierA) return isSeptToJuin ? total + SEANCES_PAR_MOIS_ATELIER * CHARGE_SALLE_ATELIER_SEANCE : total;
      return a.debut && getMonthKeyFromDate(a.debut) === m.key ? total + CHARGE_SALLE_STAGE : total;
    }, 0);
  });
  const grandTotalChargeSalle = chargeSalleParMois.reduce((s, c) => s + c, 0);

  const inscMap = new Map(inscriptions.map(i => [i.id_inscription, i]));

  const paiByFact = new Map<number, number>();
  paiements.forEach(p => { if (p.id_facturation) paiByFact.set(p.id_facturation, (paiByFact.get(p.id_facturation) || 0) + (p.montant || 0)); });

  const paiementsByFact = new Map<number, typeof paiements>();
  paiements.forEach(p => {
    if (p.id_facturation) {
      const arr = paiementsByFact.get(p.id_facturation) || [];
      arr.push(p);
      paiementsByFact.set(p.id_facturation, arr);
    }
  });

  const partByInscAgenda = new Map<string, number>();
  participations.forEach(p => {
    if (p.id_inscription && p.id_agenda) {
      partByInscAgenda.set(`${p.id_inscription}-${p.id_agenda}`, p.formule || 0);
    }
  });

  const partInscritByInscAgenda = new Map<string, number>();
  participations.forEach(p => {
    if (p.id_inscription && p.id_agenda) {
      partInscritByInscAgenda.set(`${p.id_inscription}-${p.id_agenda}`, p.inscrit || 0);
    }
  });

  const openPayment = (factId: number, inscId: number | null, montantRestant: number) => {
    setEncForm({
      id_facturation: String(factId),
      montant: String(montantRestant),
      date_paiement: todayTahiti(),
      type: "", numero: "", info: "",
      id_inscription: inscId ? String(inscId) : "",
      date_depot: "",
    });
    setEncOpen(true);
  };

  // Retire les noms de mois (et l'année éventuelle qui suit) d'un objet de facture repris d'une facture
  // précédente, pour que la nouvelle facture n'hérite pas du mois de la précédente.
  const stripMoisFromObjet = (objet: string): string => {
    const mois = "janvier|f[eé]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[eé]cembre";
    return objet
      .replace(new RegExp(`\\s*[-—–:/,]?\\s*\\b(${mois})\\b(\\s+\\d{4})?`, "gi"), "")
      .replace(/\s*[-—–:/,]\s*$/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const openNewFacture = (row: any, agenda: any, campName: string, m: { key: string; label: string; monthIndex: number }) => {
    const idMois = m.monthIndex + 1;
    // Dernière facture de l'enfant sur ce programme : sert de modèle pour le montant et l'objet
    const lastFact = [...row.childFacts].sort((a: any, b: any) => b.id_facturation - a.id_facturation)[0];
    // Date du jour si elle se rattache bien à ce mois, sinon le 1er du mois de la colonne
    const today = todayTahiti();
    const date = getMonthKeyFromMois(idMois, today) === m.key ? today : `${m.key}-01`;
    setFactForm({
      id_participation: row.id_participation ? String(row.id_participation) : "",
      id_inscription: String(row.insc.id_inscription),
      montant: lastFact?.montant ? String(lastFact.montant) : "",
      date_facturation: date,
      objet: stripMoisFromObjet(lastFact?.objet || "") || campName,
      id_mois: String(idMois),
    });
    setFactContext({ enfant: `${row.insc.prenom || ""} ${row.insc.nom || ""}`.trim(), campName, moisLabel: m.label });
    setFactOpen(true);
  };

  const handleSaveFacture = async () => {
    setFactSaving(true);
    try {
      const { data: max } = await supabase.from("data_facturation").select("id_facturation").order("id_facturation", { ascending: false }).limit(1);
      const { error } = await supabase.from("data_facturation").insert({
        id_facturation: (max?.[0]?.id_facturation || 0) + 1,
        id_participation: factForm.id_participation ? parseInt(factForm.id_participation) : null,
        id_inscription: factForm.id_inscription ? parseInt(factForm.id_inscription) : null,
        montant: factForm.montant ? parseInt(factForm.montant) : null,
        date_facturation: factForm.date_facturation || null,
        objet: factForm.objet || null,
        id_mois: factForm.id_mois ? parseInt(factForm.id_mois) : null,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ predicate: q => String(q.queryKey[0] ?? "").includes("facturation") });
      toast({ title: "Facture ajoutée" });
      setFactOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setFactSaving(false);
  };

  // Nom du mois d'une facture d'après son champ id_mois (1 = janvier … 12 = décembre) — plus fiable
  // que la date de facturation, qui peut être postérieure au mois réel si la facture est saisie en retard.
  // Retombe sur la date si id_mois est absent ou vaut 0 (valeur historique "non renseigné").
  const getFactureMoisLabel = (f: any): string => {
    if (f?.id_mois) return MONTH_NAMES[f.id_mois - 1];
    if (f?.date_facturation) return MONTH_NAMES[parseInt(f.date_facturation.slice(5, 7)) - 1];
    return "";
  };

  const resolveVars = (text: string, ctx: { insc: any; montantFacture: number; campName: string; dayOrMonth: string } | null) => {
    if (!ctx) return text;
    const { insc, montantFacture, campName, dayOrMonth } = ctx;
    const totalFact = facturations.filter(f => f.id_inscription === insc.id_inscription).reduce((s, f) => s + (f.montant || 0), 0);
    const totalPaid = paiements.filter(p => p.id_inscription === insc.id_inscription).reduce((s, p) => s + (p.montant || 0), 0);
    return text
      .replace(/\{Prénom\}/g, insc.prenom || "")
      .replace(/\{Nom\}/g, insc.nom || "")
      .replace(/\{Prénom_légal\}/g, insc.legal_prenom || "")
      .replace(/\{Nom_légal\}/g, insc.legal_nom || "")
      .replace(/\{Ville\}/g, insc.ville || "")
      .replace(/\{Montant_facture\}/g, formatXPF(montantFacture))
      .replace(/\{Montant_dû\}/g, formatXPF(totalFact - totalPaid))
      .replace(/\{Programme\}/g, campName)
      .replace(/\{Mois\}/g, dayOrMonth)
      .replace(/\{Mois_facture\}/g, dayOrMonth)
      .replace(/\{ID_Inscription\}/g, String(insc.id_inscription));
  };

  const openSmsDialog = (insc: any, campName: string, montantFacture: number, dayOrMonth: string = "") => {
    setSmsPhone(insc.telephone || "");
    setSmsRecipientName(`${insc.prenom || ""} ${insc.nom || ""}`);
    setSmsBody("");
    setSmsContext({ insc, montantFacture, campName, dayOrMonth });
    setSmsOpen(true);
  };

  const openEmailDialog = (insc: any, campName: string, montantFacture: number, dayOrMonth: string = "", fact: any = null, agenda: any = null) => {
    setEmailAddress(insc.email || "");
    setEmailRecipientName(`${insc.prenom || ""} ${insc.nom || ""}`);
    setEmailBody("");
    setEmailSubject("Facture SmartClub");
    setEmailContext({ insc, montantFacture, campName, dayOrMonth, fact, agenda });
    setEmailAttachFacture(!!fact);
    setEmailOpen(true);
  };

  const resolvedSmsBody = resolveVars(smsBody, smsContext);
  const smsHref = `sms:${smsPhone}${resolvedSmsBody ? `?body=${encodeURIComponent(resolvedSmsBody)}` : ""}`;

  const resolvedEmailBody = resolveVars(emailBody, emailContext);
  const handleSendEmail = async () => {
    if (!emailAddress || !resolvedEmailBody) return;
    setEmailSending(true);
    try {
      let attachments: { content: string; name: string }[] | undefined;
      if (emailAttachFacture && emailContext?.fact) {
        const part = participations.find((p: any) => p.id_participation === emailContext.fact.id_participation);
        const heuresLabel = getFactureHeuresLabel(emailContext.fact.montant, part?.formule, forfaits);
        const pdfBase64 = await getFacturePdfBase64(
          emailContext.fact,
          emailContext.insc,
          ecole,
          paiementsByFact.get(emailContext.fact.id_facturation) || [],
          emailContext.agenda,
          heuresLabel
        );
        attachments = [{ content: pdfBase64, name: `facture-${emailContext.fact.id_facturation}.pdf` }];
      }
      await sendEmail({
        to: emailAddress,
        toName: emailRecipientName,
        subject: emailSubject,
        text: resolvedEmailBody,
        fromName: ecole?.sarl || "SmartClub",
        fromEmail: ecole?.email || undefined,
        attachments,
      });
      toast({ title: "Email envoyé", description: `Message envoyé à ${emailAddress}` });
      setEmailOpen(false);
      setEmailBody("");
    } catch (e: any) {
      toast({ title: "Erreur envoi email", description: e.message, variant: "destructive" });
    } finally {
      setEmailSending(false);
    }
  };

  const downloadFacturePdf = (fact: any, insc: any) => {
    const part = participations.find((p: any) => p.id_participation === fact.id_participation);
    const heuresLabel = getFactureHeuresLabel(fact.montant, part?.formule, forfaits);
    generateFacturePdf(fact, insc, ecole, paiementsByFact.get(fact.id_facturation) || [], part?.agenda ?? null, heuresLabel);
  };

  const handleSaveEnc = async () => {
    setSaving(true);
    try {
      const { data: max } = await supabase.from("data_paiement").select("id_paiement").order("id_paiement", { ascending: false }).limit(1);
      await supabase.from("data_paiement").insert({
        id_paiement: (max?.[0]?.id_paiement || 0) + 1,
        id_facturation: encForm.id_facturation ? parseInt(encForm.id_facturation) : null,
        montant: encForm.montant ? parseInt(encForm.montant) : null,
        date_paiement: encForm.date_paiement || null,
        type: encForm.type || null,
        numero: encForm.numero || null,
        info: encForm.info || null,
        id_inscription: encForm.id_inscription ? parseInt(encForm.id_inscription) : null,
        date_depot: encForm.type === "Chèque" && encForm.date_depot ? encForm.date_depot : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["data_paiement_with_insc"] });
      toast({ title: "Encaissement ajouté" });
      setEncOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSaving(false);
  };

  // === Grand totals by month across all agendas ===
  const allYearFacts = facturations.filter(f => getSchoolYearFromDate(f.date_facturation) === currentYear);
  const allYearPaies = paiements.filter(p => {
    // Group by facture month
    if (!p.id_facturation) return false;
    const fact = facturations.find(f => f.id_facturation === p.id_facturation);
    return fact && getSchoolYearFromDate(fact.date_facturation) === currentYear;
  });

  const grandMonthTotals = months.map(m => {
    const factMonth = allYearFacts.filter(f => getMonthKeyFromMois(f.id_mois, f.date_facturation) === m.key).reduce((s, f) => s + (f.montant || 0), 0);
    const monthFactIds = new Set(allYearFacts.filter(f => getMonthKeyFromMois(f.id_mois, f.date_facturation) === m.key).map(f => f.id_facturation));
    const paidMonth = paiements.filter(p => p.id_facturation && monthFactIds.has(p.id_facturation)).reduce((s, p) => s + (p.montant || 0), 0);
    return { factMonth, paidMonth };
  });

  const grandTotalFact = grandMonthTotals.reduce((s, m) => s + m.factMonth, 0);
  const grandTotalPaid = grandMonthTotals.reduce((s, m) => s + m.paidMonth, 0);

  // CPS : cotisation sociale forfaitaire de 6 500 F par mois
  const CPS_PAR_MOIS = 6500;
  const cpsParMois = months.map(() => CPS_PAR_MOIS);
  const grandTotalCps = cpsParMois.reduce((s, c) => s + c, 0);

  // Publicité : 30 000 F par stage (le mois de sa date de début) + 150 000 F de pub globale versés intégralement en août (non étalés sur l'année)
  const PUB_PAR_STAGE = 30000;
  const PUB_GLOBALE_AOUT = 150000;
  const publiciteParMois = months.map(m => {
    const nbStagesMois = yearAgendas.filter(a => a.camp?.duree !== "Hors vacances scolaires" && a.debut && getMonthKeyFromDate(a.debut) === m.key).length;
    const pubStages = nbStagesMois * PUB_PAR_STAGE;
    const pubGlobale = m.monthIndex === 7 ? PUB_GLOBALE_AOUT : 0;
    return pubStages + pubGlobale;
  });
  const grandTotalPublicite = publiciteParMois.reduce((s, p) => s + p, 0);

  // Revenu net = Facturé - Charges de salle - CPS - Publicité
  const revenuParMois = grandMonthTotals.map((mt, i) => mt.factMonth - chargeSalleParMois[i] - cpsParMois[i] - publiciteParMois[i]);
  const grandTotalRevenu = revenuParMois.reduce((s, r) => s + r, 0);

  // === Factures tab data ===
  const yearFacts = facturations
    .filter(f => getSchoolYearFromDate(f.date_facturation) === currentYear)
    .sort((a, b) => b.id_facturation - a.id_facturation);
  const totalFacture = yearFacts.reduce((s, f) => s + (f.montant || 0), 0);
  const partMapById = new Map(participations.map((p: any) => [p.id_participation, p]));
  const agendaMapById = new Map(agendas.map((a: any) => [a.id_agenda, a]));
  const getAgendaForFacture = (f: any) => {
    if (!f.id_participation) return null;
    const part = partMapById.get(f.id_participation);
    if (!part?.id_agenda) return null;
    return agendaMapById.get(part.id_agenda) || null;
  };
  const downloadPdf = async (f: any) => {
    const agenda = getAgendaForFacture(f);
    const heuresLabel = getFactureHeuresLabel(f.montant, partMapById.get(f.id_participation)?.formule, forfaits);
    await generateFacturePdf(f, f.inscription, ecole, paiementsByFact.get(f.id_facturation) || [], agenda, heuresLabel);
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Encaissements & Factures</h1>
        <p className="page-subtitle">{formatSchoolYear(currentYear)}</p>
      </div>

      <Tabs defaultValue="encaissements">
        <TabsList>
          <TabsTrigger value="encaissements">Encaissements</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="encaissements" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card"><div className="flex items-start justify-between"><div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total encaissé</p><CurrencyDisplay amount={totalEncaisse} size="lg" layout="stacked" /></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Banknote className="h-5 w-5" /></div></div></div>
            <div className="stat-card"><div className="flex items-start justify-between"><div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Chèques</p><CurrencyDisplay amount={byCheque} size="lg" layout="stacked" /></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></div></div></div>
            <div className="stat-card"><div className="flex items-start justify-between"><div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Virements</p><CurrencyDisplay amount={byVirement} size="lg" layout="stacked" /></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div></div></div>
          </div>

      {yearAgendas.map(agenda => {
        const agendaParts = participations.filter(p => p.id_agenda === agenda.id_agenda);
        const agendaInscIds = new Set(agendaParts.map(p => p.id_inscription).filter(Boolean));
        const agendaPartIds = new Set(agendaParts.map(p => p.id_participation).filter(Boolean));
        // Filtrer les factures par id_participation lié à cet agenda (pas juste par id_inscription)
        const agendaFacts = facturations.filter(f => f.id_participation ? agendaPartIds.has(f.id_participation) : false);
        const agendaFactIds = new Set(agendaFacts.map(f => f.id_facturation).filter(Boolean));
        // Filtrer les paiements par id_facturation lié à ces factures
        const agendaPaies = paiements.filter(p => p.id_facturation ? agendaFactIds.has(p.id_facturation) : false);
        const campName = agenda.camp?.nom || "Activité";
        const isAtelier = agenda.camp?.duree === "Hors vacances scolaires";
        const dayOrMonth = agenda.debut
          ? (isAtelier ? getDayOfWeekTahiti(agenda.debut) : MONTH_NAMES[new Date(agenda.debut + "T12:00:00").getMonth()])
          : null;
        const schoolYearLabel = isAtelier && agenda.debut ? getSchoolYearFromDate(agenda.debut).replace("-", "/") : null;

        const childRows = Array.from(agendaInscIds).map(inscId => {
          const insc = inscMap.get(inscId!);
          if (!insc) return null;
          const formule = partByInscAgenda.get(`${inscId}-${agenda.id_agenda}`) || 0;
          const inscrit = partInscritByInscAgenda.get(`${inscId}-${agenda.id_agenda}`) ?? 0;
          const part = agendaParts.find(p => p.id_inscription === inscId);
          const childFacts = agendaFacts.filter(f => part ? f.id_participation === part.id_participation : false);
          const childFactIds = new Set(childFacts.map(f => f.id_facturation).filter(Boolean));
          const childPaies = agendaPaies.filter(p => p.id_facturation ? childFactIds.has(p.id_facturation) : false);
          return { insc, childFacts, childPaies, formule, inscrit, ordinateur: part?.ordinateur ?? null, id_participation: part?.id_participation ?? null };
        }).filter(Boolean) as any[];

        childRows.sort((a: any, b: any) => {
          const soldeA = a.childFacts.reduce((s: number, f: any) => s + (f.montant || 0), 0) - a.childPaies.reduce((s: number, p: any) => s + (p.montant || 0), 0);
          const soldeB = b.childFacts.reduce((s: number, f: any) => s + (f.montant || 0), 0) - b.childPaies.reduce((s: number, p: any) => s + (p.montant || 0), 0);
          return soldeB - soldeA;
        });

        const factMonthMap = new Map<number, string>();
        agendaFacts.forEach(f => { factMonthMap.set(f.id_facturation, getMonthKeyFromMois(f.id_mois, f.date_facturation)); });

        const monthTotals = months.map(m => {
          const factMonth = agendaFacts.filter(f => getMonthKeyFromMois(f.id_mois, f.date_facturation) === m.key).reduce((s, f) => s + (f.montant || 0), 0);
          const paidMonth = agendaPaies.filter(p => p.id_facturation && factMonthMap.get(p.id_facturation) === m.key).reduce((s, p) => s + (p.montant || 0), 0);
          return { factMonth, paidMonth };
        });

        return (
          <div key={agenda.id_agenda} className="stat-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-sm">{campName}</h3>
                  {dayOrMonth && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide bg-white ${isAtelier ? "text-blue-600 border-blue-300" : "text-orange-600 border-orange-300"}`}>
                      {dayOrMonth}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${isAtelier ? "text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30" : "text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-500/10 dark:border-orange-500/30"}`}>
                    {isAtelier ? "Cursus" : "Stage"}
                  </span>
                  {schoolYearLabel && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30">
                      {schoolYearLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{agenda.debut} → {agenda.fin} • {agendaParts.length} participant(s)</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs sticky left-0 bg-muted/50 min-w-[140px]">Enfant</TableHead>
                    {months.map(m => <TableHead key={m.key} className="font-semibold text-[10px] text-center min-w-[90px]">{m.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childRows.map((row: any) => {
                    const totalFact = row.childFacts.reduce((s: number, f: any) => s + (f.montant || 0), 0);
                    const totalPaid = row.childPaies.reduce((s: number, p: any) => s + (p.montant || 0), 0);
                    const solde = totalFact - totalPaid;
                    const isStopped = row.inscrit === 1;
                    const isAnnual = row.formule === 2;
                    const rowBg = isStopped ? "bg-red-100 dark:bg-red-950/40" : isAnnual ? "bg-emerald-50 dark:bg-emerald-950/20" : "";
                    const stickyBg = isStopped ? "bg-red-100 dark:bg-red-950/40" : isAnnual ? "bg-emerald-50 dark:bg-emerald-950/20" : "bg-card";

                    return (
                      <TableRow key={row.insc.id_inscription} className={`hover:bg-muted/30 ${rowBg}`}>
                        <TableCell className={`text-xs font-medium sticky left-0 ${stickyBg}`}>
                          <div className="flex items-center gap-1">
                            <ConsentImageIcon consent={row.insc.consent_image} />
                            <Link to={`/inscrits/${row.insc.id_inscription}`} className="text-primary hover:underline">{row.insc.prenom} {row.insc.nom}</Link>
                            {isStopped && <span className="ml-1 text-[9px] text-destructive font-semibold">ARRÊT</span>}
                            {isAnnual && <span className="ml-1 text-[9px] text-emerald-600 font-semibold">ANNÉE</span>}
                            {row.ordinateur === 1 && <Monitor className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-normal font-mono">KIDSID{row.insc.id_inscription}</div>
                          {row.insc.remarque && <div className="text-[9px] text-muted-foreground font-normal mt-0.5 line-clamp-2" title={row.insc.remarque}>{row.insc.remarque}</div>}
                        </TableCell>
                        {months.map(m => {
                          const monthFacts = row.childFacts.filter((f: any) => getMonthKeyFromMois(f.id_mois, f.date_facturation) === m.key);
                          const mFact = monthFacts.reduce((s: number, f: any) => s + (f.montant || 0), 0);
                          const monthFactIds = new Set(monthFacts.map((f: any) => f.id_facturation));
                          const monthPaies = row.childPaies.filter((p: any) => p.id_facturation && monthFactIds.has(p.id_facturation));
                          const mPaid = monthPaies.reduce((s: number, p: any) => s + (p.montant || 0), 0);
                          const pType = monthPaies[0]?.type;
                          const pDate = monthPaies[0]?.date_paiement;
                          const monthUnpaid = mFact - mPaid;
                          const unpaidFact = monthUnpaid > 0 ? monthFacts.find((f: any) => {
                            const paid = paiByFact.get(f.id_facturation) || 0;
                            return (f.montant || 0) - paid > 0;
                          }) : null;

                          return (
                            <TableCell key={m.key} className={`text-center text-[10px] p-1 ${monthUnpaid > 0 ? "bg-amber-100 dark:bg-amber-900/40" : ""}`}>
                              {(mFact > 0 || mPaid > 0) ? (
                                <div className="space-y-0.5">
                                  {monthFacts.length > 0 && (
                                    <div className="font-mono text-[9px] text-muted-foreground">
                                      {monthFacts.map((f: any) => `#${f.id_facturation}`).join(" ")}
                                    </div>
                                  )}
                                  {mFact > 0 && <div className={monthUnpaid <= 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground"}>{formatXPF(mFact)}</div>}
                                  {mPaid > 0 && <div className="font-semibold text-foreground">{formatXPF(mPaid)}</div>}
                                  {pType && <div className="text-[9px] text-muted-foreground">{pType}</div>}
                                  {pDate && <div className="text-[9px] text-muted-foreground">{formatDateTahiti(pDate)}</div>}
                                  {unpaidFact && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <button
                                        onClick={() => openPayment(unpaidFact.id_facturation, row.insc.id_inscription, (unpaidFact.montant || 0) - (paiByFact.get(unpaidFact.id_facturation) || 0))}
                                        className="text-destructive hover:text-destructive/80 p-1 rounded hover:bg-destructive/10"
                                        title="Ajouter encaissement"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); openSmsDialog(row.insc, campName, unpaidFact.montant || 0, getFactureMoisLabel(unpaidFact)); }}
                                        className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10"
                                        title="Envoyer SMS de relance"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={e => { e.stopPropagation(); openEmailDialog(row.insc, campName, unpaidFact.montant || 0, getFactureMoisLabel(unpaidFact), unpaidFact, agenda); }}
                                        className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10"
                                        title="Envoyer email de relance"
                                      >
                                        <Mail className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => downloadFacturePdf(unpaidFact, row.insc)}
                                        className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10"
                                        title="Télécharger facture PDF"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                  {!unpaidFact && monthFacts.length > 0 && (
                                    <button
                                      onClick={() => downloadFacturePdf(monthFacts[0], row.insc)}
                                      className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 mx-auto block"
                                      title="Télécharger facture PDF"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => openNewFacture(row, agenda, campName, m)}
                                  className="mx-auto flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
                                  title={`Créer une facture — ${m.label}`}
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30 font-semibold">
                    <TableCell className="text-xs sticky left-0 bg-muted/30">Total</TableCell>
                    {monthTotals.map((mt, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px] p-1">
                        {(mt.factMonth > 0 || mt.paidMonth > 0) ? (
                          <div className="space-y-0.5">
                            {mt.factMonth > 0 && <div className="text-muted-foreground">{formatXPF(mt.factMonth)}</div>}
                            {mt.paidMonth > 0 && <div>{formatXPF(mt.paidMonth)}</div>}
                          </div>
                        ) : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}

          {/* Grand totals table */}
          <div className="stat-card space-y-3">
            <h3 className="font-display font-semibold text-sm">Récapitulatif mensuel — {formatSchoolYear(currentYear)}</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs"></TableHead>
                    {months.map(m => <TableHead key={m.key} className="font-semibold text-[10px] text-center">{m.label.split(" ")[0]}</TableHead>)}
                    <TableHead className="font-semibold text-xs text-center bg-primary/10">Total année</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs font-semibold">Facturé</TableCell>
                    {grandMonthTotals.map((mt, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        {mt.factMonth > 0 ? formatXPF(mt.factMonth) : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs font-bold bg-primary/5">{formatXPF(grandTotalFact)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold">Encaissé</TableCell>
                    {grandMonthTotals.map((mt, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        {mt.paidMonth > 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatXPF(mt.paidMonth)}</span> : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs font-bold text-emerald-600 bg-primary/5">{formatXPF(grandTotalPaid)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-xs font-semibold">Solde</TableCell>
                    {grandMonthTotals.map((mt, i) => {
                      const solde = mt.factMonth - mt.paidMonth;
                      return (
                        <TableCell key={months[i].key} className="text-center text-[10px]">
                          {solde !== 0 ? <span className={solde > 0 ? "text-destructive font-semibold" : "text-emerald-600"}>{formatXPF(solde)}</span> : "—"}
                        </TableCell>
                      );
                    })}
                    <TableCell className={`text-center text-xs font-bold bg-primary/5 ${grandTotalFact - grandTotalPaid > 0 ? "text-destructive" : "text-emerald-600"}`}>
                      {formatXPF(grandTotalFact - grandTotalPaid)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold">Charges de salle</TableCell>
                    {chargeSalleParMois.map((c, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        {c > 0 ? <span className="text-orange-600 dark:text-orange-400 font-medium">{formatXPF(c)}</span> : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs font-bold text-orange-600 bg-primary/5">{formatXPF(grandTotalChargeSalle)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold">CPS (6 500 F/mois)</TableCell>
                    {cpsParMois.map((c, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        {c > 0 ? <span className="text-orange-600 dark:text-orange-400 font-medium">{formatXPF(c)}</span> : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs font-bold text-orange-600 bg-primary/5">{formatXPF(grandTotalCps)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold">Publicité</TableCell>
                    {publiciteParMois.map((p, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        {p > 0 ? <span className="text-orange-600 dark:text-orange-400 font-medium">{formatXPF(p)}</span> : "—"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center text-xs font-bold text-orange-600 bg-primary/5">{formatXPF(grandTotalPublicite)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-xs font-bold">Revenu</TableCell>
                    {revenuParMois.map((r, i) => (
                      <TableCell key={months[i].key} className="text-center text-[10px]">
                        <span className={r >= 0 ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>{formatXPF(r)}</span>
                      </TableCell>
                    ))}
                    <TableCell className={`text-center text-xs font-bold bg-primary/5 ${grandTotalRevenu >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {formatXPF(grandTotalRevenu)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="factures" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total facturé</p><CurrencyDisplay amount={totalFacture} size="lg" layout="stacked" /></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nb factures</p><p className="text-2xl font-bold font-display">{yearFacts.length}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="h-5 w-5" /></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-start justify-between">
                <div className="space-y-1"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moy. facture</p><CurrencyDisplay amount={yearFacts.length > 0 ? Math.round(totalFacture / yearFacts.length) : null} size="lg" layout="stacked" /></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><AlertCircle className="h-5 w-5" /></div>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs">Facture</TableHead>
                  <TableHead className="font-semibold text-xs">Enfant</TableHead>
                  <TableHead className="font-semibold text-xs">Client</TableHead>
                  <TableHead className="font-semibold text-xs">Objet</TableHead>
                  <TableHead className="font-semibold text-xs">Heures</TableHead>
                  <TableHead className="font-semibold text-xs text-right whitespace-nowrap">Montant</TableHead>
                  <TableHead className="font-semibold text-xs text-right whitespace-nowrap">Payé</TableHead>
                  <TableHead className="font-semibold text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearFacts.map(f => {
                  const paid = paiByFact.get(f.id_facturation) || 0;
                  const unpaid = (f.montant || 0) - paid;
                  return (
                    <TableRow key={f.id_facturation} className={`hover:bg-muted/30 ${unpaid > 0 ? "bg-destructive/5" : ""}`}>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">#{f.id_facturation}</div>
                        <div className="text-[10px] text-muted-foreground">{formatDateTahiti(f.date_facturation)}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {f.inscription ? <Link to={`/inscrits/${f.id_inscription}`} className="text-primary hover:underline">{f.inscription.prenom} {f.inscription.nom}</Link> : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.inscription ? `${f.inscription.legal_prenom || ""} ${f.inscription.legal_nom || ""}`.trim() || "—" : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{f.objet || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{getFactureHeuresLabel(f.montant, partMapById.get(f.id_participation)?.formule, forfaits) || "—"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap"><CurrencyDisplay amount={f.montant} size="sm" /></TableCell>
                      <TableCell className="text-right text-sm font-medium whitespace-nowrap">{paid > 0 ? formatXPF(paid) : "—"}</TableCell>
                      <TableCell><button onClick={() => downloadPdf(f)} className="p-1 hover:bg-muted rounded text-primary"><Download className="h-3.5 w-3.5" /></button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {ecole && (ecole.banque || ecole.iban || ecole.bic) && (
            <div className="stat-card">
              <h2 className="font-display font-semibold text-base mb-4">Coordonnées bancaires</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {ecole.banque && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Banque</p>
                    <p className="text-sm font-mono font-medium">{ecole.banque}</p>
                  </div>
                )}
                {ecole.agence && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Agence</p>
                    <p className="text-sm font-mono font-medium">{ecole.agence}</p>
                  </div>
                )}
                {ecole.compte && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Compte</p>
                    <p className="text-sm font-mono font-medium">{ecole.compte}</p>
                  </div>
                )}
                {ecole.cle && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Clé</p>
                    <p className="text-sm font-mono font-medium">{ecole.cle}</p>
                  </div>
                )}
                {ecole.iban && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IBAN</p>
                    <p className="text-sm font-mono font-medium tracking-wide">{ecole.iban}</p>
                  </div>
                )}
                {ecole.bic && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">BIC</p>
                    <p className="text-sm font-mono font-medium">{ecole.bic}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Coût par salle */}
      {lieuRows.length > 0 && (
        <div className="stat-card space-y-3">
          <h3 className="font-display font-semibold text-sm">Coût par salle — {formatSchoolYear(currentYear)}</h3>
          <p className="text-xs text-muted-foreground">
            Cursus : 5 000 F / séance de 2 H (3 séances/mois, sept-juin) · Stage : 45 000 F / stage
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs">Salle</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Cursus</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Stages</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Heures totales</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Coût total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lieuRows.map(r => (
                  <TableRow key={r.lieuId}>
                    <TableCell className="text-sm font-medium">{r.nom}</TableCell>
                    <TableCell className="text-sm text-center">{r.cursusCount || "—"}</TableCell>
                    <TableCell className="text-sm text-center">{r.stageCount || "—"}</TableCell>
                    <TableCell className="text-sm text-center">{r.heures} H</TableCell>
                    <TableCell className="text-sm text-right font-semibold">{r.coutTotal != null ? formatXPF(r.coutTotal) : "—"}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-sm font-semibold" colSpan={4}>Total</TableCell>
                  <TableCell className="text-sm font-bold text-right">{formatXPF(grandTotalCoutSalles)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Payment dialog */}
      <Dialog open={encOpen} onOpenChange={setEncOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Ajouter un encaissement</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Facture #</Label><Input value={encForm.id_facturation} disabled /></div>
            <div><Label>Montant (XPF)</Label><Input type="number" value={encForm.montant} onChange={e => setEncForm(f => ({ ...f, montant: e.target.value }))} /></div>
            <div><Label>Date</Label><Input type="date" value={encForm.date_paiement} onChange={e => setEncForm(f => ({ ...f, date_paiement: e.target.value }))} /></div>
            <div><Label>Mode de paiement</Label>
              <Select value={encForm.type} onValueChange={v => setEncForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Mode…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="CB">CB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {encForm.type === "Chèque" && (
              <div><Label>Date de dépôt du chèque</Label><Input type="date" value={encForm.date_depot} onChange={e => setEncForm(f => ({ ...f, date_depot: e.target.value }))} /></div>
            )}
            <div><Label>Référence</Label><Input value={encForm.numero} onChange={e => setEncForm(f => ({ ...f, numero: e.target.value }))} /></div>
            <Button onClick={handleSaveEnc} disabled={saving} className="w-full">{saving ? "Enregistrement…" : "Enregistrer"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nouvelle facture dialog */}
      <Dialog open={factOpen} onOpenChange={setFactOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
          {factContext && (
            <p className="text-xs text-muted-foreground -mt-2">{factContext.enfant} · {factContext.campName} · {factContext.moisLabel}</p>
          )}
          <div className="space-y-4 pt-2">
            <div><Label>Montant (XPF)</Label><Input type="number" value={factForm.montant} onChange={e => setFactForm(f => ({ ...f, montant: e.target.value }))} /></div>
            <div><Label>Date de facturation</Label><Input type="date" value={factForm.date_facturation} onChange={e => setFactForm(f => ({ ...f, date_facturation: e.target.value }))} /></div>
            <div><Label>Mois</Label>
              <Select value={factForm.id_mois} onValueChange={v => setFactForm(f => ({ ...f, id_mois: v }))}>
                <SelectTrigger><SelectValue placeholder="Mois…" /></SelectTrigger>
                <SelectContent>
                  {MONTH_NAMES.map((n, i) => <SelectItem key={i} value={String(i + 1)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Objet</Label><Input value={factForm.objet} onChange={e => setFactForm(f => ({ ...f, objet: e.target.value }))} /></div>
            <Button onClick={handleSaveFacture} disabled={factSaving || !factForm.montant || !factForm.id_participation} className="w-full">{factSaving ? "Enregistrement…" : "Créer la facture"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS dialog */}
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>SMS de relance — {smsRecipientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {smsTemplates.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Modèles rapides</p>
                <div className="flex flex-wrap gap-1.5">
                  {smsTemplates.map(t => (
                    <Badge key={t.id} variant="outline" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setSmsBody(t.body)}>
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {MSG_VARIABLES.map(v => (
                  <Badge key={v.tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs" onClick={() => setSmsBody(prev => prev + v.tag)} title={v.desc}>
                    {v.tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea value={smsBody} onChange={e => setSmsBody(e.target.value)} placeholder="Rédigez votre message ici…" rows={4} />
            {smsBody && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Aperçu</p>
                <p className="text-sm">{resolvedSmsBody}</p>
                <p className="text-xs text-muted-foreground mt-1">{resolvedSmsBody.length} caractères</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsOpen(false)}>Annuler</Button>
            <Button asChild disabled={!smsBody || !smsPhone}>
              <a href={smsHref}><Send className="h-4 w-4 mr-1" /> Envoyer le SMS</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Email de relance — {emailRecipientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Email</Label><Input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} /></div>
            <div><Label>Objet</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
            {emailTemplates.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Modèles rapides</p>
                <div className="flex flex-wrap gap-1.5">
                  {emailTemplates.map(t => (
                    <Badge key={t.id} variant="outline" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setEmailBody(t.body); if (t.subject) setEmailSubject(t.subject); }}>
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {MSG_VARIABLES.map(v => (
                  <Badge key={v.tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs" onClick={() => setEmailBody(prev => prev + v.tag)} title={v.desc}>
                    {v.tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Rédigez votre email ici…" rows={6} />
            {emailBody && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Aperçu</p>
                <p className="text-sm whitespace-pre-wrap">{resolvedEmailBody}</p>
              </div>
            )}
            {emailContext?.fact && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={emailAttachFacture} onChange={e => setEmailAttachFacture(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm">Joindre la facture n° {emailContext.fact.id_facturation} en PDF</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={!emailBody || !emailAddress || emailSending}>
              <Mail className="h-4 w-4 mr-1" />{emailSending ? "Envoi…" : "Envoyer l'email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EncaissementsPage;
