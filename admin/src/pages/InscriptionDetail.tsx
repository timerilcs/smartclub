import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import { formatXPF } from "@/lib/currency";
import { ArrowLeft, Save, Loader2, Plus, Pencil, Trash2, Download, Mail, MessageSquare, Send, Gamepad2, Eye, EyeOff, Copy, ExternalLink, RefreshCw, KeyRound, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { generateFacturePdf, getFacturePdfBase64 } from "@/lib/facture-pdf";
import { getFactureHeuresLabel } from "@/lib/facture-heures";
import { useForfaits } from "@/hooks/useSupabaseData";
import { getDayOfWeekTahiti, MONTH_NAMES, formatAgendaSelectLabel, formatDayTimeTahiti, formatDateLongTahiti, todayTahiti, formatDateTahiti } from "@/lib/tahiti-date";
import { sendEmail } from "@/lib/sendEmail";

function useInscriptionDetail(id: number) {
  return useQuery({
    queryKey: ["inscription_detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_inscription").select("*").eq("id_inscription", id).single();
      if (error) throw error;
      return data;
    },
  });
}

function useInscriptionParticipations(id: number) {
  return useQuery({
    queryKey: ["inscription_participations", id],
    queryFn: async () => {
      const [partRes, agendaRes, campRes] = await Promise.all([
        supabase.from("data_participation").select("*").eq("id_inscription", id),
        supabase.from("data_agenda").select("*"),
        supabase.from("data_camp").select("*"),
      ]);
      if (partRes.error) throw partRes.error;
      const campMap = new Map((campRes.data || []).map(c => [c.id_camp, c]));
      const agendaMap = new Map((agendaRes.data || []).map(a => [a.id_agenda, { ...a, camp: a.id_camp ? campMap.get(a.id_camp) : null }]));
      return (partRes.data || []).map(p => ({ ...p, agenda: p.id_agenda ? agendaMap.get(p.id_agenda) : null }));
    },
  });
}

function useInscriptionPresences(id: number) {
  return useQuery({
    queryKey: ["inscription_presences", id],
    queryFn: async () => {
      const [presRes, agendaRes, campRes] = await Promise.all([
        supabase.from("data_presence").select("*").eq("id_inscription", id).order("date_seance", { ascending: false }),
        supabase.from("data_agenda").select("*"),
        supabase.from("data_camp").select("*"),
      ]);
      if (presRes.error) throw presRes.error;
      const campMap = new Map((campRes.data || []).map(c => [c.id_camp, c]));
      const agendaMap = new Map((agendaRes.data || []).map(a => [a.id_agenda, { ...a, camp: a.id_camp ? campMap.get(a.id_camp) : null }]));
      return (presRes.data || []).map(p => ({ ...p, agenda: p.id_agenda ? agendaMap.get(p.id_agenda) : null }));
    },
  });
}

