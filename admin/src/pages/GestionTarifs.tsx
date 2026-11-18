import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { formatXPF, formatEUR } from "@/lib/currency";
import { Pencil, Plus, Trash2, Tag, Clock } from "lucide-react";

type Forfait = {
  id_forfait: number;
  nom: string | null;
  designation: string | null;
  prix: number | null;
  heure: number | null;
};

export default function GestionTarifsPage() {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Partial<Forfait> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: forfaits = [], isLoading } = useQuery({
    queryKey: ["data_forfait"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_forfait")
        .select("*")
        .order("id_forfait");
      if (error) throw error;
      return data as Forfait[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<Forfait>) => {
      if (item.id_forfait) {
        const { error } = await supabase
          .from("data_forfait")
          .update({
            nom: item.nom || null,
            designation: item.designation || null,
            prix: item.prix ?? 0,
            heure: item.heure ?? 0,
          })
          .eq("id_forfait", item.id_forfait);
        if (error) throw error;
      } else {
        // Get next id
        const maxId = forfaits.reduce((max, f) => Math.max(max, f.id_forfait), 0);
        const { error } = await supabase.from("data_forfait").insert({
          id_forfait: maxId + 1,
          nom: item.nom || null,
          designation: item.designation || null,
          prix: item.prix ?? 0,
          heure: item.heure ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_forfait"] });
      toast({ title: "Tarif enregistré" });
      setDialogOpen(false);
      setEditItem(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("data_forfait").delete().eq("id_forfait", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["data_forfait"] });
      toast({ title: "Tarif supprimé" });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des tarifs</h1>
          <p className="text-sm text-muted-foreground">
            Modifiez les tarifs des stages, ateliers et formules d'abonnement.
          </p>
        </div>
        <Button onClick={() => { setEditItem({ nom: "", designation: "", prix: 0, heure: 0 }); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un tarif
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement…</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Formule</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  <TableHead className="text-right">Prix XPF</TableHead>
                  <TableHead className="text-right">Prix EUR</TableHead>
                  <TableHead className="text-right">Tarif horaire</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forfaits.map((f) => (
                  <TableRow key={f.id_forfait}>
                    <TableCell className="text-muted-foreground text-xs">{f.id_forfait}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium text-sm">{f.nom || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {f.designation || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.heure ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {f.heure}h
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {formatXPF(f.prix)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatEUR(f.prix)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      {f.heure ? `${formatXPF(Math.round((f.prix ?? 0) / f.heure))}/h` : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { setEditItem({ ...f }); setDialogOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => { if (confirm(`Supprimer "${f.nom}" ?`)) deleteMutation.mutate(f.id_forfait); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem?.id_forfait ? "Modifier le tarif" : "Nouveau tarif"}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom de la formule *</Label>
                <Input
                  value={editItem.nom || ""}
                  onChange={(e) => setEditItem({ ...editItem, nom: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Description / Désignation</Label>
                <Textarea
                  value={editItem.designation || ""}
                  onChange={(e) => setEditItem({ ...editItem, designation: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Prix (XPF)</Label>
                  <Input
                    type="number"
                    value={editItem.prix ?? 0}
                    onChange={(e) => setEditItem({ ...editItem, prix: parseInt(e.target.value) || 0 })}
                  />
                  {editItem.prix ? (
                    <p className="text-xs text-muted-foreground">{formatEUR(editItem.prix)}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Heures incluses</Label>
                  <Input
                    type="number"
                    value={editItem.heure ?? 0}
                    onChange={(e) => setEditItem({ ...editItem, heure: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button
                onClick={() => saveMutation.mutate(editItem)}
                disabled={saveMutation.isPending || !editItem.nom}
                className="w-full"
              >
                {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
