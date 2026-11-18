/* Petites formes géométriques "cahier de maths" utilisées en décor */
type P = { className?: string; style?: React.CSSProperties };
export const Plus = ({ className = "", style }: P) => (
  <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
    <path d="M20 6v28M6 20h28" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
export const Triangle = ({ className = "", style }: P) => (
  <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
    <path d="M20 5 36 34H4Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
  </svg>
);
export const Cercle = ({ className = "", style }: P) => (
  <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
    <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="5 6" />
  </svg>
);
export const Pi = ({ className = "", style }: P) => (
  <span className={`font-display font-extrabold ${className}`} style={style} aria-hidden>π</span>
);
/* Bandeau inspiré des motifs tapa */
export const Tapa = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden>
    <defs>
      <pattern id="tapa" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 24 12 0 24 24Z" fill="currentColor" />
        <circle cx="12" cy="18" r="2.5" fill="#fbf7f0" />
      </pattern>
    </defs>
    <rect width="240" height="24" fill="url(#tapa)" />
  </svg>
);
export const Souligne = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 14" className={className} preserveAspectRatio="none" aria-hidden>
    <path d="M3 9c40-6 90-8 194-3" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>
);
