import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { EnTetePage, AppelAction, FaqBloc } from "@/components/Blocs";
import { Triangle, Cercle } from "@/components/Formes";

const offres = [
  {
    id: "kids", etiquette: "Primaire", nom: "SmartClub Kids", accent: "text-corail", fond: "bg-corail-clair", Forme: Triangle,
    texte: "Un accompagnement en mathématiques et en français, avec une pédagogie adaptée à l'âge et au rythme de chaque enfant.",
    points: ["Aide aux devoirs et compréhension des leçons", "Renforcement des fondamentaux", "Acquisition de bonnes méthodes de travail", "Développement de l'autonomie et de la confiance en soi"],
    detail: "Groupes de 4 à 5 élèves · séances de 1h30 · 1, 2 ou 3 séances par semaine",
  },
  {
    id: "college-lycee", etiquette: "Collège & Lycée", nom: "SmartClub Collège & Lycée", accent: "text-lagon-fonce", fond: "bg-lagon-clair", Forme: Cercle,
    texte: "Principalement en mathématiques, pour consolider ses acquis et atteindre ses objectifs scolaires.",
    points: ["Explication et approfondissement des notions du programme", "Entraînement avec des exercices adaptés", "Préparation aux évaluations, au DNB et au baccalauréat", "Méthodes de travail et de raisonnement"],
    detail: "Petits groupes · 1 séance de 1h30 par semaine",
  },
];

export default function Accompagnements() {
  return (
    <>
      <EnTetePage sur="Nos accompagnements" titre={<>Un suivi <span className="surligne">sur mesure</span>, la force du groupe en plus.</>}
        intro="En petits groupes de 3 à 5 élèves, chacun avance à son rythme tout en profitant de la dynamique collective." />
      <section className="conteneur space-y-14 py-20">
        {offres.map(({ id, etiquette, nom, accent, fond, Forme, texte, points, detail }, i) => (
          <article id={id} key={id} className={`grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className={`relative grid aspect-[5/4] place-items-center overflow-hidden rounded-[2rem] border-[1.5px] border-encre ${fond} shadow-[8px_8px_0_#13213c]`}>
              <Forme className={`h-2/3 w-2/3 ${accent} opacity-30`} />
              <p className="absolute font-display text-6xl font-extrabold sm:text-7xl">{i === 0 ? "1 + 1" : "f(x)"}</p>
            </div>
            <div>
              <span className="etiquette">{etiquette}</span>
              <h2 className="mt-4 text-4xl font-bold sm:text-5xl">{nom}</h2>
              <p className="mt-4 text-lg text-encre/75">{texte}</p>
              <ul className="mt-6 space-y-3">
                {points.map(p => (
                  <li key={p} className="flex gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-encre text-sable"><Check className="h-4 w-4" /></span>{p}</li>
                ))}
              </ul>
              <p className="mt-6 font-hand text-2xl text-encre/70">{detail}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/inscription?formule=${i + 1}`} className="btn-primaire">S'inscrire <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/tarifs" className="btn-ligne">Voir les tarifs</Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <FaqBloc />
      <AppelAction />
    </>
  );
}