function useInscriptionFactures(id: number) {
  return useQuery({
    queryKey: ["inscription_factures", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_facturation").select("*").eq("id_inscription", id).order("id_facturation", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useInscriptionPaiements(id: number) {
  return useQuery({
    queryKey: ["inscription_paiements", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_paiement").select("*").eq("id_inscription", id).order("date_paiement", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useSmsTemplates() {
  return useQuery({
    queryKey: ["data_message_templates_sms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_message_templates").select("*").eq("channel", "sms").order("label");
      if (error) throw error;
      return (data || []) as { id: number; label: string; body: string }[];
    },
  });
}

function useEmailTemplates() {
  return useQuery({
    queryKey: ["data_message_templates_email"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_message_templates").select("*").eq("channel", "email").order("label");
      if (error) throw error;
      return (data || []) as { id: number; label: string; subject: string | null; body: string }[];
    },
  });
}

function useEcole() {
  return useQuery({
    queryKey: ["data_ecoles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_ecoles").select("*").limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

function useInscriptionDemandes(id: number) {
  return useQuery({
    queryKey: ["inscription_demandes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_demandes")
        .select("*")
        .eq("id_inscription", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

function useAllAgendas() {
  return useQuery({
    queryKey: ["all_agendas_for_detail"],
    queryFn: async () => {
      const [agendaRes, campRes] = await Promise.all([
        supabase.from("data_agenda").select("*").order("debut", { ascending: false }),
        supabase.from("data_camp").select("*"),
      ]);
      if (agendaRes.error) throw agendaRes.error;
      const campMap = new Map((campRes.data || []).map(c => [c.id_camp, c]));
      return (agendaRes.data || []).map(a => ({ ...a, camp: a.id_camp ? campMap.get(a.id_camp) : null }));
    },
  });
}

const generateKidsPassword = () => {
  // Format A1B2C3 : lettres majuscules et chiffres en alternance (sans O et I pour éviter la confusion)
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  return Array.from({ length: 3 }, () =>
    letters[Math.floor(Math.random() * letters.length)] +
    digits[Math.floor(Math.random() * digits.length)]
  ).join("");
};

const FORMULE_LABELS: Record<number, string> = { 0: "Non définie", 1: "Mensualités", 2: "À l'année" };
const ORDINATEUR_LABELS: Record<number, string> = { 1: "Vient avec son PC", 2: "A besoin d'un PC" };
const MONTH_OPTIONS = [
  { value: "", label: "— Aucun —" },
  { value: "1", label: "Janvier" }, { value: "2", label: "Février" }, { value: "3", label: "Mars" },
  { value: "4", label: "Avril" }, { value: "5", label: "Mai" }, { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" }, { value: "8", label: "Août" }, { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" }, { value: "11", label: "Novembre" }, { value: "12", label: "Décembre" },
];

const factureLabel = (f: { id_facturation: number; montant: number | null; id_mois?: number | null }) => {
  const mois = f.id_mois ? MONTH_OPTIONS.find(m => m.value === String(f.id_mois))?.label : null;
  return `Facture #${f.id_facturation}${mois ? ` (${mois})` : ""} — ${formatXPF(f.montant)}`;
};

const InscriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inscId = parseInt(id || "0");

  const { data: inscription, isLoading } = useInscriptionDetail(inscId);
  const { data: participations = [] } = useInscriptionParticipations(inscId);
  const { data: presences = [] } = useInscriptionPresences(inscId);
  const { data: factures = [] } = useInscriptionFactures(inscId);
  const { data: paiements = [] } = useInscriptionPaiements(inscId);
  const { data: demandes = [] } = useInscriptionDemandes(inscId);
  const { data: allAgendas = [] } = useAllAgendas();
  const { data: smsTemplates = [] } = useSmsTemplates();
  const { data: emailTemplates = [] } = useEmailTemplates();
  const { data: ecole } = useEcole();
  const { data: forfaits = [] } = useForfaits();

  const [form, setForm] = useState<Record<string, string>>({});
  const [consentImage, setConsentImage] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const [partOpen, setPartOpen] = useState(false);
  const [partForm, setPartForm] = useState({ id_agenda: "", ordinateur: "1", formule: "0", inscrit: "1" });
  const [editingPartId, setEditingPartId] = useState<number | null>(null);

  const [factOpen, setFactOpen] = useState(false);
  const [factForm, setFactForm] = useState({ id_participation: "", montant: "", date_facturation: "", objet: "", id_mois: "" });
  const [editingFactId, setEditingFactId] = useState<number | null>(null);

  const [encOpen, setEncOpen] = useState(false);
  const [encForm, setEncForm] = useState({ id_facturation: "", montant: "", date_paiement: "", type: "", numero: "", info: "" });
  const [editingEncId, setEditingEncId] = useState<number | null>(null);

  const [smsOpen, setSmsOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [smsRecipientName, setSmsRecipientName] = useState("");
  const [smsParticipationId, setSmsParticipationId] = useState<number | null>(null);

  const [emailOpen, setEmailOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailRecipientName, setEmailRecipientName] = useState("");
  const [emailSubject, setEmailSubject] = useState("SmartClub");
  const [emailSending, setEmailSending] = useState(false);
  const [emailAttachFacture, setEmailAttachFacture] = useState(false);
  const [emailFactureId, setEmailFactureId] = useState("");
  const [emailParticipationId, setEmailParticipationId] = useState<number | null>(null);

  const [showKidsPassword, setShowKidsPassword] = useState(false);
  const [kidsAccountLoading, setKidsAccountLoading] = useState(false);
  const [editingKidsPassword, setEditingKidsPassword] = useState(false);
  const [newKidsPasswordInput, setNewKidsPasswordInput] = useState("");

  useEffect(() => {
    if (inscription) {
      setForm({
        nom: inscription.nom || "", prenom: inscription.prenom || "",
        date_naissance: inscription.date_naissance || "", adresse: inscription.adresse || "",
        code_postal: inscription.code_postal || "", ville: inscription.ville || "",
        ile: inscription.ile || "", telephone: inscription.telephone || "",
        email: inscription.email || "", legal_nom: inscription.legal_nom || "",
        legal_prenom: inscription.legal_prenom || "", remarque: inscription.remarque || "",
        genre: inscription.genre || "", pc: inscription.pc != null ? String(inscription.pc) : "",
      });
      setConsentImage(inscription.consent_image ?? null);
    }
  }, [inscription]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("data_inscription").update({
        nom: form.nom, prenom: form.prenom, date_naissance: form.date_naissance || null,
        adresse: form.adresse || null, code_postal: form.code_postal || null,
        ville: form.ville || null, ile: form.ile || null, telephone: form.telephone || null,
        email: form.email || null, legal_nom: form.legal_nom || null,
        legal_prenom: form.legal_prenom || null, remarque: form.remarque || null,
        genre: form.genre || null,
        pc: form.pc !== "" ? parseInt(form.pc) : null,
        consent_image: consentImage,
      }).eq("id_inscription", inscId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["inscription_detail", inscId] });
      toast({ title: "Inscrit modifié avec succès" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (participations.length > 0 || factures.length > 0 || paiements.length > 0) {
      toast({ title: "Impossible de supprimer", description: "Cet inscrit a des participations, factures ou encaissements.", variant: "destructive" });
      return;
    }
    if (!confirm("Supprimer cet inscrit ?")) return;
    try {
      await supabase.from("data_inscription").delete().eq("id_inscription", inscId);
      toast({ title: "Inscrit supprimé" });
      navigate("/inscrits");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const setField = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["inscription_participations", inscId] }),
      queryClient.invalidateQueries({ queryKey: ["inscription_factures", inscId] }),
      queryClient.invalidateQueries({ queryKey: ["inscription_paiements", inscId] }),
    ]);
  };

  // === PARTICIPATION CRUD ===
  const openNewPart = () => { setPartForm({ id_agenda: "", ordinateur: "1", formule: "0", inscrit: "2" }); setEditingPartId(null); setPartOpen(true); };
  const openEditPart = (p: any) => {
    setPartForm({ id_agenda: p.id_agenda ? String(p.id_agenda) : "", ordinateur: String(p.ordinateur || 1), formule: String(p.formule || 0), inscrit: String(p.inscrit ?? 1) });
    setEditingPartId(p.id_participation); setPartOpen(true);
  };
  const handleSavePart = async () => {
    try {
      const payload = { id_agenda: partForm.id_agenda ? parseInt(partForm.id_agenda) : null, ordinateur: parseInt(partForm.ordinateur), formule: parseInt(partForm.formule), id_inscription: inscId, inscrit: parseInt(partForm.inscrit), date_formulaire: new Date().toISOString() };
      if (editingPartId) {
        const { error } = await supabase.from("data_participation").update(payload).eq("id_participation", editingPartId);
        if (error) throw error;
      } else {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") + Date.now().toString(16);
        const { data: maxPart } = await supabase.from("data_participation").select("id_participation").order("id_participation", { ascending: false }).limit(1);
        const nextId = (maxPart?.[0]?.id_participation || 0) + 1;
        const { error } = await supabase.from("data_participation").insert({ ...payload, code, id_participation: nextId });
        if (error) throw error;
      }
      await invalidateAll();
      toast({ title: editingPartId ? "Participation modifiée" : "Participation ajoutée" });
      setPartOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };
  const handleDeletePart = async (pid: number) => {
    if (!confirm("Supprimer cette participation ?")) return;
    await supabase.from("data_participation").delete().eq("id_participation", pid);
    await invalidateAll();
    toast({ title: "Participation supprimée" });
  };

  // === FACTURE CRUD ===
  const openNewFact = () => {
    const lastFact = factures[0];
    setFactForm({
      id_participation: lastFact?.id_participation ? String(lastFact.id_participation) : (participations[0]?.id_participation ? String(participations[0].id_participation) : ""),
      montant: lastFact?.montant ? String(lastFact.montant) : "",
      date_facturation: todayTahiti(),
      objet: lastFact?.objet || "",
      id_mois: "",
    });
    setEditingFactId(null); setFactOpen(true);
  };
  const openEditFact = (f: any) => {
    setFactForm({
      id_participation: f.id_participation ? String(f.id_participation) : "",
      montant: f.montant ? String(f.montant) : "",
      date_facturation: f.date_facturation ? f.date_facturation.slice(0, 10) : "",
      objet: f.objet || "",
      id_mois: f.id_mois ? String(f.id_mois) : "",
    });
    setEditingFactId(f.id_facturation); setFactOpen(true);
  };
  const handleSaveFact = async () => {
    try {
      const payload = {
        id_participation: factForm.id_participation ? parseInt(factForm.id_participation) : null,
        montant: factForm.montant ? parseInt(factForm.montant) : null,
        date_facturation: factForm.date_facturation || null,
        objet: factForm.objet || null,
        id_inscription: inscId,
        id_mois: factForm.id_mois ? parseInt(factForm.id_mois) : null,
      };
      if (editingFactId) {
        await supabase.from("data_facturation").update(payload).eq("id_facturation", editingFactId);
      } else {
        const { data: max } = await supabase.from("data_facturation").select("id_facturation").order("id_facturation", { ascending: false }).limit(1);
        await supabase.from("data_facturation").insert({ ...payload, id_facturation: (max?.[0]?.id_facturation || 0) + 1 });
      }
      await invalidateAll();
      toast({ title: editingFactId ? "Facture modifiée" : "Facture ajoutée" });
      setFactOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };
  const handleDeleteFact = async (fid: number) => {
    if (!confirm("Supprimer cette facture ?")) return;
    await supabase.from("data_facturation").delete().eq("id_facturation", fid);
    await invalidateAll();
    toast({ title: "Facture supprimée" });
  };

  // === ENCAISSEMENT CRUD ===
  const openNewEnc = (prefillFactId?: number) => {
    setEncForm({
      id_facturation: prefillFactId ? String(prefillFactId) : (factures[0]?.id_facturation ? String(factures[0].id_facturation) : ""),
      montant: "", date_paiement: todayTahiti(),
      type: "", numero: "", info: "",
    });
    setEditingEncId(null); setEncOpen(true);
  };
  const openEditEnc = (p: any) => {
    setEncForm({
      id_facturation: p.id_facturation ? String(p.id_facturation) : "",
      montant: p.montant ? String(p.montant) : "",
      date_paiement: p.date_paiement ? p.date_paiement.slice(0, 10) : "",
      type: p.type || "", numero: p.numero || "", info: p.info || "",
    });
    setEditingEncId(p.id_paiement); setEncOpen(true);
  };
  const handleSaveEnc = async () => {
    try {
      const payload = {
        id_facturation: encForm.id_facturation ? parseInt(encForm.id_facturation) : null,
        montant: encForm.montant ? parseInt(encForm.montant) : null,
        date_paiement: encForm.date_paiement || null,
        type: encForm.type || null, numero: encForm.numero || null, info: encForm.info || null,
        id_inscription: inscId,
      };
      if (editingEncId) {
        await supabase.from("data_paiement").update(payload).eq("id_paiement", editingEncId);
      } else {
        const { data: max } = await supabase.from("data_paiement").select("id_paiement").order("id_paiement", { ascending: false }).limit(1);
        await supabase.from("data_paiement").insert({ ...payload, id_paiement: (max?.[0]?.id_paiement || 0) + 1 });
      }
      await invalidateAll();
      toast({ title: editingEncId ? "Encaissement modifié" : "Encaissement ajouté" });
      setEncOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };
  const handleDeleteEnc = async (pid: number) => {
    if (!confirm("Supprimer cet encaissement ?")) return;
    await supabase.from("data_paiement").delete().eq("id_paiement", pid);
    await invalidateAll();
    toast({ title: "Encaissement supprimé" });
  };

  const totalFacture = factures.reduce((s, f) => s + (f.montant || 0), 0);
  const totalPaye = paiements.reduce((s, p) => s + (p.montant || 0), 0);
  const solde = totalFacture - totalPaye;

  const nbPresent = presences.filter(p => p.statut === "présent").length;
  const nbAbsent = presences.filter(p => p.statut === "absent").length;
  const nbExcuse = presences.filter(p => p.statut === "excusé").length;
  const totalSeancesPointees = presences.length;
  const tauxPresence = totalSeancesPointees > 0 ? Math.round((nbPresent / totalSeancesPointees) * 100) : null;
  const absencesEtExcuses = presences.filter(p => p.statut !== "présent");

  const campName = participations[0]?.agenda?.camp?.nom || "SmartClub";

  const firstAgenda = participations[participations.length - 1]?.agenda as any ?? null;

  const fmtDateShort = (d: string | null) => {
    if (!d) return "";
    const dt = new Date(d.slice(0, 10) + "T12:00:00");
    const months = ["jan","fév","mar","avr","mai","juin","juil","août","sep","oct","nov","déc"];
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  // Variables calculées à partir d'une participation donnée (fallback : dernière participation)
  const computeMsgVars = (participation: any | null) => {
    const agenda = participation?.agenda ?? firstAgenda;
    const parts: string[] = [];
    if (agenda?.debut) parts.push(`du ${fmtDateShort(agenda.debut)}`);
    if (agenda?.fin) parts.push(`au ${fmtDateShort(agenda.fin)}`);
    const agendaDateLine = parts.join(" ");

    const horaireParts: string[] = [];
    if (agenda?.heure_debut) horaireParts.push(agenda.heure_debut);
    if (agenda?.heure_fin) horaireParts.push(agenda.heure_fin);
    const agendaHoraires = horaireParts.join(" - ");

    const agendaLieu = agenda?.lieu || "";
    const agendaLieuMaps = agendaLieu ? `${agendaLieu} — https://maps.google.com/?q=${encodeURIComponent(agendaLieu)}` : "";

    const jourHeureDebut = agenda?.debut ? formatDayTimeTahiti(agenda.debut, agenda.heure_debut) : "";
    const dateFin = agenda?.fin ? formatDateLongTahiti(agenda.fin) : "";
    const formuleLabel = participation ? (FORMULE_LABELS[participation.formule || 0] || "") : "";
    const pcLabel = participation ? (ORDINATEUR_LABELS[participation.ordinateur || 1] || "") : "";
    const programme = agenda?.camp?.nom || campName;

    return { agendaDateLine, agendaHoraires, agendaLieu, agendaLieuMaps, jourHeureDebut, dateFin, formuleLabel, pcLabel, programme };
  };

  const ribLine = (() => {
    if (!ecole) return "";
    const parts: string[] = [];
    if (ecole.banque) parts.push(`Banque : ${ecole.banque}`);
    if (ecole.agence) parts.push(`Agence : ${ecole.agence}`);
    if (ecole.compte) parts.push(`Compte : ${ecole.compte}`);
    if (ecole.cle) parts.push(`Clé : ${ecole.cle}`);
    if (ecole.iban) parts.push(`IBAN : ${ecole.iban}`);
    if (ecole.bic) parts.push(`BIC : ${ecole.bic}`);
    return parts.join(" | ");
  })();

  const MSG_VARIABLES = [
    { tag: "{Prénom}", desc: "Prénom enfant" },
    { tag: "{Nom}", desc: "Nom enfant" },
    { tag: "{Prénom_légal}", desc: "Prénom responsable" },
    { tag: "{Nom_légal}", desc: "Nom responsable" },
    { tag: "{Ville}", desc: "Ville" },
    { tag: "{Montant_dû}", desc: "Solde restant dû" },
    { tag: "{Programme}", desc: "Nom du programme" },
    { tag: "{ID_Inscription}", desc: "N° d'inscription" },
    { tag: "{RIB}", desc: "Coordonnées bancaires" },
    { tag: "{Date_Programme}", desc: "Dates du stage / atelier" },
    { tag: "{Horaires}", desc: "Horaires (heure début - fin)" },
    { tag: "{Lieu}", desc: "Lieu + lien Google Maps" },
    { tag: "{Jour_Heure_Debut}", desc: "Jour + heure de début (ex: Mardi 25 août à 16h30)" },
    { tag: "{Date_Fin}", desc: "Date de fin du dernier atelier" },
    { tag: "{Formule}", desc: "Formule choisie (Mensualités / À l'année)" },
    { tag: "{PC}", desc: "Vient avec son PC / a besoin d'un PC" },
    { tag: "{Login}", desc: "Email de connexion Espace Kids" },
    { tag: "{MotDePasse}", desc: "Mot de passe temporaire Espace Kids" },
    { tag: "{LienKids}", desc: "Lien Espace Kids" },
  ];

  const resolveVars = (text: string, participation: any | null = null) => {
    const insc = inscription as any;
    const v = computeMsgVars(participation);
    return text
      .replace(/\{Prénom\}/g, inscription?.prenom || "")
      .replace(/\{Nom\}/g, inscription?.nom || "")
      .replace(/\{Prénom_légal\}/g, inscription?.legal_prenom || "")
      .replace(/\{Nom_légal\}/g, inscription?.legal_nom || "")
      .replace(/\{Ville\}/g, inscription?.ville || "")
      .replace(/\{Montant_dû\}/g, formatXPF(solde))
      .replace(/\{Programme\}/g, v.programme)
      .replace(/\{ID_Inscription\}/g, String(inscId))
      .replace(/\{RIB\}/g, ribLine)
      .replace(/\{Date_Programme\}/g, v.agendaDateLine)
      .replace(/\{Horaires\}/g, v.agendaHoraires)
      .replace(/\{Lieu\}/g, v.agendaLieuMaps)
      .replace(/\{Jour_Heure_Debut\}/g, v.jourHeureDebut)
      .replace(/\{Date_Fin\}/g, v.dateFin)
      .replace(/\{Formule\}/g, v.formuleLabel)
      .replace(/\{PC\}/g, v.pcLabel)
      .replace(/\{Login\}/g, insc?.kids_email || "")
      .replace(/\{MotDePasse\}/g, insc?.kids_password_temp || "")
      .replace(/\{LienKids\}/g, "https://smartclub.pf");
  };

  const openSmsDialog = (participation?: any) => {
    setSmsPhone(inscription?.telephone || "");
    setSmsRecipientName(`${inscription?.prenom || ""} ${inscription?.nom || ""}`.trim());
    setSmsBody("");
    setSmsParticipationId(participation?.id_participation ?? null);
    setSmsOpen(true);
  };

  const openEmailDialog = (participation?: any) => {
    setEmailAddress(inscription?.email || "");
    setEmailRecipientName(`${inscription?.prenom || ""} ${inscription?.nom || ""}`.trim());
    setEmailBody("");
    setEmailSubject("SmartClub");
    setEmailAttachFacture(false);
    const linkedFacture = participation ? factures.find(f => f.id_participation === participation.id_participation) : null;
    setEmailFactureId(linkedFacture ? String(linkedFacture.id_facturation) : (factures[0]?.id_facturation ? String(factures[0].id_facturation) : ""));
    setEmailParticipationId(participation?.id_participation ?? null);
    setEmailOpen(true);
  };

  const smsParticipation = participations.find(p => p.id_participation === smsParticipationId) ?? null;
  const emailParticipation = participations.find(p => p.id_participation === emailParticipationId) ?? null;
  const resolvedSmsBody = resolveVars(smsBody, smsParticipation);
  const smsHref = `sms:${smsPhone}${resolvedSmsBody ? `?body=${encodeURIComponent(resolvedSmsBody)}` : ""}`;
  const resolvedEmailBody = resolveVars(emailBody, emailParticipation);

  const handleSendEmail = async () => {
    if (!emailAddress || !resolvedEmailBody) return;
    setEmailSending(true);
    try {
      let attachments: { content: string; name: string }[] | undefined;
      if (emailAttachFacture && emailFactureId) {
        const fact = factures.find(f => String(f.id_facturation) === emailFactureId);
        if (fact) {
          const factPaiements = paiements.filter(p => p.id_facturation === fact.id_facturation);
          const participation = participations.find(p => p.id_participation === fact.id_participation);
          const heuresLabel = getFactureHeuresLabel(fact.montant, participation?.formule, forfaits);
          const pdfBase64 = await getFacturePdfBase64(fact, inscription || null, ecole || null, factPaiements, participation?.agenda ?? null, heuresLabel);
          attachments = [{ content: pdfBase64, name: `facture-${fact.id_facturation}.pdf` }];
        }
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

  const handleCreateKidsAccount = async () => {
    if (!(inscription as any)?.email) return;
    setKidsAccountLoading(true);
    try {
      const kidsEmail = (inscription as any).email;
      const kidsPassword = generateKidsPassword();

      // Via Edge Function (service role) → compte confirmé sans email de vérification
      // Si l'email existe déjà (autre enfant du même parent), le compte est réutilisé
      const res = await fetch(
        "https://dyizcnebdzxnpwufyxps.supabase.co/functions/v1/create-kids-account",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: kidsEmail,
            password: kidsPassword,
            inscription_id: inscId,
            display_name: inscription?.prenom || "",
          }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const actualEmail = result.actual_email || kidsEmail;

      await supabase.from("data_inscription").update({
        kids_email: actualEmail,
        kids_password_temp: kidsPassword,
        kids_account_created: true,
      } as any).eq("id_inscription", inscId);

      await queryClient.invalidateQueries({ queryKey: ["inscription_detail", inscId] });
      toast({ title: "Compte Kids créé !", description: `Login : ${actualEmail}` });
    } catch (e: any) {
      toast({ title: "Erreur création compte", description: e.message, variant: "destructive" });
    }
    setKidsAccountLoading(false);
  };

  const handleRegenerateKidsAccount = async () => {
    if (!(inscription as any)?.kids_email) return;
    setKidsAccountLoading(true);
    try {
      // Toujours utiliser l'email kids existant (ne pas réinventer un email)
      const kidsEmail = (inscription as any).kids_email;
      const kidsPassword = generateKidsPassword();

      const res = await fetch(
        "https://dyizcnebdzxnpwufyxps.supabase.co/functions/v1/create-kids-account",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: kidsEmail,
            password: kidsPassword,
            inscription_id: inscId,
            display_name: inscription?.prenom || "",
          }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const actualEmail = result.actual_email || kidsEmail;
      await supabase.from("data_inscription").update({
        kids_password_temp: kidsPassword,
        kids_email: actualEmail,
      } as any).eq("id_inscription", inscId);

      await queryClient.invalidateQueries({ queryKey: ["inscription_detail", inscId] });
      toast({ title: "Identifiants regénérés !", description: `Login : ${actualEmail}` });
    } catch (e: any) {
      toast({ title: "Erreur regénération", description: e.message, variant: "destructive" });
    }
    setKidsAccountLoading(false);
  };

  const handleChangeKidsPassword = async () => {
    const pwd = newKidsPasswordInput.trim();
    if (!pwd || pwd.length < 4) {
      toast({ title: "Mot de passe trop court", description: "Minimum 4 caractères.", variant: "destructive" });
      return;
    }
    const kidsEmail = (inscription as any).kids_email;
    if (!kidsEmail) return;
    setKidsAccountLoading(true);
    try {
      const res = await fetch(
        "https://dyizcnebdzxnpwufyxps.supabase.co/functions/v1/create-kids-account",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: kidsEmail,
            password: pwd,
            inscription_id: inscId,
            display_name: inscription?.prenom || "",
          }),
        }
      );
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      await supabase.from("data_inscription").update({ kids_password_temp: pwd } as any).eq("id_inscription", inscId);
      await queryClient.invalidateQueries({ queryKey: ["inscription_detail", inscId] });
      setEditingKidsPassword(false);
      setNewKidsPasswordInput("");
      toast({ title: "Mot de passe modifié !", description: `Nouveau MDP : ${pwd}` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setKidsAccountLoading(false);
  };

  const handleSendKidsCredentials = async () => {
    const insc = inscription as any;
    if (!insc?.kids_email) return;
    setKidsAccountLoading(true);
    try {
      await sendEmail({
        to: insc.kids_email,
        toName: `${inscription?.prenom || ""} ${inscription?.nom || ""}`.trim(),
        subject: "Tes identifiants Espace SmartClub",
        text: `Bonjour ${inscription?.prenom || ""},\n\nVoici tes identifiants pour accéder à l'Espace SmartClub :\n\n• Lien de connexion : https://smartclub.pf\n• Email : ${insc.kids_email}\n• Mot de passe : ${insc.kids_password_temp || "(non disponible)"}\n\nTu peux changer ton mot de passe depuis la page de connexion via « Mot de passe oublié ».\n\nL'équipe Polykids`,
        fromName: ecole?.sarl || "SmartClub",
        fromEmail: ecole?.email || undefined,
      });
      toast({ title: "Identifiants envoyés", description: `Email envoyé à ${insc.kids_email}` });
    } catch (e: any) {
      toast({ title: "Erreur envoi", description: e.message, variant: "destructive" });
    }
    setKidsAccountLoading(false);
  };

  const handleDownloadPDF = (facture: any) => {
    const facturePaiements = paiements.filter(p => p.id_facturation === facture.id_facturation);
    const part = participations.find(p => p.id_participation === facture.id_participation);
    const heuresLabel = getFactureHeuresLabel(facture.montant, part?.formule, forfaits);
    generateFacturePdf(facture, inscription || null, ecole || null, facturePaiements, part?.agenda ?? null, heuresLabel);
  };

  if (isLoading) return <div className="p-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!inscription) return <div className="p-8 text-muted-foreground">Inscrit introuvable.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inscrits")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="page-title">{inscription.prenom} {inscription.nom}</h1>
          <p className="page-subtitle">Fiche inscrit #{inscription.id_inscription}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={participations.length > 0 || factures.length > 0 || paiements.length > 0}>
          <Trash2 className="h-4 w-4 mr-1" /> Supprimer
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total facturé</p><CurrencyDisplay amount={totalFacture} size="lg" layout="stacked" /></div>
        <div className="stat-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total payé</p><CurrencyDisplay amount={totalPaye} size="lg" layout="stacked" /></div>
        <div className="stat-card"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Solde</p><CurrencyDisplay amount={solde} size="lg" layout="stacked" className={solde > 0 ? "text-destructive" : ""} /></div>
      </div>

      {/* Two-column layout: Left = Participations/Factures/Encaissements, Right = Infos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Participations */}
          <div className="stat-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Participations ({participations.length})</h3>
              <Button size="sm" variant="outline" onClick={openNewPart}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </div>
            <div className="bg-card rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs w-12">#</TableHead>
                    <TableHead className="font-semibold text-xs">Camp / Agenda</TableHead>
                    <TableHead className="font-semibold text-xs">Jour</TableHead>
                    <TableHead className="font-semibold text-xs">Dates</TableHead>
                    <TableHead className="font-semibold text-xs">Statut</TableHead>
                    <TableHead className="font-semibold text-xs">Ordinateur</TableHead>
                    <TableHead className="font-semibold text-xs">Formule</TableHead>
                    <TableHead className="font-semibold text-xs w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participations.map(p => (
                    <TableRow key={p.id_participation} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.id_participation}</TableCell>
                      <TableCell className="font-medium text-sm">{p.agenda?.camp?.nom || `Agenda #${p.id_agenda}`}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.agenda?.camp?.duree === "Hors vacances scolaires" && p.agenda?.debut ? getDayOfWeekTahiti(p.agenda.debut) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.agenda?.debut} → {p.agenda?.fin}</TableCell>
                      <TableCell>
                        {p.inscrit === 0
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">Inscrit</span>
                          : p.inscrit === 1
                          ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30">Arrêt</span>
                          : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/30">En attente</span>
                        }
                      </TableCell>
                      <TableCell className="text-sm">{ORDINATEUR_LABELS[p.ordinateur || 1] || "—"}</TableCell>
                      <TableCell className="text-sm">{FORMULE_LABELS[p.formule || 0] || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button onClick={() => openEmailDialog(p)} className="p-1 hover:bg-muted rounded" title="Envoyer un email"><Mail className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openSmsDialog(p)} className="p-1 hover:bg-muted rounded" title="Envoyer un SMS"><MessageSquare className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openEditPart(p)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeletePart(p.id_participation)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {participations.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">Aucune participation</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Absences */}
          <div className="stat-card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-semibold text-sm">Absences ({nbAbsent + nbExcuse})</h3>
              {totalSeancesPointees > 0 && (
                <span className="text-xs text-muted-foreground">
                  Taux de présence : <span className="font-semibold text-foreground">{tauxPresence}%</span> ({nbPresent}/{totalSeancesPointees} séances pointées)
                </span>
              )}
            </div>
            {totalSeancesPointees === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun pointage enregistré pour cet enfant.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 text-xs">
                  <span className="text-emerald-600 font-medium">{nbPresent} présent(s)</span>
                  <span className="text-destructive font-medium">{nbAbsent} absent(s)</span>
                  <span className="text-amber-600 font-medium">{nbExcuse} excusé(s)</span>
                </div>
                {absencesEtExcuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune absence enregistrée — 100% de présence 🎉</p>
                ) : (
                  <div className="bg-card rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold text-xs">Date</TableHead>
                          <TableHead className="font-semibold text-xs">Atelier</TableHead>
                          <TableHead className="font-semibold text-xs">Statut</TableHead>
                          <TableHead className="font-semibold text-xs">Remarque</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {absencesEtExcuses.map((p: any) => (
                          <TableRow key={p.id_presence} className="hover:bg-muted/30">
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDateLongTahiti(p.date_seance)}</TableCell>
                            <TableCell className="text-sm">{p.agenda?.camp?.nom || `Atelier #${p.id_agenda}`}</TableCell>
                            <TableCell>
                              {p.statut === "absent" ? (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/30">Absent</span>
                              ) : (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30">Excusé</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.remarque || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Factures */}
          <div className="stat-card space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-semibold text-sm">Factures ({factures.length})</h3>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={openNewFact}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
              </div>
            </div>
            <div className="bg-card rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">#</TableHead>
                    <TableHead className="font-semibold text-xs">Date</TableHead>
                    <TableHead className="font-semibold text-xs">Mois</TableHead>
                    <TableHead className="font-semibold text-xs">Objet</TableHead>
                    <TableHead className="font-semibold text-xs">Heures</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Montant</TableHead>
                    <TableHead className="font-semibold text-xs w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.map(f => (
                    <TableRow key={f.id_facturation} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">{f.id_facturation}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTahiti(f.date_facturation)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.id_mois ? MONTH_OPTIONS.find(m => m.value === String(f.id_mois))?.label || f.id_mois : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.objet || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{getFactureHeuresLabel(f.montant, participations.find(p => p.id_participation === f.id_participation)?.formule, forfaits) || "—"}</TableCell>
                      <TableCell className="text-right"><CurrencyDisplay amount={f.montant} size="sm" /></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button onClick={() => handleDownloadPDF(f)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground" title="Télécharger PDF"><Download className="h-3.5 w-3.5" /></button>
                          <button onClick={() => openEditFact(f)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteFact(f.id_facturation)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {factures.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Aucune facture</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Encaissements */}
          <div className="stat-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm">Encaissements ({paiements.length})</h3>
              <Button size="sm" variant="outline" onClick={() => openNewEnc()}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
            </div>
            <div className="bg-card rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold text-xs">Date</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Montant</TableHead>
                    <TableHead className="font-semibold text-xs">Type</TableHead>
                    <TableHead className="font-semibold text-xs">Facture</TableHead>
                    <TableHead className="font-semibold text-xs">Réf.</TableHead>
                    <TableHead className="font-semibold text-xs w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.map(p => (
                    <TableRow key={p.id_paiement} className="hover:bg-muted/30">
                      <TableCell className="text-sm text-muted-foreground">{formatDateTahiti(p.date_paiement)}</TableCell>
                      <TableCell className="text-right"><CurrencyDisplay amount={p.montant} size="sm" /></TableCell>
                      <TableCell><span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{p.type || "—"}</span></TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{p.id_facturation || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.numero || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button onClick={() => openEditEnc(p)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteEnc(p.id_paiement)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paiements.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Aucun encaissement</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Notes / Remarques */}
          <div className="stat-card space-y-4">
            <h3 className="font-display font-semibold text-sm">Notes / Remarques</h3>
            <Textarea value={form.remarque} onChange={setField("remarque")} rows={4} placeholder="Allergies, infos médicales, contacts d'urgence…" />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>

          <div className="stat-card space-y-4">
            <h3 className="font-display font-semibold text-sm">Enfant</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Prénom</Label><Input value={form.prenom} onChange={setField("prenom")} /></div>
              <div><Label>Nom</Label><Input value={form.nom} onChange={setField("nom")} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Genre</Label>
                <Select value={form.genre ?? ""} onValueChange={v => setForm(f => ({ ...f, genre: v }))}>
                  <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9">👧 Fille</SelectItem>
                    <SelectItem value="10">👦 Garçon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date de naissance</Label><Input type="date" value={form.date_naissance} onChange={setField("date_naissance")} /></div>
            </div>
            <div>
              <Label>Droit à l'image (réseaux sociaux SmartClub)</Label>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setConsentImage(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    consentImage === true
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 font-medium"
                      : "border-input hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Autorisé
                </button>
                <button
                  type="button"
                  onClick={() => setConsentImage(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    consentImage === false
                      ? "bg-destructive/10 border-destructive text-destructive font-medium"
                      : "border-input hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <EyeOff className="h-3.5 w-3.5" /> Refusé
                </button>
                <button
                  type="button"
                  onClick={() => setConsentImage(null)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                    consentImage === null
                      ? "bg-muted border-muted-foreground/50 text-muted-foreground font-medium"
                      : "border-input hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 opacity-30" /> Non défini
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Téléphone</Label><Input value={form.telephone} onChange={setField("telephone")} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={setField("email")} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Adresse</Label><Input value={form.adresse} onChange={setField("adresse")} /></div>
              <div><Label>Code postal</Label><Input value={form.code_postal} onChange={setField("code_postal")} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Ville</Label><Input value={form.ville} onChange={setField("ville")} /></div>
              <div><Label>Île</Label><Input value={form.ile} onChange={setField("ile")} placeholder="Tahiti, Moorea…" /></div>
            </div>
          </div>

          <div className="stat-card space-y-4">
            <h3 className="font-display font-semibold text-sm">Responsable légal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Prénom</Label><Input value={form.legal_prenom} onChange={setField("legal_prenom")} /></div>
              <div><Label>Nom</Label><Input value={form.legal_nom} onChange={setField("legal_nom")} /></div>
            </div>
          </div>

        </div>
      </div>

      {/* Participation Dialog */}
      <Dialog open={partOpen} onOpenChange={setPartOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingPartId ? "Modifier la participation" : "Nouvelle participation"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Agenda</Label>
              <Select value={partForm.id_agenda} onValueChange={v => setPartForm(f => ({ ...f, id_agenda: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir un agenda…" /></SelectTrigger>
                <SelectContent>{allAgendas.map(a => (
                  <SelectItem key={a.id_agenda} value={String(a.id_agenda)}>
                    {formatAgendaSelectLabel(a)}
                  </SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ordinateur</Label>
              <Select value={partForm.ordinateur} onValueChange={v => setPartForm(f => ({ ...f, ordinateur: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Vient avec son PC</SelectItem>
                  <SelectItem value="2">A besoin d'un PC fourni</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Formule</Label>
              <Select value={partForm.formule} onValueChange={v => setPartForm(f => ({ ...f, formule: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Non définie</SelectItem>
                  <SelectItem value="1">Mensualités</SelectItem>
                  <SelectItem value="2">À l'année</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={partForm.inscrit} onValueChange={v => setPartForm(f => ({ ...f, inscrit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Inscrit</SelectItem>
                  <SelectItem value="1">Arrêt</SelectItem>
                  <SelectItem value="2">En attente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSavePart} className="w-full">{editingPartId ? "Modifier" : "Ajouter"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Facture Dialog */}
      <Dialog open={factOpen} onOpenChange={setFactOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingFactId ? "Modifier la facture" : "Nouvelle facture"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Participation associée</Label>
              <Select value={factForm.id_participation} onValueChange={v => setFactForm(f => ({ ...f, id_participation: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>{participations.map(p => {
                  const ag = p.agenda as any;
                  const isAtelier = ag?.camp?.duree === "Hors vacances scolaires";
                  const dayOrMonth = isAtelier
                    ? getDayOfWeekTahiti(ag?.debut)
                    : ag?.debut ? MONTH_NAMES[new Date(ag.debut + "T12:00:00").getMonth()] : null;
                  return (
                    <SelectItem key={p.id_participation} value={String(p.id_participation)}>
                      {ag?.camp?.nom || "Participation"}{dayOrMonth ? ` — ${dayOrMonth}` : ""} #{p.id_participation}
                    </SelectItem>
                  );
                })}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant (XPF)</Label><Input type="number" value={factForm.montant} onChange={e => setFactForm(f => ({ ...f, montant: e.target.value }))} /></div>
            <div><Label>Date</Label><Input type="date" value={factForm.date_facturation} onChange={e => setFactForm(f => ({ ...f, date_facturation: e.target.value }))} /></div>
            <div>
              <Label className="text-white">Mois (id_mois)</Label>
              <Select value={factForm.id_mois} onValueChange={v => setFactForm(f => ({ ...f, id_mois: v }))}>
                <SelectTrigger><SelectValue placeholder="— Aucun —" /></SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map(m => (
                    <SelectItem key={m.value || "none"} value={m.value || "none"}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Objet</Label><Input value={factForm.objet} onChange={e => setFactForm(f => ({ ...f, objet: e.target.value }))} /></div>
            <Button onClick={handleSaveFact} className="w-full">{editingFactId ? "Modifier" : "Ajouter"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-lg flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>SMS — {smsRecipientName}</DialogTitle>
            {smsParticipation && (
              <p className="text-xs text-muted-foreground">
                Participation : {smsParticipation.agenda?.camp?.nom || `#${smsParticipation.id_participation}`}
              </p>
            )}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {smsTemplates.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Modèles rapides</p>
                <div className="flex flex-wrap gap-1.5">
                  {smsTemplates.map(t => (
                    <Badge key={t.id} variant="outline" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => setSmsBody(t.body)}>{t.label}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {MSG_VARIABLES.map(v => (
                  <Badge key={v.tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs" onClick={() => setSmsBody(prev => prev + v.tag)} title={v.desc}>{v.tag}</Badge>
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
          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
            <Button variant="outline" onClick={() => setSmsOpen(false)}>Annuler</Button>
            <Button asChild disabled={!smsBody || !smsPhone}>
              <a href={smsHref}><Send className="h-4 w-4 mr-1" /> Envoyer le SMS</a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>Email — {emailRecipientName}</DialogTitle>
            {emailParticipation && (
              <p className="text-xs text-muted-foreground">
                Participation : {emailParticipation.agenda?.camp?.nom || `#${emailParticipation.id_participation}`}
              </p>
            )}
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <div><Label>Email</Label><Input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} /></div>
            <div><Label>Objet</Label><Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} /></div>
            {emailTemplates.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Modèles rapides</p>
                <div className="flex flex-wrap gap-1.5">
                  {emailTemplates.map(t => (
                    <Badge key={t.id} variant="outline" className="cursor-pointer hover:bg-accent transition-colors" onClick={() => { setEmailBody(t.body); if (t.subject) setEmailSubject(t.subject); }}>{t.label}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {MSG_VARIABLES.map(v => (
                  <Badge key={v.tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs" onClick={() => setEmailBody(prev => prev + v.tag)} title={v.desc}>{v.tag}</Badge>
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
            {factures.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={emailAttachFacture} onChange={e => setEmailAttachFacture(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm">Joindre une facture en PDF</span>
                </label>
                {emailAttachFacture && (
                  <Select value={emailFactureId} onValueChange={setEmailFactureId}>
                    <SelectTrigger><SelectValue placeholder="Choisir une facture…" /></SelectTrigger>
                    <SelectContent>
                      {factures.map(f => (
                        <SelectItem key={f.id_facturation} value={String(f.id_facturation)}>
                          {factureLabel(f)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={!emailBody || !emailAddress || emailSending || (emailAttachFacture && !emailFactureId)}>
              <Mail className="h-4 w-4 mr-1" />{emailSending ? "Envoi…" : "Envoyer l'email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encaissement Dialog */}
      <Dialog open={encOpen} onOpenChange={setEncOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>{editingEncId ? "Modifier l'encaissement" : "Nouvel encaissement"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Facture associée</Label>
              <Select value={encForm.id_facturation} onValueChange={v => setEncForm(f => ({ ...f, id_facturation: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>{factures.map(f => (
                  <SelectItem key={f.id_facturation} value={String(f.id_facturation)}>{factureLabel(f)}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div><Label>Montant (XPF)</Label><Input type="number" value={encForm.montant} onChange={e => setEncForm(f => ({ ...f, montant: e.target.value }))} /></div>
            <div><Label>Date d'encaissement</Label><Input type="date" value={encForm.date_paiement} onChange={e => setEncForm(f => ({ ...f, date_paiement: e.target.value }))} /></div>
            <div>
              <Label>Mode de paiement</Label>
              <Select value={encForm.type} onValueChange={v => setEncForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Mode…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Espèces">Espèces</SelectItem>
                  <SelectItem value="CB">CB</SelectItem>
                  <SelectItem value="Virement">Virement</SelectItem>
                  <SelectItem value="Chèque">Chèque</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Référence / N°</Label><Input value={encForm.numero} onChange={e => setEncForm(f => ({ ...f, numero: e.target.value }))} /></div>
            <div><Label>Info</Label><Input value={encForm.info} onChange={e => setEncForm(f => ({ ...f, info: e.target.value }))} /></div>
            <Button onClick={handleSaveEnc} className="w-full">{editingEncId ? "Modifier" : "Ajouter"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InscriptionDetail;
