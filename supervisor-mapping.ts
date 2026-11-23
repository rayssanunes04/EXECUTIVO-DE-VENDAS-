import { SUPERVISORS, type SalesRow } from "./dashboard-types";

export const UNASSIGNED_SUPERVISOR = "Sem Supervisor";
export const SUPERVISOR_CHOICES = [...SUPERVISORS, UNASSIGNED_SUPERVISOR];
export type SupervisorMapping = { representante: string; supervisor: string; representante_key: string; familia?: string };
export function mergeSupervisorMappings(mappings: { representante: string; supervisor: string; familia?: string }[]): SupervisorMapping[] {
  const unique = new Map<string, SupervisorMapping>();
  for (const m of mappings) {
    const key = JSON.stringify([representativeKey(m.representante), representativeKey(m.familia ?? ""), m.supervisor]);
    unique.set(key, { ...m, representante_key: representativeKey(m.representante) });
  }
  return [...unique.values()];
}
export function supervisorTotals(rows: SalesRow[]) {
  return SUPERVISOR_CHOICES.filter((name) => name !== UNASSIGNED_SUPERVISOR || rows.some((r) => r.supervisor === name)).map((supervisor) => {
    const team = rows.filter((r) => r.supervisor === supervisor);
    const meta = team.reduce((s, r) => s + r.meta, 0);
    const faturamento = team.reduce((s, r) => s + r.faturamento, 0);
    const atingimento = meta ? faturamento / meta : null;
    return { supervisor, meta, faturamento, atingimento, gap: faturamento - meta, achieved: atingimento != null && atingimento >= 1 };
  });
}
export const representativeKey = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/\s+/g, " ");
export function assignSupervisorMappings(rows: SalesRow[], mappings: SupervisorMapping[]): SalesRow[] {
  return rows.map((row) => {
    const matched = mappings.filter((m) => m.representante_key === representativeKey(row.representante) && (!m.familia || representativeKey(m.familia) === representativeKey(row.familia)));
    const names = [...new Set(matched.map((m) => m.supervisor))];
    return { ...row, supervisor: names.length === 1 ? names[0] ?? UNASSIGNED_SUPERVISOR : UNASSIGNED_SUPERVISOR };
  });
}

export type SupervisorUpload = { supervisor: string; rows: SalesRow[] };
const pairKey = (r: SalesRow) => JSON.stringify([representativeKey(r.representante), representativeKey(r.familia)]);
export function composeSupervisorViews(general: SalesRow[], uploads: SupervisorUpload[]) {
  const members = new Map<string, Set<string>>();
  for (const upload of uploads) for (const row of upload.rows) {
    const key = pairKey(row);
    const names = members.get(key) ?? new Set<string>();
    names.add(upload.supervisor); members.set(key, names);
  }
  const sales = general.map((r) => {
    const names = [...(members.get(pairKey(r)) ?? [])];
    return { ...r, supervisor: names.length === 1 ? names[0] ?? UNASSIGNED_SUPERVISOR : UNASSIGNED_SUPERVISOR };
  });
  const teamSales = sales.filter((r) => (members.get(pairKey(r))?.size ?? 0) <= 1);
  const generalPairs = new Set(general.map(pairKey));
  for (const upload of uploads) for (const row of upload.rows) {
    // Only ambiguous pairs use exact individual financial rows, in a separate view.
    if (generalPairs.has(pairKey(row)) && (members.get(pairKey(row))?.size ?? 0) > 1) teamSales.push({ ...row, supervisor: upload.supervisor });
  }
  return { sales, teamSales };
}