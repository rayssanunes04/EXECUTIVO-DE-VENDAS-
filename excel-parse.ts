import * as XLSX from "xlsx";
import { CANAL_GERAL, NO_SUPERVISOR, type HistoryRow, type SalesRow } from "./dashboard-types";

type Cell = string | number | boolean | null | undefined;
type Grid = Cell[][];

export const norm = (v: Cell) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

export function parseNum(v: Cell): number {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  let s = String(v).replace(/R\$|%|\s/g, "");
  if (!s) return 0;
  const neg = /^\(.*\)$/.test(s);
  s = s.replace(/[()]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? (neg ? -n : n) : 0;
}

async function readGrid(file: File, preferred: string): Promise<Grid> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const name =
    wb.SheetNames.find((n) => norm(n) === norm(preferred)) ?? wb.SheetNames.find((n) => norm(n) === "EXPORT") ?? wb.SheetNames[0];
  const sheet = name ? wb.Sheets[name] : undefined;
  if (!sheet) throw new Error("A planilha não contém uma aba legível.");
  return XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: null, raw: true });
}

function findHeader(grid: Grid, required: string[]) {
  const idx = grid.findIndex((row) => {
    const cells = row.map(norm);
    return required.every((r) => cells.includes(norm(r)));
  });
  return idx;
}

function colIndex(header: Cell[], ...names: string[]) {
  const h = header.map(norm);
  for (const n of names) {
    const i = h.indexOf(norm(n));
    if (i >= 0) return i;
  }
  for (const n of names) {
    const i = h.findIndex((c) => c.includes(norm(n)));
    if (i >= 0) return i;
  }
  return -1;
}

function filtersText(grid: Grid) {
  for (const row of grid)
    for (const c of row)
      if (typeof c === "string" && norm(c).startsWith("FILTROS APLICADOS")) return c;
  return "";
}


function detectAno(text: string) {
  const m = text.match(/20\d{2}/);
  return m ? Number(m[0]) : new Date().getFullYear();
}

const isJunk = (first: Cell) => {
  const f = norm(first);
  return !f || f === "TOTAL" || f.startsWith("FILTROS APLICADOS");
};

export async function parseMain(file: File) {
  const grid = await readGrid(file, "Sheet1");
  const hi = findHeader(grid, ["Gerente"]);
  if (hi < 0) throw new Error("Coluna 'Gerente' não encontrada na planilha principal.");
  const header = grid[hi];
  if (!header) throw new Error("Cabeçalho da planilha principal não encontrado.");
  const c = {
    gerente: colIndex(header, "Gerente"),
    rep: colIndex(header, "Representante", "Vendedor"),
    fam: colIndex(header, "Cod Desc Familia", "Familia"),
    meta: colIndex(header, "Meta"),
    fat: colIndex(header, "Faturamento"),
    ating: colIndex(header, "Atingimento"),
    cliente: colIndex(header, "Cliente"),
    periodo: colIndex(header, "Periodo", "Período"),
    supervisor: colIndex(header, "Supervisor", "Supervisor Kids"),
  };
  if (c.meta < 0 || c.fat < 0) throw new Error("Colunas 'Meta' e 'Faturamento' são obrigatórias.");
  const ftext = filtersText(grid);
  const canal = CANAL_GERAL;
  const ano = detectAno(ftext);
  const rows: SalesRow[] = [];
  for (const r of grid.slice(hi + 1)) {
    if (!r || r.every((v) => v == null || String(v).trim() === "")) continue;
    if (isJunk(r[c.gerente]) || r.some((v) => typeof v === "string" && norm(v).startsWith("FILTROS APLICADOS"))) continue;
    if (c.rep >= 0 && norm(r[c.rep]) === "TOTAL") continue;
    const meta = parseNum(r[c.meta]);
    const fat = parseNum(r[c.fat]);
    const pv = c.periodo >= 0 ? r[c.periodo] : null;
    const periodo = pv != null ? String(pv).match(/20\d{2}/) : null;
    const mes = periodoMonth(pv);
    rows.push({
      canal,
      ano: periodo ? Number(periodo[0]) : ano,
      supervisor: c.supervisor >= 0 ? String(r[c.supervisor] ?? "").trim() || "Geral" : "Geral",
      gerente: String(r[c.gerente] ?? "").trim(),
      representante: c.rep >= 0 ? String(r[c.rep] ?? "").trim() : "",
      cliente: c.cliente >= 0 ? String(r[c.cliente] ?? "").trim() || null : null,
      familia: c.fam >= 0 ? String(r[c.fam] ?? "").trim() : "",
      meta,
      faturamento: fat,
      atingimento: meta ? fat / meta : null,
      mes_ordem: mes,
    });
  }
  return { rows, canal, ano };
}

