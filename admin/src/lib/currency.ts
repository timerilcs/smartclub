const DEFAULT_RATE = 119.331742;

export function getConversionRate(): number {
  const stored = localStorage.getItem("xpf_eur_rate");
  return stored ? parseFloat(stored) : DEFAULT_RATE;
}

export function setConversionRate(rate: number): void {
  localStorage.setItem("xpf_eur_rate", String(rate));
}

export function formatXPF(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return amount.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " XPF";
}

export function formatEUR(amountXPF: number | null | undefined, rate?: number): string {
  if (amountXPF == null) return "—";
  const r = rate ?? getConversionRate();
  const eur = amountXPF / r;
  return eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
