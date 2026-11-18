export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="18" fill={clair ? "#ffffff" : "#13213c"} />
        <path d="M20 40c3 4 8 6 12 6 6 0 10-3 10-8 0-11-21-6-21-16 0-4 4-7 10-7 4 0 8 2 10 4" fill="none" stroke="#0fa3a3" strokeWidth="5.5" strokeLinecap="round" />
      </svg>
      <span className={`font-display text-2xl font-medium leading-none ${clair ? "text-white" : "text-encre"}`}>
        Smart<span className={clair ? "text-white/70" : "text-lagon"}>Club</span>
      </span>
    </span>
  );
}
