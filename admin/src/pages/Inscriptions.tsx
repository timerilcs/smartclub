import { useInscriptions, useParticipations, useAgendas, useFacturations, usePaiements, getSchoolYearFromDate } from "@/hooks/useSupabaseData";
import { formatXPF } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolYear } from "@/contexts/SchoolYearContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Phone, MessageSquare, Send, X, Eye, EyeOff, FileText, Laptop, Mail } from "lucide-react";
import { sendEmail } from "@/lib/sendEmail";
import { toast } from "@/hooks/use-toast";
import { generateIdentifiantsPdf } from "@/lib/identifiants-pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { formatSchoolYear, computeAge } from "@/lib/school-year";
import { getDayOfWeekTahiti, formatDateTimeTahiti } from "@/lib/tahiti-date";

function GenderIcon({ genre }: { genre: string | null | undefined }) {
  if (genre === "9") return <span title="Fille">👧</span>;
  if (genre === "10") return <span title="Garçon">👦</span>;
  return <span className="text-muted-foreground">—</span>;
}

function ConsentImageIcon({ consent }: { consent: boolean | null | undefined }) {
  if (consent === true) return <Eye className="h-3.5 w-3.5 text-emerald-500 shrink-0" title="Droit à l'image : Autorisé" />;
  if (consent === false) return <EyeOff className="h-3.5 w-3.5 text-destructive shrink-0" title="Droit à l'image : Refusé" />;
  return <Eye className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" title="Droit à l'image : Non défini" />;
}

