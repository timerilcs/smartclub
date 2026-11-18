import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Formule = { id_camp: number; nom: string; nom_court: string; intitule: string; age: string };
export type Groupe = {
  id_agenda: number; id_camp: number; debut: string | null; fin: string | null;
  heure_debut: string | null; heure_fin: string | null; info: string | null; infocourte: string | null;
  lieu: string | null; place_max: number | null;
};
export type Forfait = { id_forfait: number; nom: string; designation: string; prix: number };
export type Avis = { id: number; nom: string; message: string; note: number; created_at: string };
export type Faq = { id: number; question: string; reponse: string; ordre: number };
export type Media = { id: number; page: string; section: string; type: string; url: string; alt: string | null };

function useTable<T>(fn: () => PromiseLike<{ data: T[] | null }>, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let ok = true;
    fn().then(({ data }) => { if (ok) { setData(data || []); setLoading(false); } }, () => ok && setLoading(false));
    return () => { ok = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading };
}

export const useFormules = () => useTable<Formule>(() => supabase.from("data_camp").select("*").order("niveau"));
export const useGroupes = () =>
  useTable<Groupe>(() => supabase.from("data_agenda").select("*").eq("actif", 1).order("debut", { ascending: true }));
export const useForfaits = () => useTable<Forfait>(() => supabase.from("data_forfait").select("*").order("id_forfait"));
export const useAvis = () =>
  useTable<Avis>(() => supabase.from("data_avis").select("id, nom, message, note, created_at").eq("approuve", 1).order("created_at", { ascending: false }));
export const useFaq = () => useTable<Faq>(() => supabase.from("data_faq").select("*").eq("actif", 1).order("ordre"));
export const useMedia = (page: string) =>
  useTable<Media>(() => supabase.from("data_media").select("*").eq("page", page).eq("actif", 1).order("sort_order"), [page]);

export const xpf = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " XPF";
export const dateCourte = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "";

export function trackPage(page: string) {
  supabase.from("page_views").insert({ page, referrer: document.referrer || null }).then(() => {}, () => {});
}
