// Tahiti timezone helpers — UTC-10 (Pacific/Tahiti)
export const TAHITI_TZ = "Pacific/Tahiti";
const DAY_NAMES = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTH_NAMES = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

/**
 * Date du jour à Tahiti au format ISO "YYYY-MM-DD".
 * À utiliser partout où l'on a besoin d'« aujourd'hui » côté interface :
 * `new Date().toISOString()` renvoie la date UTC, en avance de 10h sur Tahiti,
 * ce qui fait basculer l'après-midi/soir sur le lendemain.
 */
export function todayTahiti(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TAHITI_TZ }).format(new Date());
}

/** Mois courant à Tahiti au format "YYYY-MM". */
export function monthKeyTahiti(): string {
  return todayTahiti().slice(0, 7);
}

/**
 * Formate un timestamp (ISO avec heure) en date "JJ/MM/AAAA" dans le fuseau de Tahiti.
 * Pour les chaînes date-seule (YYYY-MM-DD), reste stable quel que soit le fuseau du navigateur.
 */
export function formatDateTahiti(dateStr: string | null): string {
  if (!dateStr) return "—";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const d = isDateOnly ? parseDateTahiti(dateStr) : new Date(dateStr);
  if (!d || isNaN(d.getTime())) return "—";
  if (isDateOnly) {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TAHITI_TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** Formate un timestamp en "JJ/MM/AAAA HH:MM" dans le fuseau de Tahiti. */
export function formatDateTimeTahiti(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TAHITI_TZ, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

/**
 * Parse a date string (YYYY-MM-DD) as a local Tahiti date, avoiding UTC offset issues.
 * For date-only strings, we treat them as noon UTC-10 to avoid day shift.
 */
export function parseDateTahiti(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  // For date-only strings (YYYY-MM-DD), parse as local date components
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    // Create date with explicit components to avoid timezone shifts
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }
  // For datetime strings, use Intl to get Tahiti day
  return new Date(dateStr);
}

export function formatDateLongTahiti(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = parseDateTahiti(dateStr);
  if (!d) return "—";
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

export function getDayOfWeekTahiti(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = parseDateTahiti(dateStr);
  if (!d) return "";
  return DAY_NAMES[d.getDay()];
}

export { DAY_NAMES, MONTH_NAMES };

/**
 * Formate le jour + heure de début : "Mardi 25 août à 16h30"
 */
export function formatDayTimeTahiti(dateStr: string | null, heureStr?: string | null): string {
  if (!dateStr) return "";
  const d = parseDateTahiti(dateStr);
  if (!d) return "";
  const base = `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()].toLowerCase()}`;
  if (!heureStr) return base;
  const [h, m] = heureStr.split(":");
  const hour = h ? String(parseInt(h, 10)) : "";
  const min = m ? m.padStart(2, "0") : "00";
  return hour ? `${base} à ${hour}h${min}` : base;
}

/**
 * Formate le label d'un agenda pour les menus déroulants :
 * - Cursus : "Nom — Cursus Lundi · 08:00 - 16:00"
 * - Stage  : "Nom — Stage Juillet · 08:00 - 16:00"
 */
/**
 * Formate une date courte : "12 juil. 2025"
 */
function formatDateCourte(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = parseDateTahiti(dateStr);
  if (!d) return "";
  const MONTH_SHORT = ["janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formate le label d'un agenda pour les menus déroulants :
 * - Cursus : "Nom — Cursus Lundi · 12 janv. → 30 juin · 08:00 - 16:00"
 * - Stage  : "Nom — Stage Juillet · 12 juil. → 18 juil. · 08:00 - 16:00"
 */
export function formatAgendaSelectLabel(a: {
  debut?: string | null;
  fin?: string | null;
  heure_debut?: string | null;
  heure_fin?: string | null;
  camp?: { nom?: string | null; nom_court?: string | null; duree?: string | null } | null;
}): string {
  const isAtelier = a.camp?.duree === "Hors vacances scolaires";
  const campName = a.camp?.nom_court || a.camp?.nom || "Agenda";

  let periodLabel: string;
  if (isAtelier) {
    const day = getDayOfWeekTahiti(a.debut || null);
    periodLabel = day ? `Cursus ${day}` : "Cursus";
  } else {
    const d = parseDateTahiti(a.debut || null);
    periodLabel = d ? `Stage ${MONTH_NAMES[d.getMonth()]}` : "Stage";
  }

  const dateDebut = formatDateCourte(a.debut || null);
  const dateFin = formatDateCourte(a.fin || null);
  const dates = dateDebut
    ? ` · ${dateDebut}${dateFin && dateFin !== dateDebut ? ` → ${dateFin}` : ""}`
    : "";

  const horaires = (a.heure_debut || a.heure_fin)
    ? ` · ${[a.heure_debut, a.heure_fin].filter(Boolean).join(" - ")}`
    : "";

  return `${campName} — ${periodLabel}${dates}${horaires}`;
}
