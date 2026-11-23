import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { HistoryRow, SalesRow } from "./dashboard-types";
import { composeSupervisorViews, SUPERVISOR_CHOICES, type SupervisorUpload } from "./supervisor-mapping";

async function passwordOk(input: string) {
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().max(200) }).parse(d))
  .handler(async ({ data }) => ({ ok: await passwordOk(data.password) }));

const salesSchema = z.object({
  canal: z.string().max(100), ano: z.number().int().nullable(), supervisor: z.string().max(200),
  gerente: z.string().max(300), representante: z.string().max(300), cliente: z.string().max(300).nullable(),
  familia: z.string().max(300), meta: z.number(), faturamento: z.number(), atingimento: z.number().nullable(), mes_ordem: z.number().int().min(1).max(12).nullable(),
});
const histSchema = z.object({
  canal: z.string().max(100), ano: z.number().int().nullable(), mes: z.string().max(50),
  mes_ordem: z.number().int(), faturamento_liquido: z.number(), meta_restante: z.number(),
  percentual_atingimento: z.number().nullable(),
});

export const uploadDashboardData = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; sales: SalesRow[] | null; history: HistoryRow[] | null; supervisorUploads?: SupervisorUpload[] }) =>
    z.object({
      password: z.string().max(200),
      sales: z.array(salesSchema).min(1).max(50000).nullable(),
      history: z.array(histSchema).max(500).nullable(),
      supervisorUploads: z.array(z.object({ supervisor: z.string().refine((v) => SUPERVISOR_CHOICES.includes(v)), rows: z.array(salesSchema).min(1).max(50000) })).max(5).default([]),
    }).parse(d))
  .handler(async ({ data }) => {
    if (!(await passwordOk(data.password))) return { ok: false as const, error: "Senha incorreta." };
    if (!data.sales && !data.supervisorUploads.length) return { ok: false as const, error: "Selecione a planilha geral ou uma planilha de supervisor." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    if (data.supervisorUploads.length) {
      const { error } = await supabaseAdmin.from("supervisor_uploads").upsert(data.supervisorUploads.map((u) => ({ supervisor: u.supervisor, rows: u.rows, updated_at: now })), { onConflict: "supervisor" });
      if (error) throw new Error("Não foi possível salvar as planilhas de supervisores.");
    }
    if (!data.sales) return { ok: true as const, count: data.supervisorUploads.reduce((s, u) => s + u.rows.length, 0), mappingOnly: true };
    const del = await supabaseAdmin.from("sales_records").delete().not("id", "is", null);
    if (del.error) return { ok: false as const, error: "Falha ao limpar dados antigos." };
    for (let i = 0; i < data.sales.length; i += 1000) {
      const { error } = await supabaseAdmin.from("sales_records").insert(data.sales.slice(i, i + 1000).map((r) => ({ ...r, supervisor: "Sem Supervisor", updated_at: now })));
      if (error) return { ok: false as const, error: "Falha ao gravar registros." };
    }
    if (data.history?.length) {
      const { error: delError } = await supabaseAdmin.from("monthly_history").delete().not("id", "is", null);
      if (delError) return { ok: false as const, error: "Falha ao substituir histórico." };
      const { error } = await supabaseAdmin.from("monthly_history").insert(data.history);
      if (error) return { ok: false as const, error: "Falha ao gravar histórico." };
    }
    const { error } = await supabaseAdmin.from("upload_logs").insert({ updated_at: now, total_meta: data.sales.reduce((s, r) => s + r.meta, 0), total_faturamento: data.sales.reduce((s, r) => s + r.faturamento, 0) });
    if (error) throw new Error("Falha ao registrar atualização.");
    return { ok: true as const, count: data.sales.length, mappingOnly: false };
  });

export const getDashboardData = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
  const sales: SalesRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("sales_records")
      .select("canal, ano, supervisor, gerente, representante, cliente, familia, meta, faturamento, atingimento, mes_ordem")
      .order("id").range(from, from + 999);
    if (error) { console.error(error); break; }
    sales.push(...(data as SalesRow[]).map((r) => ({ ...r, meta: Number(r.meta), faturamento: Number(r.faturamento) })));
    if (!data || data.length < 1000) break;
  }
  const { data: history } = await sb
    .from("monthly_history")
    .select("canal, ano, mes, mes_ordem, faturamento_liquido, meta_restante, percentual_atingimento")
    .order("mes_ordem");
  const { data: log } = await sb.from("upload_logs").select("updated_at").order("updated_at", { ascending: false }).limit(1);
  const { data: snapshots, error: snapshotError } = await sb.from("supervisor_uploads").select("supervisor, rows");
  if (snapshotError) throw new Error("Não foi possível carregar as equipes.");
  const uploads = (snapshots ?? []).map((u) => ({ supervisor: u.supervisor, rows: z.array(salesSchema).parse(u.rows) }));
  const views = composeSupervisorViews(sales, uploads);
  return {
    ...views,
    history: ((history ?? []) as HistoryRow[]).map((h) => ({
      ...h, faturamento_liquido: Number(h.faturamento_liquido), meta_restante: Number(h.meta_restante),
      percentual_atingimento: h.percentual_atingimento == null ? null : Number(h.percentual_atingimento),
    })),
    updatedAt: log?.[0]?.updated_at ?? null,
  };
});
