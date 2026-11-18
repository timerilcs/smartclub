import { RefreshCw, BookOpenCheck, GraduationCap, Rocket } from "lucide-react";
import { EnTetePage, AppelAction } from "@/components/Blocs";
import { ListeGroupes } from "@/components/Groupes";

const types = [
  { i: RefreshCw, t: "Remise à niveau", d: "Reprendre les bases qui manquent, sereinement." },
  { i: BookOpenCheck, t: "Révisions", d: "Consolider les notions vues en classe avant la reprise." },
  { i: GraduationCap, t: "Préparation aux examens", d: "S'entraîner pour le DNB et le baccalauréat." },
  { i: Rocket, t: "Anticipation de la rentrée", d: "Prendre de l'avance sur le programme de l'année suivante." },
];

export default function Stages() {
  return (
    <>
      <EnTetePage image="/images/salle-large.webp" couleur="corail" sur="Pendant les vacances" titre={<>Les stages <span className="surligne">SmartClub</span></>}
        intro="En complément du suivi régulier, des stages intensifs pendant les vacances scolaires pour repartir du bon pied." />
      <section className="conteneur grid gap-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {types.map(({ i: I, t, d }) => (
          <div key={t} className="carte carte-hover">
            <I className="h-9 w-9 text-lagon" />
            <h2 className="mt-5 font-sans text-xl font-bold">{t}</h2>
            <p className="mt-2 text-encre/70">{d}</p>
          </div>
        ))}
      </section>
      <section className="conteneur pb-10">
        <h2 className="mb-2 text-4xl font-bold">Prochains stages</h2>
        <p className="mb-8 text-lg text-encre/70">Dates, horaires et places disponibles.</p>
        <ListeGroupes filtre={g => g.id_camp === 3} vide="Les dates des prochains stages arrivent bientôt. Laissez-nous vos coordonnées pour être prévenu en priorité." />
      </section>
      <AppelAction titre="Une place pour le prochain stage ?" />
    </>
  );
}
