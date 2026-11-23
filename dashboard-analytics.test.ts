import { describe, expect, it } from "vitest";
import { matchesPerformance } from "@/lib/dashboard-filters";
import { monthlyPoints, topRepresentatives } from "@/lib/dashboard-analytics";
import type { SalesRow } from "@/lib/dashboard-types";

describe("Status da Meta", () => {
  it("Meta Batida inclui 100% e acima, não 99,99%", () => {
    expect(matchesPerformance({ meta: 100, faturamento: 100 }, "Meta Batida (≥ 100%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 120 }, "Meta Batida (≥ 100%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 99.99 }, "Meta Batida (≥ 100%)")).toBe(false);
  });
  it("Em Atenção vai de 80% até abaixo de 100%", () => {
    expect(matchesPerformance({ meta: 100, faturamento: 80 }, "Em Atenção (80% a 99%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 99.99 }, "Em Atenção (80% a 99%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 100 }, "Em Atenção (80% a 99%)")).toBe(false);
    expect(matchesPerformance({ meta: 100, faturamento: 79.99 }, "Em Atenção (80% a 99%)")).toBe(false);
  });
  it("Crítico inclui valores abaixo de 80%, mas não sem meta", () => {
    expect(matchesPerformance({ meta: 100, faturamento: 79.99 }, "Crítico (< 80%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: -10 }, "Crítico (< 80%)")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 80 }, "Crítico (< 80%)")).toBe(false);
    expect(matchesPerformance({ meta: 0, faturamento: 10 }, "Crítico (< 80%)")).toBe(false);
  });
  it("Sem Meta seleciona somente meta igual a R$ 0", () => {
    expect(matchesPerformance({ meta: 0, faturamento: 50 }, "Sem Meta (R$ 0)")).toBe(true);
    expect(matchesPerformance({ meta: 1, faturamento: 0 }, "Sem Meta (R$ 0)")).toBe(false);
  });
  it("Todos preserva todas as linhas", () => {
    expect(matchesPerformance({ meta: 0, faturamento: 50 }, "__all__")).toBe(true);
    expect(matchesPerformance({ meta: 100, faturamento: 50 }, "__all__")).toBe(true);
  });
});
describe("Gráficos analíticos", () => {
  it("compara faturamento com a Meta da planilha sem somar faturamento à meta", () => {
    const points = monthlyPoints([{ canal: "GERAL", ano: 2026, mes: "Janeiro", mes_ordem: 1, faturamento_liquido: 80, meta_restante: 100, percentual_atingimento: 0.8 }], new Set());
    expect(points).toHaveLength(12);
    expect(points[0]).toMatchObject({ fat: 80, meta: 100, pct: 0.8, available: true });
    expect(points[1]?.available).toBe(false);
    expect(monthlyPoints([], new Set(["2026-2"])).map((point) => point.label)).toEqual(["Fev"]);
  });
  it("agrupa famílias do representante e limita ranking aos dez maiores faturamentos", () => {
    const row = (name: string, fat: number): SalesRow => ({ canal: "GERAL", ano: 2026, mes_ordem: 1, supervisor: "KAM", gerente: "R35 - FERNANDO E.", representante: name, cliente: null, familia: "BB - BABY", meta: 100, faturamento: fat, atingimento: null });
    const rows = Array.from({ length: 12 }, (_, i) => row(`Rep ${i}`, i * 10));
    rows.push(row("Rep 0", 200));
    const ranking = topRepresentatives(rows);
    expect(ranking).toHaveLength(10);
    expect(ranking[0]).toEqual({ name: "Rep 0", fat: 200, meta: 200 });
    expect(ranking.some((entry) => entry.name === "Rep 1")).toBe(false);
  });
});