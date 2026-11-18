import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Download, Eye } from "lucide-react";
import { formatDateTahiti } from "@/lib/tahiti-date";
import { useState, useRef, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

function useReglements() {
  return useQuery({
    queryKey: ["data_reglements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_reglements").select("*").order("date_maj", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

const ReglementsPage = () => {
  const { data: reglements = [], isLoading } = useReglements();
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

  const execCmd = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }, []);

  const downloadPdf = (r: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(r.titre || "Règlement", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Dernière mise à jour : ${r.date_maj ? formatDateTahiti(r.date_maj) : "—"}`, 20, 35);
    doc.setFontSize(12);
    doc.setTextColor(0);
    // Strip HTML for PDF
    const tmp = document.createElement("div");
    tmp.innerHTML = r.reglement || "";
    const text = tmp.textContent || tmp.innerText || "";
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, 50);
    doc.save(`${r.titre || "reglement"}.pdf`);
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Règlements / CGV</h1>
          <p className="page-subtitle">{reglements.length} document(s)</p>
        </div>
        <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs">Titre</TableHead>
              <TableHead className="font-semibold text-xs">Dernière MAJ</TableHead>
              <TableHead className="font-semibold text-xs">Aperçu</TableHead>
              <TableHead className="font-semibold text-xs w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
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

      {/* Editor Dialog */}
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
                <Button type="button" variant="outline" size="sm" onClick={() => execCmd("formatBlock", "p")}>P</Button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: form.reglement }}
              />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.titre}>{editingId ? "Modifier" : "Créer"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{previewTitle}</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none pt-2" dangerouslySetInnerHTML={{ __html: previewContent }} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReglementsPage;
