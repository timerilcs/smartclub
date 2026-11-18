import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Building2, Mail, Phone, CreditCard, MapPin, Plus, Pencil, Trash2, DollarSign, Save, Download, Eye, EyeOff, ScrollText, Wrench, Palette, Sparkles } from "lucide-react";
import { formatDateTahiti } from "@/lib/tahiti-date";
import OptimisationMediasPage from "./OptimisationMediasPage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { getConversionRate, setConversionRate } from "@/lib/currency";
import { useCommunications } from "@/hooks/useSupabaseData";
import jsPDF from "jspdf";

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

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      {icon && <div className="mt-0.5 text-muted-foreground">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || "—"}</p>
      </div>
    </div>
  );
}

// === Reglements sub-component ===
function ReglementsTab() {
  const { data: reglements = [], isLoading } = useQuery({
    queryKey: ["data_reglements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_reglements").select("*").order("date_maj", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ titre: "", reglement: "" });
  const editorRef = useRef<HTMLDivElement>(null);

  const openNew = () => { setForm({ titre: "", reglement: "" }); setEditingId(null); setOpen(true); };
  const openEdit = (r: any) => { setForm({ titre: r.titre || "", reglement: r.reglement || "" }); setEditingId(r.id_reglement); setOpen(true); };
  const openPreview = (r: any) => { setPreviewTitle(r.titre || ""); setPreviewContent(r.reglement || ""); setPreviewOpen(true); };

  const handleSave = async () => {
    try {
      const content = editorRef.current?.innerHTML || form.reglement;
      if (editingId) {
        await supabase.from("data_reglements").update({ titre: form.titre, reglement: content, date_maj: new Date().toISOString() }).eq("id_reglement", editingId);
      } else {
        const { data: max } = await supabase.from("data_reglements").select("id_reglement").order("id_reglement", { ascending: false }).limit(1);
        await supabase.from("data_reglements").insert({ id_reglement: (max?.[0]?.id_reglement || 0) + 1, titre: form.titre, reglement: content, date_maj: new Date().toISOString() });
      }
      await queryClient.invalidateQueries({ queryKey: ["data_reglements"] });
      toast({ title: editingId ? "Règlement modifié" : "Règlement créé" });
      setOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce règlement ?")) return;
    await supabase.from("data_reglements").delete().eq("id_reglement", id);
    await queryClient.invalidateQueries({ queryKey: ["data_reglements"] });
    toast({ title: "Supprimé" });
  };

  const execCmd = useCallback((cmd: string, value?: string) => { document.execCommand(cmd, false, value); editorRef.current?.focus(); }, []);

  const downloadPdf = (r: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(r.titre || "Règlement", 20, 25);
    doc.setFontSize(10); doc.setTextColor(120); doc.text(`Dernière mise à jour : ${r.date_maj ? formatDateTahiti(r.date_maj) : "—"}`, 20, 35);
    doc.setFontSize(12); doc.setTextColor(0);
    const tmp = document.createElement("div"); tmp.innerHTML = r.reglement || "";
    const text = tmp.textContent || tmp.innerText || "";
    doc.text(doc.splitTextToSize(text, 170), 20, 50);
    doc.save(`${r.titre || "reglement"}.pdf`);
  };

  if (isLoading) return <div className="py-8 text-muted-foreground text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-base">Règlements / CGV</h2>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader><TableRow className="bg-muted/50">
            <TableHead className="font-semibold text-xs">Titre</TableHead>
            <TableHead className="font-semibold text-xs">Dernière MAJ</TableHead>
            <TableHead className="font-semibold text-xs">Aperçu</TableHead>
            <TableHead className="font-semibold text-xs w-28">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {reglements.map(r => (
              <TableRow key={r.id_reglement} className="hover:bg-muted/30">
                <TableCell className="font-medium text-sm">{r.titre || "Sans titre"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.date_maj ? formatDateTahiti(r.date_maj) : "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.reglement?.replace(/<[^>]*>/g, "").slice(0, 80) || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openPreview(r)} className="p-1 hover:bg-muted rounded"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => openEdit(r)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => downloadPdf(r)} className="p-1 hover:bg-muted rounded text-primary"><Download className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(r.id_reglement)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Modifier le règlement" : "Nouveau règlement"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Titre</Label><Input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))} /></div>
            <div>
              <Label>Contenu</Label>
              <div className="flex gap-1 mb-2 flex-wrap">
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("bold")}><strong>B</strong></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("italic")}><em>I</em></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("underline")}><u>U</u></Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("insertUnorderedList")}>• Liste</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("insertOrderedList")}>1. Liste</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("formatBlock", "h2")}>H2</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("formatBlock", "h3")}>H3</Button>
              </div>
              <div ref={editorRef} contentEditable className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: form.reglement }} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.titre}>{editingId ? "Modifier" : "Créer"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewTitle}</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none pt-2" dangerouslySetInnerHTML={{ __html: previewContent }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === Outils sub-component ===
