import { MESES, type HistoryRow, type SalesRow } from "./dashboard-types";
import { inPeriod } from "./dashboard-filters";

export type MonthlyPoint = { label: string; fat: number; meta: number; pct: number | null; available: boolean };
export function monthlyPoints(history: HistoryRow[], period: Set<string>): MonthlyPoint[] {
  return MESES.flatMap((label, index) => {
    const month = index + 1;
    if (period.size && ![...period].some((key) => key.endsWith(`-${month}`))) return [];
    const source = history.filter((row) => row.mes_ordem === month && inPeriod(period, row.ano, month));
    const fat = source.reduce((sum, row) => sum + row.faturamento_liquido, 0);
    // The workbook's Meta column is persisted under the legacy name meta_restante.
    const meta = source.reduce((sum, row) => sum + row.meta_restante, 0);
    return [{ label, fat, meta, pct: meta ? fat / meta : null, available: source.length > 0 }];
  });
}
export function topRepresentatives(rows: SalesRow[]) {
  const groups = new Map<string, { name: string; fat: number; meta: number }>();
  for (const row of rows) {
    if (!row.representante) continue;
    const group = groups.get(row.representante) ?? { name: row.representante, fat: 0, meta: 0 };
    group.fat += row.faturamento;
    group.meta += row.meta;
    groups.set(row.representante, group);
  }
  return [...groups.values()].sort((a, b) => b.fat - a.fat || a.name.localeCompare(b.name, "pt-BR")).slice(0, 10);
}