import { useMemo, useState, useId } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Search,
  Store,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Gavel,
  ClipboardCheck,
  Building,
  HardHat,
  Flame,
  ChevronRight,
  X,
  Minus,
  CheckCircle2,
  BarChart2,
  FileText,
  Bell,
  ChevronDown,
  ChevronUp,
  Link2,
  Download,
  Printer,
  MessageCircle,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";
import { useRecords, STORES_INFO, OpRecord, Area, RecordKind } from "../recordsStore";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConformityLevel = "conforme" | "atencao" | "critico";

interface StoreConformityData {
  name: string;
  luc: string;
  segment: string;
  piso: string;
  policyActive: boolean;
  score: number;
  level: ConformityLevel;
  openFines: number;
  openFinesCount: number;
  contestedFines: number;
  totalRecords: number;
  recordsByArea: Record<Area, number>;
  recordsByKind: Record<RecordKind, number>;
  lastRecord?: OpRecord;
  recentIssues: OpRecord[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AREA_ICONS: Record<Area, typeof Building> = {
  Arquitetura: Building,
  Engenharia: HardHat,
  Brigada: Flame,
};
const AREA_BG: Record<Area, string> = {
  Arquitetura: "bg-[#FFF0E0] text-[#7A3A00]",
  Engenharia: "bg-[#E3ECF8] text-[#1B3A6B]",
  Brigada: "bg-[#FBE4E4] text-[#8B1A1A]",
};
const AREA_COLORS: Record<Area, string> = {
  Arquitetura: "bg-[#7A3A00]",
  Engenharia: "bg-[#1B3A6B]",
  Brigada: "bg-[#8B1A1A]",
};
const KIND_LABEL: Record<RecordKind, string> = {
  vistoria: "Vistoria",
  multa: "Multa",
  interacao: "Processo",
  notificacao: "Notificação",
  documento: "Documento",
  ocorrencia: "Ocorrência",
};
const LEVEL_CONFIG: Record<ConformityLevel, { bg: string; text: string; border: string; barColor: string; icon: typeof ShieldCheck; label: string }> = {
  conforme: {
    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
    barColor: "bg-emerald-500", icon: ShieldCheck, label: "Conforme",
  },
  atencao: {
    bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
    barColor: "bg-amber-400", icon: AlertTriangle, label: "Atenção",
  },
  critico: {
    bg: "bg-red-50", text: "text-red-700", border: "border-red-200",
    barColor: "bg-[#8B1A1A]", icon: AlertCircle, label: "Crítico",
  },
};

// ─── Score Calculation ────────────────────────────────────────────────────────

const STORES_INFO_BY_NAME = new Map(STORES_INFO.map((s) => [s.name, s]));

function calcConformityScore(records: OpRecord[], storeName: string): StoreConformityData {
  const info = STORES_INFO_BY_NAME.get(storeName);
  const storeRecords = records.filter((r) => r.store === storeName);

  const openFinesList = storeRecords.filter((r) => r.kind === "multa" && (r.status === "Pendente" || r.status === "Não paga"));
  const contestedFines = 0;
  const openFinesAmount = openFinesList.reduce((s, r) => s + (r.amount || 0), 0);

  // Score calculation
  let score = 100;
  
  // Penalidades
  const openFinesPenalty = openFinesList.length * 20;
  const reprovedInspectionsCount = storeRecords.filter(r => r.kind === "vistoria" && r.result === "Reprovado").length;
  const reprovedPenalty = reprovedInspectionsCount * 10;
  const policyPenalty = !info?.policyActive ? 15 : 0;
  
  score -= (openFinesPenalty + reprovedPenalty + policyPenalty);
  score = Math.max(0, Math.min(100, score));

  let level: ConformityLevel = "conforme";
  if (score < 50) level = "critico";
  else if (score < 80) level = "atencao";

  const recordsByArea: Record<Area, number> = { Arquitetura: 0, Engenharia: 0, Brigada: 0 };
  const recordsByKind: Record<RecordKind, number> = { vistoria: 0, multa: 0, interacao: 0, notificacao: 0, documento: 0, ocorrencia: 0 };
  let lastRecord: OpRecord | undefined;
  let lastTs = -Infinity;
  storeRecords.forEach((r) => {
    recordsByArea[r.area] = (recordsByArea[r.area] || 0) + 1;
    recordsByKind[r.kind] = (recordsByKind[r.kind] || 0) + 1;
    const ts = new Date(r.date).getTime();
    if (ts > lastTs) { lastTs = ts; lastRecord = r; }
  });

  const recentIssues = storeRecords
    .filter((r) => {
      if (r.kind === "multa") return r.status === "Pendente" || r.status === "Não paga";
      if (r.kind === "notificacao") return r.status === "Pendente";
      if (r.kind === "vistoria") return r.result === "Reprovado";
      return false;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return {
    name: storeName,
    luc: info?.luc ?? "",
    segment: info?.segment ?? "",
    piso: info?.piso ?? "",
    policyActive: info?.policyActive ?? false,
    score,
    level,
    openFines: openFinesAmount,
    openFinesCount: openFinesList.length,
    contestedFines,
    totalRecords: storeRecords.length,
    recordsByArea,
    recordsByKind,
    lastRecord,
    recentIssues,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}
function formatDateShort(s: string) {
  return new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function StoreConformity() {
  const records = useRecords();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"todos" | ConformityLevel>("todos");
  const [areaFilter, setAreaFilter] = useState<"todas" | Area>("todas");
  const [sortBy, setSortBy] = useState<"score" | "name" | "fines" | "records">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "table">("grid");

  const allConformityData = useMemo(() => {
    return STORES_INFO.map((info) => calcConformityScore(records, info.name));
  }, [records]);

  const filtered = useMemo(() => {
    let data = allConformityData.filter((s) => {
      if (levelFilter !== "todos" && s.level !== levelFilter) return false;
      if (areaFilter !== "todas" && s.recordsByArea[areaFilter] === 0) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.luc.toLowerCase().includes(q) || s.segment.toLowerCase().includes(q);
      }
      return true;
    });

    data = [...data].sort((a, b) => {
      let diff = 0;
      if (sortBy === "score") diff = a.score - b.score;
      else if (sortBy === "name") diff = a.name.localeCompare(b.name);
      else if (sortBy === "fines") diff = a.openFines - b.openFines;
      else if (sortBy === "records") diff = a.totalRecords - b.totalRecords;
      return sortDir === "asc" ? diff : -diff;
    });
    return data;
  }, [allConformityData, levelFilter, areaFilter, query, sortBy, sortDir]);

  const totals = useMemo(() => ({
    total: allConformityData.length,
    conforme: allConformityData.filter((s) => s.level === "conforme").length,
    atencao: allConformityData.filter((s) => s.level === "atencao").length,
    critico: allConformityData.filter((s) => s.level === "critico").length,
    avgScore: allConformityData.length === 0 ? 0 : Math.round(allConformityData.reduce((s, x) => s + x.score, 0) / allConformityData.length),
    totalOpenFines: allConformityData.reduce((s, x) => s + x.openFines, 0),
  }), [allConformityData]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
  };

  const selectedData = useMemo(() => selected ? allConformityData.find((s) => s.name === selected) : null, [selected, allConformityData]);


  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#6e150e]">Conformidade das Lojas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Índice consolidado por lojista — registros e vistorias de todas as áreas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            title="Visualização em Grid"
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${view === "grid" ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "bg-white text-gray-600 border-gray-200"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setView("table")}
            title="Visualização em Lista"
            className={`p-2 rounded-xl border-2 transition-all cursor-pointer ${view === "table" ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "bg-white text-gray-600 border-gray-200"}`}
          >
            <ListIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dashboard Overview */}
      <ConformityOverview data={allConformityData} />

      {/* Filters — search + level + area unified */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar loja, LUC ou segmento..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
          />
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-200 self-center" />

        {/* Level pills */}
        <div className="flex gap-1.5 flex-wrap">
          {(["todos", "conforme", "atencao", "critico"] as const).map((f) => {
            const labels: Record<string, string> = { todos: "Todos", conforme: "Conforme", atencao: "Atenção", critico: "Crítico" };
            const counts: Record<string, number> = { todos: totals.total, conforme: totals.conforme, atencao: totals.atencao, critico: totals.critico };
            const dotColor: Record<string, string> = { todos: "", conforme: "bg-emerald-500", atencao: "bg-amber-400", critico: "bg-red-500" };
            const active = levelFilter === f;
            return (
              <button
                key={f}
                onClick={() => setLevelFilter(f)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border-2 transition-all ${active ? "bg-[#8B1A1A] text-white border-[#8B1A1A]" : "bg-white text-gray-600 border-gray-200 hover:border-[#8B1A1A]/40"}`}
              >
                {f !== "todos" && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-white/70" : dotColor[f]}`} />
                )}
                {labels[f]}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{counts[f]}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-200 self-center" />

        {/* Area select */}
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value as typeof areaFilter)}
          className="appearance-none px-3 py-2 bg-white border-2 border-gray-200 rounded-2xl text-xs font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer shrink-0"
        >
          <option value="todas">Todas as áreas</option>
          <option value="Arquitetura">Arquitetura</option>
          <option value="Engenharia">Engenharia</option>
          <option value="Brigada">Brigada</option>
        </select>
      </div>

      {/* Content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((data) => (
            <ConformityCard key={data.name} data={data} onOpen={() => setSelected(data.name)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full p-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              Nenhuma loja encontrada com os filtros selecionados.
            </div>
          )}
        </div>
      ) : (
        <ConformityTable data={filtered} sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} onOpen={(name) => setSelected(name)} />
      )}

      {/* Drawer */}
      <AnimatePresence>
        {selected && selectedData && (
          <ConformityDrawer
            data={selectedData}
            records={records.filter((r) => r.store === selected).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, level, size = "md" }: { score: number; level: ConformityLevel; size?: "sm" | "md" }) {
  const C = LEVEL_CONFIG[level];
  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 bg-gray-100 rounded-full overflow-hidden ${size === "sm" ? "h-1.5" : "h-2.5"}`}>
        <div
          className={`h-full rounded-full transition-all ${C.barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${C.text}`}>{score}%</span>
    </div>
  );
}

// ─── Conformity Card ──────────────────────────────────────────────────────────

function PieTooltip({ active, payload, total }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-bold text-gray-800">{item.name}</div>
      <div className="text-gray-500">{item.value} reg. · {pct}%</div>
    </div>
  );
}

function ConformityCard({ data, onOpen }: { data: StoreConformityData; onOpen: () => void }) {
  const C = LEVEL_CONFIG[data.level];
  const CIcon = C.icon;
  const [expanded, setExpanded] = useState(false);
  const [chartTab, setChartTab] = useState<"tipo" | "area">("tipo");

  const byTypePie = useMemo(() => [
    { name: "Vistorias",     value: data.recordsByKind.vistoria     || 0, color: "#1B3A6B" },
    { name: "Multas",        value: data.recordsByKind.multa        || 0, color: "#8B1A1A" },
    { name: "Notificações",  value: data.recordsByKind.notificacao  || 0, color: "#7A3A00" },
    { name: "Documentos",    value: data.recordsByKind.documento    || 0, color: "#9CA3AF" },
  ].filter((d) => d.value > 0), [data]);

  const byAreaPie = useMemo(() => [
    { name: "Engenharia",  value: data.recordsByArea["Engenharia"]  || 0, color: "#1B3A6B" },
    { name: "Arquitetura", value: data.recordsByArea["Arquitetura"] || 0, color: "#7A3A00" },
    { name: "Brigada",     value: data.recordsByArea["Brigada"]     || 0, color: "#8B1A1A" },
  ].filter((d) => d.value > 0), [data]);

  const activePie = chartTab === "tipo" ? byTypePie : byAreaPie;
  const totalPie = activePie.reduce((s, d) => s + d.value, 0);
  const chartId = `pie-${data.name.replace(/\W+/g, "-").toLowerCase()}-${chartTab}`;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 flex flex-col ${expanded ? "border-[#8B1A1A]/40 shadow-md" : "border-gray-100 hover:shadow-md hover:border-[#8B1A1A]/20"}`}>

      {/* ── Clickable header — toggles chart ── */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        className="text-left p-5 flex flex-col gap-3 w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]/30 rounded-t-2xl"
      >
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#8B1A1A] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate text-sm">{data.name}</h3>
              <div className="text-[11px] text-gray-500">{data.luc} · {data.segment}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${C.bg} ${C.text} ${C.border}`}>
              <CIcon className="w-3 h-3" /> {C.label}
            </span>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-[#8B1A1A]" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>

        {/* Score bar */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Índice de Conformidade</span>
          <ScoreBar score={data.score} level={data.level} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100">
          <StatMini label="Ocorrências"  value={data.recordsByKind.ocorrencia || 0}  color={(data.recordsByKind.ocorrencia || 0)  > 0 ? "text-[#8B1A1A]" : "text-gray-400"} icon={ClipboardCheck} />
          <StatMini label="Notificações" value={data.recordsByKind.notificacao || 0} color={(data.recordsByKind.notificacao || 0) > 2 ? "text-amber-600"  : (data.recordsByKind.notificacao || 0) > 0 ? "text-[#1B3A6B]" : "text-gray-400"} icon={Bell} />
          <StatMini label="Multas"       value={data.recordsByKind.multa || 0}       color={(data.recordsByKind.multa || 0)       > 0 ? "text-[#8B1A1A]" : "text-gray-400"} icon={Gavel} />
        </div>
        {(data.recordsByKind.notificacao || 0) > 2 && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 self-start">
            <AlertCircle className="w-3 h-3" /> Mais de 2 notificações
          </div>
        )}
      </div>

      {/* ── Expanded: pie chart ── */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-dashed border-gray-200 pt-4 flex flex-col gap-3">

          {/* Chart tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { id: "tipo",     label: "Por Tipo"  },
              { id: "area",     label: "Por Área"  },
            ] as const).map((t) => (
              <button
                key={t.id}
                onClick={(e) => { e.stopPropagation(); setChartTab(t.id); }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${chartTab === t.id ? "bg-white text-[#8B1A1A] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={chartTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
            >
              {activePie.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-gray-400 text-xs gap-1">
                  <BarChart2 className="w-8 h-8 text-gray-200" />
                  Sem dados para exibir nesta categoria.
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Donut chart */}
                  <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart id={chartId}>
                        <Pie
                          data={activePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={activePie.length > 1 ? 3 : 0}
                          dataKey="value"
                          strokeWidth={0}
                          animationBegin={0}
                          animationDuration={500}
                        >
                          {activePie.map((entry) => (
                            <Cell key={`${chartId}-${entry.name}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={(props) => <PieTooltip {...props} total={totalPie} />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-base font-black text-gray-800 leading-none">{totalPie}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">total</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {activePie.map((item) => {
                      const pct = totalPie > 0 ? Math.round((item.value / totalPie) * 100) : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] text-gray-600 truncate flex-1">{item.name}</span>
                          <span className="text-[11px] font-bold text-gray-800 tabular-nums">{item.value}</span>
                          <span className="text-[10px] text-gray-400 tabular-nums w-7 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer: area tags + details button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <div className="flex gap-1 flex-wrap">
              {(["Engenharia", "Arquitetura", "Brigada"] as Area[]).map((area) => {
                const count = data.recordsByArea[area];
                if (count === 0) return null;
                const Icon = AREA_ICONS[area];
                return (
                  <span key={area} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${AREA_BG[area]}`}>
                    <Icon className="w-3 h-3" /> {count}
                  </span>
                );
              })}
              {!data.policyActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                  <AlertCircle className="w-3 h-3" /> Apólice vencida
                </span>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B1A1A] hover:underline shrink-0"
            >
              Detalhes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsed footer ── */}
      {!expanded && (
        <div className="px-5 pb-4 -mt-1">
          <div className="flex gap-1.5 flex-wrap mb-3">
            {(["Engenharia", "Arquitetura", "Brigada"] as Area[]).map((area) => {
              const count = data.recordsByArea[area];
              if (count === 0) return null;
              const Icon = AREA_ICONS[area];
              return (
                <span key={area} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${AREA_BG[area]}`}>
                  <Icon className="w-3 h-3" /> {count}
                </span>
              );
            })}
            {!data.policyActive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700">
                <AlertCircle className="w-3 h-3" /> Apólice vencida
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full flex items-center justify-between text-[11px] text-gray-400 hover:text-[#8B1A1A] border-t border-gray-100 pt-2.5 transition-colors"
          >
            <span>Clique para ver o gráfico</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof Gavel }) {
  return (
    <div className="flex flex-col items-center">
      <Icon className={`w-3.5 h-3.5 mb-0.5 ${color}`} />
      <div className={`text-sm font-bold ${color}`}>{value}</div>
      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
    </div>
  );
}

// ─── Conformity Table ─────────────────────────────────────────────────────────

function ConformityTable({
  data, sortBy, sortDir, onSort, onOpen,
}: {
  data: StoreConformityData[];
  sortBy: string;
  sortDir: "asc" | "desc";
  onSort: (f: "score" | "name" | "fines" | "records") => void;
  onOpen: (name: string) => void;
}) {
  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <Minus className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-[#FAF7F2]">
              <th className="text-left py-3 px-4">
                <button onClick={() => onSort("name")} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#8B1A1A]">
                  Loja <SortIcon field="name" />
                </button>
              </th>
              <th className="text-left py-3 px-4 hidden md:table-cell">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Situação</span>
              </th>
              <th className="text-left py-3 px-4">
                <button onClick={() => onSort("score")} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#8B1A1A]">
                  Índice <SortIcon field="score" />
                </button>
              </th>
              <th className="text-center py-3 px-3 hidden sm:table-cell">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Multas</span>
              </th>
              <th className="text-center py-3 px-3 hidden lg:table-cell">
                <button onClick={() => onSort("fines")} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-[#8B1A1A]">
                  Em Aberto <SortIcon field="fines" />
                </button>
              </th>
              <th className="text-center py-3 px-3 hidden xl:table-cell">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">Áreas</span>
              </th>
              <th className="py-3 px-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((s) => {
              const C = LEVEL_CONFIG[s.level];
              const CIcon = C.icon;
              return (
                <tr key={s.name} className="hover:bg-[#FAF7F2]/50 transition-colors cursor-pointer" onClick={() => onOpen(s.name)}>
                  <td className="py-3 px-4">
                    <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                    <div className="text-[11px] text-gray-500">{s.luc} · {s.segment}</div>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${C.bg} ${C.text} ${C.border}`}>
                      <CIcon className="w-3 h-3" /> {C.label}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full rounded-full ${C.barColor}`} style={{ width: `${s.score}%` }} />
                      </div>
                      <span className={`text-xs font-bold tabular-nums ${C.text}`}>{s.score}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <span className={`text-sm font-bold ${s.openFinesCount > 0 ? "text-[#8B1A1A]" : "text-gray-300"}`}>{s.openFinesCount}</span>
                  </td>
                  <td className="py-3 px-3 text-center hidden lg:table-cell">
                    <span className={`text-sm font-bold ${s.openFines > 0 ? "text-[#8B1A1A]" : "text-gray-400"}`}>
                      {s.openFines > 0 ? formatBRL(s.openFines) : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-3 hidden xl:table-cell">
                    <div className="flex gap-1">
                      {(["Engenharia", "Arquitetura", "Brigada"] as Area[]).map((area) => {
                        const count = s.recordsByArea[area];
                        if (count === 0) return null;
                        const Icon = AREA_ICONS[area];
                        return (
                          <span key={area} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${AREA_BG[area]}`}>
                            <Icon className="w-2.5 h-2.5" /> {count}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B1A1A]" />
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">Nenhuma loja encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Conformity Drawer ────────────────────────────────────────────────────────

function ConformityDrawer({ data, records, onClose }: { data: StoreConformityData; records: OpRecord[]; onClose: () => void }) {
  const [tab, setTab] = useState<"resumo" | "registros">("resumo");
  const [showExport, setShowExport] = useState(false);
  const C = LEVEL_CONFIG[data.level];
  const CIcon = C.icon;

  const { vistorias, multas, ocorrencias, notificacoes, outros } = useMemo(() => {
    const grouped = {
      vistorias: [] as OpRecord[],
      multas: [] as OpRecord[],
      ocorrencias: [] as OpRecord[],
      notificacoes: [] as OpRecord[],
      outros: [] as OpRecord[],
    };
    records.forEach((r) => {
      switch (r.kind) {
        case "vistoria":    grouped.vistorias.push(r); break;
        case "multa":       grouped.multas.push(r); break;
        case "ocorrencia":  grouped.ocorrencias.push(r); break;
        case "notificacao": grouped.notificacoes.push(r); break;
        case "documento":
        case "interacao":   grouped.outros.push(r); break;
      }
    });
    return grouped;
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
        className="bg-white w-full max-w-2xl h-full overflow-hidden shadow-2xl flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 bg-[#FAF7F2] shrink-0">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#8B1A1A] shadow-sm shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{data.name}</h2>
                <p className="text-xs text-gray-500">{data.segment} · LUC {data.luc} · Piso {data.piso}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full shrink-0"><X className="w-5 h-5" /></button>
          </div>

          {/* Score panel */}
          <div className={`p-4 rounded-2xl border ${C.bg} ${C.border} mb-3`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CIcon className={`w-5 h-5 ${C.text}`} />
                <span className={`text-sm font-bold ${C.text}`}>Índice de Conformidade: {C.label}</span>
              </div>
              <span className={`text-2xl font-black ${C.text}`}>{data.score}%</span>
            </div>
            <ScoreBar score={data.score} level={data.level} size="md" />
            <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
              {data.openFinesCount > 0 && <span className="flex items-center gap-1"><Gavel className="w-3 h-3 text-[#8B1A1A]" /> {data.openFinesCount} multa(s) em aberto</span>}
              {!data.policyActive && <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-600" /> Apólice de seguro vencida</span>}
              {data.level === "conforme" && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Nenhuma pendência relevante</span>}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Ocorrências", value: data.recordsByKind.ocorrencia || 0, icon: MessageCircle, color: "text-[#8B1A1A] bg-[#FBE4E4]" },
              { label: "Notificações", value: data.recordsByKind.notificacao || 0, icon: Bell, color: "text-[#7A3A00] bg-[#FFF0E0]" },
              { label: "Vistorias", value: data.recordsByKind.vistoria || 0, icon: ClipboardCheck, color: "text-[#1B3A6B] bg-[#E3ECF8]" },
              { label: "Multas", value: data.recordsByKind.multa || 0, icon: Gavel, color: "text-[#8B1A1A] bg-[#FBE4E4]" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`bg-white rounded-xl p-2.5 text-center border border-gray-100`}>
                  <div className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center mb-1 ${item.color}`}><Icon className="w-3.5 h-3.5" /></div>
                  <div className="text-base font-bold text-gray-900">{item.value}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-white shrink-0">
          {([
            { id: "resumo", label: "Resumo", icon: BarChart2 },
            { id: "registros", label: `Registros (${records.length})`, icon: ClipboardCheck },
          ] as const).map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold border-b-2 transition-all ${active ? "border-[#8B1A1A] text-[#8B1A1A] bg-[#FAF7F2]/50" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
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
                {/* Area breakdown */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Registros por Área</h4>
                  <div className="space-y-2">
                    {(["Engenharia", "Arquitetura", "Brigada"] as Area[]).map((area) => {
                      const count = data.recordsByArea[area];
                      const Icon = AREA_ICONS[area];
                      const pct = data.totalRecords > 0 ? Math.round((count / data.totalRecords) * 100) : 0;
                      return (
                        <div key={area} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${AREA_BG[area]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-gray-700">{area}</span>
                              <span className="text-xs font-bold text-gray-900">{count} reg.</span>
                            </div>
                            <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${AREA_COLORS[area]}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-gray-400 w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Fines summary */}
                {data.openFinesCount > 0 && (
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Multas Pendentes</h4>
                    <div className="bg-white border border-[#8B1A1A]/20 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#8B1A1A]" />
                          <span className="text-sm text-gray-700">{data.openFinesCount} multa(s) não pagas</span>
                        </div>
                        <span className="text-sm font-bold text-[#8B1A1A]">{formatBRL(data.openFines)}</span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Recent issues */}
                {data.recentIssues.length > 0 && (
                  <section>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Pendências Recentes</h4>
                    <div className="space-y-2">
                      {data.recentIssues.map((r) => <RecordRow key={r.id} record={r} />)}
                    </div>
                  </section>
                )}

                {data.level === "conforme" && data.recentIssues.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ShieldCheck className="w-12 h-12 text-emerald-300 mb-3" />
                    <p className="text-sm font-bold text-emerald-700">Loja em plena conformidade</p>
                    <p className="text-xs text-gray-400 mt-1">Nenhuma pendência identificada nos registros.</p>
                  </div>
                )}
              </motion.div>
            )}

            {tab === "registros" && (
              <motion.div
                key="registros"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="space-y-4"
              >
                {ocorrencias.length > 0 && (
                  <RecordGroup title="Ocorrências" icon={MessageCircle} color="text-[#8B1A1A]" records={ocorrencias} />
                )}
                {notificacoes.length > 0 && (
                  <RecordGroup title="Notificações" icon={Bell} color="text-[#7A3A00]" records={notificacoes} />
                )}
                {vistorias.length > 0 && (
                  <RecordGroup title="Vistorias" icon={ClipboardCheck} color="text-[#1B3A6B]" records={vistorias} />
                )}
                {multas.length > 0 && (
                  <RecordGroup title="Multas" icon={Gavel} color="text-[#8B1A1A]" records={multas} />
                )}
                {outros.length > 0 && (
                  <RecordGroup title="Outros" icon={FileText} color="text-gray-600" records={outros} />
                )}
                {records.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                    <p className="text-sm">Nenhum registro encontrado.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-2">
          <button
            onClick={() => setShowExport(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-[#8B1A1A] text-white hover:bg-[#a43030] transition-colors shadow-sm text-sm"
            title="Gerar relatório em PDF"
          >
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showExport && (
          <ExportPdfModal
            data={data}
            records={records}
            ocorrencias={ocorrencias}
            notificacoes={notificacoes}
            vistorias={vistorias}
            multas={multas}
            onClose={() => setShowExport(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Export PDF Modal ─────────────────────────────────────────────────────────

type ExportSection = "ocorrencias" | "notificacoes" | "vistorias" | "multas" | "multasFaturadas" | "multasCanceladas" | "multasPendentes";

function ExportPdfModal({
  data, records, ocorrencias, notificacoes, vistorias, multas, onClose,
}: {
  data: StoreConformityData;
  records: OpRecord[];
  ocorrencias: OpRecord[];
  notificacoes: OpRecord[];
  vistorias: OpRecord[];
  multas: OpRecord[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(`Relatório — ${data.name}`);
  const [author, setAuthor] = useState("Administração JP Mall");
  const [notes, setNotes] = useState("");
  const multasNaoPagas  = multas.filter((m) => m.status === "Pendente" || m.status === "Não paga");
  const multasFaturadas = multas.filter((m) => m.status === "Faturada");
  const multasCancel    = multas.filter((m) => m.status === "Cancelada");

  const [sections, setSections] = useState<Record<ExportSection, boolean>>({
    ocorrencias: ocorrencias.length > 0,
    notificacoes: notificacoes.length > 0,
    vistorias: false,
    multas: multasNaoPagas.length > 0,
    multasFaturadas: multasFaturadas.length > 0,
    multasCanceladas: multasCancel.length > 0,
    multasPendentes: multasNaoPagas.length > 0 || multasFaturadas.length > 0,
  });

  const sectionsList: { id: ExportSection; label: string; count?: number; required?: boolean }[] = [
    { id: "ocorrencias",      label: "Ocorrências",                       count: ocorrencias.length },
    { id: "notificacoes",     label: "Notificações",                      count: notificacoes.length },
    { id: "multas",           label: "Multas não pagas",                  count: multasNaoPagas.length },
    { id: "multasFaturadas",  label: "Multas faturadas",                  count: multasFaturadas.length },
    { id: "multasCanceladas", label: "Multas canceladas",                 count: multasCancel.length },
    { id: "multasPendentes",  label: "Resumo financeiro de multas" },
    { id: "vistorias",        label: "Vistorias",                         count: vistorias.length },
  ];

  const toggle = (id: ExportSection) => setSections((s) => ({ ...s, [id]: !s[id] }));

  const handleGenerate = () => {
    const html = buildPdfHtml({
      data, title, author, notes, sections,
      ocorrencias, notificacoes, vistorias,
      multasNaoPagas, multasCancel, multasFaturadas,
      totalRecords: records.length,
    });
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) {
      alert("Não foi possível abrir a janela de impressão. Verifique o bloqueador de pop-ups.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FAF7F2] rounded-xl flex items-center justify-center text-[#8B1A1A]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Exportar Relatório PDF</h3>
              <p className="text-xs text-gray-500">{data.name} · {data.luc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">Título do relatório</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">Responsável pelo relatório</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-2">Seções a incluir</label>
            <div className="space-y-1.5">
              {sectionsList.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-xl cursor-pointer hover:border-[#8B1A1A]/40 hover:bg-[#FAF7F2]/30 transition-all">
                  <input
                    type="checkbox"
                    checked={sections[s.id]}
                    onChange={() => toggle(s.id)}
                    className="w-4 h-4 accent-[#8B1A1A]"
                  />
                  <span className="text-sm text-gray-700 flex-1">{s.label}</span>
                  {typeof s.count === "number" && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.count > 0 ? "bg-[#FAF7F2] text-[#8B1A1A]" : "bg-gray-100 text-gray-400"}`}>
                      {s.count}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1.5">Observações (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Adicione comentários, recomendações ou notas que aparecerão no final do relatório..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-[#8B1A1A] text-white hover:bg-[#a43030] text-sm shadow-sm"
          >
            <Printer className="w-4 h-4" /> Gerar PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildPdfHtml({
  data, title, author, notes, sections,
  ocorrencias, notificacoes, vistorias,
  multasNaoPagas, multasCancel, multasFaturadas,
  totalRecords,
}: {
  data: StoreConformityData;
  title: string;
  author: string;
  notes: string;
  sections: Record<ExportSection, boolean>;
  ocorrencias: OpRecord[];
  notificacoes: OpRecord[];
  vistorias: OpRecord[];
  multasNaoPagas: OpRecord[];
  multasCancel: OpRecord[];
  multasFaturadas: OpRecord[];
  totalRecords: number;
}): string {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const levelLabel = LEVEL_CONFIG[data.level].label;
  const levelColor = data.level === "conforme" ? "#10B981" : data.level === "atencao" ? "#F59E0B" : "#8B1A1A";

  const renderRecordTable = (rows: OpRecord[], opts: { showAmount?: boolean; showStatus?: boolean } = {}) => `
    <table>
      <thead>
        <tr>
          <th style="width:60px">ID</th>
          <th style="width:80px">Data</th>
          <th>Assunto</th>
          <th style="width:90px">Área</th>
          ${opts.showStatus ? '<th style="width:90px">Status</th>' : ""}
          ${opts.showAmount ? '<th style="width:90px;text-align:right">Valor</th>' : ""}
        </tr>
      </thead>
      <tbody>
        ${rows.map((r) => `
          <tr>
            <td>#${escapeHtml(r.id)}</td>
            <td>${formatDate(r.date)}</td>
            <td>
              <div style="font-weight:600">${escapeHtml(r.subject)}</div>
              ${r.description ? `<div style="font-size:10px;color:#666;margin-top:2px">${escapeHtml(r.description).slice(0, 200)}</div>` : ""}
            </td>
            <td>${escapeHtml(r.area)}</td>
            ${opts.showStatus ? `<td>${escapeHtml(r.status || r.result || "—")}</td>` : ""}
            ${opts.showAmount ? `<td style="text-align:right">${r.amount ? formatBRL(r.amount) : "—"}</td>` : ""}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  const sectionHtml = (id: ExportSection, label: string, content: string) =>
    sections[id] ? `<section><h2>${label}</h2>${content}</section>` : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #1f2937; font-size: 12px; line-height: 1.5; margin: 0; }
  header { border-bottom: 3px solid #8B1A1A; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end; }
  header .brand { font-size: 11px; color: #8B1A1A; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  header h1 { margin: 4px 0 0; font-size: 18px; color: #111; }
  header .meta { font-size: 10px; color: #666; text-align: right; }
  .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
  .info-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 10px; }
  .info-card .label { font-size: 9px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700; }
  .info-card .value { font-size: 14px; font-weight: 700; color: #111; margin-top: 2px; }
  .score-box { border: 2px solid ${levelColor}; border-radius: 10px; padding: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; background: ${levelColor}11; }
  .score-box .lbl { font-size: 11px; color: #444; }
  .score-box .lvl { font-size: 13px; font-weight: 800; color: ${levelColor}; text-transform: uppercase; }
  .score-box .score { font-size: 28px; font-weight: 900; color: ${levelColor}; }
  section { margin-bottom: 18px; page-break-inside: avoid; }
  h2 { font-size: 13px; color: #8B1A1A; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #FAF7F2; text-align: left; padding: 6px 8px; font-weight: 700; color: #6e150e; border-bottom: 2px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
  td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  .area-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .area-row .name { width: 90px; font-weight: 700; font-size: 11px; }
  .area-row .bar { flex: 1; background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden; }
  .area-row .bar > div { height: 100%; }
  .area-row .count { width: 80px; text-align: right; font-size: 11px; font-weight: 700; }
  .fines-card { border: 1px solid #f5c5c5; border-radius: 10px; padding: 12px; background: #fff7f7; }
  .fines-card .line { display: flex; justify-content: space-between; padding: 4px 0; }
  .notes { border-left: 3px solid #8B1A1A; padding: 8px 12px; background: #FAF7F2; border-radius: 0 8px 8px 0; white-space: pre-wrap; font-size: 11px; }
  footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<header>
  <div>
    <div class="brand">JP Mall · Conformidade</div>
    <h1>${escapeHtml(title)}</h1>
  </div>
  <div class="meta">
    <div><strong>Emitido em:</strong> ${today}</div>
    <div><strong>Responsável:</strong> ${escapeHtml(author)}</div>
  </div>
</header>

<div class="info-grid">
  <div class="info-card"><div class="label">Loja</div><div class="value">${escapeHtml(data.name)}</div></div>
  <div class="info-card"><div class="label">LUC</div><div class="value">${escapeHtml(data.luc)}</div></div>
  <div class="info-card"><div class="label">Segmento</div><div class="value">${escapeHtml(data.segment)}</div></div>
  <div class="info-card"><div class="label">Piso</div><div class="value">${escapeHtml(data.piso)}</div></div>
</div>

<div class="info-grid">
  <div class="info-card"><div class="label">Total de Registros</div><div class="value">${totalRecords}</div></div>
  <div class="info-card"><div class="label">Ocorrências</div><div class="value">${data.recordsByKind.ocorrencia || 0}</div></div>
  <div class="info-card"><div class="label">Notificações</div><div class="value">${data.recordsByKind.notificacao || 0}</div></div>
  <div class="info-card"><div class="label">Multas</div><div class="value">${data.recordsByKind.multa || 0}</div></div>
</div>

${sectionHtml("multasPendentes", "Resumo Financeiro de Multas", `
  <div class="fines-card">
    <div class="line"><span>${multasNaoPagas.length} multa(s) não pagas</span><strong style="color:#8B1A1A">${formatBRL(multasNaoPagas.reduce((s, r) => s + (r.amount || 0), 0))}</strong></div>
    <div class="line"><span>${multasFaturadas.length} multa(s) faturadas</span><strong style="color:#059669">${formatBRL(multasFaturadas.reduce((s, r) => s + (r.amount || 0), 0))}</strong></div>
    ${!data.policyActive ? '<div class="line" style="color:#8B1A1A"><span>⚠ Apólice de seguro vencida</span></div>' : ""}
  </div>
`)}

${sectionHtml("ocorrencias", `Ocorrências (${ocorrencias.length})`, ocorrencias.length > 0 ? renderRecordTable(ocorrencias, { showStatus: true }) : '<p style="color:#999;font-style:italic">Nenhuma ocorrência registrada.</p>')}

${sectionHtml("notificacoes", `Notificações (${notificacoes.length})`, notificacoes.length > 0 ? renderRecordTable(notificacoes, { showStatus: true }) : '<p style="color:#999;font-style:italic">Nenhuma notificação registrada.</p>')}

${sectionHtml("multas", `Multas Não Pagas (${multasNaoPagas.length})`, multasNaoPagas.length > 0 ? renderRecordTable(multasNaoPagas, { showStatus: true, showAmount: true }) : '<p style="color:#999;font-style:italic">Nenhuma multa em aberto.</p>')}

${sectionHtml("multasFaturadas", `Multas Faturadas (${multasFaturadas.length})`, multasFaturadas.length > 0 ? renderRecordTable(multasFaturadas, { showStatus: true, showAmount: true }) : '<p style="color:#999;font-style:italic">Nenhuma multa faturada.</p>')}

${sectionHtml("multasCanceladas", `Multas Canceladas (${multasCancel.length})`, multasCancel.length > 0 ? renderRecordTable(multasCancel, { showStatus: true, showAmount: true }) : '<p style="color:#999;font-style:italic">Nenhuma multa cancelada.</p>')}

${sectionHtml("vistorias", `Vistorias (${vistorias.length})`, vistorias.length > 0 ? renderRecordTable(vistorias, { showStatus: true }) : '<p style="color:#999;font-style:italic">Nenhuma vistoria registrada.</p>')}

${notes.trim() ? `<section><h2>Observações</h2><div class="notes">${escapeHtml(notes)}</div></section>` : ""}

<footer>
  Relatório gerado automaticamente pelo sistema JP Mall em ${today} · ${escapeHtml(author)}
</footer>

</body>
</html>`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecordGroup({ title, icon: Icon, color, records }: { title: string; icon: typeof ClipboardCheck; color: string; records: OpRecord[] }) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-xs font-black uppercase tracking-wider">{title} ({records.length})</span>
      </div>
      <div className="space-y-2">
        {records.map((r) => <RecordRow key={r.id} record={r} />)}
      </div>
    </div>
  );
}

function RecordRow({ record }: { record: OpRecord }) {
  const AreaIcon = AREA_ICONS[record.area];
  const status = record.result || record.status;
  let statusCls = "bg-gray-100 text-gray-600";
  if (["Aprovado", "Paga", "Concluído"].includes(status || "")) statusCls = "bg-emerald-50 text-emerald-700";
  else if (["Pendente", "Contestada", "Aprovado com ressalvas"].includes(status || "")) statusCls = "bg-amber-50 text-amber-700";
  else if (["Reprovado", "Não paga"].includes(status || "")) statusCls = "bg-red-50 text-red-700";

  return (
    <Link
      to={`/registros?tab=registros&detail=${record.id}`}
      className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#8B1A1A]/40 hover:shadow-sm hover:bg-[#FAF7F2]/40 transition-all group"
      title="Abrir registro"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${AREA_BG[record.area]}`}>
        <AreaIcon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[#8B1A1A] flex items-center gap-1">
              {KIND_LABEL[record.kind]} · #{record.id}
              {record.linkedRecordIds && record.linkedRecordIds.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-gray-400"><Link2 className="w-3 h-3" />{record.linkedRecordIds.length}</span>
              )}
            </div>
            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-[#8B1A1A] transition-colors">{record.subject}</div>
          </div>
          {status && (
            <span className={`inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusCls}`}>{status}</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-[11px] text-gray-500">{formatDate(record.date)} · {record.author}</div>
          <div className="flex items-center gap-2">
            {record.amount !== undefined && (
              <span className="text-[11px] font-bold text-[#8B1A1A]">{formatBRL(record.amount)}</span>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#8B1A1A] transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Conformity Overview Dashboard ──────────────────────────────────────────

function ConformityOverview({ data }: { data: StoreConformityData[] }) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const totals = useMemo(() => ({
    conforme: data.filter((s) => s.level === "conforme").length,
    atencao: data.filter((s) => s.level === "atencao").length,
    critico: data.filter((s) => s.level === "critico").length,
  }), [data]);

  const pieData = [
    { name: "Conforme", value: totals.conforme, color: "#10b981" },
    { name: "Atenção", value: totals.atencao, color: "#f59e0b" },
    { name: "Crítico", value: totals.critico, color: "#ef4444" },
  ].filter(d => d.value > 0);

  const topCritical = useMemo(() => {
    return [...data]
      .filter(s => s.level === "critico" || s.level === "atencao")
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(s => ({
        name: s.name,
        score: s.score,
        fines: s.openFinesCount,
        color: s.level === "critico" ? "#ef4444" : "#f59e0b"
      }));
  }, [data]);

  const cards = [
    { label: "Lojas Críticas", value: totals.critico, icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Lojas em Atenção", value: totals.atencao, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Lojas Conformes", value: totals.conforme, icon: ShieldCheck, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-2">
      <div className="flex flex-col gap-3 lg:col-span-1">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${c.color}`}><Icon className="w-6 h-6" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.label}</div>
                <div className="text-xl font-bold text-gray-900">{c.value}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-1 flex flex-col">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Visão Geral de Conformidade</h3>
        {pieData.length > 0 ? (
          <>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart id={`${uid}-conformity-pie`}>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} stroke="none">
                    {pieData.map((entry, index) => <Cell key={`${uid}-pie-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, "Lojas"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-2">
              {pieData.map((d) => (
                <div key={`pie-legend-conformity-${d.name}`} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></div>
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Nenhum dado</div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 lg:col-span-1 flex flex-col">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Lojas com Menor Score</h3>
        {topCritical.length > 0 ? (
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart id={`${uid}-critical-bar`} data={topCritical} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} width={80} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`${value} pts`, "Score"]} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {topCritical.map((entry, index) => <Cell key={`${uid}-bar-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-400 gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-300" />
            Nenhuma loja em situação crítica!
          </div>
        )}
      </div>
    </div>
  );
}

