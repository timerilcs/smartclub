import { Link } from "react-router-dom";
import { EnTetePage, AppelAction } from "@/components/Blocs";
import { ListeGroupes } from "@/components/Groupes";
import { useForfaits, xpf } from "@/lib/data";

const DEFAUT = [
  { id_forfait: 1, nom: "Kids – 1 séance/sem.", designation: "", prix: 15000 },
  { id_forfait: 2, nom: "Kids – 2 séances/sem.", designation: "", prix: 25000 },
  { id_forfait: 3, nom: "Kids – 3 séances/sem.", designation: "", prix: 36000 },
  { id_forfait: 4, nom: "Collège & Lycée", designation: "", prix: 18000 },
];

export default function Tarifs() {
  const { data } = useForfaits();
  const forfaits = data.length ? data : DEFAUT;
  const kids = forfaits.filter(f => /kids/i.test(f.nom));
  const autres = forfaits.filter(f => !/kids/i.test(f.nom));
  return (
    <>
      <EnTetePage couleur="lagon" sur="Tarifs & horaires" titre={<>Des tarifs <span className="surligne">clairs</span>, par période de 5 semaines.</>}
        intro="Les séances durent 1h30 et suivent le calendrier scolaire. Pas de frais cachés." />
      <section className="conteneur grid gap-8 py-20 lg:grid-cols-[1.3fr_1fr]">
        <div className="carte bg-corail-clair">
          <span className="etiquette">Primaire</span>
          <h2 className="mt-4 text-3xl font-bold">SmartClub Kids</h2>
          <div className="mt-6 divide-y-[1.5px] divide-dashed divide-encre/20">
            {kids.map(f => (
              <div key={f.id_forfait} className="flex items-baseline justify-between gap-4 py-4">
                <span className="text-lg">{f.nom.replace(/^Kids\s*[–-]\s*/i, "")}</span>
                <span className="font-display text-2xl font-bold">{xpf(Number(f.prix))}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-encre/60">Séances de 1h30 · groupes de 4 à 5 élèves</p>
        </div>
        <div className="space-y-8">
          {autres.map(f => (
            <div key={f.id_forfait} className="carte bg-lagon-clair">
              <span className="etiquette">Collège & Lycée</span>
              <h2 className="mt-4 text-3xl font-bold">{f.nom}</h2>
              <p className="mt-5 font-display text-5xl font-extrabold">{xpf(Number(f.prix))}</p>
              <p className="mt-1 text-encre/60">par période de 5 semaines · 1 séance de 1h30 / semaine</p>
            </div>
          ))}
          <Link to="/inscription" className="btn-corail w-full">Demander une inscription</Link>
        </div>
      </section>
      <section className="conteneur pb-10">
        <h2 className="mb-2 text-4xl font-bold">Horaires des groupes</h2>
        <p className="mb-8 text-lg text-encre/70">Les créneaux ouverts pour la période en cours.</p>
        <ListeGroupes filtre={g => g.id_camp !== 3} vide="Les créneaux de la prochaine période seront bientôt publiés. Inscrivez-vous et nous vous proposerons l'horaire le plus adapté." />
      </section>
      <AppelAction />
    </>
  );
}
