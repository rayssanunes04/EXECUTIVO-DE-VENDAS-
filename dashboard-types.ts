export type SalesRow = {
  canal: string;
  ano: number | null;
  supervisor: string;
  gerente: string;
  representante: string;
  cliente: string | null;
  familia: string;
  meta: number;
  faturamento: number;
  atingimento: number | null;
  mes_ordem: number | null;
};

export type HistoryRow = {
  canal: string;
  ano: number | null;
  mes: string;
  mes_ordem: number;
  faturamento_liquido: number;
  meta_restante: number;
  percentual_atingimento: number | null;
};

export const SUPERVISORS = [
  "ALMIR NETO",
  "FERNANDO NOGUCHI",
  "KAM",
  "PATRICIA CARDOSO",
  "SHEYLA MACEDO",
] as const;

export const GERENTE = "R35 - FERNANDO E.";
export const CANAL_GERAL = "GERAL";
export const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export const NO_SUPERVISOR = "Sem Supervisor / Geral";
