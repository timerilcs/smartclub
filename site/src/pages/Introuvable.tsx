import { Link } from "react-router-dom";
export default function Introuvable() {
  return (
    <section className="grid min-h-[80vh] place-items-center bg-encre px-5 pt-24 text-center text-white">
      <div>
        <p className="font-display text-[8rem] leading-none text-lagon">404</p>
        <h1 className="text-3xl">Cette page n'est pas au programme.</h1>
        <Link to="/" className="btn-blanc mt-8">Retour à l'accueil</Link>
      </div>
    </section>
  );
}