type Matiere = { id_matiere: number; nom: string | null; couleur: string | null; actif: number | null; compte_heures: number | null; coef: number | null; affiche_absences: number | null; eval: number | null; id_select: number | null; };

function OutilsTab() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Partial<Matiere> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const { data: matieres = [], isLoading } = useQuery({
    queryKey: ["data_matieres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_matieres").select("*").order("nom");
      if (error) throw error;
      return data as Matiere[];
    },
  });

  const filtered = showInactive ? matieres : matieres.filter(m => m.actif === 1);

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<Matiere>) => {
      if (item.id_matiere) {
        const { error } = await supabase.from("data_matieres").update({ nom: item.nom || null, couleur: item.couleur || null, actif: item.actif ?? 1, compte_heures: item.compte_heures ?? 1, coef: item.coef ?? 1, affiche_absences: item.affiche_absences ?? 1 }).eq("id_matiere", item.id_matiere);
        if (error) throw error;
      } else {
        const maxId = matieres.reduce((max, m) => Math.max(max, m.id_matiere), 0);
        const { error } = await supabase.from("data_matieres").insert({ id_matiere: maxId + 1, nom: item.nom || null, couleur: item.couleur || "#666666", actif: item.actif ?? 1, compte_heures: item.compte_heures ?? 1, coef: item.coef ?? 1, affiche_absences: item.affiche_absences ?? 1, eval: 0, id_select: 0 });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_matieres"] }); toast({ title: "Outil enregistré" }); setDialogOpen(false); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("data_matieres").delete().eq("id_matiere", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_matieres"] }); toast({ title: "Outil supprimé" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="py-8 text-muted-foreground text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-base">Outils & Logiciels</h2>
          <p className="text-xs text-muted-foreground">Gérez les logiciels et outils utilisés dans les agendas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2"><Switch checked={showInactive} onCheckedChange={setShowInactive} className="scale-75" /><span className="text-xs text-muted-foreground">Inactifs</span></div>
          <Button size="sm" onClick={() => { setEditItem({ nom: "", couleur: "#666666", actif: 1, coef: 1, compte_heures: 1, affiche_absences: 1 }); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
        </div>
      </div>
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filtered.map(m => (
          <Card key={m.id_matiere} className={`group cursor-pointer hover:shadow-md transition-shadow ${m.actif !== 1 ? "opacity-40" : ""}`} onClick={() => { setEditItem({ ...m }); setDialogOpen(true); }}>
            <CardContent className="p-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: m.couleur || "#666" }}>{(m.nom || "?").charAt(0).toUpperCase()}</div>
              <p className="text-sm font-medium leading-tight">{m.nom || "—"}</p>
              <div className="flex items-center justify-center gap-1"><div className="w-3 h-3 rounded-full border" style={{ backgroundColor: m.couleur || "#666" }} /><span className="text-[10px] text-muted-foreground font-mono">{m.couleur}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem?.id_matiere ? "Modifier l'outil" : "Nouvel outil"}</DialogTitle></DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Nom *</Label><Input value={editItem.nom || ""} onChange={e => setEditItem({ ...editItem, nom: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Couleur</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={editItem.couleur || "#666666"} onChange={e => setEditItem({ ...editItem, couleur: e.target.value })} className="h-10 w-14 rounded-md border border-input cursor-pointer" />
                  <Input value={editItem.couleur || ""} onChange={e => setEditItem({ ...editItem, couleur: e.target.value })} className="font-mono" />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5"><Label>Coefficient</Label><Input type="number" min="1" value={editItem.coef ?? 1} onChange={e => setEditItem({ ...editItem, coef: parseInt(e.target.value) || 1 })} /></div>
                <div className="flex items-center gap-3 pt-6"><Switch checked={(editItem.actif ?? 1) === 1} onCheckedChange={v => setEditItem({ ...editItem, actif: v ? 1 : 0 })} /><Label>Actif</Label></div>
              </div>
              <div className="flex items-center gap-3"><Switch checked={(editItem.compte_heures ?? 1) === 1} onCheckedChange={v => setEditItem({ ...editItem, compte_heures: v ? 1 : 0 })} /><Label>Compter les heures</Label></div>
              <div className="flex items-center gap-3"><Switch checked={(editItem.affiche_absences ?? 1) === 1} onCheckedChange={v => setEditItem({ ...editItem, affiche_absences: v ? 1 : 0 })} /><Label>Afficher dans les absences</Label></div>
              <div className="flex gap-2">
                <Button onClick={() => saveMutation.mutate(editItem)} disabled={saveMutation.isPending || !editItem.nom} className="flex-1">{saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button>
                {editItem.id_matiere && <Button variant="destructive" onClick={() => { if (confirm(`Supprimer "${editItem.nom}" ?`)) { deleteMutation.mutate(editItem.id_matiere!); setDialogOpen(false); } }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === FAQ sub-component ===
const FAQ_PAGES = [
  { slug: "camp-jeu-video", label: "Stage Tahiti – Jeu Vidéo" },
  { slug: "camp-moorea",    label: "Stage Moorea" },
  { slug: "camp-roblox",   label: "Stage Roblox" },
  { slug: "ateliers",      label: "Ateliers périscolaires" },
];

type FAQItem = { id: number; question: string; reponse: string; ordre: number; actif: number; pages: string[] };
const emptyFAQ = (): Omit<FAQItem, "id"> => ({ question: "", reponse: "", ordre: 0, actif: 1, pages: [] });

function FAQTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<FAQItem, "id">>(emptyFAQ());

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["data_faq_admin"],
    queryFn: async () => {
      const { data: items, error } = await supabase.from("data_faq").select("*").order("ordre", { ascending: true });
      if (error) throw error;
      const { data: pages } = await supabase.from("data_faq_pages").select("id_faq, page");
      const pagesMap: Record<number, string[]> = {};
      for (const p of pages || []) {
        if (!pagesMap[p.id_faq]) pagesMap[p.id_faq] = [];
        pagesMap[p.id_faq].push(p.page);
      }
      return (items || []).map(f => ({ ...f, pages: pagesMap[f.id] || [] })) as FAQItem[];
    },
  });

  const openNew = () => {
    const maxOrdre = faqs.length ? Math.max(...faqs.map(f => f.ordre)) + 1 : 1;
    setEditingId(null);
    setForm({ ...emptyFAQ(), ordre: maxOrdre });
    setDialogOpen(true);
  };

  const openEdit = (faq: FAQItem) => {
    setEditingId(faq.id);
    setForm({ question: faq.question, reponse: faq.reponse, ordre: faq.ordre, actif: faq.actif, pages: [...faq.pages] });
    setDialogOpen(true);
  };

  const togglePage = (slug: string) =>
    setForm(f => ({ ...f, pages: f.pages.includes(slug) ? f.pages.filter(p => p !== slug) : [...f.pages, slug] }));

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number | null; data: Omit<FAQItem, "id"> }) => {
      let faqId = id;
      if (id) {
        const { error } = await supabase.from("data_faq").update({ question: data.question, reponse: data.reponse, ordre: data.ordre, actif: data.actif }).eq("id", id);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("data_faq").insert({ question: data.question, reponse: data.reponse, ordre: data.ordre, actif: data.actif }).select("id").single();
        if (error) throw error;
        faqId = ins?.id;
      }
      if (!faqId) return;
      await supabase.from("data_faq_pages").delete().eq("id_faq", faqId);
      if (data.pages.length > 0)
        await supabase.from("data_faq_pages").insert(data.pages.map(p => ({ id_faq: faqId!, page: p })));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_faq_admin"] }); queryClient.invalidateQueries({ queryKey: ["faq"] }); toast({ title: editingId ? "Question modifiée" : "Question créée" }); setDialogOpen(false); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const toggleActif = useMutation({
    mutationFn: async ({ id, actif }: { id: number; actif: number }) => { await supabase.from("data_faq").update({ actif }).eq("id", id); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data_faq_admin"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("data_faq").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_faq_admin"] }); toast({ title: "Question supprimée" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="py-8 text-muted-foreground text-center">Chargement…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold text-base">Questions fréquentes (FAQ)</h2>
          <p className="text-xs text-muted-foreground">Gérez les questions affichées sur le site public.</p>
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs w-8">Ordre</TableHead>
              <TableHead className="font-semibold text-xs">Question</TableHead>
              <TableHead className="font-semibold text-xs">Pages</TableHead>
              <TableHead className="font-semibold text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.map(faq => (
              <TableRow key={faq.id} className={`hover:bg-muted/30 ${faq.actif === 0 ? "opacity-40" : ""}`}>
                <TableCell className="text-xs text-muted-foreground font-mono">{faq.ordre}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{faq.question}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{faq.reponse}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {faq.pages.length === 0
                      ? <span className="text-xs text-orange-500 font-medium">Aucune page</span>
                      : faq.pages.map(p => {
                          const label = FAQ_PAGES.find(x => x.slug === p)?.label || p;
                          return <span key={p} className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">{label}</span>;
                        })
                    }
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActif.mutate({ id: faq.id, actif: faq.actif === 1 ? 0 : 1 })} className="p-1 hover:bg-muted rounded" title={faq.actif === 1 ? "Désactiver" : "Activer"}>
                      {faq.actif === 1 ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(faq)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm("Supprimer cette question ?")) deleteMutation.mutate(faq.id); }} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditingId(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Modifier la question" : "Nouvelle question"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Question *</Label>
              <Input value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} placeholder="La question…" />
            </div>
            <div className="space-y-1.5">
              <Label>Réponse *</Label>
              <textarea
                className="w-full min-h-[100px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.reponse}
                onChange={e => setForm(f => ({ ...f, reponse: e.target.value }))}
                placeholder="La réponse…"
              />
            </div>
            <div className="flex gap-4 items-end">
              <div className="space-y-1.5">
                <Label>Ordre d'affichage</Label>
                <Input type="number" className="w-24" value={form.ordre} onChange={e => setForm(f => ({ ...f, ordre: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={form.actif === 1} onCheckedChange={v => setForm(f => ({ ...f, actif: v ? 1 : 0 }))} />
                <Label>Visible sur le site</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pages où afficher cette question</Label>
              <div className="flex flex-wrap gap-2">
                {FAQ_PAGES.map(p => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => togglePage(p.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.pages.includes(p.slug)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-input hover:border-primary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => saveMutation.mutate({ id: editingId, data: form })} disabled={saveMutation.isPending || !form.question || !form.reponse} className="flex-1">
                {saveMutation.isPending ? "Enregistrement…" : editingId ? "Modifier" : "Créer"}
              </Button>
              {editingId && (
                <Button variant="destructive" onClick={() => { if (confirm("Supprimer cette question ?")) { deleteMutation.mutate(editingId); setDialogOpen(false); } }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// === Main Page ===
const ParametresPage = () => {
  const { data: ecole, isLoading } = useEcole();
  const { user } = useAuth();
  const { data: communications = [] } = useCommunications();
  const queryClient = useQueryClient();

  const [rate, setRate] = useState(() => getConversionRate());
  const [commOpen, setCommOpen] = useState(false);
  const [commForm, setCommForm] = useState({ information_courte: "", information: "", color: "#3b82f6" });
  const [editingCommId, setEditingCommId] = useState<number | null>(null);
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolForm, setSchoolForm] = useState<Record<string, string>>({});
  const [savingSchool, setSavingSchool] = useState(false);

  useEffect(() => {
    if (ecole) {
      setSchoolForm({
        sarl: ecole.sarl || "", prenom_directeur: ecole.prenom_directeur || "", nom_directeur: ecole.nom_directeur || "",
        rue: ecole.rue || "", cp: ecole.cp || "", ville: ecole.ville || "",
        email: ecole.email || "", tel: ecole.tel || "", mobile: ecole.mobile || "",
        tahiti: ecole.tahiti || "", siret: ecole.siret || "",
      });
    }
  }, [ecole]);

  const handleSaveSchool = async () => {
    if (!ecole) return;
    setSavingSchool(true);
    try {
      await supabase.from("data_ecoles").update({
        sarl: schoolForm.sarl || null, prenom_directeur: schoolForm.prenom_directeur || null,
        nom_directeur: schoolForm.nom_directeur || null, rue: schoolForm.rue || null,
        cp: schoolForm.cp || null, ville: schoolForm.ville || null,
        email: schoolForm.email || null, tel: schoolForm.tel || null,
        mobile: schoolForm.mobile || null, tahiti: schoolForm.tahiti || null,
        siret: schoolForm.siret || null,
      }).eq("id_ecole", ecole.id_ecole);
      await queryClient.invalidateQueries({ queryKey: ["data_ecoles"] });
      toast({ title: "Informations école mises à jour" });
      setEditingSchool(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSavingSchool(false);
  };

  const handleSaveRate = () => { setConversionRate(rate); toast({ title: "Taux de conversion sauvegardé", description: `1 € = ${rate} XPF` }); };

  const openNewComm = () => { setCommForm({ information_courte: "", information: "", color: "#3b82f6" }); setEditingCommId(null); setCommOpen(true); };
  const openEditComm = (c: any) => { setCommForm({ information_courte: c.information_courte || "", information: c.information || "", color: c.color || "#3b82f6" }); setEditingCommId(c.id_communication); setCommOpen(true); };

  const handleSaveComm = async () => {
    try {
      if (editingCommId) {
        await supabase.from("data_communications").update({ information_courte: commForm.information_courte, information: commForm.information, color: commForm.color }).eq("id_communication", editingCommId);
      } else {
        const { data: max } = await supabase.from("data_communications").select("id_communication").order("id_communication", { ascending: false }).limit(1);
        await supabase.from("data_communications").insert({ id_communication: (max?.[0]?.id_communication || 0) + 1, information_courte: commForm.information_courte, information: commForm.information, color: commForm.color });
      }
      await queryClient.invalidateQueries({ queryKey: ["data_communications"] });
      toast({ title: editingCommId ? "Canal modifié" : "Canal créé" });
      setCommOpen(false);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const handleDeleteComm = async (id: number) => {
    if (!confirm("Supprimer ce canal ?")) return;
    await supabase.from("data_communications").delete().eq("id_communication", id);
    await queryClient.invalidateQueries({ queryKey: ["data_communications"] });
    toast({ title: "Canal supprimé" });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-subtitle">Configuration de l'école et du compte</p>
      </div>

      <Tabs defaultValue="ecole" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ecole">École</TabsTrigger>
          <TabsTrigger value="devise">Devise</TabsTrigger>
          <TabsTrigger value="communications">Canaux</TabsTrigger>
          <TabsTrigger value="reglements">Règlements</TabsTrigger>
          <TabsTrigger value="outils">Outils</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="medias"><Sparkles className="h-3.5 w-3.5 mr-1" />Médias</TabsTrigger>
          <TabsTrigger value="compte">Compte</TabsTrigger>
        </TabsList>

        <TabsContent value="ecole" className="space-y-6">
          <div className="flex justify-end">
            {!editingSchool ? (
              <Button size="sm" variant="outline" onClick={() => setEditingSchool(true)}><Pencil className="h-4 w-4 mr-1" /> Modifier</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingSchool(false)}>Annuler</Button>
                <Button size="sm" onClick={handleSaveSchool} disabled={savingSchool}><Save className="h-4 w-4 mr-1" /> {savingSchool ? "Enregistrement…" : "Enregistrer"}</Button>
              </div>
            )}
          </div>
          {editingSchool ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="stat-card space-y-3">
                <h2 className="font-display font-semibold text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Informations école</h2>
                <div><Label>Société</Label><Input value={schoolForm.sarl} onChange={e => setSchoolForm(f => ({ ...f, sarl: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prénom directeur</Label><Input value={schoolForm.prenom_directeur} onChange={e => setSchoolForm(f => ({ ...f, prenom_directeur: e.target.value }))} /></div>
                  <div><Label>Nom directeur</Label><Input value={schoolForm.nom_directeur} onChange={e => setSchoolForm(f => ({ ...f, nom_directeur: e.target.value }))} /></div>
                </div>
                <div><Label>Adresse</Label><Input value={schoolForm.rue} onChange={e => setSchoolForm(f => ({ ...f, rue: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Code postal</Label><Input value={schoolForm.cp} onChange={e => setSchoolForm(f => ({ ...f, cp: e.target.value }))} /></div>
                  <div><Label>Ville</Label><Input value={schoolForm.ville} onChange={e => setSchoolForm(f => ({ ...f, ville: e.target.value }))} /></div>
                </div>
                <div><Label>Email</Label><Input value={schoolForm.email} onChange={e => setSchoolForm(f => ({ ...f, email: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Téléphone</Label><Input value={schoolForm.tel} onChange={e => setSchoolForm(f => ({ ...f, tel: e.target.value }))} /></div>
                  <div><Label>Mobile</Label><Input value={schoolForm.mobile} onChange={e => setSchoolForm(f => ({ ...f, mobile: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>N° Tahiti</Label><Input value={schoolForm.tahiti} onChange={e => setSchoolForm(f => ({ ...f, tahiti: e.target.value }))} /></div>
                  <div><Label>SIRET</Label><Input value={schoolForm.siret} onChange={e => setSchoolForm(f => ({ ...f, siret: e.target.value }))} /></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="stat-card space-y-1">
                <div className="flex items-center gap-2 mb-4"><Building2 className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-base">Informations école</h2></div>
                <InfoRow label="Société" value={ecole?.sarl} icon={<Building2 className="h-4 w-4" />} />
                <InfoRow label="Directeur" value={ecole ? `${ecole.prenom_directeur} ${ecole.nom_directeur}` : null} />
                <InfoRow label="Adresse" value={ecole ? `${ecole.rue}, ${ecole.cp} ${ecole.ville}` : null} icon={<MapPin className="h-4 w-4" />} />
                <InfoRow label="Email" value={ecole?.email} icon={<Mail className="h-4 w-4" />} />
                <InfoRow label="Téléphone" value={ecole?.mobile || ecole?.tel} icon={<Phone className="h-4 w-4" />} />
                <InfoRow label="N° Tahiti" value={ecole?.tahiti} />
                <InfoRow label="SIRET" value={ecole?.siret} />
              </div>
              <div className="stat-card space-y-1">
                <div className="flex items-center gap-2 mb-4"><CreditCard className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-base">Coordonnées bancaires</h2></div>
                <InfoRow label="Banque" value={ecole?.banque} />
                <InfoRow label="Agence" value={ecole?.agence} />
                <InfoRow label="Compte" value={ecole?.compte} />
                <InfoRow label="Clé" value={ecole?.cle} />
                <InfoRow label="IBAN" value={ecole?.iban} />
                <InfoRow label="BIC" value={ecole?.bic} />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="devise">
          <div className="stat-card max-w-md space-y-4">
            <div className="flex items-center gap-2 mb-2"><DollarSign className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-base">Taux de conversion XPF → EUR</h2></div>
            <p className="text-sm text-muted-foreground">Ce taux est utilisé pour l'affichage indicatif en euros.</p>
            <div className="flex items-end gap-3">
              <div className="flex-1"><Label>1 € =</Label><Input type="number" step="0.000001" value={rate} onChange={e => setRate(parseFloat(e.target.value) || 0)} /></div>
              <span className="pb-2 text-sm font-medium">XPF</span>
            </div>
            <Button onClick={handleSaveRate} size="sm">Enregistrer</Button>
          </div>
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base">Canaux de communication</h2>
            <Button size="sm" onClick={openNewComm}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="font-semibold text-xs w-10">Couleur</TableHead>
                <TableHead className="font-semibold text-xs">Nom court</TableHead>
                <TableHead className="font-semibold text-xs">Description</TableHead>
                <TableHead className="font-semibold text-xs w-20">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {communications.map(c => (
                  <TableRow key={c.id_communication} className="hover:bg-muted/30">
                    <TableCell><div className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.color || "#ccc" }} /></TableCell>
                    <TableCell className="font-medium text-sm">{c.information_courte || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.information || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditComm(c)} className="p-1 hover:bg-muted rounded"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDeleteComm(c.id_communication)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Dialog open={commOpen} onOpenChange={setCommOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCommId ? "Modifier le canal" : "Nouveau canal"}</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Nom court</Label><Input value={commForm.information_courte} onChange={e => setCommForm(f => ({ ...f, information_courte: e.target.value }))} /></div>
                <div><Label>Description</Label><Input value={commForm.information} onChange={e => setCommForm(f => ({ ...f, information: e.target.value }))} /></div>
                <div><Label>Couleur</Label><Input type="color" value={commForm.color} onChange={e => setCommForm(f => ({ ...f, color: e.target.value }))} className="h-10 w-20" /></div>
                <Button onClick={handleSaveComm} className="w-full">{editingCommId ? "Modifier" : "Créer"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="reglements"><ReglementsTab /></TabsContent>
        <TabsContent value="outils"><OutilsTab /></TabsContent>
        <TabsContent value="faq"><FAQTab /></TabsContent>
        <TabsContent value="medias"><OptimisationMediasPage /></TabsContent>

        <TabsContent value="compte">
          <div className="stat-card max-w-md space-y-1">
            <div className="flex items-center gap-2 mb-4"><Settings className="h-5 w-5 text-primary" /><h2 className="font-display font-semibold text-base">Compte utilisateur</h2></div>
            <InfoRow label="Email connecté" value={user?.email} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="ID utilisateur" value={user?.id} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParametresPage;
