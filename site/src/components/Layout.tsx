import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";
import { Tapa } from "./Formes";
import { trackPage } from "@/lib/data";

const liens = [
  { to: "/accompagnements", label: "Accompagnements" },
  { to: "/tarifs", label: "Tarifs & horaires" },
  { to: "/stages", label: "Stages" },
  { to: "/avis", label: "Avis" },
  { to: "/contact", label: "Contact" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [ouvert, setOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOuvert(false); window.scrollTo(0, 0); trackPage(pathname); }, [pathname]);
  useEffect(() => {
    const f = () => setDefile(window.scrollY > 12);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-primaire">Aller au contenu</a>
      <header className={`sticky top-0 z-40 transition-all ${defile ? "bg-sable/90 backdrop-blur-md shadow-[0_1px_0_rgba(19,33,60,.12)]" : "bg-transparent"}`}>
        <div className="conteneur flex h-20 items-center justify-between">
          <Link to="/" aria-label="SmartClub – accueil"><Logo /></Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {liens.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${isActive ? "bg-encre text-sable" : "hover:bg-encre/5"}`}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/inscription" className="btn-corail hidden !py-2.5 sm:inline-flex">S'inscrire</Link>
            <button onClick={() => setOuvert(o => !o)} className="rounded-full p-2.5 hover:bg-encre/5 lg:hidden" aria-label="Menu" aria-expanded={ouvert}>
              {ouvert ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {ouvert && (
          <nav className="conteneur flex flex-col gap-1 pb-6 lg:hidden">
            {liens.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-2xl px-4 py-3 text-lg font-semibold ${isActive ? "bg-encre text-sable" : "bg-white"}`}>{l.label}</NavLink>
            ))}
            <Link to="/inscription" className="btn-corail mt-2">S'inscrire</Link>
          </nav>
        )}
      </header>

      <main id="contenu" className="flex-1">{children}</main>

      <footer className="mt-24 bg-encre text-sable">
        <Tapa className="h-4 w-full text-lagon" />
        <div className="conteneur grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo clair />
            <p className="mt-4 max-w-sm text-sable/70">Apprendre autrement, progresser ensemble et prendre confiance en soi. Soutien scolaire en petits groupes, du primaire au lycée.</p>
          </div>
          <div>
            <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-soleil">Le club</h3>
            <ul className="space-y-2 text-sable/80">
              {liens.map(l => <li key={l.to}><Link className="hover:text-white" to={l.to}>{l.label}</Link></li>)}
              <li><Link className="hover:text-white" to="/inscription">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-soleil">Nous joindre</h3>
            <ul className="space-y-3 text-sable/80">
              <li className="flex gap-2"><MapPin className="h-5 w-5 shrink-0 text-lagon" /> Tahiti, Polynésie française</li>
              <li className="flex gap-2"><Mail className="h-5 w-5 shrink-0 text-lagon" /><Link to="/contact" className="hover:text-white">Écrire au club</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-sable/10">
          <p className="conteneur py-5 text-sm text-sable/50">© {new Date().getFullYear()} SmartClub · Soutien scolaire à Tahiti</p>
        </div>
      </footer>
    </div>
  );
}
