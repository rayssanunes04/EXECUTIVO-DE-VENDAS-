import { useMemo } from "react";
import { topRepresentatives } from "@/lib/dashboard-analytics";
import type { SalesRow } from "@/lib/dashboard-types";
import { money } from "@/lib/format";
import { Status } from "./DetailTable";

export function RepresentativeRanking({ rows }: { rows: SalesRow[] }) {
  const ranking = useMemo(() => topRepresentatives(rows), [rows]);
  const max = Math.max(1, ...ranking.flatMap((entry) => [entry.meta, entry.fat]));
  return <section aria-label="Top 10 Representantes" className="min-w-0 rounded-lg border bg-card p-5 shadow-card">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-base font-bold text-table-navy">Top 10 Representantes (Faturamento vs. Meta)</h2>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-table-progress" />Faturamento</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-table-border" />Meta</span>
      </div>
    </div>
    {ranking.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">Nenhum representante para os filtros selecionados.</p> : <ol className="divide-y divide-table-border">
      {ranking.map((entry, index) => <li key={entry.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 md:grid-cols-[minmax(180px,1fr)_minmax(160px,2fr)_150px_90px]">
        <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1"><span className="w-5 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span title={entry.name} className="truncate text-xs font-medium">{entry.name}</span></div>
        <div className="min-w-0 space-y-1.5">
          <progress aria-label={`Faturamento de ${entry.name}: ${money(entry.fat)}`} className="family-progress block h-2 w-full overflow-hidden rounded-sm" max={max} value={Math.max(0, entry.fat)} />
          <progress aria-label={`Meta de ${entry.name}: ${money(entry.meta)}`} className="ranking-meta-progress block h-2 w-full overflow-hidden rounded-sm" max={max} value={Math.max(0, entry.meta)} />
        </div>
        <div className="text-right text-xs tabular-nums"><p className="font-semibold text-table-navy">{money(entry.fat)}</p><p className="mt-1 text-muted-foreground">{money(entry.meta)}</p></div>
        <div className="col-span-2 text-right md:col-span-1"><Status value={entry.meta ? entry.fat / entry.meta : null} /></div>
      </li>)}
    </ol>}
  </section>;
}