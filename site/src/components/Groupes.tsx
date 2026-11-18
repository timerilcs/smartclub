import { Link } from "react-router-dom";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { useGroupes, dateCourte, Groupe } from "@/lib/data";

export function ListeGroupes({ filtre, vide }: { filtre: (g: Groupe) => boolean; vide: string }) {
  const { data, loading } = useGroupes();
  const groupes = data.filter(filtre);
  if (loading) return <p className="text-encre/50">Chargement des créneaux…</p>;
  if (!groupes.length)
    return <p className="rounded-2xl border border-dashed border-encre/30 bg-white/60 p-6 text-encre/70">{vide}</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {groupes.map(g => (
        <div key={g.id_agenda} className="flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 ring-encre/10">
          <p className="text-lg font-bold">{g.infocourte || g.info || "Groupe"}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-encre/70">
            {g.debut && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{dateCourte(g.debut)}{g.fin && ` → ${dateCourte(g.fin)}`}</span>}
            {g.heure_debut && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{g.heure_debut}{g.heure_fin && ` – ${g.heure_fin}`}</span>}
            {g.lieu && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{g.lieu}</span>}
          </div>
          <Link to={`/inscription?groupe=${g.id_agenda}`} className="mt-auto self-start font-bold underline decoration-corail decoration-[3px] underline-offset-4">Réserver une place</Link>
        </div>
      ))}
    </div>
  );
}
