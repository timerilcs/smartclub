import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Check, Trash2, Pencil, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDateTahiti } from "@/lib/tahiti-date";

type Avis = {
  id: number;
  nom: string;
  message: string;
  note: number;
  approuve: number;
  created_at: string;
};

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("h-3.5 w-3.5", i < note ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")}
        />
      ))}
    </div>
  );
}

const AvisPage = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, nom: "", message: "", note: 5, created_at: "" });

  const { data: avis = [], isLoading } = useQuery({
    queryKey: ["data_avis_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_avis")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Avis[];
    },
  });

  const filtered = avis.filter(a => {
    if (filter === "pending") return a.approuve !== 1;
    if (filter === "approved") return a.approuve === 1;
    return true;
  });

  const pendingCount = avis.filter(a => a.approuve !== 1).length;

  const handleValidate = async (id: number) => {
    await supabase.from("data_avis").update({ approuve: 1 } as any).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["data_avis_all"] });
    await queryClient.invalidateQueries({ queryKey: ["data_avis_pending_count"] });
    toast({ title: "Avis approuvé" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet avis ?")) return;
    await supabase.from("data_avis").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["data_avis_all"] });
    await queryClient.invalidateQueries({ queryKey: ["data_avis_pending_count"] });
    toast({ title: "Avis supprimé" });
  };

  const openEdit = (a: Avis) => {
    setEditForm({
      id: a.id,
      nom: a.nom,
      message: a.message,
      note: a.note,
      created_at: a.created_at ? a.created_at.slice(0, 10) : "",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    await supabase.from("data_avis").update({
      nom: editForm.nom,
      message: editForm.message,
      note: editForm.note,
      created_at: editForm.created_at ? new Date(editForm.created_at + "T12:00:00").toISOString() : undefined,
    } as any).eq("id", editForm.id);
    await queryClient.invalidateQueries({ queryKey: ["data_avis_all"] });
    toast({ title: "Avis modifié" });
    setEditOpen(false);
  };

  const tabs = [
    { key: "pending" as const, label: `En attente${pendingCount > 0 ? ` (${pendingCount})` : ""}` },
    { key: "approved" as const, label: "Approuvés" },
    { key: "all" as const, label: "Tous" },
  ];

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Avis clients</h1>
        <p className="page-subtitle">{filtered.length} avis</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              filter === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun avis dans cette catégorie.</p>
      )}

      <div className="space-y-3">
        {filtered.map(a => (
          <div
            key={a.id}
            className={cn(
              "stat-card flex items-start gap-4",
              a.approuve !== 1 && "border-amber-400/40 bg-amber-500/5"
            )}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-sm">{a.nom}</span>
                <StarRating note={a.note} />
                {a.approuve !== 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide text-amber-700 border-amber-400/50 bg-amber-500/10">
                    En attente
                  </span>
                )}
                {a.approuve === 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide text-emerald-700 border-emerald-400/50 bg-emerald-500/10">
                    Approuvé
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {a.created_at ? formatDateTahiti(a.created_at) : "—"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{a.message}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {a.approuve !== 1 && (
                <button
                  onClick={() => handleValidate(a.id)}
                  className="p-1.5 rounded hover:bg-emerald-500/10 text-emerald-600 transition-colors"
                  title="Approuver"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => openEdit(a)}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Modifier"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Modifier l'avis</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Nom</Label><Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} /></div>
            <div>
              <Label>Note</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setEditForm(f => ({ ...f, note: n }))}
                    className="p-1"
                  >
                    <Star className={cn("h-5 w-5", n <= editForm.note ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Date</Label><Input type="date" value={editForm.created_at} onChange={e => setEditForm(f => ({ ...f, created_at: e.target.value }))} /></div>
            <div><Label>Message</Label><Textarea value={editForm.message} onChange={e => setEditForm(f => ({ ...f, message: e.target.value }))} rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvisPage;
