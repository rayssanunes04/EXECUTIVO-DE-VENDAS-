import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseMain, parseHistory } from "@/lib/excel-parse";
import { operationRows, representativeOptions, matchesRepresentatives, inPeriod } from "@/lib/dashboard-filters";
import type { SalesRow } from "@/lib/dashboard-types";

function workbook(grid: unknown[][], sheet: string): File {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grid), sheet);
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return { name: "teste.xlsx", arrayBuffer: async () => bytes } as File;
}
const row = (representante: string, familia = "BB - BABY", mes_ordem = 1): SalesRow => ({
  canal: "GERAL", ano: 2026, supervisor: "Geral", gerente: "R35 - FERNANDO E.", representante,
  cliente: null, familia, meta: 100, faturamento: 50, atingimento: 0.5, mes_ordem,
});

describe("Regras da operação", () => {
  it("ignora Total, vazias e Filtros aplicados, preservando devoluções negativas", async () => {
    const result = await parseMain(workbook([
      ["Gerente", "Representante", "Cod Desc Familia", "Meta", "Faturamento", "Periodo"],
      ["R35 - FERNANDO E.", "Ana", "BB - BABY", 100, -25, "01/2026"],
      ["Total", "", "", 100, 999], [], ["Filtros aplicados: 2026"],
    ], "Export"));
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.faturamento).toBe(-25);
  });
  it("atribui Geral quando não há coluna Supervisor", async () => {
    const result = await parseMain(workbook([["Gerente", "Meta", "Faturamento"], ["R35 - FERNANDO E.", 100, 50]], "Export"));
    expect(result.rows[0]?.supervisor).toBe("Geral");
  });
  it("lê o supervisor diretamente da principal quando informado", async () => {
    const result = await parseMain(workbook([["Gerente", "Meta", "Faturamento", "Supervisor"], ["R35 - FERNANDO E.", 100, 50, "ALMIR NETO"]], "Export"));
    expect(result.rows[0]?.supervisor).toBe("ALMIR NETO");
  });
  it("lê Supervisor Kids diretamente da principal sem arquivos auxiliares", async () => {
    const result = await parseMain(workbook([["Gerente", "Meta", "Faturamento", "Supervisor Kids"], ["R35 - FERNANDO E.", 100, 50, "PATRICIA CARDOSO"]], "Export"));
    expect(result.rows[0]?.supervisor).toBe("PATRICIA CARDOSO");
  });
  it("cruza os vendedores pelo supervisor sem incluir outra equipe", () => {
    const rows = [{ ...row("Ana"), supervisor: "ALMIR NETO" }, { ...row("Bia"), supervisor: "KAM" }, { ...row("Caio"), supervisor: "ALMIR NETO" }];
    expect(representativeOptions(rows, "ALMIR NETO")).toEqual(["Ana", "Caio"]);
    expect(representativeOptions(rows, "KAM")).toEqual(["Bia"]);
    expect(representativeOptions(rows)).toEqual(["Ana", "Bia", "Caio"]);
  });
  it("localiza o cabeçalho de histórico após linhas introdutórias", async () => {
    const result = await parseHistory(workbook([["Histórico"], [], ["Date - Ano", "Date - Mês", "Faturamento Líquido", "Meta"], [2026, "Janeiro", 50, 100], [2026, "Dezembro", 75, 100]], "Sheet1"), "GERAL");
    expect(result.map((r) => r.mes_ordem)).toEqual([1, 12]);
  });
  it("considera somente BB - BABY e BR - BRINQUEDOS, inclusive em Todos", () => {
    expect(operationRows([row("Ana"), row("Bia", "BR - BRINQUEDOS"), row("Caio", "OUTRA")]).map((r) => r.familia)).toEqual(["BB - BABY", "BR - BRINQUEDOS"]);
  });
  it("lista representantes únicos em ordem alfabética", () => {
    expect(representativeOptions([row("Zeca"), row("Ana"), row("Zeca"), row("")])).toEqual(["Ana", "Zeca"]);
  });
  it("seleciona um ou vários vendedores e permite Todos", () => {
    const rows = [row("Ana"), row("Bia"), row("Caio")];
    expect(rows.filter((r) => matchesRepresentatives(r, ["Ana"])).map((r) => r.representante)).toEqual(["Ana"]);
    expect(rows.filter((r) => matchesRepresentatives(r, ["Ana", "Caio"])).map((r) => r.representante)).toEqual(["Ana", "Caio"]);
    expect(rows.filter((r) => matchesRepresentatives(r, []))).toHaveLength(3);
  });
  it("seleciona um ou múltiplos meses de 2026 sem incluir outro ano", () => {
    expect(inPeriod(new Set(["2026-1"]), 2026, 1)).toBe(true);
    expect(inPeriod(new Set(["2026-1"]), 2026, 2)).toBe(false);
    expect(inPeriod(new Set(["2026-1", "2026-12"]), 2026, 12)).toBe(true);
    expect(inPeriod(new Set(["2026-1", "2026-12"]), 2025, 12)).toBe(false);
  });
});