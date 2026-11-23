import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import type { SalesRow } from "@/lib/dashboard-types";
import { money, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Key = "supervisor" | "gerente" | "representante" | "familia" | "meta" | "faturamento" | "atingimento";
const COLS: { key: Key; label: string; num?: boolean }[] = [
  { key: "supervisor", label: "Supervisor" },
  { key: "gerente", label: "Gerente" },
  { key: "representante", label: "Representante" },
  { key: "familia", label: "Cod Desc Familia" },
  { key: "meta", label: "Meta", num: true },
  { key: "faturamento", label: "Faturamento", num: true },
  { key: "atingimento", label: "Atingimento", num: true },
];

export function Status({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const ok = value >= 1;
  return (
    <span className={cn("inline-flex items-center justify-end gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums whitespace-nowrap", ok ? "bg-attainment-positive text-attainment-positive-foreground" : "bg-attainment-negative text-attainment-negative-foreground")}>
      {ok ? <Check aria-label="Meta atingida" className="h-3 w-3 shrink-0" /> : <X aria-label="Abaixo da meta" className="h-3 w-3 shrink-0" />}
      {pct(value)}
    </span>
  );
}

export function DetailTable({ rows }: { rows: SalesRow[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "faturamento", dir: -1 });
  const sorted = useMemo(() => {
    const val = (r: SalesRow) => (sort.key === "atingimento" ? (r.meta ? r.faturamento / r.meta : -Infinity) : r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), "pt-BR")) * sort.dir;
    });
  }, [rows, sort]);
  const meta = rows.reduce((s, r) => s + r.meta, 0);
  const fat = rows.reduce((s, r) => s + r.faturamento, 0);
  return (
    <section aria-label="Atingimento Detalhado" className="flex max-h-[480px] w-full min-w-0 flex-col overflow-hidden rounded-xl border border-table-border bg-table-surface shadow-table">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-table-border px-5 py-4">
        <h2 className="text-base font-bold text-table-navy">Atingimento Detalhado</h2>
        <span className="text-xs text-muted-foreground">{rows.length.toLocaleString("pt-BR")} linhas</span>
      </div>
      <div className="min-h-0 overflow-auto">
        <table className="dashboard-detail-table w-full text-sm">
          <colgroup><col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[21%]" /><col className="w-[13%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[12%]" /></colgroup>
          <thead className="sticky top-0 z-10 bg-table-navy text-table-header-foreground">
            <tr>
              {COLS.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cn("px-3 py-3 text-xs font-semibold", c.num ? "text-right" : "text-left")}>
                  <Button variant="ghost" className="h-auto w-full justify-start whitespace-normal rounded-sm p-0 text-left text-xs font-semibold text-table-header-foreground hover:bg-transparent hover:text-table-header-foreground/80" onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.num ? -1 : 1 }))}>
                  <span className={cn("inline-flex w-full items-center gap-1", c.num && "justify-end")}>
                    {c.label}
                    {sort.key === c.key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                  </span></Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-b border-table-border last:border-0 odd:bg-table-surface even:bg-table-stripe hover:bg-table-total">
                <td title={r.supervisor} className="truncate px-3 py-3 text-xs font-medium text-table-navy">{r.supervisor}</td>
                <td title={r.gerente} className="truncate px-3 py-3 text-xs">{r.gerente}</td>
                <td title={r.representante} className="truncate px-3 py-3 text-xs">{r.representante}</td>
                <td title={r.familia} className="truncate px-3 py-3 text-xs">{r.familia}</td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right">{money(r.meta)}</td>
                <td className={cn("tabular whitespace-nowrap px-3 py-2 text-right", r.faturamento < 0 && "text-destructive")}>{money(r.faturamento)}</td>
                <td className="tabular whitespace-nowrap px-3 py-2 text-right"><Status value={r.meta ? r.faturamento / r.meta : null} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">Nenhum registro para os filtros selecionados.</td></tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 z-10 bg-table-total font-bold text-table-navy shadow-table-total">
            <tr>
               <td className="px-3 py-3" colSpan={4}>Total Geral</td>
               <td className="tabular whitespace-nowrap px-3 py-3 text-right">{money(meta)}</td>
               <td className="tabular whitespace-nowrap px-3 py-3 text-right">{money(fat)}</td>
               <td className="tabular px-3 py-3 text-right"><Status value={meta ? fat / meta : null} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
