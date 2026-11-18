import { Link } from "react-router-dom";
import { ArrowRight, Users, Clock, CalendarRange, Lightbulb, Compass, Sparkles, Target, Heart, ShieldCheck, Home as Maison } from "lucide-react";
import { Titre } from "@/components/Titre";
import { AppelAction, AvisApercu, FaqBloc, FondImage, Video } from "@/components/Blocs";
import { useMedia } from "@/lib/data";

function Hero() {
  const { data: medias } = useMedia("accueil");
  const visuel = medias.find(m => m.section === "hero" && m.type === "image");
  return (
    <FondImage image={visuel?.url || "/images/groupe-table.webp"} voile="bg-gradient-to-r from-encre/85 via-encre/55 to-encre/20" className="flex min-h-[92vh] items-center pb-32 pt-32">
      <div className="conteneur apparait">
        <p className="surtitre !text-white/75">Soutien scolaire · Tahiti</p>
        <h1 className="mt-5 max-w-3xl text-[clamp(2.8rem,6.5vw,5.2rem)] leading-[1.02]">
          Apprendre <em className="text-lagon-clair">autrement</em>,<br />progresser ensemble.
        </h1>
        <p className="mt-7 max-w-xl text-xl leading-relaxed text-white/80">
          Pas seulement faire les devoirs : comprendre ses difficultés, prendre de bonnes méthodes et
          reprendre confiance en soi, en petits groupes de 3 à 5 élèves.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/inscription" className="btn-blanc">Inscrire mon enfant <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/accompagnements" className="btn-verre">Découvrir le club</Link>
        </div>
      </div>
    </FondImage>
  );
}

function Chiffres() {
  const items = [
    { icone: Users, val: "3 à 5", txt: "élèves par groupe" },
    { icone: Clock, val: "1h30", txt: "par séance" },
    { icone: CalendarRange, val: "5 sem.", txt: "par période, au rythme de l'école" },
  ];
  return (
    <section className="conteneur relative z-10 -mt-16">
      <div className="grid gap-6 rounded-2xl bg-white p-6 sm:grid-cols-3 sm:p-8">
        {items.map(({ icone: I, val, txt }) => (
          <div key={val} className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-lagon-clair text-lagon-fonce"><I className="h-7 w-7" /></span>
            <div><p className="font-display text-3xl">{val}</p><p className="text-encre/60">{txt}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Offres() {
  const cartes = [
    { img: "/images/groupe-kids.webp", tag: "Primaire", nom: "SmartClub Kids", txt: "Maths et français : aide aux devoirs, fondamentaux, bonnes méthodes et confiance en soi.", prix: "dès 15 000 XPF", lien: "/accompagnements#kids" },
    { img: "/images/concentration.webp", tag: "Collège & Lycée", nom: "SmartClub Collège & Lycée", txt: "Principalement en mathématiques : notions du programme, entraînement, préparation au DNB et au bac.", prix: "18 000 XPF", lien: "/accompagnements#college-lycee" },
  ];
  return (
    <section className="conteneur py-24">
      <Titre sur="Nos accompagnements" titre="Du CP à la terminale" intro="Deux formules pensées pour l'âge, le rythme et les objectifs de chaque élève." />
      <div className="grid gap-8 md:grid-cols-2">
        {cartes.map(c => (
          <Link key={c.nom} to={c.lien} className="group overflow-hidden rounded-2xl bg-white">
            <div className="aspect-[16/10] overflow-hidden"><img src={c.img} alt={c.nom} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
            <div className="p-8">
              <span className="etiquette">{c.tag}</span>
              <h3 className="mt-4 text-3xl">{c.nom}</h3>
              <p className="mt-3 text-encre/65">{c.txt}</p>
              <div className="mt-6 flex items-center justify-between">
                <p className="font-display text-xl">{c.prix} <span className="font-sans text-sm text-encre/50">/ 5 semaines</span></p>
                <ArrowRight className="h-5 w-5 text-lagon transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Methode() {
  const etapes = [
    { i: Lightbulb, t: "Comprendre", d: "On identifie ce qui bloque vraiment, plutôt que de refaire l'exercice à la place de l'élève." },
    { i: Compass, t: "Méthode", d: "Organisation, raisonnement, façon d'apprendre une leçon : des outils qui servent toute l'année." },
    { i: Target, t: "Autonomie", d: "L'élève apprend à chercher, à se corriger et à travailler par lui-même." },
    { i: Sparkles, t: "Confiance", d: "Chaque progrès est valorisé. La réussite redevient possible — et ça change tout." },
  ];
  return (
    <FondImage image="/images/salle-verte.webp" voile="bg-encre/80" className="py-28">
      <div className="conteneur">
        <Titre clair sur="Notre philosophie" titre="Plus qu'une aide aux devoirs" intro="Un environnement bienveillant et stimulant, où l'on apprend à apprendre." />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {etapes.map(({ i: I, t, d }, n) => (
            <li key={t} className="relative rounded-2xl bg-white/10 p-7 backdrop-blur-sm">
              <span className="absolute right-6 top-5 font-display text-5xl text-white/15">{n + 1}</span>
              <I className="h-8 w-8 text-lagon-clair" />
              <h3 className="mt-5 text-2xl">{t}</h3>
              <p className="mt-2 text-white/70">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </FondImage>
  );
}

function Valeurs() {
  const v = [
    { i: Heart, t: "Bienveillance", d: "Chaque élève se sent écouté et encouragé.", c: "text-lagon" },
    { i: ShieldCheck, t: "Exigence", d: "Un enseignement sérieux, structuré et de qualité.", c: "text-lagon" },
    { i: Sparkles, t: "Confiance", d: "On valorise les efforts et les progrès de chacun.", c: "text-lagon" },
    { i: Compass, t: "Autonomie", d: "Travailler et réfléchir par soi-même.", c: "text-lagon" },
    { i: Maison, t: "Proximité", d: "Une vraie relation de confiance avec les familles.", c: "text-lagon" },
  ];
  return (
    <section className="conteneur py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="surtitre">Nos valeurs</p>
          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Sérieux sur le fond, <span className="surligne">humain</span> dans la forme.</h2>
          <img src="/images/selfie-eleve.webp" alt="La fondatrice de SmartClub avec une élève" loading="lazy" className="mt-8 aspect-[4/3] w-full rounded-2xl object-cover" />
          <p className="mt-6 text-lg text-encre/65">SmartClub a été créé par une jeune Polynésienne diplômée et passionnée de mathématiques, avec une conviction : chaque élève peut progresser quand on lui en donne les moyens.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {v.map(({ i: I, t, d, c }) => (
            <li key={t} className="flex gap-4 rounded-2xl bg-white p-6">
              <I className={`h-7 w-7 shrink-0 ${c}`} />
              <div><h3 className="font-sans text-lg font-bold">{t}</h3><p className="text-encre/65">{d}</p></div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Accueil() {
  return (
    <>
      <Hero />
      <Chiffres />
      <Offres />
      <Methode />
      <Valeurs />
      <Video />
      <AvisApercu />
      <FaqBloc />
      <AppelAction />
    </>
  );
}
