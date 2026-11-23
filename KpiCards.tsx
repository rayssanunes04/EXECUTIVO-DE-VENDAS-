import { Target, Wallet, Percent, TrendingDown } from "lucide-react";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function KpiCards({ meta, fat }: { meta: number; fat: number }) {
  const ating = meta ? fat / meta : null;
  const gap = fat - meta;
  const ok = ating != null && ating >= 1;
  const items = [
    { label: "Meta Total", value: money(meta), icon: Target },
    { label: "Faturamento Líquido", value: money(fat), icon: Wallet },
    {
      label: "% de Atingimento Geral", value: pct(ating), icon: Percent,
      badge: ating == null ? null : ok ? "Meta batida" : ating >= 0.8 ? "Atenção" : "Abaixo da meta",
      tone: ok ? "bg-success text-success-foreground" : ating != null && ating >= 0.8 ? "bg-warning text-foreground" : "bg-destructive text-destructive-foreground",
    },
    { label: "Gap / Diferença para Meta", value: money(gap), icon: TrendingDown, neg: gap < 0 },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="relative overflow-hidden rounded-lg border bg-card p-5 shadow-card">
          <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{it.label}</p>
            <it.icon className="h-4 w-4 text-secondary" />
          </div>
          <p className={cn("tabular mt-3 text-2xl font-bold text-primary", it.neg && "text-destructive")}>{it.value}</p>
          {it.badge && <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", it.tone)}>{it.badge}</span>}
        </div>
      ))}
    </div>
  );
}
