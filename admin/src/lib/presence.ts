import { parseDateTahiti } from "./tahiti-date";

export type PresenceStatut = "présent" | "absent" | "excusé";

export const PRESENCE_STATUTS: PresenceStatut[] = ["présent", "absent", "excusé"];

export interface PresenceRow {
  id_presence: number;
  id_agenda: number | null;
  id_inscription: number | null;
  date_seance: string;
  statut: string | null;
  heures: number | null;
  remarque: string | null;
}

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calcule les dates de séances hebdomadaires d'un atelier (même jour de semaine que `debut`)
 * entre `debut` et `fin` inclus. Si `moisKey` ("YYYY-MM") est fourni, ne garde que les
 * séances de ce mois calendaire.
 */
export function getSeancesAtelier(
  debut: string | null,
  fin: string | null,
  moisKey?: string
): string[] {
  if (!debut || !fin) return [];
  const start = parseDateTahiti(debut);
  const end = parseDateTahiti(fin);
  if (!start || !end) return [];

  const dates: string[] = [];
  const d = new Date(start);
  while (d.getTime() <= end.getTime()) {
    const iso = toISODateLocal(d);
    if (!moisKey || iso.slice(0, 7) === moisKey) dates.push(iso);
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

/** Durée en heures entre deux horaires "HH:MM" (ou "HH:MM:SS"). Retourne 0 si invalide. */
export function computeDureeHeures(heureDebut: string | null, heureFin: string | null): number {
  if (!heureDebut || !heureFin) return 0;
  const [h1, m1] = heureDebut.split(":").map(Number);
  const [h2, m2] = heureFin.split(":").map(Number);
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return 0;
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  return minutes > 0 ? minutes / 60 : 0;
}

/** Formate un nombre d'heures : 1 -> "1h", 1.5 -> "1h30" */
export function formatHeures(heures: number): string {
  const totalMinutes = Math.round(heures * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}
