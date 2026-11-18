import { CheckCircle2 } from "lucide-react";
export function Merci({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="carte apparait bg-lagon-clair text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-lagon-fonce" />
      <h2 className="mt-4 text-3xl font-bold">{titre}</h2>
      <p className="mt-2 text-lg text-encre/75">{texte}</p>
    </div>
  );
}
export function Erreur({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <p role="alert" className="rounded-xl bg-corail-clair px-4 py-3 font-semibold text-corail">{msg}</p>;
}
