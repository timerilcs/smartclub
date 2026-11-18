import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

const VARIABLES = [
  { tag: "{Prénom}", desc: "Prénom enfant" },
  { tag: "{Nom}", desc: "Nom enfant" },
  { tag: "{Prénom_légal}", desc: "Prénom responsable" },
  { tag: "{Nom_légal}", desc: "Nom responsable" },
  { tag: "{Ville}", desc: "Ville" },
  { tag: "{Téléphone}", desc: "Téléphone" },
  { tag: "{Email}", desc: "Email" },
  { tag: "{Montant_dû}", desc: "Montant restant dû (XPF)" },
  { tag: "{Montant_facture}", desc: "Montant de la facture (XPF)" },
  { tag: "{Programme}", desc: "Nom du programme" },
  { tag: "{Mois_facture}", desc: "Mois de la facture" },
  { tag: "{Login}", desc: "Email de connexion Espace Kids" },
  { tag: "{MotDePasse}", desc: "Mot de passe temporaire Espace Kids" },
  { tag: "{LienKids}", desc: "Lien de connexion Espace Kids" },
];

type Template = {
  id: number;
  label: string;
  channel: string;
  subject: string | null;
  body: string;
  created_at: string;
  updated_at: string;
};

function useMessageTemplates() {
  return useQuery({
    queryKey: ["data_message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_message_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Template[];
    },
  });
}

const ModelesMessagesPage = () => {
  const queryClient = useQueryClient();
  const { data: templates = [], isLoading } = useMessageTemplates();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [label, setLabel] = useState("");
  const [channel, setChannel] = useState("sms");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const subjectValue = channel === "email" ? (subject || null) : null;
      if (editing) {
        const { error } = await supabase
          .from("data_message_templates")
          .update({ label, channel, subject: subjectValue, body, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("data_message_templates")
          .insert({ label, channel, subject: subjectValue, body });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_message_templates"] });
      toast.success(editing ? "Modèle mis à jour" : "Modèle créé");
      closeDialog();
    },
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("data_message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_message_templates"] });
      toast.success("Modèle supprimé");
    },
  });

  const openNew = () => {
    setEditing(null);
    setLabel("");
    setChannel("sms");
    setSubject("");
    setBody("");
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditing(t);
    setLabel(t.label);
    setChannel(t.channel);
    setSubject(t.subject || "");
    setBody(t.body);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const insertVar = (tag: string) => setBody(prev => prev + tag);

  const previewText = body
    .replace(/\{Prénom\}/g, "Maeva")
    .replace(/\{Nom\}/g, "Dupont")
    .replace(/\{Prénom_légal\}/g, "Sophie")
    .replace(/\{Nom_légal\}/g, "Dupont")
    .replace(/\{Ville\}/g, "Papeete")
    .replace(/\{Téléphone\}/g, "87 12 34 56")
    .replace(/\{Email\}/g, "sophie@mail.pf")
    .replace(/\{Login\}/g, "sophie@mail.pf")
    .replace(/\{MotDePasse\}/g, "Xk7mNpQr2v")
    .replace(/\{LienKids\}/g, "https://smartclub.pf");

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Modèles de messages</h1>
          <p className="page-subtitle">{templates.length} modèle{templates.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Nouveau modèle
        </Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs">Nom</TableHead>
              <TableHead className="font-semibold text-xs">Canal</TableHead>
              <TableHead className="font-semibold text-xs">Contenu</TableHead>
              <TableHead className="font-semibold text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Aucun modèle. Cliquez sur « Nouveau modèle » pour commencer.
                </TableCell>
              </TableRow>
            )}
            {templates.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium text-sm">{t.label}</TableCell>
                <TableCell>
                  <Badge variant={t.channel === "email" ? "default" : "secondary"}>
                    {t.channel.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                  {t.subject && <span className="text-foreground font-medium">{t.subject} — </span>}
                  {t.body}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Modifier">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Copié !"); }}
                      title="Copier"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(t.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nom du modèle</label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Rappel stage" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Canal</label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {channel === "email" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Objet de l'email</label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Rappel — Stage SmartClub" />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Variables <span className="text-muted-foreground/60">(cliquer pour insérer)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLES.map(v => (
                  <Badge
                    key={v.tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors font-mono text-xs"
                    onClick={() => insertVar(v.tag)}
                    title={v.desc}
                  >
                    {v.tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Rédigez votre message ici…"
                rows={5}
              />
              {channel === "sms" && (
                <p className="text-xs text-muted-foreground">{body.length} / 160 caractères</p>
              )}
            </div>

            {body && (
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground mb-1">Aperçu (données fictives)</p>
                <p className="text-sm whitespace-pre-wrap">{previewText}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annuler</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!label || !body || saveMutation.isPending}>
              {editing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelesMessagesPage;
