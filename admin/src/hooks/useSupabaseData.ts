import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper: derive school year from a date (Aug 1 = start)
export function getSchoolYearFromDate(dateStr: string | null): string {
  if (!dateStr) return "Inconnu";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  if (month >= 7) return `${year}-${year + 1}`; // Aug(7)+ = current year start
  return `${year - 1}-${year}`;
}

export function useCamps() {
  return useQuery({
    queryKey: ["data_camp"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_camp").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAgendas() {
  return useQuery({
    queryKey: ["data_agenda_with_camp"],
    queryFn: async () => {
      const [agendaRes, campRes] = await Promise.all([
        supabase.from("data_agenda").select("*").order("debut", { ascending: false }),
        supabase.from("data_camp").select("*"),
      ]);
      if (agendaRes.error) throw agendaRes.error;
      if (campRes.error) throw campRes.error;
      const campMap = new Map((campRes.data || []).map(c => [c.id_camp, c]));
      return (agendaRes.data || []).map(a => ({
        ...a,
        camp: a.id_camp ? campMap.get(a.id_camp) || null : null,
      }));
    },
  });
}

export function useInscriptions() {
  return useQuery({
    queryKey: ["data_inscription_with_comm"],
    queryFn: async () => {
      const [inscRes, commRes] = await Promise.all([
        supabase.from("data_inscription").select("*").order("date_formulaire", { ascending: false }),
        supabase.from("data_communications").select("*"),
      ]);
      if (inscRes.error) throw inscRes.error;
      if (commRes.error) throw commRes.error;
      const commMap = new Map((commRes.data || []).map(c => [c.id_communication, c]));
      return (inscRes.data || []).map(i => ({
        ...i,
        communication: i.id_communication ? commMap.get(i.id_communication) || null : null,
      }));
    },
  });
}

export function useParticipations() {
  return useQuery({
    queryKey: ["data_participation"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_participation").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useFacturations() {
  return useQuery({
    queryKey: ["data_facturation_with_insc"],
    queryFn: async () => {
      const [factRes, inscRes] = await Promise.all([
        supabase.from("data_facturation").select("*").order("date_facturation", { ascending: false }),
        supabase.from("data_inscription").select("id_inscription, nom, prenom, legal_nom, legal_prenom, adresse, code_postal, ville"),
      ]);
      if (factRes.error) throw factRes.error;
      if (inscRes.error) throw inscRes.error;
      const inscMap = new Map((inscRes.data || []).map(i => [i.id_inscription, i]));
      return (factRes.data || []).map(f => ({
        ...f,
        inscription: f.id_inscription ? inscMap.get(f.id_inscription) || null : null,
      }));
    },
  });
}

export function usePaiements() {
  return useQuery({
    queryKey: ["data_paiement_with_insc"],
    queryFn: async () => {
      const [paiRes, inscRes] = await Promise.all([
        supabase.from("data_paiement").select("*").order("date_paiement", { ascending: false }),
        supabase.from("data_inscription").select("id_inscription, nom, prenom, legal_nom, legal_prenom"),
      ]);
      if (paiRes.error) throw paiRes.error;
      if (inscRes.error) throw inscRes.error;
      const inscMap = new Map((inscRes.data || []).map(i => [i.id_inscription, i]));
      return (paiRes.data || []).map(p => ({
        ...p,
        inscription: p.id_inscription ? inscMap.get(p.id_inscription) || null : null,
      }));
    },
  });
}

export function usePresences() {
  return useQuery({
    queryKey: ["data_presence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_presence").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePresencesForAgenda(agendaId: number | null) {
  return useQuery({
    queryKey: ["data_presence_agenda", agendaId],
    enabled: agendaId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("data_presence")
        .select("*")
        .eq("id_agenda", agendaId as number);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useForfaits() {
  return useQuery({
    queryKey: ["data_forfait"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_forfait").select("*").order("id_forfait");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useLieux() {
  return useQuery({
    queryKey: ["data_lieux"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_lieux").select("*").order("ordre_affichage");
      if (error) throw error;
      return data || [];
    },
  });
}

export function usePaiementsSalles() {
  return useQuery({
    queryKey: ["data_paiements_salles_with_lieu"],
    queryFn: async () => {
      const [paiRes, lieuxRes] = await Promise.all([
        supabase.from("data_paiements_salles").select("*").order("date_paiement", { ascending: false }),
        supabase.from("data_lieux").select("id, nom"),
      ]);
      if (paiRes.error) throw paiRes.error;
      if (lieuxRes.error) throw lieuxRes.error;
      const lieuMap = new Map((lieuxRes.data || []).map((l) => [l.id, l]));
      return (paiRes.data || []).map((p) => ({
        ...p,
        lieu: p.lieu_id ? lieuMap.get(p.lieu_id) || null : null,
      }));
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["data_contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_contact").select("*").order("date_formulaire", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCommunications() {
  return useQuery({
    queryKey: ["data_communications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_communications").select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

// Derive unique school years from agenda dates
export function useEcole() {
  return useQuery({
    queryKey: ["data_ecoles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("data_ecoles").select("*").limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
  });
}

export function deriveSchoolYears(agendas: { debut: string | null }[]): string[] {
  const yearsSet = new Set<string>();
  agendas.forEach((a) => {
    if (a.debut) yearsSet.add(getSchoolYearFromDate(a.debut));
  });
  return Array.from(yearsSet).sort().reverse();
}
