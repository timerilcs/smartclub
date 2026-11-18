export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <img
      src={clair ? "/images/logo-smartclub-clair.png" : "/images/logo-smartclub.png"}
      alt="SmartClub"
      width={700}
      height={131}
      className="h-8 w-auto sm:h-9"
    />
  );
}
