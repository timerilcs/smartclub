import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Image, Zap, SkipForward, RefreshCw } from "lucide-react";

const SUPABASE_URL = "https://dyizcnebdzxnpwufyxps.supabase.co";
const IMAGE_PROXY_URL = `${SUPABASE_URL}/functions/v1/image-proxy`;
const FTP_UPLOAD_URL = `${SUPABASE_URL}/functions/v1/ftp-upload`;
const MAX_SIZE = 480;
const PIXEL_ART_THRESHOLD = 256;

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? "";
}

async function loadImageViaProxy(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const proxyUrl = `${IMAGE_PROXY_URL}?url=${encodeURIComponent(url)}`;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = proxyUrl;
  });
}

async function generateWebpThumbnail(img: HTMLImageElement): Promise<Blob | null> {
  let w = img.naturalWidth;
  let h = img.naturalHeight;

  // Skip pixel art (small images)
  if (w <= PIXEL_ART_THRESHOLD && h <= PIXEL_ART_THRESHOLD) {
    return null; // signal "skip"
  }

  if (w > MAX_SIZE || h > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) return resolve(blob);
        canvas.toBlob((jpeg) => resolve(jpeg), "image/jpeg", 0.82);
      },
      "image/webp",
      0.82
    );
  });
}

async function uploadThumbnail(blob: Blob, kidId: string, filename: string, token: string): Promise<string | null> {
  const form = new FormData();
  form.append("file", blob, filename);
  form.append("user_id", kidId);
  form.append("filename", filename);

  const res = await fetch(FTP_UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.url ?? null;
}

const MAX_WIDTH_FULL = 1920;

async function convertBlobToWebP(blob: Blob, maxWidth = MAX_WIDTH_FULL, quality = 0.85): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (b) => resolve(b ?? null),
        "image/webp",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

type Creation = {
  id_creation: number;
  file_url: string;
  kid_id: string;
  thumbnail_url: string | null;
};

type ItemStatus = "pending" | "processing" | "done" | "skipped" | "error";

type ProcessItem = Creation & { status: ItemStatus; reason?: string };

export default function OptimisationMediasPage() {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [items, setItems] = useState<ProcessItem[]>([]);
  const [current, setCurrent] = useState(0);

  // --- Conversion full-image en WebP ---
  const [convRunning, setConvRunning] = useState(false);
  const [convItems, setConvItems] = useState<ProcessItem[]>([]);
  const [convCurrent, setConvCurrent] = useState(0);

  const { data: nonWebpCreations = [], isLoading: nonWebpLoading } = useQuery({
    queryKey: ["creations_non_webp"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kids_creations")
        .select("id_creation, file_url, kid_id, thumbnail_url")
        .eq("type", "image")
        .not("file_url", "ilike", "%.webp")
        .not("file_url", "is", null)
        .order("id_creation", { ascending: true });
      return (data ?? []) as Creation[];
    },
  });

  const convDone = convItems.filter((i) => i.status === "done").length;
  const convSkipped = convItems.filter((i) => i.status === "skipped").length;
  const convErrors = convItems.filter((i) => i.status === "error").length;
  const convProgress = convItems.length > 0 ? Math.round((convCurrent / convItems.length) * 100) : 0;

  const updateConvItem = (id: number, patch: Partial<ProcessItem>) => {
    setConvItems((prev) => prev.map((i) => (i.id_creation === id ? { ...i, ...patch } : i)));
  };

  const handleConvertImages = async () => {
    if (nonWebpCreations.length === 0) return;
    setConvRunning(true);
    setConvCurrent(0);
    setConvItems(nonWebpCreations.map((c) => ({ ...c, status: "pending" })));
    const token = await getAuthToken();

    for (let i = 0; i < nonWebpCreations.length; i++) {
      const creation = nonWebpCreations[i];
      setConvCurrent(i);
      updateConvItem(creation.id_creation, { status: "processing" });

      try {
        // Charger l'image via le proxy (contourne CORS)
        const proxyUrl = `${IMAGE_PROXY_URL}?url=${encodeURIComponent(creation.file_url)}`;
        const resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error("Image introuvable via proxy");
        const srcBlob = await resp.blob();

        // Convertir en WebP
        const webpBlob = await convertBlobToWebP(srcBlob);
        if (!webpBlob) throw new Error("Conversion WebP échouée");

        // Nom de fichier : même base + .webp
        const urlParts = creation.file_url.split("/");
        const originalBase = urlParts[urlParts.length - 1].replace(/\.[^.]+$/, "");
        const webpFilename = `${originalBase}.webp`;

        // Upload FTP
        const form = new FormData();
        form.append("file", webpBlob, webpFilename);
        form.append("user_id", creation.kid_id);
        form.append("filename", webpFilename);
        const uploadRes = await fetch(FTP_UPLOAD_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!uploadRes.ok) throw new Error("Échec upload FTP");
        const uploadJson = await uploadRes.json();
        const newUrl: string = uploadJson.url;
        if (!newUrl) throw new Error("URL absente dans la réponse FTP");

        // Mettre à jour la DB
        const { error: dbError } = await supabase
          .from("kids_creations")
          .update({ file_url: newUrl })
          .eq("id_creation", creation.id_creation);
        if (dbError) throw new Error("Erreur DB");

        updateConvItem(creation.id_creation, { status: "done" });
      } catch (err: any) {
        updateConvItem(creation.id_creation, { status: "error", reason: err?.message ?? "Erreur inconnue" });
      }
    }

    setConvCurrent(nonWebpCreations.length);
    setConvRunning(false);
    queryClient.invalidateQueries({ queryKey: ["creations_non_webp"] });
  };

  const { data: creations = [], isLoading } = useQuery({
    queryKey: ["creations_without_thumbnail"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kids_creations")
        .select("id_creation, file_url, kid_id, thumbnail_url")
        .eq("type", "image")
        .is("thumbnail_url", null)
        .order("id_creation", { ascending: true });
      return (data ?? []) as Creation[];
    },
  });

  const done = items.filter((i) => i.status === "done").length;
  const skipped = items.filter((i) => i.status === "skipped").length;
  const errors = items.filter((i) => i.status === "error").length;
  const progress = items.length > 0 ? Math.round((current / items.length) * 100) : 0;

  const updateItem = (id: number, patch: Partial<ProcessItem>) => {
    setItems((prev) => prev.map((i) => (i.id_creation === id ? { ...i, ...patch } : i)));
  };

  const handleStart = async () => {
    if (creations.length === 0) return;
    setRunning(true);
    setCurrent(0);

    const initial: ProcessItem[] = creations.map((c) => ({ ...c, status: "pending" }));
    setItems(initial);

    const token = await getAuthToken();

    for (let i = 0; i < creations.length; i++) {
      const creation = creations[i];
      setCurrent(i);
      updateItem(creation.id_creation, { status: "processing" });

      try {
        // Load via proxy
        const img = await loadImageViaProxy(creation.file_url);
        if (!img) {
          updateItem(creation.id_creation, { status: "error", reason: "Image introuvable" });
          continue;
        }

        // Generate thumbnail (null = pixel art, skip)
        const blob = await generateWebpThumbnail(img);
        if (blob === null) {
          updateItem(creation.id_creation, { status: "skipped", reason: "Pixel art (≤256px)" });
          // Still mark thumbnail_url to itself to avoid re-processing
          await supabase
            .from("kids_creations")
            .update({ thumbnail_url: creation.file_url })
            .eq("id_creation", creation.id_creation);
          continue;
        }

        // Extract filename base from file_url
        const urlParts = creation.file_url.split("/");
        const originalFilename = urlParts[urlParts.length - 1].replace(/\.[^.]+$/, "");
        const thumbFilename = `${originalFilename}_thumb.webp`;

        // Upload to FTP
        const publicUrl = await uploadThumbnail(blob, creation.kid_id, thumbFilename, token);
        if (!publicUrl) {
          updateItem(creation.id_creation, { status: "error", reason: "Échec upload FTP" });
          continue;
        }

        // Update DB
        const { error: dbError } = await supabase
          .from("kids_creations")
          .update({ thumbnail_url: publicUrl })
          .eq("id_creation", creation.id_creation);

        if (dbError) {
          updateItem(creation.id_creation, { status: "error", reason: "Erreur DB" });
        } else {
          updateItem(creation.id_creation, { status: "done" });
        }
      } catch (err: any) {
        updateItem(creation.id_creation, { status: "error", reason: err?.message ?? "Erreur inconnue" });
      }
    }

    setCurrent(creations.length);
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ["creations_without_thumbnail"] });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Optimisation des médias</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Génère des miniatures WebP et convertit les images existantes au format WebP.
        </p>
      </div>

      {/* Section : conversion des images full-size en WebP */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Convertir les images en WebP
            </CardTitle>
            <Badge variant="secondary">
              {nonWebpLoading ? "…" : nonWebpCreations.length} image{nonWebpCreations.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Convertit les images jpg/png déjà uploadées en WebP (max {MAX_WIDTH_FULL}px, qualité 85%).
            Le fichier original reste sur le FTP, seule la référence en base est mise à jour.
          </p>

          {nonWebpCreations.length === 0 && !nonWebpLoading && convItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Toutes les images sont déjà en WebP.
            </p>
          )}

          {nonWebpCreations.length > 0 && convItems.length === 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {nonWebpCreations.length} image{nonWebpCreations.length > 1 ? "s" : ""} à convertir.
              </p>
              <Button onClick={handleConvertImages} disabled={convRunning} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Lancer la conversion
              </Button>
            </div>
          )}

          {convItems.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {convRunning ? `Traitement ${convCurrent + 1} / ${convItems.length}…` : "Terminé"}
                  </span>
                  <span className="font-medium">{convProgress}%</span>
                </div>
                <Progress value={convProgress} className="h-2" />
              </div>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> {convDone} convertie{convDone > 1 ? "s" : ""}
                </span>
                {convSkipped > 0 && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <SkipForward className="w-3.5 h-3.5" /> {convSkipped} ignorée{convSkipped > 1 ? "s" : ""}
                  </span>
                )}
                {convErrors > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" /> {convErrors} erreur{convErrors > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {convItems.filter((i) => i.status === "error").length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {convItems
                    .filter((i) => i.status === "error")
                    .map((i) => (
                      <div key={i.id_creation} className="text-xs text-destructive flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>#{i.id_creation} — {i.reason}</span>
                      </div>
                    ))}
                </div>
              )}
              {!convRunning && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConvItems([]);
                    setConvCurrent(0);
                    queryClient.invalidateQueries({ queryKey: ["creations_non_webp"] });
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="w-4 h-4" />
              Générer les miniatures manquantes
            </CardTitle>
            <Badge variant="secondary">{isLoading ? "…" : creations.length} image{creations.length !== 1 ? "s" : ""}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Génère des miniatures WebP (max 480px) pour les créations sans miniature. Les images pixel art (≤ 256px) sont ignorées.
          </p>
          {creations.length === 0 && !isLoading && items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Toutes les créations ont déjà une miniature. Rien à faire.
            </p>
          )}

          {creations.length > 0 && items.length === 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {creations.length} création{creations.length > 1 ? "s" : ""} sans miniature trouvée{creations.length > 1 ? "s" : ""}.
              </p>
              <Button onClick={handleStart} disabled={running} className="gap-2">
                <Zap className="w-4 h-4" />
                Lancer l'optimisation
              </Button>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {running ? `Traitement ${current + 1} / ${items.length}…` : "Terminé"}
                  </span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> {done} optimisée{done > 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <SkipForward className="w-3.5 h-3.5" /> {skipped} ignorée{skipped > 1 ? "s" : ""}
                </span>
                {errors > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors} erreur{errors > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Log des erreurs uniquement */}
              {items.filter((i) => i.status === "error").length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {items
                    .filter((i) => i.status === "error")
                    .map((i) => (
                      <div key={i.id_creation} className="text-xs text-destructive flex items-start gap-1.5">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>#{i.id_creation} — {i.reason}</span>
                      </div>
                    ))}
                </div>
              )}

              {!running && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItems([]);
                    setCurrent(0);
                    queryClient.invalidateQueries({ queryKey: ["creations_without_thumbnail"] });
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
