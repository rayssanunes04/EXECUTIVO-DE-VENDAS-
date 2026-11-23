import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseMain, parseHistory, parseSupervisorMap } from "@/lib/excel-parse";
import { composeSupervisorViews, assignSupervisorMappings, mergeSupervisorMappings, supervisorTotals, representativeKey, SUPERVISOR_CHOICES } from "@/lib/supervisor-mapping";

function file(grid: unknown[][]) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(grid), "Sheet1");
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return { name: "Atingimento - Kids.xlsx", arrayBuffer: async () => bytes } as File;
}
const main = () => file([["Filtros aplicados: Ano 2026"], [], ["Gerente", "Representante", "Cod Desc Familia", "Meta", "Faturamento", "Atingimento"], ["R35 - FERNANDO E.", "  João   Silva ", "BB - BABY", 100, -25, -0.25], ["R35 - FERNANDO E.", "Bia", "BR - BRINQUEDOS", 200, 150, 0.75], ["Total", null, null, 300, 125], []]);

describe("Cadastro permanente de supervisores", () => {
  it("planilhas individuais não aumentam Meta ou Faturamento da geral", async () => {
    const { rows } = await parseMain(main());
    const individual = await parseSupervisorMap(file([["Representante", "Meta", "Faturamento"], ["João Silva", 999999, 999999], ["João Silva", 999999, 999999]]));
    const mappings = mergeSupervisorMappings([...individual.reps].map((representante) => ({ representante, supervisor: "KAM" })));
    const result = assignSupervisorMappings(rows, mappings);
    expect(mappings).toHaveLength(1);
    expect(result.reduce((sum, r) => sum + r.meta, 0)).toBe(300);
    expect(result.reduce((sum, r) => sum + r.faturamento, 0)).toBe(125);
  });
  it("permite representante em duas planilhas de supervisores diferentes", () => {
    expect(mergeSupervisorMappings([{ representante: "João Silva", supervisor: "KAM" }, { representante: "JOAO SILVA", supervisor: "ALMIR NETO" }])).toHaveLength(2);
  });
  it("vincula Gustavo por representante e família sem misturar as equipes", async () => {
    const { rows } = await parseMain(main());
    const baby = { ...rows[0], representante: "Gustavo", familia: "BB - BABY", meta: 100, faturamento: 60 } as typeof rows[number];
    const toys = { ...baby, familia: "BR - BRINQUEDOS", meta: 200, faturamento: 80 };
    const views = composeSupervisorViews([baby, toys], [{ supervisor: "KAM", rows: [baby] }, { supervisor: "ALMIR NETO", rows: [toys] }]);
    expect(views.sales.map((r) => r.supervisor)).toEqual(["KAM", "ALMIR NETO"]);
    expect(views.teamSales.reduce((s, r) => s + r.meta, 0)).toBe(300);
  });
  it("usa valores exatos individuais no empate de família sem somar à geral", async () => {
    const { rows } = await parseMain(main());
    const general = { ...rows[0], representante: "Gustavo", meta: 300, faturamento: 150 } as typeof rows[number];
    const views = composeSupervisorViews([general], [{ supervisor: "KAM", rows: [{ ...general, cliente: "A", meta: 100, faturamento: 40 }] }, { supervisor: "ALMIR NETO", rows: [{ ...general, cliente: "B", meta: 200, faturamento: 110 }] }]);
    expect(views.sales).toHaveLength(1);
    expect(views.sales[0]).toMatchObject({ meta: 300, faturamento: 150 });
    expect(views.teamSales.map((r) => [r.supervisor, r.cliente, r.meta, r.faturamento])).toEqual([["KAM", "A", 100, 40], ["ALMIR NETO", "B", 200, 110]]);
  });
  it("não adiciona linhas individuais à geral mesmo se as equipes tiverem totais divergentes", async () => {
    const { rows } = await parseMain(main());
    const general = { ...rows[0], representante: "Gustavo", meta: 100, faturamento: -25 } as typeof rows[number];
    const views = composeSupervisorViews([general], [{ supervisor: "KAM", rows: [{ ...general, meta: 80, faturamento: 60 }] }, { supervisor: "ALMIR NETO", rows: [{ ...general, meta: 90, faturamento: 70 }] }]);
    expect(views.sales.reduce((s, r) => s + r.meta, 0)).toBe(100);
    expect(views.sales.reduce((s, r) => s + r.faturamento, 0)).toBe(-25);
  });
  it("calcula Meta, Faturamento e Gap por supervisor usando só linhas gerais", async () => {
    const { rows } = await parseMain(main());
    const totals = supervisorTotals(assignSupervisorMappings(rows, [{ representante: "João Silva", representante_key: "JOAO SILVA", supervisor: "KAM" }]));
    expect(totals.find((t) => t.supervisor === "KAM")).toMatchObject({ meta: 100, faturamento: -25, atingimento: -0.25, gap: -125, achieved: false });
    expect(totals.find((t) => t.supervisor === "Sem Supervisor")).toMatchObject({ meta: 200, faturamento: 150, gap: -50 });
  });
  it("considera atingimento de exatamente 100% como meta batida", async () => {
    const { rows } = await parseMain(main());
    const totals = supervisorTotals(rows.map((r) => ({ ...r, supervisor: "KAM", faturamento: r.meta })));
    expect(totals.find((t) => t.supervisor === "KAM")).toMatchObject({ atingimento: 1, gap: 0, achieved: true });
  });
  it("lê Sheet1 após filtros e linha vazia, sem Total", async () => {
    const { rows } = await parseMain(main());
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.meta)).toEqual([100, 200]);
  });
  it("cruza representantes normalizados e preserva todos os valores financeiros", async () => {
    const { rows } = await parseMain(main());
    const mapped = assignSupervisorMappings(rows, [{ representante: "JOAO SILVA", representante_key: representativeKey("JOAO SILVA"), supervisor: "ALMIR NETO" }]);
    expect(mapped[0]?.supervisor).toBe("ALMIR NETO");
    expect(mapped.map(({ supervisor, ...rest }) => rest)).toEqual(rows.map(({ supervisor, ...rest }) => rest));
  });
  it("preenche Sem Supervisor quando não há vínculo, mesmo com nome na principal", async () => {
    const { rows } = await parseMain(main());
    expect(assignSupervisorMappings([{ ...rows[0], supervisor: "KAM" } as typeof rows[number]], [])[0]?.supervisor).toBe("Sem Supervisor");
  });
  it("cadastro individual extrai somente representantes únicos, não valores", async () => {
    const { reps } = await parseSupervisorMap(main());
    expect([...reps]).toEqual(["JOAO SILVA", "BIA"]);
  });
  it("histórico localiza cabeçalho real e descarta rodapé", async () => {
    const result = await parseHistory(file([["Filtros aplicados: 2026"], [], ["Date - Ano", "Date - Mês", "Faturamento Líquido", "Meta", "% de Atingimento"], [2026, "Janeiro", 50, 100, 0.5], ["Total", null, 999, 999], [], ["Filtros aplicados: 2026"]]), "GERAL");
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ ano: 2026, mes_ordem: 1, faturamento_liquido: 50 });
  });
  it("permite apenas os cinco supervisores e Sem Supervisor", () => {
    expect(SUPERVISOR_CHOICES).toEqual(["ALMIR NETO", "FERNANDO NOGUCHI", "KAM", "PATRICIA CARDOSO", "SHEYLA MACEDO", "Sem Supervisor"]);
  });
});