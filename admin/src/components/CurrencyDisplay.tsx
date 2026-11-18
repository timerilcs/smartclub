import { formatXPF, formatEUR } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
  layout?: "inline" | "stacked";
}

export function CurrencyDisplay({ amount, className, size = "md", layout = "inline" }: CurrencyDisplayProps) {
  if (amount == null) return <span className={className}>—</span>;

  if (layout === "stacked") {
    return (
      <div className={cn("flex flex-col", className)}>
        <span className={cn(
          "font-semibold",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-2xl font-bold font-display"
        )}>
          {formatXPF(amount)}
        </span>
        <span className={cn(
          "text-muted-foreground",
          size === "sm" && "text-[10px]",
          size === "md" && "text-xs",
          size === "lg" && "text-xs"
        )}>
          ≈ {formatEUR(amount)}
        </span>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn(
        "font-semibold",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-2xl font-bold font-display"
      )}>
        {formatXPF(amount)}
      </span>
      <span className={cn(
        "text-muted-foreground",
        size === "sm" && "text-[10px]",
        size === "md" && "text-xs",
        size === "lg" && "text-sm"
      )}>
        ({formatEUR(amount)})
      </span>
    </span>
  );
}
