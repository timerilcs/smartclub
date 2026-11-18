export function Titre({ sur, titre, intro, centre = true, clair = false }: { sur?: string; titre: React.ReactNode; intro?: string; centre?: boolean; clair?: boolean }) {
  return (
    <div className={`${centre ? "mx-auto text-center" : ""} mb-12 max-w-2xl`}>
      {sur && <p className={`font-hand text-2xl ${clair ? "text-soleil" : "text-corail"}`}>{sur}</p>}
      <h2 className={`text-4xl font-bold leading-[1.05] sm:text-5xl ${clair ? "text-sable" : ""}`}>{titre}</h2>
      {intro && <p className={`mt-4 text-lg ${clair ? "text-sable/75" : "text-encre/70"}`}>{intro}</p>}
    </div>
  );
}
