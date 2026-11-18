import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { EnTetePage, AppelAction, FaqBloc } from "@/components/Blocs";

const offres = [
  {
    id: "kids", etiquette: "Primaire", nom: "SmartClub Kids", accent: "text-lagon", fond: "bg-corail-clair",
    texte: "Un accompagnement en mathématiques et en français, avec une pédagogie adaptée à l'âge et au rythme de chaque enfant.",
    points: ["Aide aux devoirs et compréhension des leçons", "Renforcement des fondamentaux", "Acquisition de bonnes méthodes de travail", "Développement de l'autonomie et de la confiance en soi"],
    detail: "Groupes de 4 à 5 élèves · séances de 1h30 · 1, 2 ou 3 séances par semaine",
  },
  {
    id: "college-lycee", etiquette: "Collège & Lycée", nom: "SmartClub Collège & Lycée", accent: "text-lagon-fonce", fond: "bg-lagon-clair",
    texte: "Principalement en mathématiques, pour consolider ses acquis et atteindre ses objectifs scolaires.",
    points: ["Explication et approfondissement des notions du programme", "Entraînement avec des exercices adaptés", "Préparation aux évaluations, au DNB et au baccalauréat", "Méthodes de travail et de raisonnement"],
    detail: "Petits groupes · 1 séance de 1h30 par semaine",
  },
];

export default function Accompagnements() {
  return (
    <>
      <EnTetePage image="/images/salle-groupe.webp" sur="Nos accompagnements" titre={<>Un suivi <span className="surligne">sur mesure</span>, la force du groupe en plus.</>}
        intro="En petits groupes de 3 à 5 élèves, chacun avance à son rythme tout en profitant de la dynamique collective." />
      <section className="conteneur space-y-14 py-20">
        {offres.map(({ id, etiquette, nom, accent, fond, texte, points, detail }, i) => (
          <article id={id} key={id} className={`grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div className="aspect-[5/4] overflow-hidden rounded-2xl">
              <img src={i === 0 ? "/images/groupe-kids.webp" : "/images/groupe-table.webp"} alt={nom} loading="lazy" className="h-full w-full object-cover" />
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
              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-encre/55">{detail}</p>
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