const InscriptionsPage = () => {
  const { currentYear } = useSchoolYear();
  const [searchParams, setSearchParams] = useSearchParams();
  const agendaFilter = searchParams.get("agenda") ? parseInt(searchParams.get("agenda")!) : null;
  const [search, setSearch] = useState("");
  const [ileFilter, setIleFilter] = useState<string>("all");
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsPhone, setSmsPhone] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [smsRecipientName, setSmsRecipientName] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailInscId, setEmailInscId] = useState<number | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const navigate = useNavigate();
  const { data: inscriptions = [], isLoading } = useInscriptions();
  const { data: participations = [] } = useParticipations();
  const { data: agendas = [] } = useAgendas();
  const { data: facturations = [] } = useFacturations();
  const { data: paiements = [] } = usePaiements();

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

  const { data: ecole } = useQuery({
    queryKey: ["data_ecoles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_ecoles").select("*").limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const VARIABLES = [
    { tag: "{Prénom}", desc: "Prénom enfant" },
    { tag: "{Nom}", desc: "Nom enfant" },
    { tag: "{Prénom_légal}", desc: "Prénom responsable" },
    { tag: "{Nom_légal}", desc: "Nom responsable" },
    { tag: "{Ville}", desc: "Ville" },
    { tag: "{Montant_dû}", desc: "Montant restant dû (XPF)" },
  ];

  const EMAIL_VARIABLES = [
    ...VARIABLES,
    { tag: "{Téléphone}", desc: "Téléphone" },
    { tag: "{Email}", desc: "Email" },
    { tag: "{ID_Inscription}", desc: "N° d'inscription" },
    { tag: "{Login}", desc: "Email de connexion Espace Kids" },
    { tag: "{MotDePasse}", desc: "Mot de passe temporaire Espace Kids" },
    { tag: "{LienKids}", desc: "Lien Espace Kids" },
  ];

  const getAmountDue = (idInscription: number) => {
    const totalFacture = facturations
      .filter(f => f.id_inscription === idInscription)
      .reduce((sum, f) => sum + (f.montant || 0), 0);
    const totalPaye = paiements
      .filter(p => p.id_inscription === idInscription)
      .reduce((sum, p) => sum + (p.montant || 0), 0);
    return totalFacture - totalPaye;
  };

  const openSmsDialog = (insc: typeof inscriptions[0]) => {
    setSmsPhone(insc.telephone || "");
    setSmsRecipientName(`${insc.prenom || ""} ${insc.nom || ""}`);
    setSmsBody("");
    setSmsOpen(true);
  };

  const resolveVars = (text: string, insc?: typeof inscriptions[0]) => {
    if (!insc) return text;
    const due = getAmountDue(insc.id_inscription);
    return text
      .replace(/\{Prénom\}/g, insc.prenom || "")
      .replace(/\{Nom\}/g, insc.nom || "")
      .replace(/\{Prénom_légal\}/g, insc.legal_prenom || "")
      .replace(/\{Nom_légal\}/g, insc.legal_nom || "")
      .replace(/\{Ville\}/g, insc.ville || "")
      .replace(/\{Montant_dû\}/g, formatXPF(due))
      .replace(/\{Téléphone\}/g, insc.telephone || "")
      .replace(/\{Email\}/g, (insc as any).email || "")
      .replace(/\{ID_Inscription\}/g, String(insc.id_inscription))
      .replace(/\{Login\}/g, (insc as any).kids_email || "")
      .replace(/\{MotDePasse\}/g, (insc as any).kids_password_temp || "")
      .replace(/\{LienKids\}/g, "https://smartclub.pf");
  };

  const openEmailDialog = (insc: typeof inscriptions[0]) => {
    setEmailInscId(insc.id_inscription);
    setEmailAddress((insc as any).email || "");
    setEmailSubject("SmartClub");
    setEmailBody("");
    setEmailOpen(true);
  };

  const emailInsc = inscriptions.find(i => i.id_inscription === emailInscId);
  const emailRecipientName = emailInsc ? `${emailInsc.prenom || ""} ${emailInsc.nom || ""}`.trim() : "";
  const resolvedEmailSubject = resolveVars(emailSubject, emailInsc);
  const resolvedEmailBody = resolveVars(emailBody, emailInsc);

  const handleSendEmail = async () => {
    if (!emailAddress || !resolvedEmailBody) return;
    setEmailSending(true);
    try {
      await sendEmail({
        to: emailAddress,
        toName: emailInsc ? `${emailInsc.legal_prenom || ""} ${emailInsc.legal_nom || ""}`.trim() || emailRecipientName : undefined,
        subject: resolvedEmailSubject || "SmartClub",
        text: resolvedEmailBody,
        fromName: (ecole as any)?.sarl || "SmartClub",
        fromEmail: (ecole as any)?.email || undefined,
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

  const currentInsc = inscriptions.find(i => `${i.prenom || ""} ${i.nom || ""}` === smsRecipientName);
  const resolvedBody = resolveVars(smsBody, currentInsc);
  const smsHref = `sms:${smsPhone}${resolvedBody ? `?body=${encodeURIComponent(resolvedBody)}` : ""}`;

  const yearAgendaIds = new Set(agendas.filter(a => getSchoolYearFromDate(a.debut) === currentYear).map(a => a.id_agenda));
  const agendaMap = new Map(agendas.map(a => [a.id_agenda, a]));

  const factureByInsc = new Map<number, number[]>();
  facturations.forEach(f => {
    if (f.id_inscription) {
      if (!factureByInsc.has(f.id_inscription)) factureByInsc.set(f.id_inscription, []);
      factureByInsc.get(f.id_inscription)!.push(f.id_facturation);
    }
  });

  // Participants de l'agenda filtré
  const agendaParticipantIds = agendaFilter
    ? new Set(participations.filter(p => p.id_agenda === agendaFilter).map(p => p.id_inscription).filter(Boolean))
    : null;
  const agendaInfo = agendaFilter ? agendaMap.get(agendaFilter) : null;

  // Show ALL inscriptions (including incomplete/drafts), sorted by most recent
  const filteredInscs = inscriptions
    .filter(i => {
      // Filtre agenda
      if (agendaParticipantIds && !agendaParticipantIds.has(i.id_inscription)) return false;
      // Ile filter (Tahiti/Moorea)
      if (ileFilter !== "all") {
        const ile = (i.ile || "").toLowerCase();
        if (ileFilter === "tahiti" && !ile.includes("tahiti")) return false;
        if (ileFilter === "moorea" && !ile.includes("moorea")) return false;
        if (ileFilter === "autre" && (ile.includes("tahiti") || ile.includes("moorea"))) return false;
      }

      if (!search) return true;
      const s = search.toLowerCase();
      const factIds = factureByInsc.get(i.id_inscription) || [];
      const factMatch = factIds.some(fid => String(fid).includes(s));
      return (
        i.nom?.toLowerCase().includes(s) ||
        i.prenom?.toLowerCase().includes(s) ||
        i.telephone?.toLowerCase().includes(s) ||
        i.legal_nom?.toLowerCase().includes(s) ||
        i.legal_prenom?.toLowerCase().includes(s) ||
        i.ville?.toLowerCase().includes(s) ||
        i.code_postal?.toLowerCase().includes(s) ||
        i.communication?.information_courte?.toLowerCase().includes(s) ||
        String(i.id_inscription).includes(s) ||
        factMatch
      );
    })
    .sort((a, b) => b.id_inscription - a.id_inscription);

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Les kids</h1>
        <p className="page-subtitle">{filteredInscs.length} formulaire(s) d'inscription</p>
      </div>
      {agendaFilter && agendaInfo && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm">
          <span className="font-medium text-primary">Filtre : {agendaInfo.camp?.nom || "Agenda"}</span>
          <span className="text-muted-foreground text-xs">{agendaInfo.debut} → {agendaInfo.fin}</span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5 text-xs"
            onClick={() => {
              const labels = filteredInscs.map(i => ({
                prenom: i.prenom,
                nom: i.nom,
                kids_email: (i as any).kids_email ?? null,
                kids_password_temp: (i as any).kids_password_temp ?? null,
              }));
              generateIdentifiantsPdf(labels, {
                nom_camp: agendaInfo.camp?.nom || "Agenda",
                debut: agendaInfo.debut ?? null,
                fin: agendaInfo.fin ?? null,
                lieu: agendaInfo.lieu ?? null,
              });
            }}
            title="Télécharger les étiquettes identifiants (12/page)"
          >
            <FileText className="h-3.5 w-3.5" />
            Étiquettes identifiants
          </Button>
          <button onClick={() => setSearchParams({})} className="text-muted-foreground hover:text-foreground" title="Retirer le filtre">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher nom, tél, ville, code postal, source, id…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={ileFilter} onValueChange={setIleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Île" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les îles</SelectItem>
            <SelectItem value="tahiti">Tahiti</SelectItem>
            <SelectItem value="moorea">Moorea</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs w-12">#</TableHead>
              <TableHead className="font-semibold text-xs w-8"></TableHead>
              <TableHead className="font-semibold text-xs">Enfant</TableHead>
              <TableHead className="font-semibold text-xs">Remarque</TableHead>
              <TableHead className="font-semibold text-xs">Âge</TableHead>
              <TableHead className="font-semibold text-xs">Responsable</TableHead>
              <TableHead className="font-semibold text-xs">Programmes</TableHead>
              <TableHead className="font-semibold text-xs w-14">PC</TableHead>
              <TableHead className="font-semibold text-xs">Inscrit le</TableHead>
              <TableHead className="font-semibold text-xs">Téléphone</TableHead>
              <TableHead className="font-semibold text-xs">Source</TableHead>
              <TableHead className="font-semibold text-xs">Île</TableHead>
              <TableHead className="font-semibold text-xs">Ville</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInscs.map(r => {
              const progs = participations
                .filter(p => p.id_inscription === r.id_inscription && p.id_agenda)
                .map(p => {
                  const agenda = agendaMap.get(p.id_agenda!);
                  if (!agenda) return null;
                  const campName = agenda.camp?.nom_court || "";
                  const year = agenda.debut ? agenda.debut.slice(0, 4) : "";
                  const lieu = agenda.lieu || "";
                  const day = getDayOfWeekTahiti(agenda.debut);
                  const parts = [campName, year, lieu, day].filter(Boolean);
                  return { label: parts.join(" · "), arrete: p.inscrit === 1 };
                })
                .filter(Boolean) as { label: string; arrete: boolean }[];
              const hasOwnPC = participations.some(p => p.id_inscription === r.id_inscription && p.ordinateur === 1);
              const age = computeAge(r.date_naissance);
              const phone = r.telephone;
              const detailPath = `/inscrits/${r.id_inscription}`;
              const detailHref = `#${detailPath}`;
              const handleNav = (e: React.MouseEvent) => {
                if (e.button === 0 && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  navigate(detailPath);
                }
              };
              return (
                <TableRow
                  key={r.id_inscription}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => navigate(detailPath)}
                >
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    <a href={detailHref} onClick={handleNav} className="hover:underline">{r.id_inscription}</a>
                  </TableCell>
                  <TableCell><GenderIcon genre={r.genre} /></TableCell>
                  <TableCell className="font-medium text-sm text-primary">
                    <div className="flex items-center gap-1.5">
                      <ConsentImageIcon consent={(r as any).consent_image} />
                      <a href={detailHref} onClick={handleNav} className="hover:underline">{r.prenom} {r.nom}</a>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                    {r.remarque ? <span className="line-clamp-2" title={r.remarque}>{r.remarque}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{age !== null ? `${age} ans` : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.legal_prenom} {r.legal_nom}</TableCell>
                  <TableCell className="text-xs">{progs.length > 0 ? progs.map((p, i) => <div key={i} className={p.arrete ? "text-destructive line-through" : ""}>{p.label}</div>) : "—"}</TableCell>
                  <TableCell className="text-center">
                    {hasOwnPC ? (
                      <Laptop className="h-7 w-7 text-destructive inline-block" aria-label="Vient avec son PC perso" />
                    ) : (r as any).pc != null ? (
                      <span className="text-2xl font-bold font-display text-foreground">
                        {(r as any).pc}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.date_formulaire ? formatDateTimeTahiti(r.date_formulaire) : "—"}</TableCell>
                  <TableCell className="text-sm">
                    {phone || (r as any).email ? (
                      <div className="flex items-center gap-1.5">
                        {phone && (
                          <>
                            <a href={`tel:${phone}`} className="text-primary hover:underline flex items-center gap-0.5" title="Appeler" onClick={e => e.stopPropagation()}>
                              <Phone className="h-3 w-3" />{phone}
                            </a>
                            <button
                              className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 transition-colors"
                              title="Rédiger SMS"
                              onClick={e => { e.stopPropagation(); openSmsDialog(r); }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {(r as any).email && (
                          <button
                            className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10 transition-colors"
                            title={`Envoyer un email (${(r as any).email})`}
                            onClick={e => { e.stopPropagation(); openEmailDialog(r); }}
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.communication?.information_courte || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.ile || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.ville || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rédiger un SMS — {smsRecipientName}</DialogTitle>
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
                {VARIABLES.map(v => (
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
                <p className="text-sm">{resolvedBody}</p>
                <p className="text-xs text-muted-foreground mt-1">{resolvedBody.length} caractères</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsOpen(false)}>Annuler</Button>
            <Button asChild disabled={!smsBody || !smsPhone}>
              <a href={smsHref}>
                <Send className="h-4 w-4 mr-1" /> Envoyer le SMS
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Envoyer un email — {emailRecipientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {emailTemplates.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Modèles email</p>
                <div className="flex flex-wrap gap-1.5">
                  {emailTemplates.map(t => (
                    <Badge
                      key={t.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => { setEmailBody(t.body); if (t.subject) setEmailSubject(t.subject); }}
                    >
                      {t.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Destinataire</label>
              <Input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="email@exemple.pf" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Objet</label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Variables disponibles</p>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_VARIABLES.map(v => (
                  <Badge key={v.tag} variant="secondary" className="cursor-pointer hover:bg-primary/10 transition-colors font-mono text-xs" onClick={() => setEmailBody(prev => prev + v.tag)} title={v.desc}>
                    {v.tag}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Rédigez votre email ici…" rows={8} />
            {emailBody && (
              <div className="bg-muted/50 rounded-lg p-3 border max-h-60 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-1">Aperçu</p>
                <p className="text-sm font-medium mb-1">{resolvedEmailSubject}</p>
                <p className="text-sm whitespace-pre-wrap">{resolvedEmailBody}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Annuler</Button>
            <Button onClick={handleSendEmail} disabled={!emailBody || !emailAddress || emailSending}>
              <Send className="h-4 w-4 mr-1" /> {emailSending ? "Envoi…" : "Envoyer l'email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InscriptionsPage;
