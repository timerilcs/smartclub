export function Logo({ clair = false }: { clair?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-10 w-10 shrink-0" aria-hidden>
        <rect width="64" height="64" rx="16" fill={clair ? "#fbf7f0" : "#13213c"} />
        <path d="M18 40c3 5 9 7 14 7 7 0 12-4 12-10 0-12-24-7-24-18 0-5 5-8 11-8 5 0 9 2 11 5" fill="none" stroke="#ffc23d" strokeWidth="6" strokeLinecap="round" />
        <circle cx="48" cy="46" r="4" fill="#ff6b4a" />
      </svg>
      <span className={`font-display text-2xl font-extrabold leading-none ${clair ? "text-sable" : "text-encre"}`}>
        Smart<span className="text-lagon">Club</span>
      </span>
    </span>
  );
}
