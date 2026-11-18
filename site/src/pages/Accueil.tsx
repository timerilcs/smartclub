import { Link } from "react-router-dom";
import { ArrowRight, Users, Clock, CalendarRange, Lightbulb, Compass, Sparkles, Target, Heart, ShieldCheck, Home as Maison } from "lucide-react";
import { Plus, Triangle, Cercle, Pi, Souligne } from "@/components/Formes";
import { Titre } from "@/components/Titre";
import { AppelAction, AvisApercu, FaqBloc } from "@/components/Blocs";
import { useMedia } from "@/lib/data";

function Hero() {
  const { data: medias } = useMedia("accueil");
  const visuel = medias.find(m => m.section === "hero" && m.type === "image");
  return (
    <section className="quadrillage relative overflow-hidden pb-24 pt-10 sm:pt-16">
      <div className="conteneur grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
        <div className="apparait">
          <span className="etiquette"><span className="h-2 w-2 rounded-full bg-lagon" /> Soutien scolaire · Tahiti</span>
          <h1 className="mt-6 text-[clamp(2.8rem,6.5vw,5.2rem)] font-extrabold leading-[0.98]">
            Apprendre <em className="relative not-italic text-lagon">autrement<Souligne className="absolute -bottom-2 left-0 h-3 w-full text-soleil" /></em>,
            <br />progresser <span className="surligne">ensemble</span>.
          </h1>
          <p className="mt-7 max-w-xl text-xl leading-relaxed text-encre/75">
            Pas seulement faire les devoirs : comprendre ses difficultés, prendre de bonnes méthodes et
            <strong className="text-encre"> reprendre confiance en soi</strong>, en petits groupes de 3 à 5 élèves.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/inscription" className="btn-corail">Inscrire mon enfant <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/accompagnements" className="btn-ligne">Découvrir le club</Link>
          </div>
        </div>

        {/* Visuel : photo depuis l'admin, sinon "fiche" illustrée */}
        <div className="relative mx-auto w-full max-w-md apparait" style={{ animationDelay: ".15s" }}>
          {visuel ? (
            <img src={visuel.url} alt={visuel.alt || "Élèves SmartClub"} className="aspect-[4/5] w-full rounded-[2rem] border-[1.5px] border-encre object-cover shadow-[10px_10px_0_#13213c]" />
          ) : (
            <div className="relative rotate-[-2deg] rounded-[2rem] border-[1.5px] border-encre bg-white p-7 shadow-[10px_10px_0_#13213c]">
              <div className="flex items-center justify-between">
                <span className="etiquette bg-soleil-clair">Groupe · 4 élèves</span>
                <span className="font-hand text-2xl text-corail">mercredi 14h</span>
              </div>
              <div className="mt-6 flex -space-x-3">
                {["#0fa3a3", "#ff6b4a", "#ffc23d", "#13213c"].map((c, i) => (
                  <span key={i} className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-white text-lg font-bold text-white" style={{ background: c }}>
                    {["M", "T", "H", "L"][i]}
                  </span>
                ))}
              </div>
              <div className="mt-7 space-y-3">
                {[["Fractions", 90], ["Méthode de travail", 75], ["Confiance en soi", 85]].map(([t, v]) => (
                  <div key={t as string}>
                    <div className="mb-1 flex justify-between text-sm font-semibold"><span>{t}</span><span className="text-lagon-fonce">+{v}%</span></div>
                    <div className="h-2.5 rounded-full bg-sable-2"><div className="h-full rounded-full bg-lagon" style={{ width: `${v}%` }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-dashed border-encre/25 pt-4 font-hand text-2xl leading-tight">« J'ai enfin compris ! » ✏️</p>
            </div>
          )}
          <Pi className="flotte absolute -left-8 -top-8 text-7xl text-corail" />
          <Cercle className="flotte absolute -bottom-8 -right-6 h-20 w-20 text-lagon" style={{ animationDelay: "1.2s" }} />
          <Plus className="flotte absolute -right-10 top-10 h-9 w-9 text-soleil" style={{ animationDelay: ".6s" }} />
        </div>
      </div>
    </section>
  );
}

function Chiffres() {
  const items = [
    { icone: Users, val: "3 à 5", txt: "élèves par groupe" },
    { icone: Clock, val: "1h30", txt: "par séance" },
    { icone: CalendarRange, val: "5 sem.", txt: "par période, au rythme de l'école" },
  ];
  return (
    <section className="conteneur -mt-10 relative z-10">
      <div className="grid gap-4 rounded-[2rem] bg-encre p-6 text-sable sm:grid-cols-3 sm:p-8">
        {items.map(({ icone: I, val, txt }) => (
          <div key={val} className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sable/10 text-soleil"><I className="h-7 w-7" /></span>
            <div><p className="font-display text-3xl font-bold">{val}</p><p className="text-sable/70">{txt}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Offres() {
  return (
    <section className="conteneur py-24">
      <Titre sur="Nos accompagnements" titre="Du CP à la terminale" intro="Deux formules pensées pour l'âge, le rythme et les objectifs de chaque élève." />
      <div className="grid gap-8 md:grid-cols-2">
        <article className="carte carte-hover relative overflow-hidden bg-corail-clair">
          <Triangle className="absolute -right-4 -top-4 h-28 w-28 rotate-12 text-corail/30" />
          <span className="etiquette">Primaire</span>
          <h3 className="mt-5 text-4xl font-bold">SmartClub <span className="text-corail">Kids</span></h3>
          <p className="mt-3 text-lg text-encre/75">Maths et français : aide aux devoirs, fondamentaux, bonnes méthodes et confiance en soi.</p>
          <p className="mt-6 font-display text-2xl font-bold">dès 15 000 XPF <span className="font-sans text-base font-medium text-encre/60">/ 5 semaines</span></p>
          <Link to="/accompagnements#kids" className="mt-6 inline-flex items-center gap-2 font-bold text-encre underline decoration-corail decoration-[3px] underline-offset-4">En savoir plus <ArrowRight className="h-4 w-4" /></Link>
        </article>
        <article className="carte carte-hover relative overflow-hidden bg-lagon-clair">
          <Cercle className="absolute -right-6 -top-6 h-32 w-32 text-lagon/30" />
          <span className="etiquette">Collège & Lycée</span>
          <h3 className="mt-5 text-4xl font-bold">SmartClub <span className="text-lagon-fonce">Collège & Lycée</span></h3>
          <p className="mt-3 text-lg text-encre/75">Principalement en mathématiques : notions du programme, entraînement, préparation au DNB et au bac.</p>
          <p className="mt-6 font-display text-2xl font-bold">18 000 XPF <span className="font-sans text-base font-medium text-encre/60">/ 5 semaines</span></p>
          <Link to="/accompagnements#college-lycee" className="mt-6 inline-flex items-center gap-2 font-bold text-encre underline decoration-lagon decoration-[3px] underline-offset-4">En savoir plus <ArrowRight className="h-4 w-4" /></Link>
        </article>
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
    <section className="bg-encre py-24 text-sable">
      <div className="conteneur">
        <Titre clair sur="Notre philosophie" titre="Plus qu'une aide aux devoirs" intro="Un environnement bienveillant et stimulant, où l'on apprend à apprendre." />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {etapes.map(({ i: I, t, d }, n) => (
            <li key={t} className="relative rounded-[1.75rem] border border-sable/15 bg-encre-2 p-7">
              <span className="absolute right-6 top-5 font-display text-5xl font-extrabold text-sable/10">{n + 1}</span>
              <I className="h-9 w-9 text-soleil" />
              <h3 className="mt-5 text-2xl font-bold">{t}</h3>
              <p className="mt-2 text-sable/70">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Valeurs() {
  const v = [
    { i: Heart, t: "Bienveillance", d: "Chaque élève se sent écouté et encouragé.", c: "text-corail" },
    { i: ShieldCheck, t: "Exigence", d: "Un enseignement sérieux, structuré et de qualité.", c: "text-lagon" },
    { i: Sparkles, t: "Confiance", d: "On valorise les efforts et les progrès de chacun.", c: "text-soleil" },
    { i: Compass, t: "Autonomie", d: "Travailler et réfléchir par soi-même.", c: "text-lagon" },
    { i: Maison, t: "Proximité", d: "Une vraie relation de confiance avec les familles.", c: "text-corail" },
  ];
  return (
    <section className="conteneur py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <p className="font-hand text-2xl text-corail">Nos valeurs</p>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl">Sérieux sur le fond, <span className="surligne">humain</span> dans la forme.</h2>
          <p className="mt-5 text-lg text-encre/70">SmartClub a été créé par une jeune Polynésienne diplômée et passionnée de mathématiques, avec une conviction : chaque élève peut progresser quand on lui en donne les moyens.</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {v.map(({ i: I, t, d, c }) => (
            <li key={t} className="flex gap-4 rounded-2xl border-[1.5px] border-encre/15 bg-white p-5">
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
      <AvisApercu />
      <FaqBloc />
      <AppelAction />
    </>
  );
}
