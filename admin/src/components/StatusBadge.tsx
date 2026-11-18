import { cn } from "@/lib/utils";

type BadgeVariant = "confirmé" | "pré-inscrit" | "annulé" | "ouvert" | "complet" | "payée" | "partielle" | "impayée" | "annulée" | "nouveau" | "contacté" | "converti" | "perdu";

const variantClasses: Record<BadgeVariant, string> = {
  "confirmé": "badge-confirmed",
  "pré-inscrit": "badge-preinscrit",
  "annulé": "badge-cancelled",
  "ouvert": "badge-confirmed",
  "complet": "badge-pending",
  "payée": "badge-confirmed",
  "partielle": "badge-pending",
  "impayée": "badge-cancelled",
  "annulée": "badge-cancelled",
  "nouveau": "badge-preinscrit",
  "contacté": "badge-pending",
  "converti": "badge-confirmed",
  "perdu": "badge-cancelled",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = status as BadgeVariant;
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border capitalize",
      variantClasses[variant] || "bg-secondary text-secondary-foreground"
    )}>
      {status}
    </span>
  );
}
