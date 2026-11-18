import { Link } from "react-router-dom";
import { ArrowRight, Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAvis, useFaq } from "@/lib/data";
import { Titre } from "./Titre";
import { Plus, Triangle } from "./Formes";

export function Etoiles({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < n ? "fill-soleil text-soleil" : "text-encre/20"}`} />
      ))}
    </span>
  );
}

export function AvisApercu({ max = 3 }: { max?: number }) {
  const { data } = useAvis();
  if (!data.length) return null;
  return (
    <section className="conteneur py-20">
      <Titre sur="Ils en parlent" titre="Ce que disent les familles" />
      <div className="grid gap-6 md:grid-cols-3">
        {data.slice(0, max).map((a, i) => (
          <figure key={a.id} className={`carte ${i % 2 ? "md:translate-y-6" : ""}`}>
            <Etoiles n={a.note} />
            <blockquote className="mt-4 text-lg leading-relaxed">« {a.message} »</blockquote>
            <figcaption className="mt-5 font-hand text-2xl text-lagon-fonce">— {a.nom}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-14 text-center"><Link to="/avis" className="btn-ligne">Tous les avis <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}

export function FaqBloc() {
  const { data } = useFaq();
  const [ouvert, setOuvert] = useState<number | null>(0);
  if (!data.length) return null;
  return (
    <section className="conteneur py-20">
      <Titre sur="Questions fréquentes" titre="On vous répond" />
      <div className="mx-auto max-w-3xl space-y-3">
        {data.map((f, i) => (
          <div key={f.id} className="overflow-hidden rounded-2xl border-[1.5px] border-encre bg-white">
            <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold"
              onClick={() => setOuvert(ouvert === i ? null : i)} aria-expanded={ouvert === i}>
              {f.question}
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${ouvert === i ? "rotate-180" : ""}`} />
            </button>
            {ouvert === i && <p className="px-6 pb-6 text-encre/75">{f.reponse}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function AppelAction({ titre = "Prêt à reprendre confiance ?", texte = "Une question, une inscription ? On vous répond rapidement pour trouver le groupe adapté." }) {
  return (
    <section className="conteneur py-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-lagon px-8 py-16 text-center text-white sm:px-16">
        <Plus className="absolute left-8 top-8 h-10 w-10 text-white/25" />
        <Triangle className="absolute bottom-8 right-10 h-14 w-14 rotate-12 text-white/25" />
        <h2 className="mx-auto max-w-2xl text-4xl font-bold sm:text-5xl">{titre}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">{texte}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/inscription" className="btn bg-encre text-sable hover:-translate-y-0.5">Inscrire mon enfant <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/contact" className="btn border-2 border-white text-white hover:bg-white hover:text-lagon-fonce">Poser une question</Link>
        </div>
      </div>
    </section>
  );
}

export function EnTetePage({ sur, titre, intro, couleur = "soleil" }: { sur: string; titre: React.ReactNode; intro: string; couleur?: "soleil" | "corail" | "lagon" }) {
  const fond = { soleil: "bg-soleil-clair", corail: "bg-corail-clair", lagon: "bg-lagon-clair" }[couleur];
  return (
    <section className={`quadrillage relative overflow-hidden ${fond} pb-20 pt-14`}>
      <div className="conteneur apparait">
        <p className="font-hand text-2xl text-corail">{sur}</p>
        <h1 className="mt-1 max-w-3xl text-5xl font-extrabold leading-[1.02] sm:text-6xl">{titre}</h1>
        <p className="mt-5 max-w-2xl text-xl text-encre/75">{intro}</p>
      </div>
      <Plus className="flotte absolute right-[8%] top-12 hidden h-12 w-12 text-corail md:block" />
      <Triangle className="flotte absolute bottom-10 right-[22%] hidden h-14 w-14 text-lagon md:block" style={{ ["--r" as any]: "14deg", animationDelay: "1s" }} />
    </section>
  );
}
