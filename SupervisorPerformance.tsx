import type { SalesRow } from "@/lib/dashboard-types";
import { supervisorTotals } from "@/lib/supervisor-mapping";
import { money, pct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SupervisorPerformance({ rows, selected, onSelect }: { rows: SalesRow[]; selected: string; onSelect: (name: string) => void }) {
  return <section aria-labelledby="supervisor-performance-title" className="space-y-3">
    <h2 id="supervisor-performance-title" className="text-base font-bold text-primary">Desempenho por Supervisor</h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {supervisorTotals(rows).map((team) => <Button key={team.supervisor} variant="outline" aria-label={`Filtrar equipe de ${team.supervisor}`} aria-pressed={selected === team.supervisor} onClick={() => onSelect(team.supervisor)} className={cn("h-auto min-w-0 flex-col items-stretch gap-3 whitespace-normal rounded-lg bg-card p-4 text-left shadow-card", selected === team.supervisor && "border-secondary ring-1 ring-secondary")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-primary">{team.supervisor}</span>
          <span className={cn("rounded px-2 py-1 text-xs font-semibold tabular", team.atingimento === null ? "bg-muted text-muted-foreground" : team.achieved ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>{pct(team.atingimento)}</span>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div><dt className="text-muted-foreground">Meta Total</dt><dd className="mt-1 break-words text-sm font-semibold tabular">{money(team.meta)}</dd></div>
          <div><dt className="text-muted-foreground">Faturamento Líquido</dt><dd className="mt-1 break-words text-sm font-semibold tabular">{money(team.faturamento)}</dd></div>
        </dl>
        <progress aria-label={`Atingimento de ${team.supervisor}`} max={1} value={Math.max(0, Math.min(1, team.atingimento ?? 0))} className={cn("supervisor-progress h-2 w-full overflow-hidden rounded", team.achieved ? "text-success" : "text-destructive")} />
        <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="text-muted-foreground">Gap / Diferença para Meta</span><span className={cn("font-semibold tabular", team.gap < 0 ? "text-destructive" : "text-success")}>{money(team.gap)}</span></div>
      </Button>)}
    </div>
  </section>;
}