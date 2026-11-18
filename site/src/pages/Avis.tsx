import { useState } from "react";
import { Star } from "lucide-react";
import { EnTetePage, Etoiles } from "@/components/Blocs";
import { Merci, Erreur } from "@/components/Envoi";
import { supabase } from "@/lib/supabase";
import { useAvis } from "@/lib/data";

export default function AvisPage() {
  const { data, loading } = useAvis();
  const [nom, setNom] = useState(""); const [message, setMessage] = useState(""); const [note, setNote] = useState(5);
  const [etat, setEtat] = useState<"idle" | "envoi" | "ok">("idle"); const [err, setErr] = useState<string | null>(null);
  const moyenne = data.length ? (data.reduce((s, a) => s + a.note, 0) / data.length).toFixed(1).replace(".", ",") : null;

  async function envoyer(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (!nom.trim() || !message.trim()) return setErr("Merci d'indiquer votre nom et votre message.");
    setEtat("envoi");
    const { error } = await supabase.from("data_avis").insert({ nom: nom.trim(), message: message.trim(), note, approuve: 0 });
    if (error) { setEtat("idle"); setErr("L'envoi n'a pas fonctionné, réessayez dans un instant."); } else setEtat("ok");
  }

  return (
    <>
      <EnTetePage image="/images/groupe-selfie.webp" couleur="lagon" sur="Avis" titre={<>La parole aux <span className="surligne">familles</span></>}
        intro={moyenne ? `Note moyenne : ${moyenne}/5 sur ${data.length} avis.` : "Les premiers retours des familles et des élèves arrivent bientôt."} />
      <section className="conteneur grid gap-12 py-20 lg:grid-cols-[1.5fr_1fr]">
        <div className="columns-1 gap-6 space-y-6 md:columns-2">
          {loading && <p className="text-encre/50">Chargement…</p>}
          {!loading && !data.length && <p className="rounded-2xl border-[1.5px] border-dashed border-encre/30 bg-white/60 p-6 text-encre/70">Soyez le premier à partager votre expérience !</p>}
          {data.map(a => (
            <figure key={a.id} className="carte break-inside-avoid">
              <Etoiles n={a.note} />
              <blockquote className="mt-3 leading-relaxed">« {a.message} »</blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-lagon-fonce">— {a.nom}</figcaption>
            </figure>
          ))}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          {etat === "ok" ? <Merci titre="Merci !" texte="Votre avis sera publié après validation par l'équipe." /> : (
            <form onSubmit={envoyer} className="carte space-y-4 bg-soleil-clair">
              <h2 className="text-2xl font-bold">Laisser un avis</h2>
              <div><label className="libelle" htmlFor="nom">Votre prénom (et initiale)</label><input id="nom" className="champ" maxLength={100} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Hinatea M." /></div>
              <div>
                <span className="libelle">Votre note</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button type="button" key={n} onClick={() => setNote(n)} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
                      <Star className={`h-8 w-8 transition-transform hover:scale-110 ${n <= note ? "fill-soleil text-soleil" : "text-encre/25"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="libelle" htmlFor="msg">Votre message</label><textarea id="msg" className="champ min-h-[130px]" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} /></div>
              <Erreur msg={err} />
              <button className="btn-primaire w-full" disabled={etat === "envoi"}>{etat === "envoi" ? "Envoi…" : "Envoyer mon avis"}</button>
            </form>
          )}
        </aside>
      </section>
    </>
  );
}
