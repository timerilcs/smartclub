const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function formatSchoolYear(yearStr: string): string {
  // yearStr = "2025-2026"
  const parts = yearStr.split("-");
  if (parts.length !== 2) return yearStr;
  return `Août ${parts[0]} → Juillet ${parts[1]}`;
}

export function getSchoolYearMonths(yearStr: string): { key: string; label: string; monthIndex: number; year: number }[] {
  const parts = yearStr.split("-");
  if (parts.length !== 2) return [];
  const startYear = parseInt(parts[0]);
  const endYear = parseInt(parts[1]);
  
  // Aug(7) to Dec(11) of startYear, then Jan(0) to Jul(6) of endYear
  const months: { key: string; label: string; monthIndex: number; year: number }[] = [];
  for (let m = 7; m <= 11; m++) {
    const mm = String(m + 1).padStart(2, "0");
    months.push({
      key: `${startYear}-${mm}`,
      label: `${MONTH_NAMES_FR[m]} ${startYear}`,
      monthIndex: m,
      year: startYear,
    });
  }
  for (let m = 0; m <= 6; m++) {
    const mm = String(m + 1).padStart(2, "0");
    months.push({
      key: `${endYear}-${mm}`,
      label: `${MONTH_NAMES_FR[m]} ${endYear}`,
      monthIndex: m,
      year: endYear,
    });
  }
  return months;
}

export function getMonthKeyFromDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 7);
}

/**
 * Clé mois ("YYYY-MM") d'une facture à partir de son champ `id_mois` (1 = janvier … 12 = décembre),
 * en gardant l'année de `date_facturation` comme ancrage (le mois peut être décalé — facture
 * saisie/payée par avance ou en retard — mais on reste sur l'année réelle de la facture : sans
 * cette ancre, une vieille facture d'une autre année scolaire portant le même id_mois se
 * retrouverait mélangée dans la colonne du même mois calendaire de l'année scolaire courante,
 * ce qui peut arriver quand un id_participation est réutilisé d'une année sur l'autre).
 * Retombe sur `getMonthKeyFromDate` si `id_mois` est absent, vaut 0 (valeur historique "non
 * renseigné") ou si `date_facturation` est absente (aucune année de référence disponible).
 */
export function getMonthKeyFromMois(
  idMois: number | null | undefined,
  dateFacturation: string | null
): string {
  if (idMois && dateFacturation) {
    const d = new Date(dateFacturation.slice(0, 10) + "T12:00:00");
    if (!isNaN(d.getTime())) {
      const dfYear = d.getFullYear();
      const dfMonth = d.getMonth() + 1; // 1-12
      let year = dfYear;
      const diff = idMois - dfMonth;
      // La facture peut être décalée de quelques mois (avance/retard de saisie) mais pas de plus
      // d'un semestre : au-delà, on considère qu'on change d'année civile (bascule déc./jan.).
      if (diff > 6) year = dfYear - 1;
      else if (diff < -6) year = dfYear + 1;
      return `${year}-${String(idMois).padStart(2, "0")}`;
    }
  }
  return getMonthKeyFromDate(dateFacturation);
}

export function computeAge(dateNaissance: string | null | undefined): number | null {
  if (!dateNaissance) return null;
  // Composants calendaires de la date de naissance (évite le décalage de fuseau sur "YYYY-MM-DD")
  const [by, bm, bd] = dateNaissance.slice(0, 10).split("-").map(Number);
  if (!by || !bm || !bd) return null;
  // « Aujourd'hui » dans le fuseau de Tahiti (UTC-10), indépendamment du fuseau du navigateur
  const [ty, tm, td] = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Tahiti" })
    .format(new Date())
    .split("-")
    .map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) {
    age--;
  }
  return age;
}
