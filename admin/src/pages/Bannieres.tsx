import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { convertToWebP } from "@/lib/image-utils";
import { useCamps } from "@/hooks/useSupabaseData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Image, Video, Plus, Trash2, Upload, ExternalLink, Pencil, Palette, Save } from "lucide-react";

const SITE_PAGES = [
  { value: "accueil", label: "Accueil" },
  { value: "accompagnements", label: "Nos accompagnements" },
  { value: "tarifs", label: "Tarifs & horaires" },
  { value: "stages", label: "Stages de vacances" },
  { value: "avis", label: "Avis" },
  { value: "contact", label: "Contact & inscription" },
];

const SECTIONS = [
  { value: "hero", label: "Bannière (header)" },
  { value: "video", label: "Vidéo de fond" },
  { value: "gallery", label: "Galerie" },
];

type MediaItem = {
  id: number;
  page: string;
  section: string;
  type: string;
  url: string;
  alt: string | null;
  sort_order: number;
  actif: number;
  overlay_opacity: number | null;
  overlay_color: string | null;
  created_at: string;
};

type PageConfig = {
  id: number;
  page: string;
  id_camp: number | null;
  theme_color: string | null;
  overlay_opacity: number | null;
  overlay_color: string | null;
};

export default function BannieresPage() {
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("accueil");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { data: allCamps = [] } = useCamps();

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ["data_media"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_media").select("*").order("page").order("section").order("sort_order");
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const { data: pageConfigs = [] } = useQuery({
    queryKey: ["data_page_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_page_config").select("*").order("page");
      if (error) throw error;
      return data as PageConfig[];
    },
  });

  const filteredItems = mediaItems.filter(m => m.page === selectedPage);
  const heroItems = filteredItems.filter(m => m.section === "hero");
  const videoItems = filteredItems.filter(m => m.section === "video");
  const galleryItems = filteredItems.filter(m => m.section === "gallery");

  const toggleMutation = useMutation({
    mutationFn: async ({ id, actif }: { id: number; actif: number }) => {
      const { error } = await supabase.from("data_media").update({ actif }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["data_media"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      if (item.type === "image" && item.url.includes("site-banners")) {
        const path = item.url.split("/site-banners/")[1];
        if (path) await supabase.storage.from("site-banners").remove([path]);
      }
      const { error } = await supabase.from("data_media").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_media"] }); toast({ title: "Média supprimé" }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const updateMediaMutation = useMutation({
    mutationFn: async (item: MediaItem) => {
      const { error } = await supabase.from("data_media").update({
        page: item.page, section: item.section, type: item.type, url: item.url,
        alt: item.alt, sort_order: item.sort_order, actif: item.actif, overlay_opacity: item.overlay_opacity, overlay_color: item.overlay_color,
      }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["data_media"] }); toast({ title: "Média modifié" }); setEditDialogOpen(false); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const getYouTubeThumbnail = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([^&?#]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bannières & Médias</h1>
          <p className="text-sm text-muted-foreground">Gérez les bannières, vidéos et thème de chaque page du site.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Ajouter un média</Button>
          </DialogTrigger>
          <AddMediaDialog onClose={() => setDialogOpen(false)} defaultPage={selectedPage} />
        </Dialog>
      </div>

      <Tabs defaultValue="medias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="medias">Médias & Bannières</TabsTrigger>
          <TabsTrigger value="theme">Thème par page</TabsTrigger>
        </TabsList>

        <TabsContent value="medias" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SITE_PAGES.map(p => {
              const count = mediaItems.filter(m => m.page === p.value).length;
              return (
                <Button key={p.value} variant={selectedPage === p.value ? "default" : "outline"} size="sm" onClick={() => setSelectedPage(p.value)} className="gap-1.5">
                  {p.label}
                  {count > 0 && <span className="ml-1 text-xs bg-primary-foreground/20 rounded-full px-1.5">{count}</span>}
                </Button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Chargement…</div>
          ) : (
            <div className="space-y-6">
              {[
                { title: "Bannières d'en-tête", icon: <Image className="h-5 w-5" />, items: heroItems },
                { title: "Vidéos de fond", icon: <Video className="h-5 w-5" />, items: videoItems },
                { title: "Galerie", icon: <Image className="h-5 w-5" />, items: galleryItems },
              ].filter(s => s.items.length > 0).map(section => (
                <Card key={section.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">{section.icon} {section.title} <span className="text-xs font-normal text-muted-foreground">({section.items.length})</span></CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.items.map(item => {
                        const isVideo = item.type === "video";
                        const thumb = isVideo ? getYouTubeThumbnail(item.url) : item.url;
                        return (
                          <div key={item.id} className={`group relative rounded-xl border overflow-hidden transition-all ${item.actif !== 1 ? "opacity-50" : ""}`}>
                            <div className="aspect-video bg-muted relative overflow-hidden">
                              {thumb ? <img src={thumb} alt={item.alt || ""} className="w-full h-full object-cover" /> : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">{isVideo ? <Video className="h-8 w-8" /> : <Image className="h-8 w-8" />}</div>
                              )}
                              {isVideo && <div className="absolute inset-0 flex items-center justify-center"><div className="bg-black/60 rounded-full p-2"><Video className="h-5 w-5 text-white" /></div></div>}
                              {item.overlay_opacity != null && item.overlay_opacity > 0 && (
                                <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                                  Overlay: {Math.round((item.overlay_opacity || 0) * 100)}%
                                </div>
                              )}
                            </div>
                            <div className="p-3 space-y-2">
                              <p className="text-xs font-medium truncate">{item.alt || "Sans description"}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{item.url}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Switch checked={item.actif === 1} onCheckedChange={v => toggleMutation.mutate({ id: item.id, actif: v ? 1 : 0 })} className="scale-75" />
                                  <span className="text-[11px] text-muted-foreground">{item.actif === 1 ? "Actif" : "Inactif"}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => { setEditItem(item); setEditDialogOpen(true); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary transition-colors"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></a>
                                  <button onClick={() => { if (confirm("Supprimer ce média ?")) deleteMutation.mutate(item); }} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredItems.length === 0 && <p className="text-center py-12 text-muted-foreground">Aucun média pour cette page.</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="theme">
          <ThemeConfigTab pageConfigs={pageConfigs} allCamps={allCamps} />
        </TabsContent>
      </Tabs>

      {/* Edit media dialog */}
      <Dialog open={editDialogOpen} onOpenChange={o => { setEditDialogOpen(o); if (!o) setEditItem(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier le média</DialogTitle></DialogHeader>
          {editItem && (
            <EditMediaForm item={editItem} onSave={item => updateMediaMutation.mutate(item)} saving={updateMediaMutation.isPending} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditMediaForm({ item, onSave, saving }: { item: MediaItem; onSave: (item: MediaItem) => void; saving: boolean }) {
  const [form, setForm] = useState({ ...item });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webpBlob = await convertToWebP(file);
      const filename = `${form.page}/${form.section}-${Date.now()}.webp`;
      const { error } = await supabase.storage.from("site-banners").upload(filename, webpBlob, { contentType: "image/webp" });
      if (error) throw error;
      const { data } = supabase.storage.from("site-banners").getPublicUrl(filename);
      setForm(f => ({ ...f, url: data.publicUrl }));
      setPreviewUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Page</Label>
        <Select value={form.page} onValueChange={v => setForm(f => ({ ...f, page: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SITE_PAGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Section</Label>
        <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {form.type === "image" && (
        <div className="space-y-2">
          <Label>Remplacer l'image</Label>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <img src={previewUrl || form.url} alt="" className="max-h-32 mx-auto rounded-lg object-contain" />
            <p className="text-xs text-muted-foreground mt-2">{uploading ? "Conversion WebP…" : "Cliquer pour remplacer"}</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileReplace} />
        </div>
      )}
      {form.type === "video" && (
        <div className="space-y-1.5">
          <Label>URL YouTube</Label>
          <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label>Description (alt)</Label>
        <Input value={form.alt || ""} onChange={e => setForm(f => ({ ...f, alt: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Couleur overlay</Label>
        <div className="flex items-center gap-2">
          <input type="color" value={form.overlay_color || "#000000"} onChange={e => setForm(f => ({ ...f, overlay_color: e.target.value }))} className="h-8 w-12 rounded border cursor-pointer" />
          <Input value={form.overlay_color || "#000000"} onChange={e => setForm(f => ({ ...f, overlay_color: e.target.value }))} className="font-mono text-xs h-8" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Opacité overlay: {Math.round((form.overlay_opacity || 0) * 100)}%</Label>
        <Slider value={[form.overlay_opacity ?? 0.5]} onValueChange={([v]) => setForm(f => ({ ...f, overlay_opacity: v }))} min={0} max={1} step={0.05} />
      </div>
      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-1.5">
          <Label>Ordre</Label>
          <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch checked={form.actif === 1} onCheckedChange={v => setForm(f => ({ ...f, actif: v ? 1 : 0 }))} />
          <Label>Actif</Label>
        </div>
      </div>
      <Button onClick={() => onSave(form)} disabled={saving} className="w-full">{saving ? "Enregistrement…" : "Enregistrer"}</Button>
    </div>
  );
}

function ThemeConfigTab({ pageConfigs, allCamps }: { pageConfigs: PageConfig[]; allCamps: any[] }) {
  const queryClient = useQueryClient();
  const [editedConfigs, setEditedConfigs] = useState<Record<string, { theme_color: string; id_camp: string; overlay_opacity: number; overlay_color: string }>>({});

  const getConfig = (page: string) => {
    if (editedConfigs[page]) return editedConfigs[page];
    const cfg = pageConfigs.find(c => c.page === page);
    return { theme_color: cfg?.theme_color || "#3b82f6", id_camp: cfg?.id_camp ? String(cfg.id_camp) : "", overlay_opacity: cfg?.overlay_opacity ?? 0.5, overlay_color: cfg?.overlay_color || "#000000" };
  };

  const setConfig = (page: string, key: string, value: any) => {
    const current = getConfig(page);
    setEditedConfigs(prev => ({ ...prev, [page]: { ...current, [key]: value } }));
  };

  const saveConfig = async (page: string) => {
    const cfg = getConfig(page);
    try {
      const existing = pageConfigs.find(c => c.page === page);
      const payload = { page, theme_color: cfg.theme_color, id_camp: cfg.id_camp ? parseInt(cfg.id_camp) : null, overlay_opacity: cfg.overlay_opacity, overlay_color: cfg.overlay_color };
      if (existing) {
        await supabase.from("data_page_config").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("data_page_config").insert(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ["data_page_config"] });
      toast({ title: `Thème "${page}" sauvegardé` });
      setEditedConfigs(prev => { const next = { ...prev }; delete next[page]; return next; });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Définissez la couleur de thématique et le camp associé pour chaque page du site.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_PAGES.map(p => {
          const cfg = getConfig(p.value);
          const isEdited = !!editedConfigs[p.value];
          return (
            <Card key={p.value} className="overflow-hidden">
              <div className="h-2" style={{ backgroundColor: cfg.theme_color }} />
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{p.label}</h4>
                  {isEdited && (
                    <Button size="sm" variant="outline" onClick={() => saveConfig(p.value)}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Sauver
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Couleur thème</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={cfg.theme_color} onChange={e => setConfig(p.value, "theme_color", e.target.value)} className="h-8 w-12 rounded border cursor-pointer" />
                    <Input value={cfg.theme_color} onChange={e => setConfig(p.value, "theme_color", e.target.value)} className="font-mono text-xs h-8" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Camp associé</Label>
                  <Select value={cfg.id_camp || "none"} onValueChange={v => setConfig(p.value, "id_camp", v === "none" ? "" : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Aucun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Aucun —</SelectItem>
                      {allCamps.map(c => <SelectItem key={c.id_camp} value={String(c.id_camp)}>{c.nom}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Couleur overlay</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={cfg.overlay_color} onChange={e => setConfig(p.value, "overlay_color", e.target.value)} className="h-8 w-12 rounded border cursor-pointer" />
                    <Input value={cfg.overlay_color} onChange={e => setConfig(p.value, "overlay_color", e.target.value)} className="font-mono text-xs h-8" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Opacité overlay: {Math.round(cfg.overlay_opacity * 100)}%</Label>
                  <Slider value={[cfg.overlay_opacity]} onValueChange={([v]) => setConfig(p.value, "overlay_opacity", v)} min={0} max={1} step={0.05} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AddMediaDialog({ onClose, defaultPage }: { onClose: () => void; defaultPage: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [page, setPage] = useState(defaultPage);
  const [section, setSection] = useState("hero");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      let finalUrl = url;
      if (mediaType === "image" && selectedFile) {
        const webpBlob = await convertToWebP(selectedFile);
        const filename = `${page}/${section}-${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from("site-banners").upload(filename, webpBlob, { contentType: "image/webp" });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("site-banners").getPublicUrl(filename);
        finalUrl = data.publicUrl;
      }
      if (!finalUrl) { toast({ title: "Veuillez fournir une image ou une URL", variant: "destructive" }); setUploading(false); return; }
      const { error } = await supabase.from("data_media").insert({ page, section, type: mediaType, url: finalUrl, alt: alt || null, actif: 1, sort_order: 0 });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["data_media"] });
      toast({ title: "Média ajouté avec succès" });
      onClose();
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); } finally { setUploading(false); }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader><DialogTitle>Ajouter un média</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <Tabs value={mediaType} onValueChange={v => setMediaType(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="image" className="flex-1 gap-2"><Image className="h-4 w-4" /> Image</TabsTrigger>
            <TabsTrigger value="video" className="flex-1 gap-2"><Video className="h-4 w-4" /> Vidéo YouTube</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="space-y-1.5">
          <Label>Page du site</Label>
          <Select value={page} onValueChange={setPage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SITE_PAGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Section</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SECTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {mediaType === "image" ? (
          <div className="space-y-3">
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
              {previewUrl ? <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" /> : (
                <div className="space-y-2"><Upload className="h-8 w-8 mx-auto text-muted-foreground" /><p className="text-sm text-muted-foreground">Cliquez pour choisir une image</p><p className="text-xs text-muted-foreground/60">Sera convertie en WebP (max 1920px)</p></div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        ) : (
          <div className="space-y-1.5"><Label>URL YouTube</Label><Input placeholder="https://youtu.be/..." value={url} onChange={e => setUrl(e.target.value)} /></div>
        )}
        <div className="space-y-1.5"><Label>Description (alt)</Label><Input placeholder="Description du média" value={alt} onChange={e => setAlt(e.target.value)} /></div>
        <Button onClick={handleSubmit} disabled={uploading} className="w-full">{uploading ? "Envoi en cours…" : "Ajouter"}</Button>
      </div>
    </DialogContent>
  );
}
