import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EnTetePage } from "@/components/Blocs";
import { Merci, Erreur } from "@/components/Envoi";
import { supabase } from "@/lib/supabase";
import { useForfaits, useGroupes, xpf, dateCourte } from "@/lib/data";

const FORMULES = [
  { id: 1, nom: "SmartClub Kids", sous: "Primaire · maths & français", couleur: "peer-checked:bg-corail-clair" },
  { id: 2, nom: "Collège & Lycée", sous: "Mathématiques", couleur: "peer-checked:bg-lagon-clair" },
  { id: 3, nom: "Stage de vacances", sous: "Révisions, remise à niveau…", couleur: "peer-checked:bg-soleil-clair" },
];
const CLASSES = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "2nde", "1re", "Terminale"];
const CONNU = ["Bouche à oreille", "Facebook / Instagram", "Google", "École / enseignant", "Autre"];

export default function Inscription() {
  const [params] = useSearchParams();
  const { data: groupes } = useGroupes();
  const { data: forfaits } = useForfaits();
  const groupeInitial = Number(params.get("groupe")) || null;
  const [f, setF] = useState({
    formule: Number(params.get("formule")) || 0, id_forfait: "", id_agenda: groupeInitial ? String(groupeInitial) : "",
    prenom: "", nom: "", date_naissance: "", classe: "",
    legal_prenom: "", legal_nom: "", email: "", telephone: "", ville: "",
    comment_connu: "", consent_image: false, remarque: "", rgpd: false,
  });
  const [etat, setEtat] = useState<"idle" | "envoi" | "ok">("idle"); const [err, setErr] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(v => ({ ...v, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  // Si on arrive avec ?groupe=, on retrouve la formule correspondante
  const formule = f.formule || groupes.find(g => g.id_agenda === groupeInitial)?.id_camp || 0;
  const groupesFormule = useMemo(() => groupes.filter(g => g.id_camp === formule), [groupes, formule]);
  const forfaitsFormule = forfaits.filter(x => (formule === 1 ? /kids/i.test(x.nom) : formule === 2 ? !/kids/i.test(x.nom) : false));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault(); setErr(null);
    if (!formule) return setErr("Choisissez une formule.");
    if (!f.prenom.trim() || !f.legal_prenom.trim() || !f.email.trim() || !f.telephone.trim())
      return setErr("Merci de compléter les champs marqués d'un astérisque.");
    if (!f.rgpd) return setErr("Merci d'accepter que vos données soient utilisées pour traiter l'inscription.");
    setEtat("envoi");
    const forfait = forfaits.find(x => String(x.id_forfait) === f.id_forfait);
    const remarque = [f.classe && `Classe : ${f.classe}`, forfait && `Formule souhaitée : ${forfait.nom}`, f.remarque.trim()].filter(Boolean).join("\n");
    const { error } = await supabase.rpc("submit_inscription", {
      payload: {
        id_camp: formule, id_agenda: f.id_agenda || null, formule: f.id_forfait || null,
        prenom: f.prenom.trim(), nom: f.nom.trim(), date_naissance: f.date_naissance || null,
        legal_prenom: f.legal_prenom.trim(), legal_nom: f.legal_nom.trim(), email: f.email.trim(),
        telephone: f.telephone.trim(), ville: f.ville.trim(), ile: "Tahiti",
        comment_connu: f.comment_connu, consent_image: f.consent_image, remarque,
      },
    });
    if (error) { setEtat("idle"); setErr("L'envoi n'a pas fonctionné. Réessayez, ou contactez-nous directement."); }
    else { setEtat("ok"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  }

  return (
    <>
      <EnTetePage couleur="corail" sur="Inscription" titre={<>Rejoindre <span className="surligne">SmartClub</span></>}
        intro="Remplissez ce formulaire en 2 minutes. Nous vous recontactons pour confirmer le groupe et l'horaire — aucun paiement en ligne." />
      <section className="conteneur max-w-4xl py-16">
        {etat === "ok" ? (
          <Merci titre="Demande d'inscription reçue !" texte={`Merci ${f.legal_prenom} ! Nous revenons vers vous très vite pour confirmer la place de ${f.prenom}.`} />
        ) : (
          <form onSubmit={envoyer} className="space-y-10">
            <fieldset>
              <legend className="mb-4 font-display text-3xl font-bold">1. La formule</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                {FORMULES.map(o => (
                  <label key={o.id} className="cursor-pointer">
                    <input type="radio" name="formule" className="peer sr-only" checked={formule === o.id}
                      onChange={() => setF(v => ({ ...v, formule: o.id, id_agenda: "", id_forfait: "" }))} />
                    <span className={`block h-full rounded-2xl border-[1.5px] border-encre bg-white p-5 transition-all peer-checked:shadow-[5px_5px_0_#13213c] peer-focus-visible:ring-4 peer-focus-visible:ring-soleil ${o.couleur}`}>
                      <span className="block text-lg font-bold">{o.nom}</span>
                      <span className="text-sm text-encre/65">{o.sous}</span>
                    </span>
                  </label>
                ))}
              </div>
              {formule > 0 && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {forfaitsFormule.length > 0 && (
                    <div><label className="libelle" htmlFor="fo">Rythme souhaité</label>
                      <select id="fo" className="champ" value={f.id_forfait} onChange={set("id_forfait")}>
                        <option value="">— À définir ensemble —</option>
                        {forfaitsFormule.map(x => <option key={x.id_forfait} value={x.id_forfait}>{x.nom} · {xpf(Number(x.prix))}</option>)}
                      </select></div>
                  )}
                  <div><label className="libelle" htmlFor="gr">Groupe / créneau</label>
                    <select id="gr" className="champ" value={f.id_agenda} onChange={set("id_agenda")}>
                      <option value="">{groupesFormule.length ? "— Je ne sais pas encore —" : "— Aucun créneau publié, on vous propose —"}</option>
                      {groupesFormule.map(g => (
                        <option key={g.id_agenda} value={g.id_agenda}>
                          {g.infocourte || g.info || "Groupe"}{g.debut ? ` · dès le ${dateCourte(g.debut)}` : ""}{g.heure_debut ? ` · ${g.heure_debut}` : ""}
                        </option>
                      ))}
                    </select></div>
                </div>
              )}
            </fieldset>

            <fieldset className="carte grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 px-2 font-display text-3xl font-bold">2. L'élève</legend>
              <div><label className="libelle" htmlFor="ep">Prénom *</label><input id="ep" className="champ" value={f.prenom} onChange={set("prenom")} /></div>
              <div><label className="libelle" htmlFor="en">Nom</label><input id="en" className="champ" value={f.nom} onChange={set("nom")} /></div>
              <div><label className="libelle" htmlFor="dn">Date de naissance</label><input id="dn" type="date" className="champ" value={f.date_naissance} onChange={set("date_naissance")} /></div>
              <div><label className="libelle" htmlFor="cl">Classe</label>
                <select id="cl" className="champ" value={f.classe} onChange={set("classe")}>
                  <option value="">—</option>{CLASSES.map(c => <option key={c}>{c}</option>)}
                </select></div>
            </fieldset>

            <fieldset className="carte grid gap-4 sm:grid-cols-2">
              <legend className="mb-2 px-2 font-display text-3xl font-bold">3. Le parent</legend>
              <div><label className="libelle" htmlFor="pp">Prénom *</label><input id="pp" className="champ" value={f.legal_prenom} onChange={set("legal_prenom")} /></div>
              <div><label className="libelle" htmlFor="pn">Nom</label><input id="pn" className="champ" value={f.legal_nom} onChange={set("legal_nom")} /></div>
              <div><label className="libelle" htmlFor="pe">Email *</label><input id="pe" type="email" className="champ" value={f.email} onChange={set("email")} /></div>
              <div><label className="libelle" htmlFor="pt">Téléphone *</label><input id="pt" type="tel" className="champ" value={f.telephone} onChange={set("telephone")} /></div>
              <div><label className="libelle" htmlFor="pv">Commune</label><input id="pv" className="champ" value={f.ville} onChange={set("ville")} /></div>
              <div><label className="libelle" htmlFor="cc">Comment nous avez-vous connus ?</label>
                <select id="cc" className="champ" value={f.comment_connu} onChange={set("comment_connu")}>
                  <option value="">—</option>{CONNU.map(c => <option key={c}>{c}</option>)}
                </select></div>
              <div className="sm:col-span-2"><label className="libelle" htmlFor="rq">Difficultés, objectifs, disponibilités…</label>
                <textarea id="rq" className="champ min-h-[120px]" maxLength={2500} value={f.remarque} onChange={set("remarque")} /></div>
              <label className="flex gap-3 sm:col-span-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-lagon" checked={f.consent_image} onChange={set("consent_image")} />
                <span>J'autorise SmartClub à publier des photos de groupe où mon enfant apparaît (réseaux sociaux, site).</span></label>
              <label className="flex gap-3 sm:col-span-2"><input type="checkbox" className="mt-1 h-5 w-5 accent-lagon" checked={f.rgpd} onChange={set("rgpd")} />
                <span>J'accepte que ces informations soient utilisées par SmartClub pour traiter l'inscription et me recontacter. *</span></label>
            </fieldset>

            <Erreur msg={err} />
            <button className="btn-corail w-full text-lg" disabled={etat === "envoi"}>{etat === "envoi" ? "Envoi en cours…" : "Envoyer la demande d'inscription"}</button>
          </form>
        )}
      </section>
    </>
  );
}
