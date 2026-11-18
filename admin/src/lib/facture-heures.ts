export interface ForfaitRate {
  id_forfait: number;
  nom?: string | null;
  prix: number | null;
  heure: number | null;
}

/**
 * Libellé "type d'abonnement : nombre d'heures" à afficher sur une facture,
 * ex : "Mensuel : Pack 3 x 2 Heures".
 * - Formule "À l'année" (2) : forfait fixe payé en 2 versements de 60 000 F, pas de calcul horaire.
 * - Sinon : on cherche un tarif (data_forfait) dont le prix correspond exactement au montant facturé
 *   (1 unité), ou dont le montant facturé est un multiple exact du prix (N unités du même tarif).
 */
export function getFactureHeuresLabel(
  montant: number | null | undefined,
  formule: number | null | undefined,
  forfaits: ForfaitRate[]
): string | null {
  if (formule === 2) return "Forfait annuel — versement";
  if (!montant) return null;

  let match = forfaits.find(f => f.prix === montant);
  let quantite = 1;
  if (!match) {
    match = forfaits.find(f => f.prix && montant % f.prix === 0);
    if (match) quantite = montant / match.prix!;
  }
  if (!match || !match.heure) return null;

  const libelleHeure = match.heure === 1 ? "Heure" : "Heures";
  const heures = quantite > 1
    ? `Pack ${quantite} x ${match.heure} ${libelleHeure}`
    : `Pack ${match.heure} ${libelleHeure}`;
  return match.nom ? `${match.nom} : ${heures}` : heures;
}
