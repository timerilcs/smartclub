import { Link } from "react-router-dom";
import { ArrowRight, Users, TrendingUp, GraduationCap, ChartNoAxesColumnIncreasing, Pencil, CirclePlay, Lightbulb, Compass, Sparkles, Target, Heart, ShieldCheck, Home as Maison } from "lucide-react";
import { Titre } from "@/components/Titre";
import { AppelAction, AvisApercu, FaqBloc, FondImage, Video } from "@/components/Blocs";

function Hero() {
  return (
    <section className="accueil-hero" aria-labelledby="accueil-titre">
      <div className="hero-photo"><img src="/images/sourires-table-etude.png" alt="Les élèves et leur accompagnatrice réunis autour d'une table au SmartClub" fetchPriority="high" /></div>
      <div className="hero-voile" />
      <svg className="hero-feuilles" viewBox="0 0 220 420" aria-hidden="true"><g fill="currentColor"><path d="M0 55Q65 10 150 12Q100 55 0 55M0 58Q100 40 205 100Q100 105 0 58M0 65Q95 95 156 192Q62 152 0 65M0 80Q55 160 60 260Q5 188 0 80M0 125Q-5 220 30 320Q48 230 0 125M0 50Q30 5 62 0H0Z" /><path d="M0 405Q45 300 170 260Q82 329 0 405M0 410Q50 350 200 350Q82 384 0 410" /></g></svg>
      <div className="conteneur hero-contenu apparait">
        <p className="hero-surtitre">Soutien scolaire · Tahiti</p>
        <h1 id="accueil-titre">
          Apprendre<br /><span>autrement</span>,<br /><span className="hero-suite">progresser ensemble.</span>
        </h1>
        <p className="hero-description">
          Pas seulement faire les devoirs : comprendre ses difficultés, prendre de bonnes méthodes et
          reprendre confiance en soi, en petits groupes de 3 à 5 élèves.
        </p>
        <div className="hero-actions">
          <Link to="/inscription" className="btn hero-inscription"><Pencil aria-hidden="true" />Inscrire mon enfant <ArrowRight aria-hidden="true" /></Link>
          <Link to="/accompagnements" className="btn hero-decouvrir"><CirclePlay aria-hidden="true" />Découvrir le club</Link>
        </div>
      </div>
      <svg className="hero-vague" viewBox="0 0 1440 85" preserveAspectRatio="none" aria-hidden="true"><path d="M0 65Q180 0 490 45T1000 50T1440 25V85H0Z" fill="#edf6ff" /></svg>
      <img className="hero-hibiscus" src="/images/hibiscus-jaune.png" alt="" aria-hidden="true" width={1254} height={1200} />
    </section>
  );
}

function Chiffres() {
  const items = [
    { icone: Users, val: "Petits groupes", txt: "(3 à 5 élèves)" },
    { icone: TrendingUp, val: "Méthodes efficaces", txt: "et personnalisées" },
    { icone: GraduationCap, val: "Confiance", txt: "en soi" },
    { icone: ChartNoAxesColumnIncreasing, val: "Progression", txt: "durable" },
  ];
  return (
    <section className="conteneur hero-benefices" aria-label="Les atouts du SmartClub">
      <div className="benefices-grille">
        {items.map(({ icone: I, val, txt }) => (
          <div key={val} className="benefice">
            <span className="benefice-icone"><I aria-hidden="true" /></span>
            <div><p className="font-extrabold">{val}</p><p>{txt}</p></div>
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
    <FondImage image="/images/salle-verte.webp" voile="bg-gradient-to-br from-encre/90 to-lagon-fonce/80" className="py-28">
      <div className="conteneur">
        <p className="philosophie-surtitre">Notre philosophie</p>
        <Titre clair titre="Plus qu'une aide aux devoirs" intro="Un environnement bienveillant et stimulant, où l'on apprend à apprendre." />
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
