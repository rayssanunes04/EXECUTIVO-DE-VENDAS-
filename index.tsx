import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BarChart3, Clock, RotateCcw } from "lucide-react";
import { getDashboardData } from "@/lib/dashboard.functions";
import { GERENTE, type SalesRow } from "@/lib/dashboard-types";
import { MAIN_FAMILIES, operationRows, representativeOptions, matchesRepresentatives, inPeriod, PERFORMANCE_OPTIONS, matchesPerformance } from "@/lib/dashboard-filters";
import { monthlyPoints } from "@/lib/dashboard-analytics";
import { Button } from "@/components/ui/button";
import { updatedLabel } from "@/lib/format";
import { ALL, FilterCombo } from "@/components/dashboard/FilterCombo";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { HistoryChart } from "@/components/dashboard/HistoryChart";
import { RepresentativeRanking } from "@/components/dashboard/RepresentativeRanking";
import { DetailTable } from "@/components/dashboard/DetailTable";
import { FamilyTable } from "@/components/dashboard/FamilyTable";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";
import { AdminUpload } from "@/components/dashboard/AdminUpload";
import { SupervisorPerformance } from "@/components/dashboard/SupervisorPerformance";

const dashboardQuery = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboardData() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard Executivo de Vendas | Atingimento de Metas" },
      { name: "description", content: "Meta, faturamento e atingimento por supervisor, gerente, representante e família." },
      { property: "og:title", content: "Dashboard Executivo de Vendas" },
      { property: "og:description", content: "Acompanhamento diário de metas e faturamento da equipe comercial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  component: Dashboard,
});

type F = "supervisor" | "familia" | "cliente";
const empty: Record<F, string> = { supervisor: ALL, familia: ALL, cliente: ALL };
const get = (r: SalesRow, k: F) => String(r[k] ?? "");
const uniq = (rows: SalesRow[], k: F) => [...new Set(rows.map((r) => get(r, k)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const [f, setF] = useState(empty);
  const [representatives, setRepresentatives] = useState<string[]>([]);
  const [period, setPeriod] = useState<Set<string>>(new Set());
  const [performance, setPerformance] = useState(ALL);

  const base = useMemo(() => operationRows(data.sales), [data.sales]);
  const teamBase = useMemo(() => operationRows(data.teamSales), [data.teamSales]);
  const activeBase = f.supervisor === ALL ? base : teamBase;
  const sellers = useMemo(() => representativeOptions(f.supervisor === ALL ? data.sales : data.teamSales, f.supervisor === ALL ? undefined : f.supervisor), [data.sales, data.teamSales, f.supervisor]);
  const years = [2026];
  const byPeriod = useMemo(() => activeBase.filter((r) => inPeriod(period, r.ano, r.mes_ordem)), [activeBase, period]);
  const rows = useMemo(
    () => byPeriod.filter((r) => matchesPerformance(r, performance) && matchesRepresentatives(r, representatives) && (Object.keys(f) as F[]).every((k) => f[k] === ALL || get(r, k) === f[k])),
    [byPeriod, f, representatives, performance],
  );
  const performanceRows = useMemo(() => teamBase.filter((r) => matchesPerformance(r, performance) && inPeriod(period, r.ano, r.mes_ordem) && matchesRepresentatives(r, representatives) && (f.familia === ALL || r.familia === f.familia) && (f.cliente === ALL || r.cliente === f.cliente)), [teamBase, period, representatives, f.familia, f.cliente, performance]);
  const selectSupervisor = (supervisor: string) => { setF((filters) => ({ ...filters, supervisor })); setRepresentatives([]); };
  const options = (k: F) => {
    if (k === "supervisor") return uniq(data.teamSales, "supervisor");
    if (k === "familia") return MAIN_FAMILIES;
    // Options narrow to rows matching the other active filters.
    const others = byPeriod.filter((r) => (Object.keys(f) as F[]).every((o) => o === k || f[o] === ALL || get(r, o) === f[o]));
    return uniq(others, k);
  };

  const meta = rows.reduce((s, r) => s + r.meta, 0);
  const fat = rows.reduce((s, r) => s + r.faturamento, 0);

  const chart = useMemo(() => monthlyPoints(data.history, period), [data.history, period]);

  const hasFilters = performance !== ALL || representatives.length > 0 || period.size > 0 || (Object.values(f) as string[]).some((v) => v !== ALL);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-table-navy text-primary-foreground shadow-card">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Dashboard Executivo de Vendas</h1>
              <p className="flex items-center gap-1.5 text-xs opacity-80"><Clock className="h-3 w-3" />{updatedLabel(data.updatedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-md bg-primary-foreground/10 px-3 py-1.5 text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70">Gerente</p>
              <p className="text-sm font-semibold">{GERENTE}</p>
            </div>
            <AdminUpload />
          </div>
        </div>
      </header>
        <div aria-label="Filtros do painel" className="border-b bg-card">
          <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-2 px-4 py-2.5 md:grid-cols-3 xl:grid-cols-7 lg:px-6">
            <FilterCombo label="Supervisor" value={f.supervisor} options={options("supervisor")} onChange={selectSupervisor} />
            <PeriodFilter years={years} value={period} onChange={setPeriod} />
            <FilterCombo label="Vendedor / Representante" multiple value={representatives} options={sellers} onChange={setRepresentatives} />
            <FilterCombo label="Família" value={f.familia} options={options("familia")} onChange={(v) => setF({ ...f, familia: v })} />
            <FilterCombo label="Cliente" value={f.cliente} options={options("cliente")} onChange={(v) => setF({ ...f, cliente: v })} />
            <FilterCombo label="Status da Meta" value={performance} options={PERFORMANCE_OPTIONS} onChange={setPerformance} />
            <Button variant="outline" onClick={() => { setF(empty); setRepresentatives([]); setPeriod(new Set()); setPerformance(ALL); }} disabled={!hasFilters}
              className="flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm font-medium text-secondary transition-colors hover:bg-accent disabled:opacity-40">
              <RotateCcw className="h-3.5 w-3.5" /> Limpar filtros
            </Button>
          </div>
        </div>

      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 lg:px-6">
        <KpiCards meta={meta} fat={fat} />
        <SupervisorPerformance rows={performanceRows} selected={f.supervisor} onSelect={selectSupervisor} />
        <HistoryChart data={chart} />
        <RepresentativeRanking rows={rows} />
        <div className="flex flex-col gap-5">
          <DetailTable rows={rows} />
          <FamilyTable rows={rows} />
        </div>
      </main>
    </div>
  );
}