const MONTHS = ["JANEIRO","FEVEREIRO","MARCO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];

export function monthOrder(v: Cell): number {
  if (typeof v === "number" && v >= 1 && v <= 12) return v;
  const s = norm(v);
  const i = MONTHS.findIndex((m) => s.startsWith(m.slice(0, 3)));
  return i >= 0 ? i + 1 : Number(s) || 0;
}

export async function parseHistory(file: File, fallbackCanal: string) {
  const grid = await readGrid(file, "Sheet1");
  const hi = findHeader(grid, ["Date - Ano", "Date - Mês"]);
  if (hi < 0) throw new Error("Cabeçalho 'Date - Ano' / 'Date - Mês' não encontrado no histórico.");
  const h = grid[hi];
  if (!h) throw new Error("Cabeçalho do histórico não encontrado.");
  const c = {
    ano: colIndex(h, "Date - Ano"),
    mes: colIndex(h, "Date - Mês"),
    fat: colIndex(h, "Faturamento Líquido", "Faturamento"),
    meta: colIndex(h, "Meta"),
    pct: colIndex(h, "% de Atingimento", "Atingimento"),
  };
  const ftext = filtersText(grid);
  void ftext;
  const canal = fallbackCanal;
  const out: HistoryRow[] = [];
  for (const r of grid.slice(hi + 1)) {
    if (!r) continue;
    const ordem = monthOrder(r[c.mes]);
    if (!ordem || ordem < 1 || ordem > 12 || norm(r[c.ano]) === "TOTAL" || r.some((v) => typeof v === "string" && norm(v).startsWith("FILTROS APLICADOS"))) continue;
    out.push({
      canal,
      ano: Number(r[c.ano]) || null,
      mes: String(r[c.mes] ?? "").trim(),
      mes_ordem: ordem,
      faturamento_liquido: parseNum(r[c.fat]),
      meta_restante: parseNum(r[c.meta]),
      percentual_atingimento: c.pct >= 0 ? parseNum(r[c.pct]) : null,
    });
  }
  return out;
}

export async function parseSupervisorMap(file: File) {
  const grid = await readGrid(file, "Export");
  const hi = findHeader(grid, ["Representante"]) >= 0 ? findHeader(grid, ["Representante"]) : findHeader(grid, ["Vendedor"]);
  if (hi < 0) throw new Error(`'Representante' não encontrado em ${file.name}.`);
  const h = grid[hi];
  if (!h) throw new Error("Cabeçalho de representantes não encontrado.");
  const rep = colIndex(h, "Representante", "Vendedor");
  const fam = colIndex(h, "Cod Desc Familia", "Familia");
  const reps = new Set<string>();
  const pairs = new Set<string>();
  for (const r of grid.slice(hi + 1)) {
    const rv = norm(r?.[rep]);
    if (!rv || rv === "TOTAL" || rv.startsWith("FILTROS APLICADOS")) continue;
    reps.add(rv);
    if (fam >= 0 && r[fam]) pairs.add(rv + "|" + norm(r[fam]));
  }
  return { reps, pairs };
}

/** Stamps supervisor names onto main rows. Financial values are never touched. */
export function applySupervisors(
  rows: SalesRow[],
  maps: { name: string; reps: Set<string>; pairs: Set<string> }[],
): SalesRow[] {
  return rows.map((row) => {
    const rep = norm(row.representante);
    const pair = rep + "|" + norm(row.familia);
    const byPair = maps.find((m) => m.pairs.has(pair));
    const byRep = byPair ?? maps.find((m) => m.reps.has(rep));
    return { ...row, supervisor: byRep?.name ?? NO_SUPERVISOR };
  });
}

/** Month (1-12) from a Periodo cell: Excel date serial, "03/2026", "2026-03", "mar/26", "Março". */
export function periodoMonth(v: Cell): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    if (v > 20000) return XLSX.SSF.parse_date_code(v)?.m ?? null;
    return v >= 1 && v <= 12 ? v : null;
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{2,4})$/) ?? s.match(/^\d{1,2}[/.-](\d{1,2})[/.-]\d{2,4}$/);
  if (m) { const n = Number(m[1]); return n >= 1 && n <= 12 ? n : null; }
  m = s.match(/^20\d{2}[/.-](\d{1,2})/);
  if (m) return Number(m[1]);
  const o = monthOrder(s.replace(/[^A-Za-zÀ-ú]/g, ""));
  return o >= 1 && o <= 12 ? o : null;
}
