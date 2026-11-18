import { Link } from "react-router-dom";
export default function Introuvable() {
  return (
    <section className="quadrillage grid min-h-[60vh] place-items-center px-5 text-center">
      <div>
        <p className="font-display text-[9rem] font-extrabold leading-none text-lagon">4<span className="text-corail">0</span>4</p>
        <h1 className="text-3xl font-bold">Cette page n'est pas au programme.</h1>
        <Link to="/" className="btn-primaire mt-8">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
