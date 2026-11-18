import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, Mail, MapPin } from "lucide-react";
import { Logo } from "./Logo";
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
  const { pathname } = useLocation();
  const surImage = true; // toutes les pages commencent par une image ou un fond foncé

  useEffect(() => { setOuvert(false); window.scrollTo(0, 0); trackPage(pathname); }, [pathname]);

  const txt = surImage ? "text-white" : "text-encre";

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 btn-primaire">Aller au contenu</a>

      {/* Menu léger, sans fond, posé sur l'image */}
      <header className={`${surImage ? "absolute inset-x-0 top-0" : "relative"} z-40 ${txt}`}>
        <div className="conteneur flex h-24 items-center justify-between">
          <Link to="/" aria-label="SmartClub – accueil"><Logo clair={surImage} /></Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {liens.map(l => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) => `relative py-1 text-[15px] font-medium transition-opacity after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-current after:transition-transform ${isActive ? "opacity-100 after:scale-x-100" : "opacity-80 hover:opacity-100 after:scale-x-0 hover:after:scale-x-100"}`}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/inscription" className={`rounded-full px-5 py-2 text-[15px] font-semibold ring-1 transition-colors ${surImage ? "ring-white/60 hover:bg-white hover:text-encre" : "ring-encre/25 hover:bg-encre hover:text-white"}`}>S'inscrire</Link>
          </nav>
          <button onClick={() => setOuvert(o => !o)} className="p-2 lg:hidden" aria-label="Menu" aria-expanded={ouvert}>
            {ouvert ? <X /> : <Menu />}
          </button>
        </div>
        {ouvert && (
          <nav className="conteneur lg:hidden">
            <div className="flex flex-col rounded-2xl bg-white p-3 text-encre">
              {liens.map(l => (
                <NavLink key={l.to} to={l.to} className={({ isActive }) => `rounded-xl px-4 py-3 text-lg font-medium ${isActive ? "bg-sable-2" : ""}`}>{l.label}</NavLink>
              ))}
              <Link to="/inscription" className="btn-corail mt-2">S'inscrire</Link>
            </div>
          </nav>
        )}
      </header>

      <main id="contenu" className="flex-1">{children}</main>

      <footer className="mt-24 bg-encre text-white">
        <div className="conteneur grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo clair />
            <p className="mt-4 max-w-sm text-white/60">Apprendre autrement, progresser ensemble et prendre confiance en soi. Soutien scolaire en petits groupes, du primaire au lycée.</p>
          </div>
          <div>
            <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[.2em] text-white/50">Le club</h3>
            <ul className="space-y-2 text-white/80">
              {liens.map(l => <li key={l.to}><Link className="hover:text-white" to={l.to}>{l.label}</Link></li>)}
              <li><Link className="hover:text-white" to="/inscription">Inscription</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[.2em] text-white/50">Nous joindre</h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex gap-2"><MapPin className="h-5 w-5 shrink-0 text-lagon" /> Tahiti, Polynésie française</li>
              <li className="flex gap-2"><Mail className="h-5 w-5 shrink-0 text-lagon" /><Link to="/contact" className="hover:text-white">Écrire au club</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <p className="conteneur py-5 text-sm text-white/40">© {new Date().getFullYear()} SmartClub · Soutien scolaire à Tahiti</p>
        </div>
      </footer>
    </div>
  );
}
