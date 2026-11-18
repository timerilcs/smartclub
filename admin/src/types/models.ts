export type MarketingSource = "Facebook" | "TikTok" | "Instagram" | "Google" | "YouTube" | "Affiche" | "Bouche-à-oreille" | "École" | "Autre";

export interface SchoolYear {
  id: string;
  name: string;
  dateDebut: string;
  dateFin: string;
  statut: "active" | "archivée";
}

export interface Stage {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  horaires: string;
  lieu: string;
  capacite: number;
  inscrits: number;
  ageMin: number;
  ageMax: number;
  prix: number;
  statut: "ouvert" | "complet" | "annulé";
  schoolYearId: string;
}

export interface WeeklyProgram {
  id: string;
  nom: string;
  jour: string;
  horaire: string;
  lieu: string;
  capacite: number;
  inscrits: number;
  tarifMensuel: number;
  schoolYearId: string;
}

export interface Child {
  id: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  age: number;
  guardian: string;
  guardianTel: string;
  guardianEmail: string;
}

export interface Registration {
  id: string;
  childId: string;
  childName: string;
  type: "stage" | "atelier";
  programId: string;
  programName: string;
  statut: "pré-inscrit" | "confirmé" | "annulé";
  source: MarketingSource;
  campaign?: string;
  dateInscription: string;
  schoolYearId: string;
}

export interface Prospect {
  id: string;
  prenomEnfant: string;
  nomEnfant: string;
  ageEnfant: number;
  parentNom: string;
  parentEmail: string;
  parentTel: string;
  source: MarketingSource;
  campaign?: string;
  interet: string;
  dateContact: string;
  statut: "nouveau" | "contacté" | "converti" | "perdu";
  schoolYearId: string;
}

export interface Invoice {
  id: string;
  numero: string;
  date: string;
  clientNom: string;
  enfantNom: string;
  programme: string;
  type: "stage" | "atelier";
  total: number;
  paye: number;
  restant: number;
  statut: "payée" | "partielle" | "impayée" | "annulée";
  schoolYearId: string;
}

export interface Payment {
  id: string;
  date: string;
  montant: number;
  methode: "CB" | "Virement" | "Chèque" | "Espèces";
  reference: string;
  factureNumero: string;
  clientNom: string;
  notes: string;
  schoolYearId: string;
}
