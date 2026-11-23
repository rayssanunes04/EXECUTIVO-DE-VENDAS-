import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { compact, money, pct } from "@/lib/format";
import type { MonthlyPoint } from "@/lib/dashboard-analytics";

function PctBadge(props: { x?: number; y?: number; width?: number; value?: number | null }) {
  const { x = 0, y = 0, width = 0, value } = props;
  if (value == null) return null;
  const text = pct(value, 1);
  const w = text.length * 6.6 + 12;
  const positive = value >= 1;
  return <g>
    <rect x={x + width / 2 - w / 2} y={y - 42} width={w} height={18} rx={9} fill={positive ? "var(--attainment-positive)" : "var(--attainment-negative)"} />
    <text x={x + width / 2} y={y - 29} textAnchor="middle" fontSize={11} fontWeight={600} fill={positive ? "var(--attainment-positive-foreground)" : "var(--attainment-negative-foreground)"}>{text}</text>
  </g>;
}

export function HistoryChart({ data }: { data: MonthlyPoint[] }) {
  return <section aria-label="Histórico de Atingimento de Meta" className="min-w-0 rounded-lg border bg-card p-5 shadow-card">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-base font-bold text-table-navy">Histórico de Atingimento de Meta</h2><p className="mt-1 text-xs text-muted-foreground">Consolidado geral · Histórico Mensal</p></div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-table-progress" />Faturamento Líquido</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-table-border" />Meta</span>
      </div>
    </div>
    {!data.some((point) => point.available) ? <p className="py-20 text-center text-sm text-muted-foreground">Sem histórico mensal para o período selecionado.</p> : <div className="overflow-x-auto">
      <div className="h-[340px] min-w-[960px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 55, right: 30, left: 0, bottom: 0 }} barGap={3}>
            <CartesianGrid vertical={false} stroke="var(--table-border)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} interval={0} tick={{ fill: "var(--muted-foreground)" }} />
            <YAxis tickFormatter={compact} tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} width={52} />
            <Tooltip formatter={(value: number, name: string) => [money(value), name === "fat" ? "Faturamento Líquido" : "Meta"]} contentStyle={{ background: "var(--card)", color: "var(--foreground)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
            <Bar dataKey="fat" fill="var(--table-progress)" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="fat" position="top" formatter={(value: number) => value ? compact(value) : ""} fontSize={10} fill="var(--table-navy)" />
            </Bar>
            <Bar dataKey="meta" fill="var(--table-border)" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey="pct" content={(props) => <PctBadge {...(props as object)} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>}
  </section>;
}