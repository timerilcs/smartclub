import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, MessageCircle, ClipboardList } from "lucide-react";
import { EnTetePage } from "@/components/Blocs";
import { Merci, Erreur } from "@/components/Envoi";
import { supabase } from "@/lib/supabase";

export default function Contact() {
  const [f, setF] = useState({ prenom: "", nom: "", email: "", telephone: "", message: "" });
  const [etat, setEtat] = useState<"idle" | "envoi" | "ok">("idle"); const [err, setErr] = useState<string | null>(null);
  const champ = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(v => ({ ...v, [k]: e.target.value }));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (!f.prenom.trim() || !f.message.trim() || (!f.email.trim() && !f.telephone.trim()))
      return setErr("Indiquez au moins votre prénom, un moyen de vous joindre et votre message.");
    setEtat("envoi");
    const { error } = await supabase.from("data_contact").insert(f);
    if (error) { setEtat("idle"); setErr("L'envoi n'a pas fonctionné, réessayez dans un instant."); } else setEtat("ok");
  }

  return (
    <>
      <EnTetePage sur="Contact" titre={<>Parlons de <span className="surligne">votre enfant</span></>}
        intro="Une question sur nos accompagnements, un horaire, un tarif ? Écrivez-nous, nous vous répondons rapidement." />
      <section className="conteneur grid gap-12 py-20 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {[
            { i: MessageCircle, t: "Réponse rapide", d: "Nous revenons vers vous par email ou téléphone, selon votre préférence." },
            { i: ClipboardList, t: "Vous voulez inscrire votre enfant ?", d: <>Le plus simple est de remplir directement le <Link to="/inscription" className="font-bold underline decoration-corail decoration-2 underline-offset-2">formulaire d'inscription</Link>.</> },
            { i: MapPin, t: "Où ?", d: "Tahiti, Polynésie française." },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="flex gap-4 rounded-2xl bg-white p-5 ring-[1.5px] ring-encre/10">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-lagon-clair text-lagon-fonce"><I className="h-6 w-6" /></span>
              <div><h2 className="font-sans text-lg font-bold">{t}</h2><p className="text-encre/70">{d}</p></div>
            </div>
          ))}
        </div>
        {etat === "ok" ? <Merci titre="Message envoyé !" texte="Merci, nous vous répondons très vite." /> : (
          <form onSubmit={envoyer} className="carte grid gap-4 sm:grid-cols-2">
            <div><label className="libelle" htmlFor="p">Prénom *</label><input id="p" className="champ" value={f.prenom} onChange={champ("prenom")} /></div>
            <div><label className="libelle" htmlFor="n">Nom</label><input id="n" className="champ" value={f.nom} onChange={champ("nom")} /></div>
            <div><label className="libelle" htmlFor="e">Email</label><input id="e" type="email" className="champ" value={f.email} onChange={champ("email")} /></div>
            <div><label className="libelle" htmlFor="t">Téléphone</label><input id="t" type="tel" className="champ" value={f.telephone} onChange={champ("telephone")} /></div>
            <div className="sm:col-span-2"><label className="libelle" htmlFor="m">Message *</label><textarea id="m" className="champ min-h-[160px]" maxLength={5000} value={f.message} onChange={champ("message")} /></div>
            <div className="sm:col-span-2"><Erreur msg={err} /></div>
            <button className="btn-primaire sm:col-span-2" disabled={etat === "envoi"}>{etat === "envoi" ? "Envoi…" : "Envoyer"}</button>
          </form>
        )}
      </section>
    </>
  );
}
