import { Link } from "react-router-dom";
import { ArrowRight, Star, Plus as PlusIcone, Play } from "lucide-react";
import { useState } from "react";
import { useAvis, useFaq } from "@/lib/data";
import { Titre } from "./Titre";

/* ID de la vidéo YouTube à venir (ex. "dQw4w9WgXcQ"). Laisser vide pour afficher l'emplacement réservé. */
export const YOUTUBE_ID = "";

export function Etoiles({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${n} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < n ? "fill-soleil text-soleil" : "text-encre/15"}`} />
      ))}
    </span>
  );
}

/* Section avec photo en fond + voile foncé */
export function FondImage({ image, children, className = "", voile = "bg-encre/60" }: { image: string; children: React.ReactNode; className?: string; voile?: string }) {
  return (
    <section className={`relative isolate overflow-hidden text-white ${className}`}>
      <img src={image} alt="" aria-hidden loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className={`absolute inset-0 -z-10 ${voile}`} />
      {children}
    </section>
  );
}

export function AvisApercu({ max = 3 }: { max?: number }) {
  const { data } = useAvis();
  if (!data.length) return null;
  return (
    <section className="conteneur py-24">
      <Titre sur="Ils en parlent" titre="Ce que disent les familles" />
      <div className="grid gap-6 md:grid-cols-3">
        {data.slice(0, max).map(a => (
          <figure key={a.id} className="carte">
            <Etoiles n={a.note} />
            <blockquote className="mt-4 text-lg leading-relaxed text-encre/80">« {a.message} »</blockquote>
            <figcaption className="mt-5 text-sm font-semibold text-lagon-fonce">{a.nom}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-12 text-center"><Link to="/avis" className="btn-ligne">Tous les avis <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
  );
}

export function FaqBloc() {
  const { data } = useFaq();
  const [ouvert, setOuvert] = useState<number | null>(0);
  if (!data.length) return null;
  return (
    <section className="conteneur py-24">
      <Titre sur="Questions fréquentes" titre="On vous répond" />
      <div className="mx-auto max-w-3xl divide-y divide-encre/10 border-y border-encre/10">
        {data.map((f, i) => (
          <div key={f.id}>
            <button className="flex w-full items-center justify-between gap-4 py-6 text-left text-lg font-medium"
              onClick={() => setOuvert(ouvert === i ? null : i)} aria-expanded={ouvert === i}>
              {f.question}
              <PlusIcone className={`h-5 w-5 shrink-0 text-lagon transition-transform ${ouvert === i ? "rotate-45" : ""}`} />
            </button>
            {ouvert === i && <p className="pb-6 pr-10 text-encre/65">{f.reponse}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Video({ id = YOUTUBE_ID }: { id?: string }) {
  return (
    <section className="conteneur py-24">
      <Titre sur="En vidéo" titre="Découvrez SmartClub" intro="Une séance, l'équipe, l'ambiance : le club en quelques minutes." />
      <div className="mx-auto aspect-video max-w-4xl overflow-hidden rounded-2xl bg-encre">
        {id ? (
          <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}`} title="Présentation SmartClub"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
        ) : (
          <div className="relative grid h-full w-full place-items-center">
            <img src="/images/salle-large.webp" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="relative text-center text-white">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/15 backdrop-blur"><Play className="ml-1 h-8 w-8 fill-white" /></span>
              <p className="mt-5 text-lg font-medium">Vidéo bientôt disponible</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function AppelAction({ titre = "Prêt à reprendre confiance ?", texte = "Une question, une inscription ? On vous répond rapidement pour trouver le groupe adapté." }) {
  return (
    <div className="conteneur py-10">
      <FondImage image="/images/groupe-selfie.webp" voile="bg-encre/65" className="rounded-3xl px-8 py-20 text-center sm:px-16">
        <h2 className="mx-auto max-w-2xl text-4xl sm:text-5xl">{titre}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{texte}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/inscription" className="btn-blanc">Inscrire mon enfant <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/contact" className="btn-verre">Poser une question</Link>
        </div>
      </FondImage>
    </div>
  );
}

export function EnTetePage({ sur, titre, intro, image = "/images/salle-groupe.webp" }: { sur: string; titre: React.ReactNode; intro: string; couleur?: string; image?: string }) {
  return (
    <FondImage image={image} voile="bg-gradient-to-b from-encre/75 via-encre/55 to-encre/70" className="pb-24 pt-40 sm:pt-48">
      <div className="conteneur apparait">
        <p className="surtitre !text-white/70">{sur}</p>
        <h1 className="mt-3 max-w-3xl text-5xl leading-[1.05] sm:text-6xl [&_.surligne]:text-white [&_.surligne]:italic">{titre}</h1>
        <p className="mt-5 max-w-2xl text-xl text-white/80">{intro}</p>
      </div>
    </FondImage>
  );
}
