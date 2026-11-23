import { useMemo } from "react";
import type { SalesRow } from "@/lib/dashboard-types";
import { money } from "@/lib/format";
import { Status } from "@/components/dashboard/DetailTable";

export function FamilyTable({ rows }: { rows: SalesRow[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, { fat: number; meta: number }>();
    for (const r of rows) {
      const g = m.get(r.familia || "—") ?? { fat: 0, meta: 0 };
      g.fat += r.faturamento; g.meta += r.meta;
      m.set(r.familia || "—", g);
    }
    return [...m.entries()].map(([familia, v]) => ({ familia, ...v })).sort((a, b) => b.fat - a.fat);
  }, [rows]);
  const fat = groups.reduce((s, g) => s + g.fat, 0);
  const meta = groups.reduce((s, g) => s + g.meta, 0);
  return (
    <section aria-label="Resumo por Família" className="w-full min-w-0 overflow-hidden rounded-xl border border-table-border bg-table-surface shadow-table">
      <div className="border-b border-table-border px-5 py-4"><h2 className="text-base font-bold text-table-navy">Resumo por Família</h2></div>
        <table className="dashboard-family-table w-full table-fixed text-sm">
          <colgroup><col className="w-[34%]" /><col className="w-[22%]" /><col className="w-[22%]" /><col className="w-[22%]" /></colgroup>
          <thead className="bg-table-navy text-xs text-table-header-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 text-left font-semibold">Cod Desc Familia</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Meta</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Faturamento</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">% Atingimento</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => {
              const a = g.meta ? g.fat / g.meta : null;
              return (
                <tr key={g.familia} className="border-b border-table-border odd:bg-table-surface even:bg-table-stripe">
                  <td className="px-3 py-3 text-xs font-medium text-table-navy">
                    <span className="break-words">{g.familia}</span>
                    <progress aria-label={`Atingimento de ${g.familia}`} className="family-progress mt-2 block h-1.5 w-full max-w-64 overflow-hidden rounded-full" max={1} value={Math.min(Math.max(a ?? 0, 0), 1)} />
                  </td>
                  <td className="tabular px-3 py-3 text-right text-muted-foreground">{money(g.meta)}</td>
                  <td className="tabular px-3 py-3 text-right">{money(g.fat)}</td>
                  <td className="tabular px-3 py-3 text-right"><Status value={a} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-table-total font-bold text-table-navy shadow-table-total">
            <tr>
              <td className="px-3 py-3">Total</td>
              <td className="tabular px-3 py-3 text-right">{money(meta)}</td>
              <td className="tabular px-3 py-3 text-right">{money(fat)}</td>
              <td className="tabular px-3 py-3 text-right"><Status value={meta ? fat / meta : null} /></td>
            </tr>
          </tfoot>
        </table>
    </section>
  );
}
