import type { SalesRow } from "./dashboard-types";
import { norm } from "./excel-parse";

export const MAIN_FAMILIES = ["BB - BABY", "BR - BRINQUEDOS"];
export const operationRows = (rows: SalesRow[]) => rows.filter((row) => MAIN_FAMILIES.includes(norm(row.familia)));
export const representativeOptions = (rows: SalesRow[], supervisor?: string) => [...new Set(rows.filter((row) => supervisor === undefined || row.supervisor === supervisor).map((row) => row.representante).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
export const matchesRepresentatives = (row: SalesRow, selected: string[]) => selected.length === 0 || selected.includes(row.representante);
export const PERFORMANCE_OPTIONS = ["Meta Batida (≥ 100%)", "Em Atenção (80% a 99%)", "Crítico (< 80%)", "Sem Meta (R$ 0)"];
export function matchesPerformance(row: Pick<SalesRow, "meta" | "faturamento">, status: string) {
  if (status === "__all__") return true;
  if (status === PERFORMANCE_OPTIONS[3]) return row.meta === 0;
  if (row.meta <= 0) return false;
  const ratio = row.faturamento / row.meta;
  if (status === PERFORMANCE_OPTIONS[0]) return ratio >= 1;
  if (status === PERFORMANCE_OPTIONS[1]) return ratio >= 0.8 && ratio < 1;
  if (status === PERFORMANCE_OPTIONS[2]) return ratio < 0.8;
  return false;
}
export function inPeriod(selected: Set<string>, year: number | null, month: number | null) {
  if (selected.size === 0) return true;
  if (month) return selected.has(`${year}-${month}`);
  return [...selected].some((key) => key.startsWith(`${year}-`));
}