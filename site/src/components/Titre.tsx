export function Titre({ sur, titre, intro, centre = true, clair = false }: { sur?: string; titre: React.ReactNode; intro?: string; centre?: boolean; clair?: boolean }) {
  return (
    <div className={`${centre ? "mx-auto text-center" : ""} mb-12 max-w-2xl`}>
      {sur && <p className={`surtitre ${clair ? "!text-white/70" : ""}`}>{sur}</p>}
      <h2 className={`mt-3 text-4xl leading-[1.1] sm:text-5xl ${clair ? "text-white" : ""}`}>{titre}</h2>
      {intro && <p className={`mt-4 text-lg ${clair ? "text-white/75" : "text-encre/65"}`}>{intro}</p>}
    </div>
  );
}
