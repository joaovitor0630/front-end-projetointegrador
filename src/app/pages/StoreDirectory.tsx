import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  Store,
  Phone,
  Mail,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
  Building,
  HardHat,
  Flame,
  ClipboardCheck,
  Gavel,
  GitBranch,
  Activity,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Link2,
  Download,
} from "lucide-react";
import { useRecords, STORES_INFO, OpRecord, Area, RecordKind, getStoreSituation } from "../recordsStore";

const AREA_ICONS: Record<Area, typeof Building> = { Arquitetura: Building, Engenharia: HardHat, Brigada: Flame };
const AREA_BG: Record<Area, string> = { Arquitetura: "bg-[#FFF0E0] text-[#7A3A00]", Engenharia: "bg-[#E3ECF8] text-[#1B3A6B]", Brigada: "bg-[#FBE4E4] text-[#8B1A1A]" };
const KIND_ICON: Record<RecordKind, typeof ClipboardCheck> = {
  vistoria: ClipboardCheck,
  multa: Gavel,
  interacao: GitBranch,
  notificacao: AlertCircle,
  documento: FileText,
};
const KIND_LABEL: Record<RecordKind, string> = {
  vistoria: "Vistoria",
  multa: "Multa",
  interacao: "Processo",
  notificacao: "Notificação",
  documento: "Documento",
};

const SITUATION_STYLES = {
  healthy: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: ShieldCheck, title: "Regular" },
  attention: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: AlertTriangle, title: "Atenção" },
  critical: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: AlertCircle, title: "Crítico" },
};

