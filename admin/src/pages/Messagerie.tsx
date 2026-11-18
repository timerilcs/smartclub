import { useContacts } from "@/hooks/useSupabaseData";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Mail, MailOpen, Archive, Phone, Trash2, Reply } from "lucide-react";
import { formatDateTahiti } from "@/lib/tahiti-date";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const MessageriePage = () => {
  const { data: contacts = [], isLoading } = useContacts();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<number>>(new Set());

  const filtered = contacts
    .filter(c => !archivedIds.has(c.id_contact))
    .filter(c => { if (filter === "unread") return !readIds.has(c.id_contact); return true; })
    .filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (c.nom?.toLowerCase().includes(s) || c.prenom?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s));
    });

  const unreadCount = contacts.filter(c => !readIds.has(c.id_contact) && !archivedIds.has(c.id_contact)).length;

  const markRead = (id: number) => setReadIds(prev => new Set(prev).add(id));
  const markArchived = (id: number) => { setArchivedIds(prev => new Set(prev).add(id)); setSelectedContact(null); };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce message ?")) return;
    try {
      await supabase.from("data_contact").delete().eq("id_contact", id);
      await queryClient.invalidateQueries({ queryKey: ["data_contact"] });
      toast({ title: "Message supprimé" });
      setSelectedContact(null);
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
  };

  const openReply = (c: any) => {
    const name = c.prenom || "Monsieur/Madame";
    setReplyText(`Ia orana, ${name}\n\n`);
    setShowReply(true);
  };

  const sendReply = () => {
    if (selectedContact?.email) {
      window.open(`mailto:${selectedContact.email}?subject=Re: Votre message&body=${encodeURIComponent(replyText)}`);
    }
    setShowReply(false);
    toast({ title: "Client email ouvert" });
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Messagerie</h1>
        <p className="page-subtitle">{contacts.length} message(s) • {unreadCount} non lu(s)</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>Tous</Button>
        <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>Non lus ({unreadCount})</Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-xs w-8"></TableHead>
              <TableHead className="font-semibold text-xs">Nom</TableHead>
              <TableHead className="font-semibold text-xs">Email</TableHead>
              <TableHead className="font-semibold text-xs">Téléphone</TableHead>
              <TableHead className="font-semibold text-xs">Message</TableHead>
              <TableHead className="font-semibold text-xs">Date</TableHead>
              <TableHead className="font-semibold text-xs w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => {
              const isRead = readIds.has(c.id_contact);
              return (
                <TableRow key={c.id_contact} className={`hover:bg-muted/30 cursor-pointer ${!isRead ? "font-semibold" : ""}`}
                  onClick={() => { setSelectedContact(c); markRead(c.id_contact); setShowReply(false); }}>
                  <TableCell>{isRead ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}</TableCell>
                  <TableCell className="text-sm">{c.prenom} {c.nom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {c.telephone ? <a href={`tel:${c.telephone}`} className="text-primary hover:underline flex items-center gap-0.5" onClick={e => e.stopPropagation()}><Phone className="h-3 w-3" />{c.telephone}</a> : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.message || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.date_formulaire ? formatDateTahiti(c.date_formulaire) : "—"}</TableCell>
                  <TableCell>
                    <button onClick={e => { e.stopPropagation(); handleDelete(c.id_contact); }} className="p-1 hover:bg-destructive/10 text-destructive rounded">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedContact?.prenom} {selectedContact?.nom}</DialogTitle></DialogHeader>
          {selectedContact && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Email :</span> {selectedContact.email || "—"}</div>
                <div><span className="text-muted-foreground">Tél :</span> {selectedContact.telephone ? <a href={`tel:${selectedContact.telephone}`} className="text-primary hover:underline">{selectedContact.telephone}</a> : "—"}</div>
                <div><span className="text-muted-foreground">Date :</span> {selectedContact.date_formulaire ? formatDateTahiti(selectedContact.date_formulaire) : "—"}</div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">{selectedContact.message || "Aucun message"}</div>

              {showReply && (
                <div className="space-y-2">
                  <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={6} className="text-sm" />
                  <Button onClick={sendReply} size="sm" className="w-full">Envoyer la réponse par email</Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openReply(selectedContact)}>
                  <Reply className="h-4 w-4 mr-1" /> Répondre
                </Button>
                <Button variant="outline" size="sm" onClick={() => markArchived(selectedContact.id_contact)}>
                  <Archive className="h-4 w-4 mr-1" /> Archiver
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedContact.id_contact)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageriePage;

export function useUnreadCount() {
  return 0;
}
