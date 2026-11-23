import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadDashboardData, verifyAdmin } from "@/lib/dashboard.functions";
import { parseHistory, parseMain } from "@/lib/excel-parse";
import { SUPERVISORS, CANAL_GERAL } from "@/lib/dashboard-types";

function FileField({ label, hint, required, file, onChange }: {
  label: string; hint?: string; required?: boolean; file: File | null; onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed bg-muted/50 px-3 py-2.5 transition-colors hover:border-secondary">
      <FileSpreadsheet className="h-5 w-5 shrink-0 text-secondary" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{file ? file.name : hint ?? "Selecionar .xlsx / .csv"}</span>
      </span>
      <input aria-label={label} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

export function AdminUpload() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [main, setMain] = useState<File | null>(null);
  const [hist, setHist] = useState<File | null>(null);
  const [supervisorFiles, setSupervisorFiles] = useState<Record<string, File | null>>({});
  const verify = useServerFn(verifyAdmin);
  const upload = useServerFn(uploadDashboardData);
  const qc = useQueryClient();

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { ok } = await verify({ data: { password } });
      if (ok) setUnlocked(true); else toast.error("Senha incorreta.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  }

  async function send() {
    if (!main && !Object.values(supervisorFiles).some(Boolean)) { toast.error("Selecione a planilha geral ou uma planilha de supervisor."); return; }
    setBusy(true);
    try {
      const parsed = main ? await parseMain(main) : null;
      const history = hist && main ? await parseHistory(hist, CANAL_GERAL) : null;
      const uploadGroups = await Promise.all(SUPERVISORS.map(async (supervisor) => {
        const file = supervisorFiles[supervisor];
        if (!file) return null;
        const { rows } = await parseMain(file);
        if (!rows.length) throw new Error(`Nenhuma linha encontrada em ${supervisor}.`);
        return { supervisor, rows };
      }));
      const supervisorUploads = uploadGroups.filter((u) => u !== null);
      const res = await upload({ data: { password, sales: parsed?.rows ?? null, history, supervisorUploads } });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(res.mappingOnly ? `${res.count} vínculos atualizados; valores da base geral preservados.` : `${res.count} linhas atualizadas.`);
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false); setUnlocked(false); setPassword(""); setMain(null); setHist(null); setSupervisorFiles({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar planilhas.");
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setUnlocked(false); setPassword(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Lock className="h-3.5 w-3.5" /> Atualizar Dados (Admin)
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto sm:max-w-2xl [&>div]:min-w-0 [&>form]:min-w-0">
        {!unlocked ? (
          <form onSubmit={unlock} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-primary">Área do Administrador</DialogTitle>
              <DialogDescription>Digite a senha para enviar as planilhas do dia.</DialogDescription>
            </DialogHeader>
            <Input type="password" autoFocus placeholder="Senha de Administrador" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-primary">Atualizar Dados (Admin)</DialogTitle>
              <DialogDescription>{main ? "A planilha geral substituirá os valores atuais." : "Envios somente de supervisores preservam os valores da base geral."}</DialogDescription>
            </DialogHeader>
            <FileField label="Planilha Geral" hint="Atingimento - Kids.xlsx · Geral · valores financeiros oficiais" required file={main} onChange={setMain} />
            <FileField label="Histórico Mensal" hint="Histórico de Atingimento de Meta.xlsx · Geral (opcional)" file={hist} onChange={setHist} />
            {SUPERVISORS.map((supervisor) => <FileField key={supervisor} label={`Planilha Supervisor: ${supervisor}`} hint={`Atingimento - Kids.xlsx · filtrado para ${supervisor}`} file={supervisorFiles[supervisor] ?? null} onChange={(file) => setSupervisorFiles((files) => ({ ...files, [supervisor]: file }))} />)}
            <Button className="w-full" onClick={send} disabled={busy || (!main && !Object.values(supervisorFiles).some(Boolean))}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Processar e publicar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
