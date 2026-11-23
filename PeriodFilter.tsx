import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { MESES } from "@/lib/dashboard-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** Selected keys are "ano-mes" (e.g. "2026-3"). Empty set = Todos. */
export function PeriodFilter({ years, value, onChange }: {
  years: number[]; value: Set<string>; onChange: (v: Set<string>) => void;
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const keys = (y: number) => MESES.map((_, i) => `${y}-${i + 1}`);
  const toggle = (ks: string[], on: boolean) => {
    const n = new Set(value);
    ks.forEach((k) => (on ? n.add(k) : n.delete(k)));
    onChange(n);
  };
  const label = value.size === 0 ? "Todos" : (() => {
    const full = years.filter((y) => keys(y).every((k) => value.has(k)));
    if (full.length && value.size === full.length * 12) return full.join(", ");
    return value.size === 1 ? (() => { const [y, m] = ([...value][0] ?? "").split("-"); return `${MONTH_NAMES[Number(m) - 1]}/${y}`; })() : `${value.size} meses`;
  })();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Período" className={cn("flex h-10 w-full min-w-0 flex-col justify-center rounded-md border bg-card px-3 text-left transition-colors hover:border-secondary", value.size > 0 && "border-secondary ring-1 ring-secondary/30")}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Período</span>
          <span className="flex items-center justify-between gap-1 text-sm font-medium text-foreground">
            <span className="truncate">{label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
          <Checkbox checked={value.size === 0} onCheckedChange={() => onChange(new Set())} /> Todos
        </label>
        {years.map((y) => {
          const ks = keys(y);
          const n = ks.filter((k) => value.has(k)).length;
          const expanded = open[y] ?? true;
          return (
            <div key={y}>
              <div className="flex items-center gap-1 rounded px-1 py-1 hover:bg-accent">
                <Button variant="ghost" size="icon" onClick={() => setOpen((o) => ({ ...o, [y]: !expanded }))} className="h-6 w-6 p-0.5 text-muted-foreground" aria-label={`Expandir ${y}`}>
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
                <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-semibold">
                  <Checkbox checked={n === 12 ? true : n > 0 ? "indeterminate" : false} onCheckedChange={() => toggle(ks, n !== 12)} />
                  {y}
                </label>
              </div>
              {expanded && (
                <div className="ml-7 grid grid-cols-1 gap-x-2">
                  {ks.map((k, i) => (
                    <label key={k} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
                      <Checkbox checked={value.has(k)} onCheckedChange={(c) => toggle([k], c === true)} /> {MONTH_NAMES[i]}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