function formatBRL(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDate(s: string) { return new Date(s).toLocaleDateString("pt-BR"); }

function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function exportStoreReport(
  info: typeof STORES_INFO[0],
  records: OpRecord[],
  situation: ReturnType<typeof getStoreSituation>,
  conformity: "Conforme" | "Não Conforme",
) {
  const rowsHtml = records.length
    ? records.map((r) => `
        <tr>
          <td>${formatDate(r.date)}</td>
          <td>${KIND_LABEL[r.kind]}</td>
          <td>${escapeHtml(r.area)}</td>
          <td>${escapeHtml(r.title)}</td>
          <td>${escapeHtml(r.status)}</td>
          <td style="text-align:right">${r.amount ? formatBRL(r.amount) : "—"}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;color:#999;padding:16px">Nenhuma ocorrência registrada.</td></tr>`;

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8" />
<title>Relatório do Lojista — ${escapeHtml(info.name)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #222; margin: 32px; }
  h1 { color: #8B1A1A; margin: 0 0 4px; font-size: 22px; }
  h2 { font-size: 14px; margin: 24px 0 8px; color: #555; text-transform: uppercase; letter-spacing: .08em; }
  .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
  .badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:11px; font-weight:700; border:1px solid; }
  .ok { background:#ecfdf5; color:#047857; border-color:#a7f3d0; }
  .bad { background:#fef2f2; color:#b91c1c; border-color:#fecaca; }
  .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; font-size: 13px; }
  .grid div b { color:#555; font-weight:600; margin-right:4px; }
  .summary { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-top:8px; }
  .tile { border:1px solid #eee; border-radius:10px; padding:12px; text-align:center; }
  .tile .v { font-size:20px; font-weight:700; }
  .tile .l { font-size:10px; text-transform:uppercase; color:#888; letter-spacing:.08em; }
  table { width:100%; border-collapse: collapse; font-size: 12px; margin-top:8px; }
  th, td { border-bottom: 1px solid #eee; padding: 6px 8px; text-align:left; }
  th { background:#FAF7F2; font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:#555; }
  .footer { margin-top: 32px; font-size: 11px; color: #888; }
  @media print { body { margin: 16mm; } }
</style></head>
<body>
  <h1>${escapeHtml(info.name)}</h1>
  <div class="meta">
    ${escapeHtml(info.segment)} · LUC ${escapeHtml(info.luc)} · Piso ${escapeHtml(info.piso)}
    &nbsp;·&nbsp; <span class="badge ${conformity === "Conforme" ? "ok" : "bad"}">${conformity}</span>
  </div>

  <h2>Contato</h2>
  <div class="grid">
    <div><b>Telefone:</b>${escapeHtml(info.phone)}</div>
    <div><b>E-mail:</b>${escapeHtml(info.email)}</div>
    <div><b>Operando desde:</b>${formatDate(info.sinceOpened)}</div>
    <div><b>Apólice:</b>${info.policyActive ? "Regular" : "Vencida"}</div>
  </div>

  <h2>Situação</h2>
  <div class="grid">
    <div><b>Nível:</b>${situation.level === "healthy" ? "Regular" : situation.level === "attention" ? "Atenção" : "Crítico"}</div>
    <div><b>Multas em aberto:</b>${situation.openFinesCount} (${formatBRL(situation.openFines)})</div>
    <div><b>Processos ativos:</b>${situation.activeProcesses}</div>
    <div><b>Vistorias reprovadas:</b>${situation.failedInspections}</div>
  </div>

  <h2>Histórico de Ocorrências (${records.length})</h2>
  <table>
    <thead><tr>
      <th>Data</th><th>Tipo</th><th>Área</th><th>Título</th><th>Status</th><th style="text-align:right">Valor</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">Gerado em ${new Date().toLocaleString("pt-BR")} · Documento interno · Não constitui notificação ao lojista.</div>
  <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (!w) {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${info.name.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click(); URL.revokeObjectURL(url);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function StoreDirectory() {
  const records = useRecords();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"todos" | "healthy" | "attention" | "critical">("todos");
  const [selected, setSelected] = useState<string | null>(null);

  const storesWithData = useMemo(() => {
    return STORES_INFO.map((info) => {
      const situation = getStoreSituation(info.name);
      const storeRecords = records.filter((r) => r.store === info.name);
      return { info, situation, count: storeRecords.length };
    });
  }, [records]);

  const filtered = useMemo(() => {
    return storesWithData.filter((s) => {
      if (levelFilter !== "todos" && s.situation.level !== levelFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return s.info.name.toLowerCase().includes(q) || s.info.luc.toLowerCase().includes(q) || s.info.segment.toLowerCase().includes(q);
      }
      return true;
    });
  }, [storesWithData, levelFilter, query]);

  const totals = useMemo(() => {
    return {
      total: storesWithData.length,
      healthy: storesWithData.filter((s) => s.situation.level === "healthy").length,
      attention: storesWithData.filter((s) => s.situation.level === "attention").length,
      critical: storesWithData.filter((s) => s.situation.level === "critical").length,
      openFines: storesWithData.reduce((sum, s) => sum + s.situation.openFines, 0),
    };
  }, [storesWithData]);

  const selectedStoreRecords = useMemo(() => {
    if (!selected) return [];
    return records.filter((r) => r.store === selected).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selected, records]);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#6e150e]">Lojas & Situação</h1>
          <p className="text-gray-500 text-sm mt-1">Panorama consolidado por lojista — histórico, processos e pendências operacionais.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar loja, LUC ou segmento..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
          />
        </div>
      </div>

      {/* Situation KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total de Lojas" value={String(totals.total)} icon={Store} accent="bg-[#FAF7F2] text-[#8B1A1A]" />
        <KpiCard label="Críticas" value={String(totals.critical)} icon={AlertCircle} accent="bg-red-50 text-red-700" />
        <KpiCard label="Em Atenção" value={String(totals.attention)} icon={AlertTriangle} accent="bg-amber-50 text-amber-700" />
        <KpiCard label="Multas em Aberto" value={formatBRL(totals.openFines)} icon={Gavel} accent="bg-[#FAF7F2] text-[#8B1A1A]" small />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {([
          { id: "todos", label: "Todas", count: totals.total },
          { id: "critical", label: "Críticas", count: totals.critical },
          { id: "attention", label: "Atenção", count: totals.attention },
          { id: "healthy", label: "Regulares", count: totals.healthy },
        ] as const).map((f) => {
          const active = levelFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setLevelFilter(f.id)}
              className={`whitespace-nowrap inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold border-2 transition-all ${active ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? "bg-white/20" : "bg-gray-100 text-gray-600"}`}>{f.count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(({ info, situation }) => (
          <StoreCard key={info.name} info={info} situation={situation} onOpen={() => setSelected(info.name)} />
        ))}
        {filtered.length === 0 && <div className="col-span-full p-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">Nenhuma loja encontrada.</div>}
      </div>

      <AnimatePresence>
        {selected && (
          <StoreDrawer
            info={STORES_INFO.find((s) => s.name === selected)!}
            records={selectedStoreRecords}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, small }: { label: string; value: string; icon: typeof Store; accent: string; small?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${accent}`}><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <div className={`font-bold text-gray-900 truncate ${small ? "text-sm md:text-base" : "text-lg"}`}>{value}</div>
      </div>
    </div>
  );
}

function StoreCard({ info, situation, onOpen }: { info: typeof STORES_INFO[0]; situation: ReturnType<typeof getStoreSituation>; onOpen: () => void }) {
  const S = SITUATION_STYLES[situation.level];
  const SIcon = S.icon;
  return (
    <button
      onClick={onOpen}
      className="text-left bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#8B1A1A]/30 transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-11 h-11 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#8B1A1A]">
          <Store className="w-5 h-5" />
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${S.bg} ${S.text} ${S.border}`}>
          <SIcon className="w-3.5 h-3.5" /> {S.title}
        </div>
      </div>
      <h3 className="font-bold text-gray-900 truncate">{info.name}</h3>
      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> {info.luc} · {info.segment}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Multas</div>
          <div className="text-sm font-bold text-[#8B1A1A]">{situation.openFinesCount}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Processos</div>
          <div className="text-sm font-bold text-amber-600">{situation.activeProcesses}</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Reprov.</div>
          <div className="text-sm font-bold text-red-600">{situation.failedInspections}</div>
        </div>
      </div>

      {situation.openFines > 0 && (
        <div className="mt-3 text-[11px] text-[#8B1A1A] font-bold flex items-center gap-1">
          <Gavel className="w-3 h-3" /> {formatBRL(situation.openFines)} em aberto
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#8B1A1A] group-hover:gap-2 transition-all">
        <span>Ver histórico completo</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export function StoreConformityDrawer({ storeName, records, onClose }: { storeName: string; records: OpRecord[]; onClose: () => void }) {
  const info = STORES_INFO.find((s) => s.name === storeName);
  if (!info) return null;
  const storeRecords = records.filter((r) => r.store === storeName).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return <StoreDrawer info={info} records={storeRecords} onClose={onClose} />;
}

function StoreDrawer({ info, records, onClose }: { info: typeof STORES_INFO[0]; records: OpRecord[]; onClose: () => void }) {
  const situation = getStoreSituation(info.name);
  const S = SITUATION_STYLES[situation.level];
  const SIcon = S.icon;
  const conformity: "Conforme" | "Não Conforme" = situation.level === "healthy" && info.policyActive ? "Conforme" : "Não Conforme";
  const isConforme = conformity === "Conforme";
  const [tab, setTab] = useState<"resumo" | "historico" | "contato">("resumo");

  const byKind = useMemo(() => {
    const counts: Record<string, number> = { vistoria: 0, multa: 0, interacao: 0 };
    records.forEach((r) => { counts[r.kind] = (counts[r.kind] || 0) + 1; });
    return counts;
  }, [records]);

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-black/40 flex items-start justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-[#FAF7F2]">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#8B1A1A] shadow-sm shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{info.name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isConforme ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {isConforme ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />} {conformity}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{info.segment} · LUC {info.luc} · Piso {info.piso}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full shrink-0"><X className="w-5 h-5" /></button>
          </div>

          <div className={`p-3 rounded-xl flex items-start gap-3 border ${S.bg} ${S.border}`}>
            <SIcon className={`w-5 h-5 ${S.text} mt-0.5 shrink-0`} />
            <div className="flex-1">
              <div className={`text-sm font-bold ${S.text}`}>Situação: {S.title}</div>
              <div className="text-xs text-gray-600 mt-0.5">
                {situation.openFinesCount > 0 && `${situation.openFinesCount} multa(s) em aberto · `}
                {situation.activeProcesses > 0 && `${situation.activeProcesses} processo(s) em curso · `}
                {situation.failedInspections > 0 && `${situation.failedInspections} vistoria(s) reprovada(s)`}
                {situation.level === "healthy" && "Nenhuma pendência relevante."}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
          {([
            { id: "resumo", label: "Resumo", icon: TrendingUp },
            { id: "historico", label: `Histórico (${records.length})`, icon: Activity },
            { id: "contato", label: "Contato", icon: Phone },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs md:text-sm font-bold border-b-2 transition-all ${active ? "border-[#8B1A1A] text-[#8B1A1A] bg-[#FAF7F2]/50" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {tab === "resumo" && (
              <motion.div
                key="resumo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="space-y-5"
              >
                <div className="grid grid-cols-3 gap-2">
                  <SummaryTile label="Vistorias" value={byKind.vistoria || 0} color="text-[#1B3A6B] bg-[#E3ECF8]" icon={ClipboardCheck} />
                  <SummaryTile label="Multas" value={byKind.multa || 0} color="text-[#8B1A1A] bg-[#FBE4E4]" icon={Gavel} />
                  <SummaryTile label="Processos" value={byKind.interacao || 0} color="text-[#7A3A00] bg-[#FFF0E0]" icon={GitBranch} />
                </div>

                {situation.openFines > 0 && (
                  <div className="bg-white rounded-2xl border border-[#8B1A1A]/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#6e150e] mb-1"><Gavel className="w-4 h-4" /> Multas em Aberto</div>
                    <div className="text-2xl font-bold text-[#8B1A1A]">{formatBRL(situation.openFines)}</div>
                    <div className="text-xs text-gray-500 mt-1">{situation.openFinesCount} registro(s) pendente(s) de pagamento</div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Últimas ocorrências</h4>
                  <div className="space-y-2">
                    {records.slice(0, 5).map((r) => <TimelineItem key={r.id} record={r} />)}
                    {records.length === 0 && <p className="text-sm text-gray-400 italic">Nenhuma ocorrência registrada.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === "historico" && (
              <motion.div
                key="historico"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="space-y-2"
              >
                {records.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Activity className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-sm">Nenhuma ocorrência registrada para esta loja.</p>
                  </div>
                ) : (
                  records.map((r) => <TimelineItem key={r.id} record={r} detailed />)
                )}
              </motion.div>
            )}

            {tab === "contato" && (
              <motion.div
                key="contato"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="space-y-3"
              >
                <InfoRow icon={MapPin} label="Unidade" value={`${info.luc} · Piso ${info.piso}`} />
                <InfoRow icon={Store} label="Segmento" value={info.segment} />
                <InfoRow icon={Phone} label="Telefone / WhatsApp" value={info.phone} />
                <InfoRow icon={Mail} label="E-mail" value={info.email} />
                <InfoRow icon={Calendar} label="Operando desde" value={formatDate(info.sinceOpened)} />
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${info.policyActive ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                  {info.policyActive ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-600 mt-0.5" />}
                  <div>
                    <div className={`text-sm font-bold ${info.policyActive ? "text-emerald-800" : "text-red-800"}`}>
                      {info.policyActive ? "Apólice de Seguro Regular" : "Apólice Vencida"}
                    </div>
                    <div className={`text-xs mt-0.5 ${info.policyActive ? "text-emerald-700" : "text-red-700"}`}>
                      {info.policyActive ? "Lojista em conformidade contratual." : "Notificar para regularização imediata."}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0">
          <button
            onClick={() => exportStoreReport(info, records, situation, conformity)}
            className="w-full bg-[#8B1A1A] text-white py-3 rounded-xl font-bold hover:bg-[#a43030] transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Relatório
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SummaryTile({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof ClipboardCheck }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 text-center">
      <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-2 ${color}`}><Icon className="w-4 h-4" /></div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TimelineItem({ record, detailed }: { record: OpRecord; detailed?: boolean }) {
  const AreaIcon = AREA_ICONS[record.area];
  const KindIcon = KIND_ICON[record.kind];
  const status = record.result || record.status;
  return (
    <div className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#8B1A1A]/30 transition-all">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${AREA_BG[record.area]}`}>
        <AreaIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8B1A1A] mb-0.5">
          <KindIcon className="w-3 h-3" /> {KIND_LABEL[record.kind]} · #{record.id}
          {record.linkedRecordIds && record.linkedRecordIds.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-gray-500"><Link2 className="w-3 h-3" />{record.linkedRecordIds.length}</span>
          )}
        </div>
        <div className="text-sm font-bold text-gray-900 truncate">{record.subject}</div>
        <div className="flex items-center justify-between mt-1 gap-2">
          <div className="text-[11px] text-gray-500">{formatDate(record.date)} · {record.author}</div>
          <div className="flex items-center gap-2">
            {record.amount !== undefined && <span className="text-[11px] font-bold text-[#8B1A1A]">{formatBRL(record.amount)}</span>}
            {status && <StatusMini value={status} />}
          </div>
        </div>
        {detailed && record.details && (
          <div className="mt-2 text-xs text-gray-600 line-clamp-2">{record.details}</div>
        )}
      </div>
    </div>
  );
}

function StatusMini({ value }: { value: string }) {
  const conforme = ["Aprovado", "Paga", "Concluído"];
  const pend = ["Pendente", "Contestada", "Aprovado com ressalvas"];
  const nao = ["Reprovado", "Não paga"];
  let cls = "bg-gray-100 text-gray-600";
  if (conforme.includes(value)) cls = "bg-emerald-50 text-emerald-700";
  else if (pend.includes(value)) cls = "bg-amber-50 text-amber-700";
  else if (nao.includes(value)) cls = "bg-red-50 text-red-700";
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>{value}</span>;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl">
      <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] flex items-center justify-center text-[#8B1A1A] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}
