import { useMemo, useState, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  Eye,
  Plus,
  Bell,
  ClipboardCheck,
  Gavel,
  GitBranch,
  FolderOpen,
  X,
  Building,
  HardHat,
  Flame,
  Download,
  Calendar,
  Edit3,
  Trash2,
  History,
  List,
  Upload,
  FileText,
  Info,
  Activity,
  ArrowUpDown,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  Link2,
  AlertCircle,
  Filter,
  ChevronRight,
  CheckCircle2,
  CheckCheck,
  MessageCircle,
  Send,
  Lock,
  Unlock,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Camera,
} from "lucide-react";
import {
  Area,
  OpRecord,
  RecordKind,
  ActivityLog,
  WorkflowStep,
  useRecords,
  useActivities,
  createRecord,
  updateRecord,
  deleteRecord,
  logView,
  advanceWorkflow,
  revertWorkflow,
  submitStepWork,
  addStepComment,
  finalizeProcess,
  reopenProcess,
  isStepSubmitted,
  STORES_INFO,
  Attachment,
  filesToAttachments,
  downloadAttachment,
  getAttachmentHref,
} from "../recordsStore";
import { useToast } from "../components/Toast";
import { AttachmentViewerHost, CameraCaptureHost } from "../components/Attachments";
import { useProfile, useUsers, useCurrentUser, useCurrentPermissions } from "../profileStore";
import { StoreConformityDrawer } from "./StoreDirectory";

const AREA_STYLES: Record<Area, { bg: string; text: string; ring: string; border: string; icon: typeof Building }> = {
  Arquitetura: { bg: "bg-[#FFF0E0]", text: "text-[#7A3A00]", ring: "ring-[#F2A65A]", border: "border-[#F2A65A]", icon: Building },
  Engenharia: { bg: "bg-[#E3ECF8]", text: "text-[#1B3A6B]", ring: "ring-[#3D6BB3]", border: "border-[#3D6BB3]", icon: HardHat },
  Brigada: { bg: "bg-[#FBE4E4]", text: "text-[#8B1A1A]", ring: "ring-[#8B1A1A]", border: "border-[#8B1A1A]", icon: Flame },
};

const KIND_META: Record<RecordKind, { label: string; icon: typeof Bell; plural: string }> = {
  notificacao: { label: "Notificação", icon: Bell, plural: "Notificações" },
  vistoria: { label: "Vistoria", icon: ClipboardCheck, plural: "Vistorias" },
  multa: { label: "Multa", icon: Gavel, plural: "Multas" },
  interacao: { label: "Processo", icon: GitBranch, plural: "Processos" },
  documento: { label: "Documento", icon: FolderOpen, plural: "Documentos" },
  ocorrencia: { label: "Ocorrência", icon: MessageCircle, plural: "Ocorrências" },
};

const ACTIVITY_KIND_META: Record<RecordKind | "sistema", { label: string }> = {
  ...Object.fromEntries(Object.entries(KIND_META).map(([k, v]) => [k, { label: v.label }])) as Record<RecordKind, { label: string }>,
  sistema: { label: "Sistema" },
};

const MULTA_CATEGORY_TO_AREA: Record<string, Area> = {
  "Manutenção e Engenharia": "Engenharia",
  "Arquitetura e Paisagismo": "Arquitetura",
  "Conservação e Resíduos": "Engenharia",
  "Segurança e Brigada": "Brigada",
};

const TAXONOMY: Record<Area, Partial<Record<RecordKind, string[]>>> = {
  Arquitetura: {
    vistoria: ["Layout/Fachada", "Comunicação visual", "Materiais de acabamento"],
    multa: ["Descaracterização da loja", "Comunicação visual irregular"],
    interacao: ["Solicitação de parecer", "Aprovação de projeto", "Handover"],
  },
  Engenharia: {
    vistoria: ["Estrutural", "Elétrica", "Hidráulica", "HVAC"],
    multa: ["Instalação fora do padrão", "Sobrecarga elétrica", "Alteração estrutural"],
    interacao: ["Solicitação técnica", "Parecer estrutural", "Reunião técnica"],
  },
  Brigada: {
    vistoria: ["Combate a incêndio", "Rota de fuga", "Sistema de alarme"],
    multa: ["AVCB vencido", "Rota de fuga obstruída", "Extintor vencido"],
    interacao: ["Parecer de segurança", "Treinamento", "Handover"],
  },
};

function AreaBadge({ area, compact = false }: { area?: Area | string; compact?: boolean }) {
  if (!area) return null;
  const normalizedArea = (area.charAt(0).toUpperCase() + area.slice(1).toLowerCase()) as Area;
  const s = AREA_STYLES[normalizedArea] || { bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-300", border: "border-gray-300", icon: Building };
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <Icon className="w-3.5 h-3.5" /> {compact ? String(area).slice(0, 3) : area}
    </span>
  );
}

function StatusBadge({ value }: { value?: string }) {
  if (!value) return <span className="text-xs text-gray-400">—</span>;
  const conforme = ["Aprovado", "Paga", "Concluído", "Conforme", "Faturada"];
  const pend = ["Pendente", "Contestada", "Aprovado com ressalvas", "Em andamento"];
  const nao = ["Reprovado", "Não paga", "Não conforme", "Cancelada"];
  let cls = "bg-gray-100 text-gray-700";
  if (conforme.includes(value)) cls = "bg-[#e8f5e9] text-[#1b5e20]";
  else if (pend.includes(value)) cls = "bg-[#FFF4E0] text-[#7A4A00]";
  else if (nao.includes(value)) cls = "bg-[#ffebee] text-[#b71c1c]";
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${cls}`}>{value}</span>;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDateTime(s: string) {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("pt-BR");
}

type TabMode = "registros" | "encerrados" | "atividade";

const AREA_SCOPE: Record<Area, { title: string; description: string; highlights: string[] }> = {
  Arquitetura: {
    title: "Arquitetura",
    description: "Projetos, fachadas, comunicação visual e conformidade ao manual do lojista.",
    highlights: ["Layout e acabamentos", "Fachada e sinalização", "Aprovação de projetos"],
  },
  Engenharia: {
    title: "Engenharia",
    description: "Sistemas estruturais, elétricos, hidráulicos e HVAC das unidades.",
    highlights: ["Estrutural", "Elétrica & sobrecarga", "HVAC e hidráulica"],
  },
  Brigada: {
    title: "Brigada",
    description: "Combate a incêndio, rotas de fuga, AVCB e segurança patrimonial.",
    highlights: ["Combate a incêndio", "Rota de fuga & alarme", "AVCB e treinamentos"],
  },
};

function isRecordClosed(r: OpRecord): boolean {
  if (r.kind === "interacao") return r.processStatus === "finalizado";
  if (r.kind === "multa") return r.status === "Paga" || r.status === "Faturada" || r.status === "Cancelada";
  if (r.kind === "vistoria") return r.result === "Aprovado";
  return false;
}
type KindFilter = RecordKind | "todos";
type SortOption = "recent" | "oldest" | "alpha" | "luc";

export function Records() {
  const toast = useToast();
  const records = useRecords();
  const activities = useActivities();
  const currentProfile = useProfile();
  const currentUser = useCurrentUser();
  const perms = useCurrentPermissions();
  const isReadOnly = !perms.createRecords;

  let currentUserArea: Area = "Engenharia";
  if (currentUser?.cargo?.toLowerCase().includes("arquiteta")) currentUserArea = "Arquitetura";
  if (currentUser?.cargo?.toLowerCase().includes("brigada")) currentUserArea = "Brigada";
  
  const currentUserName = currentUser?.nome ?? "Gerente JP Mall";

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabMode | null;
  const activeTab: TabMode = tabParam && ["registros", "atividade", "encerrados"].includes(tabParam) ? tabParam : "registros";
  const setActiveTab = (t: TabMode) => setSearchParams((p) => { const np = new URLSearchParams(p); np.set("tab", t); return np; }, { replace: true });
  const [areaTab, setAreaTab] = useState<Area>("Arquitetura");
  const [kindFilter, setKindFilter] = useState<KindFilter>("todos");
  const [storeFilter, setStoreFilter] = useState<string>("Todas");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [areaFilter, setAreaFilter] = useState<string>("Todas");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const [showForm, setShowForm] = useState(false);
  const [prefillKind, setPrefillKind] = useState<RecordKind | null>(null);
  const [editing, setEditing] = useState<OpRecord | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [conformityStore, setConformityStore] = useState<string | null>(null);

  const detail = useMemo(() => detailId ? records.find((r) => r.id === detailId) || null : null, [records, detailId]);

  useEffect(() => {
    const id = searchParams.get("detail");
    if (id && id !== detailId && records.some((r) => r.id === id)) {
      setDetailId(id);
    }
  }, [searchParams, records]); // eslint-disable-line react-hooks/exhaustive-deps

  const stores = useMemo(() => Array.from(new Set(records.map((r) => r.store))).sort((a, b) => a.localeCompare(b)), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.kind === "interacao") return false;
      if (isRecordClosed(r)) return false;
      if (kindFilter !== "todos" && r.kind !== kindFilter) return false;
      if (storeFilter !== "Todas" && r.store !== storeFilter) return false;
      if (areaFilter !== "Todas" && r.area !== areaFilter) return false;
      if (statusFilter !== "Todos") {
        const currentStatus = r.result || r.status;
        if (currentStatus !== statusFilter) return false;
      }
      if (period !== "all") {
        const days = parseInt(period, 10);
        if (new Date(r.date).getTime() < Date.now() - days * 86400000) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [r.id, r.store, r.author, r.subject, r.details, r.taxonomy, r.luc].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, kindFilter, storeFilter, areaFilter, statusFilter, period, query]);

  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    if (sortBy === "recent") sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (sortBy === "oldest") sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    else if (sortBy === "alpha") sorted.sort((a, b) => a.store.localeCompare(b.store));
    else if (sortBy === "luc") sorted.sort((a, b) => a.luc.localeCompare(b.luc));
    return sorted;
  }, [filteredRecords, sortBy]);

  function handleOpenDetail(r: OpRecord) {
    setDetailId(r.id);
  }

  async function handleDelete(r: OpRecord) {
    if (!confirm(`Excluir o registro ${r.id}? Esta ação será registrada no histórico de atividades.`)) return;
    try {
      await deleteRecord(r.id, currentUserName);
      setDetailId(null);
      toast.push({ kind: "success", title: "Registro excluído", message: `${r.id} removido. Histórico atualizado.` });
    } catch (err: any) {
      toast.push({ kind: "error", title: "Erro na Exclusão", message: err.message || "Não foi possível excluir o registro." });
    }
  }

  function openNew(kind?: RecordKind) {
    if (isReadOnly) return;
    setEditing(null);
    setPrefillKind(kind || null);
    setShowForm(true);
  }

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">{
            activeTab === "atividade" ? "Atividades" :
            activeTab === "encerrados" ? "Encerrados" :
            "Ocorrências"
          }</h1>
          <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1 line-clamp-2">{
            activeTab === "atividade" ? "Linha do tempo de eventos e interações do sistema." :
            activeTab === "encerrados" ? "Ocorrências finalizadas, disponíveis para consulta e edição." :
            "Vistorias, multas e notificações registradas por loja."
          }</p>
        </div>
        {activeTab === "registros" && !isReadOnly && (
          <button
            onClick={() => openNew()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 md:gap-2 bg-[#8B1A1A] hover:bg-[#a43030] active:bg-[#6e150e] text-white font-medium px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl shadow-sm transition-all cursor-pointer text-sm md:text-base shrink-0"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" /> Novo Registro
          </button>
        )}
        {isReadOnly && (
          <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-amber-50 border border-amber-200 rounded-lg md:rounded-xl text-amber-700 text-[10px] md:text-xs font-semibold w-full sm:w-auto justify-center sm:justify-start">
            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> <span className="truncate">Modo visualização</span>
          </div>
        )}
      </div>


      <AnimatePresence mode="wait">
        {activeTab === "registros" && (
          <motion.div
            key="registros"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <OccurrencesOverview
              records={records}
              onAreaClick={(area) => {
                setAreaFilter(area);
              }}
              onKindClick={(kind) => {
                setKindFilter(kind);
              }}
            />
            <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-3 md:mt-4">
              <div className="overflow-x-auto scrollbar-thin [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent pb-2">
                <div className="flex min-w-max w-full">
                  {(["todos", "ocorrencia", "vistoria", "multa", "notificacao"] as KindFilter[]).map((k) => {
                    const active = kindFilter === k;
                    const label = k === "todos" ? "Todos" : KIND_META[k as RecordKind].plural;
                    const Icon = k === "todos" ? Info : KIND_META[k as RecordKind].icon;
                    return (
                      <button
                        key={k}
                        onClick={() => setKindFilter(k)}
                        className={`flex flex-1 items-center justify-center py-3 md:py-4 px-3 text-xs md:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          active ? "text-[#8B1A1A] bg-[#FAF7F2]" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <span className="relative inline-flex items-center gap-1.5 md:gap-2 pb-1">
                          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> <span>{label}</span>
                          <motion.span
                            aria-hidden
                            className="pointer-events-none absolute left-1/2 bottom-0 h-0.5 bg-[#8B1A1A] rounded-full -translate-x-1/2"
                            initial={false}
                            animate={{ width: active ? "100%" : "0%", opacity: active ? 1 : 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <FiltersBar
                query={query}
                setQuery={setQuery}
                storeFilter={storeFilter}
                setStoreFilter={setStoreFilter}
                stores={stores}
                areaFilter={areaFilter}
                setAreaFilter={setAreaFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                period={period}
                setPeriod={setPeriod}
                kindFilter={kindFilter}
                autoOpen={areaFilter !== "Todas"}
              />

              <AnimatePresence mode="wait">
                <motion.div
                  key={kindFilter}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <RecordsList records={sortedRecords} onOpen={handleOpenDetail} hideStatus={kindFilter === "ocorrencia" || kindFilter === "vistoria" || kindFilter === "notificacao"} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {activeTab === "encerrados" && (
          <motion.div
            key="encerrados"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ClosedTab records={records} onOpen={handleOpenDetail} stores={stores} />
          </motion.div>
        )}

        {activeTab === "atividade" && (
          <motion.div
            key="atividade"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ActivityTab activities={activities} stores={stores} records={records} onOpen={handleOpenDetail} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <SmartForm
            currentUserArea={currentUserArea}
            currentUserName={currentUserName}
            editing={editing}
            prefillKind={prefillKind}
            allRecords={records}
            onClose={() => {
              setShowForm(false);
              setEditing(null);
              setPrefillKind(null);
            }}
            onSaved={(msg) => {
              setShowForm(false);
              setEditing(null);
              setPrefillKind(null);
              toast.push({ kind: "success", title: msg, message: "Ação registrada e notificação enviada." });
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detail && (
          <DetailDrawer
            record={detail}
            allRecords={records}
            onClose={() => {
              setDetailId(null);
              if (searchParams.get("detail")) {
                setSearchParams((p) => { const np = new URLSearchParams(p); np.delete("detail"); return np; }, { replace: true });
              }
            }}
            onEdit={() => {
              setEditing(detail);
              setShowForm(true);
              setDetailId(null);
            }}
            onDelete={() => handleDelete(detail)}
            onOpenAudit={() => setAuditOpen(true)}
            onOpenLinked={(r) => {
              setDetailId(r.id);
            }}
            onOpenStore={(name) => setConformityStore(name)}
          />
        )}
      </AnimatePresence>
      {auditOpen && detail && <AuditModal record={detail} onClose={() => setAuditOpen(false)} />}
      <AnimatePresence>
        {conformityStore && <StoreConformityDrawer storeName={conformityStore} records={records} onClose={() => setConformityStore(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Occurrences Overview ---------- */
function svgArc(cx: number, cy: number, r: number, ir: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = toRad(startDeg), e = toRad(endDeg);
  const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
  const ix1 = cx + ir * Math.cos(s), iy1 = cy + ir * Math.sin(s);
  const ix2 = cx + ir * Math.cos(e), iy2 = cy + ir * Math.sin(e);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} L${ix2} ${iy2} A${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1}Z`;
}

function OccurrencesOverview({ records, onAreaClick, onKindClick }: { records: OpRecord[]; onAreaClick: (area: string) => void; onKindClick: (kind: RecordKind) => void }) {
  const stats = useMemo(() => ({
    ocorrencias: records.filter((r) => r.kind === "ocorrencia").length,
    notificacoes: records.filter((r) => r.kind === "notificacao").length,
    vistorias: records.filter((r) => r.kind === "vistoria").length,
    multas: records.filter((r) => r.kind === "multa").length,
  }), [records]);

  const cards = [
    { label: "Ocorrências", value: stats.ocorrencias, icon: MessageCircle, color: "bg-[#FAF7F2] text-[#8B1A1A]", kind: "ocorrencia" as RecordKind },
    { label: "Notificações", value: stats.notificacoes, icon: Bell, color: "bg-[#E3ECF8] text-[#1B3A6B]", kind: "notificacao" as RecordKind },
    { label: "Vistorias", value: stats.vistorias, icon: ClipboardCheck, color: "bg-[#FFF0E0] text-[#7A3A00]", kind: "vistoria" as RecordKind },
    { label: "Multas", value: stats.multas, icon: Gavel, color: "bg-[#FBE4E4] text-[#8B1A1A]", kind: "multa" as RecordKind },
  ];

  const statusData = useMemo(() => {
    let pendentes = 0, faturadas = 0, pagas = 0, canceladas = 0;
    records.forEach(r => {
      if (r.kind !== "multa") return;
      const s = r.status;
      if (s === "Paga") pagas++;
      else if (s === "Faturada") faturadas++;
      else if (s === "Cancelada") canceladas++;
      else if (s === "Pendente" || s === "Não paga") pendentes++;
    });
    return [
      { name: "Pendentes", value: pendentes, color: "#ef4444" },
      { name: "Faturadas", value: faturadas, color: "#f59e0b" },
      { name: "Pagas", value: pagas, color: "#10b981" },
      { name: "Canceladas", value: canceladas, color: "#9ca3af" },
    ].filter(d => d.value > 0);
  }, [records]);

  const areaData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => { if (r.area) map[r.area] = (map[r.area] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [records]);

  const areaColors = ["#1B3A6B", "#8B1A1A", "#7A3A00", "#d97706", "#4f46e5"];
  const total = statusData.reduce((s, d) => s + d.value, 0);
  const areaMax = areaData.length > 0 ? Math.max(...areaData.map(d => d.value)) : 1;

  const donutSlices = useMemo(() => {
    let angle = 0;
    return statusData.map(d => {
      const sweep = (d.value / total) * 360;
      const path = svgArc(100, 100, 82, 52, angle, angle + sweep - 1);
      angle += sweep;
      return { ...d, path };
    });
  }, [statusData, total]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
      {/* Cards */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 lg:col-span-1">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onKindClick(c.kind)}
              className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8B1A1A]/30 active:scale-[0.98] p-3 md:p-6 flex flex-col justify-center items-center text-center gap-2 md:gap-3 transition-all cursor-pointer min-h-[100px] md:min-h-0"
            >
              <div className={`p-2 md:p-3.5 rounded-lg md:rounded-xl shrink-0 ${c.color}`}><Icon className="w-5 h-5 md:w-7 md:h-7" /></div>
              <div>
                <div className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.label}</div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{c.value}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Donut — Status */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 lg:col-span-1 flex flex-col">
        <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status das Multas</h3>
        {statusData.length > 0 ? (
          <>
            <div className="flex-1 flex items-center justify-center min-h-[200px] md:min-h-[260px]">
              <svg viewBox="0 0 200 200" className="w-44 h-44 md:w-56 md:h-56">
                {donutSlices.map((s, i) => (
                  <path key={i} d={s.path} fill={s.color} />
                ))}
                <text x="100" y="94" textAnchor="middle" style={{ fontSize: 30, fontWeight: 700, fill: "#111827" }}>{total}</text>
                <text x="100" y="114" textAnchor="middle" style={{ fontSize: 11, fontWeight: 600, fill: "#9ca3af" }}>TOTAL</text>
              </svg>
            </div>
            <div className="flex justify-center flex-wrap gap-x-3 md:gap-x-4 gap-y-1.5 md:gap-y-2 mt-2">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 md:gap-1.5 text-[11px] md:text-xs text-gray-600">
                  <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs md:text-sm text-gray-400">Nenhum dado</div>
        )}
      </div>

      {/* Bars — Área */}
      <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 lg:col-span-1 flex flex-col">
        <h3 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 md:mb-4">Registros por Área</h3>
        {areaData.length > 0 ? (
          <div className="flex-1 flex flex-col justify-center gap-3 md:gap-5">
            {areaData.map((d, i) => (
              <button
                key={d.name}
                type="button"
                onClick={() => onAreaClick(d.name)}
                className="w-full text-left group"
              >
                <div className="flex items-center justify-between mb-1 md:mb-1.5">
                  <span className="text-[11px] md:text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">{d.name}</span>
                  <span className="text-[11px] md:text-xs font-bold" style={{ color: areaColors[i % areaColors.length] }}>{d.value}</span>
                </div>
                <div className="h-2.5 md:h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                    style={{ width: `${Math.round((d.value / areaMax) * 100)}%`, backgroundColor: areaColors[i % areaColors.length] }}
                  />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs md:text-sm text-gray-400">Nenhum dado</div>
        )}
      </div>
    </div>
  );
}

/* ---------- Area Hero ---------- */
function AreaHero({ area, count }: { area: Area; count: number }) {
  const s = AREA_STYLES[area];
  const scope = AREA_SCOPE[area];
  const Icon = s.icon;
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${s.bg} ${s.border}`}>
      <div className="p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-center">
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-white/70 ${s.text} shrink-0`}>
          <Icon className="w-7 h-7 md:w-8 md:h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-black uppercase tracking-widest ${s.text} opacity-80 mb-1`}>Área operacional</div>
          <h2 className={`text-xl md:text-2xl font-bold ${s.text}`}>{scope.title}</h2>
          <p className={`text-sm ${s.text} opacity-80 mt-1`}>{scope.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {scope.highlights.map((h) => (
              <span key={h} className="px-2.5 py-1 bg-white/70 rounded-full text-[11px] font-bold text-gray-700">{h}</span>
            ))}
          </div>
        </div>
        <div className={`rounded-2xl bg-white/80 px-4 py-3 text-center shrink-0 ${s.text}`}>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Ativos</div>
          <div className="text-2xl font-bold">{count}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Closed Tab ---------- */
function ClosedTab({ records, onOpen, stores }: { records: OpRecord[]; onOpen: (r: OpRecord) => void; stores: string[] }) {
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("Todas");
  const [kindFilter, setKindFilter] = useState<"todos" | "ocorrencia" | "vistoria" | "multa">("todos");

  const closed = useMemo(() => {
    return records.filter((r) => {
      if (!isRecordClosed(r)) return false;
      if (kindFilter !== "todos" && r.kind !== kindFilter) return false;
      if (storeFilter !== "Todas" && r.store !== storeFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [r.id, r.store, r.subject, r.luc].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, query, storeFilter, kindFilter]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><CheckCheck className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold text-[#6e150e]">Ocorrências Encerradas</h2>
            <p className="text-xs text-gray-500">Vistorias aprovadas, multas faturadas ou canceladas. Acesso e edição liberados.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar encerrados…"
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="appearance-none px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]">
            <option value="Todas">Todas as lojas</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex bg-gray-50 border border-gray-200 rounded-xl p-1 gap-0.5 overflow-x-auto scrollbar-thin [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
            {(["todos", "ocorrencia", "vistoria", "multa"] as const).map((k) => (
              <button key={k} onClick={() => setKindFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${kindFilter === k ? "bg-[#8B1A1A] text-white" : "text-gray-500 hover:text-gray-700"}`}>
                {k === "todos" ? "Todos" : KIND_META[k as RecordKind].plural}
              </button>
            ))}
          </div>
        </div>
      </div>

      {closed.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <CheckCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">Nenhum registro encerrado no período.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <RecordsList records={closed} onOpen={onOpen} hideStatus={kindFilter === "ocorrencia" || kindFilter === "vistoria" || kindFilter === "notificacao"} />
        </div>
      )}
    </div>
  );
}

/* ---------- Filters Bar ---------- */
function FiltersBar({ query, setQuery, storeFilter, setStoreFilter, stores, areaFilter, setAreaFilter, statusFilter, setStatusFilter, sortBy, setSortBy, period, setPeriod, kindFilter, autoOpen }: any) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (autoOpen) setOpen(true);
  }, [autoOpen]);

  const activeCount = [
    storeFilter !== "Todas",
    areaFilter !== "Todas",
    statusFilter !== "Todos" && kindFilter !== "ocorrencia" && kindFilter !== "vistoria" && kindFilter !== "notificacao",
    sortBy !== "recent",
    period !== "all",
  ].filter(Boolean).length;

  function clearAll() {
    setStoreFilter("Todas");
    setAreaFilter("Todas");
    setStatusFilter("Todos");
    setSortBy("recent");
    setPeriod("all");
  }

  return (
    <div className="p-3 md:p-4 bg-[#FAF7F2]/50 border-b border-gray-100 space-y-2 md:space-y-3">
      {/* Active area filter badge */}
      {areaFilter !== "Todas" && (
        <div className="flex items-center gap-2 p-2 bg-white border border-[#8B1A1A]/20 rounded-lg md:rounded-xl">
          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
            <Filter className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#8B1A1A] shrink-0" />
            <span className="text-[10px] md:text-xs font-bold text-gray-700 shrink-0">Filtrando por área:</span>
            <span className={`inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold ${AREA_STYLES[areaFilter as Area].bg} ${AREA_STYLES[areaFilter as Area].text} truncate`}>
              {(() => {
                const Icon = AREA_STYLES[areaFilter as Area].icon;
                return <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />;
              })()}
              <span className="truncate">{areaFilter}</span>
            </span>
          </div>
          <button
            onClick={() => setAreaFilter("Todas")}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            title="Remover filtro de área"
          >
            <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      )}
      {/* Row 1: search + filter toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 md:left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="w-full pl-8 md:pl-10 pr-8 md:pr-9 py-2 md:py-2.5 bg-white border border-gray-200 rounded-lg md:rounded-xl text-xs md:text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] focus:border-[#8B1A1A] transition-all"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={`relative inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg md:rounded-xl border text-xs md:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
            open || activeCount > 0
              ? "bg-[#8B1A1A] text-white border-[#8B1A1A]"
              : "bg-white text-gray-600 border-gray-200 hover:border-[#8B1A1A] hover:text-[#8B1A1A]"
          }`}
        >
          <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="absolute -top-1 md:-top-1.5 -right-1 md:-right-1.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-white text-[#8B1A1A] border border-[#8B1A1A] rounded-full text-[9px] md:text-[10px] font-black flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: collapsible filter panel */}
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="appearance-none px-2.5 md:px-3 py-2 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
          >
            <option value="Todas">Todas as lojas</option>
            {stores.map((s: string) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="appearance-none px-2.5 md:px-3 py-2 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
          >
            <option value="Todas">Todas as áreas</option>
            <option value="Arquitetura">Arquitetura</option>
            <option value="Engenharia">Engenharia</option>
            <option value="Brigada">Brigada</option>
          </select>
          {kindFilter !== "ocorrencia" && kindFilter !== "vistoria" && kindFilter !== "notificacao" && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none px-2.5 md:px-3 py-2 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
            >
              <option value="Todos">Qualquer status</option>
              <option value="Pendente">Pendente</option>
              <option value="Faturada">Faturada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none px-2.5 md:px-3 py-2 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
          >
            <option value="recent">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="alpha">A-Z por loja</option>
            <option value="luc">Por LUC</option>
          </select>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none px-2.5 md:px-3 py-2 bg-white border border-gray-200 rounded-lg md:rounded-xl text-[11px] md:text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
          >
            <option value="all">Todo o período</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
          {activeCount > 0 && (
            <button
              onClick={clearAll}
              className="sm:col-span-2 lg:col-span-4 text-[11px] md:text-xs font-semibold text-[#8B1A1A] hover:underline text-right pt-1 cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Records List (responsive: table desktop, cards mobile) ---------- */
function RecordsList({ records, onOpen, hideStatus }: { records: OpRecord[]; onOpen: (r: OpRecord) => void; hideStatus?: boolean }) {
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [records]);
  const perPage = 10;
  const paginated = useMemo(() => records.slice((page - 1) * perPage, page * perPage), [records, page]);

  if (records.length === 0) {
    return <div className="p-12 md:p-16 text-center text-gray-400 text-sm">Nenhum registro encontrado.</div>;
  }
  return (
    <div className="flex flex-col">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] uppercase tracking-widest text-gray-500 font-bold">
              <th className="p-4 pl-6">Loja</th>
              <th className="p-4">LUC</th>
              <th className="p-4">Data</th>
              <th className="p-4">Tipo / Área</th>
              <th className="p-4">Assunto</th>
              {!hideStatus && <th className="p-4">Status</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((r) => {
              const areaStyle = r.area ? AREA_STYLES[r.area] : null;
              const AreaIcon = areaStyle?.icon;
              const KindIcon = KIND_META[r.kind].icon;
              return (
                <tr key={r.id} onClick={() => onOpen(r)} className="hover:bg-[#FAF7F2] transition-all cursor-pointer">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${areaStyle?.bg ?? "bg-gray-100"}`}>
                        {AreaIcon ? <AreaIcon className={`w-4 h-4 ${areaStyle?.text}`} /> : <Bell className="w-4 h-4 text-gray-500" />}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{r.store}</span>
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAF7F2] text-[#8B1A1A] shrink-0"
                        title={KIND_META[r.kind].label}
                      >
                        <KindIcon className="w-3 h-3" />
                      </span>
                    </div>
                  </td>
                  <td className="p-4"><span className="text-sm font-bold text-[#8B1A1A]">{r.luc}</span></td>
                  <td className="p-4"><span className="text-sm text-gray-600">{formatDate(r.date)}</span></td>
                  <td className="p-4">{r.area ? <AreaBadge area={r.area} /> : <span className="text-xs text-gray-400 italic">—</span>}</td>
                  <td className="p-4">
                    <div className="text-sm text-gray-900 font-medium max-w-md truncate">{r.subject}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      #{r.id}
                      {r.linkedRecordIds && r.linkedRecordIds.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8B1A1A] font-bold"><Link2 className="w-3 h-3" />{r.linkedRecordIds.length}</span>
                      )}
                      {r.externalSource && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider border border-indigo-100" title={r.externalRef ? `Ref. externa: ${r.externalRef}` : undefined}>
                          Externo · {r.externalSource}
                        </span>
                      )}
                    </div>
                  </td>
                  {!hideStatus && (
                    <td className="p-4">
                      <StatusBadge value={r.result || r.status} />
                      {r.kind === "multa" && r.amount !== undefined && (
                        <div className="text-xs font-bold text-[#8B1A1A] mt-1">{formatBRL(r.amount)}</div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {paginated.map((r) => {
          const areaStyle = r.area ? AREA_STYLES[r.area] : null;
          const AreaIcon = areaStyle?.icon;
          const KindIcon = KIND_META[r.kind].icon;
          return (
            <button
              key={r.id}
              onClick={() => onOpen(r)}
              className="w-full text-left p-4 hover:bg-[#FAF7F2] active:bg-[#f5ede3] transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-lg ${areaStyle?.bg ?? "bg-gray-100"} shrink-0`}>
                    {AreaIcon ? <AreaIcon className={`w-4 h-4 ${areaStyle?.text}`} /> : <Bell className="w-4 h-4 text-gray-500" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-bold text-gray-900 truncate">{r.store}</span>
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FAF7F2] text-[#8B1A1A] shrink-0"
                        title={KIND_META[r.kind].label}
                      >
                        <KindIcon className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-[#8B1A1A]">{r.luc} · #{r.id}</div>
                  </div>
                </div>
                {!hideStatus && <StatusBadge value={r.result || r.status} />}
              </div>
              <div className="text-sm text-gray-800 font-medium mb-1.5 line-clamp-2">{r.subject}</div>
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1"><KindIcon className="w-3 h-3" />{KIND_META[r.kind].label}</span>
                <span>{formatDate(r.date)}</span>
                {r.kind === "multa" && r.amount !== undefined && (
                  <span className="font-bold text-[#8B1A1A]">{formatBRL(r.amount)}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <SimplePagination page={page} setPage={setPage} total={records.length} perPage={perPage} />
    </div>
  );
}

/* ---------- Processes Tab ---------- */
function ProcessesTab({ records, onOpen, onNew, stores }: { records: OpRecord[]; onOpen: (r: OpRecord) => void; onNew: () => void; stores: string[] }) {
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("Todas");
  const processes = useMemo(() => {
    return records.filter((r) => r.kind === "interacao" && r.processStatus !== "finalizado").filter((r) => {
      if (storeFilter !== "Todas" && r.store !== storeFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [r.id, r.store, r.subject, r.details, r.luc].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, query, storeFilter]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [processes]);
  const perPage = 10;
  const paginatedProcesses = useMemo(() => processes.slice((page - 1) * perPage, page * perPage), [processes, page]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#6e150e] flex items-center gap-2"><GitBranch className="w-5 h-5" /> Processos Integrados</h2>
            <p className="text-xs text-gray-500 mt-0.5">Demandas formais que atravessam áreas (Engenharia · Arquitetura · Brigada) e podem relacionar outros registros.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por processo, loja ou LUC…"
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="appearance-none px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
          >
            <option value="Todas">Todas as lojas</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> Processos finalizados ficam disponíveis na aba <strong>Encerrados</strong>.</p>
      </div>

      {processes.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <GitBranch className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm">Nenhum processo encontrado.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {paginatedProcesses.map((r) => <ProcessCard key={r.id} record={r} onOpen={onOpen} />)}
          </div>
          <SimplePagination page={page} setPage={setPage} total={processes.length} perPage={perPage} />
        </>
      )}
    </div>
  );
}

function ProcessCard({ record, onOpen }: { record: OpRecord; onOpen: (r: OpRecord) => void }) {
  const steps = record.workflowSteps || [];
  const currentIdx = record.currentStepIndex ?? 0;
  const isComplete = record.processStatus === "finalizado";
  const linkedCount = record.linkedRecordIds?.length || 0;

  return (
    <button
      onClick={() => onOpen(record)}
      className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#8B1A1A]/30 transition-all p-4 md:p-5 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#8B1A1A] mb-1">
            <span>#{record.id}</span>
            <span>·</span>
            <span>{record.luc}</span>
            {linkedCount > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#FAF7F2] rounded-full text-[10px]">
                <Link2 className="w-3 h-3" /> {linkedCount}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-gray-900 line-clamp-2">{record.subject}</div>
          <div className="text-xs text-gray-500 mt-1">{record.store}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B1A1A] shrink-0" />
      </div>

      {steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const style = AREA_STYLES[s.area];
              const Icon = style.icon;
              const isCurrent = s.status === "current";
              const isDone = s.status === "completed";
              return (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isDone ? "bg-[#8B1A1A] text-white" : isCurrent ? `${style.bg} ${style.text} ring-2 ${style.ring}/40` : "bg-gray-100 text-gray-400"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${isDone ? "bg-[#8B1A1A]" : "bg-gray-200"}`} />}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
              {isComplete ? "Concluído" : `Em ${steps[currentIdx]?.area || "andamento"}`}
            </span>
            {record.dueDate && (
              <span className="text-[10px] text-gray-500 inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> prazo {formatDate(record.dueDate)}</span>
            )}
          </div>
        </div>
      )}
    </button>
  );
}

/* ---------- Activity Tab ---------- */
function ActivityTab({ activities, stores, records, onOpen }: { activities: ActivityLog[]; stores: string[]; records: OpRecord[]; onOpen: (r: OpRecord) => void }) {
  const [query, setQuery] = useState("");
  const [storeFilter, setStoreFilter] = useState("Todas");
  const [processStatusFilter, setProcessStatusFilter] = useState<"todos" | "andamento" | "concluidos">("todos");
  const [areaFilter, setAreaFilter] = useState<"Todas" | Area>("Todas");
  const [kindFilter, setKindFilter] = useState<"todos" | RecordKind>("todos");
  const [actionFilter, setActionFilter] = useState<"todas" | ActivityLog["action"]>("todas");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const recordById = useMemo(() => {
    const m = new Map<string, OpRecord>();
    records.forEach((r) => m.set(r.id, r));
    return m;
  }, [records]);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      const r = recordById.get(a.recordId);
      if (storeFilter !== "Todas" && a.store !== storeFilter) return false;
      if (areaFilter !== "Todas" && r?.area !== areaFilter) return false;
      if (kindFilter !== "todos" && a.kind !== kindFilter) return false;
      if (actionFilter !== "todas" && a.action !== actionFilter) return false;
      if (processStatusFilter !== "todos") {
        const closed = r ? isRecordClosed(r) : false;
        if (processStatusFilter === "concluidos" && !closed) return false;
        if (processStatusFilter === "andamento" && closed) return false;
      }
      if (dateFrom && new Date(a.at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.at) > new Date(dateTo + "T23:59:59")) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return a.store.toLowerCase().includes(q) || a.recordId.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q) || a.luc.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [activities, query, storeFilter, processStatusFilter, areaFilter, kindFilter, actionFilter, dateFrom, dateTo, recordById]);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  useEffect(() => { setPage(1); }, [filtered, perPage]);
  const paginatedActivities = useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page, perPage]);

  function clearFilters() {
    setQuery(""); setStoreFilter("Todas"); setProcessStatusFilter("todos");
    setAreaFilter("Todas"); setKindFilter("todos"); setActionFilter("todas");
    setDateFrom(""); setDateTo("");
  }

  const grouped = useMemo(() => {
    const g: Record<string, ActivityLog[]> = {};
    paginatedActivities.forEach((a) => { (g[a.store] = g[a.store] || []).push(a); });
    return g;
  }, [paginatedActivities]);

  const actionMap: Record<ActivityLog["action"], { label: string; color: string; icon: any }> = {
    create: { label: "Cadastro", color: "text-emerald-600 bg-emerald-50", icon: Plus },
    update: { label: "Edição", color: "text-blue-600 bg-blue-50", icon: Edit3 },
    delete: { label: "Exclusão", color: "text-red-600 bg-red-50", icon: Trash2 },
    view: { label: "Consulta", color: "text-amber-600 bg-amber-50", icon: Eye },
  };

  const activeFilterCount = [
    storeFilter !== "Todas",
    areaFilter !== "Todas",
    kindFilter !== "todos",
    actionFilter !== "todas",
    processStatusFilter !== "todos",
    !!dateFrom || !!dateTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        {/* Row 1: search + filter toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por loja, ID, LUC ou assunto…"
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer shrink-0 ${
              filtersOpen || activeFilterCount > 0
                ? "bg-[#8B1A1A] text-white border-[#8B1A1A]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#8B1A1A] hover:text-[#8B1A1A]"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[#8B1A1A] border border-[#8B1A1A] rounded-full text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Row 2: collapsible advanced filters */}
        {filtersOpen && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer">
                <option value="Todas">Todas as lojas</option>
                {stores.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value as "Todas" | Area)} className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer">
                <option value="Todas">Todas as áreas</option>
                <option value="Brigada">Brigada</option>
                <option value="Engenharia">Engenharia</option>
                <option value="Arquitetura">Arquitetura</option>
              </select>
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "todos" | RecordKind)} className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer">
                <option value="todos">Todos os tipos</option>
                <option value="vistoria">Vistorias</option>
                <option value="multa">Multas</option>
                <option value="notificacao">Notificações</option>
              </select>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value as "todas" | ActivityLog["action"])} className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer">
                <option value="todas">Todas as ações</option>
                <option value="create">Cadastros</option>
                <option value="update">Edições</option>
                <option value="view">Consultas</option>
              </select>
              <select value={processStatusFilter} onChange={(e) => setProcessStatusFilter(e.target.value as "todos" | "andamento" | "concluidos")} className="appearance-none px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer">
                <option value="todos">Qualquer status</option>
                <option value="andamento">Em andamento</option>
                <option value="concluidos">Concluídos</option>
              </select>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                />
                <span className="text-gray-400 text-xs shrink-0">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs font-semibold text-[#8B1A1A] hover:underline cursor-pointer">
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] text-gray-500 font-medium">
            {filtered.length} {filtered.length === 1 ? "evento encontrado" : "eventos encontrados"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 hidden sm:inline">Itens por página:</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="appearance-none px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([store, list]) => (
          <div key={store} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Building className="w-4 h-4 text-[#8B1A1A]" /> {store}</h3>
              <span className="text-[10px] font-bold text-[#8B1A1A] bg-white px-2 py-1 rounded-lg border border-gray-200">LUC: {list[0].luc}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {list.map((a) => {
                const act = actionMap[a.action];
                const ActIcon = act.icon;
                const r = recordById.get(a.recordId);
                return (
                  <button
                    key={a.id}
                    onClick={() => r && onOpen(r)}
                    disabled={!r}
                    className="w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors disabled:cursor-default"
                  >
                    <div className={`p-2 rounded-lg ${act.color}`}><ActIcon className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-gray-900">{act.label} de {ACTIVITY_KIND_META[a.kind].label}</span>
                          {r && <AreaBadge area={r.area} />}
                          {r && isRecordClosed(r) && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Concluído</span>}
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium shrink-0">{formatDateTime(a.at)}</span>
                      </div>
                      <div className="text-sm text-gray-600 truncate"><span className="font-bold text-[#8B1A1A]">{a.recordId}</span> — {a.subject}</div>
                      <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Por <strong>{a.user}</strong></span>
                        {a.externalSource && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider border border-indigo-100">
                            Externo · {a.externalSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && <div className="p-16 text-center text-gray-400 text-sm bg-white rounded-2xl border border-dashed border-gray-200">Nenhuma atividade registrada.</div>}
      </div>
      <SimplePagination page={page} setPage={setPage} total={filtered.length} perPage={perPage} />
    </div>
  );
}

/* ---------- Detail Drawer ---------- */
function DetailDrawer({ record, allRecords, onClose, onEdit, onDelete, onOpenAudit, onOpenLinked, onOpenStore }: { record: OpRecord; allRecords: OpRecord[]; onClose: () => void; onEdit: () => void; onDelete: () => void; onOpenAudit: () => void; onOpenLinked: (r: OpRecord) => void; onOpenStore: (name: string) => void }) {
  const toast = useToast();
  const drawerUser = useCurrentUser();
  const drawerPerms = useCurrentPermissions();
  const isReadOnly = !drawerPerms.editRecords;
  const KindIcon = KIND_META[record.kind].icon;
  const currentUserName = drawerUser?.nome ?? "Gerente JP Mall";
  const steps = record.workflowSteps || [];
  const hasWorkflow = steps.length > 0;
  const currentIdx = record.currentStepIndex ?? 0;
  const canAdvance = hasWorkflow && currentIdx < steps.length - 1;
  const canRevert = hasWorkflow && currentIdx > 0;

  const isProcess = record.kind === "interacao";
  const isFinalized = record.processStatus === "finalizado";
  const atLastStep = hasWorkflow && currentIdx === steps.length - 1;
  const currentStepSubmitted = hasWorkflow && isStepSubmitted(steps[currentIdx]);

  const linkedRecords = useMemo(() => {
    const ids = record.linkedRecordIds || [];
    return allRecords.filter((r) => ids.includes(r.id));
  }, [record, allRecords]);

  const relatedBackRefs = useMemo(() => {
    return allRecords.filter((r) => (r.linkedRecordIds || []).includes(record.id));
  }, [record, allRecords]);

  const [viewerAtt, setViewerAtt] = useState<Attachment | null>(null);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end"
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
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-start justify-between bg-[#FAF7F2]">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <AreaBadge area={record.area} />
              <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                <KindIcon className="w-3 h-3" /> {KIND_META[record.kind].label}
              </span>
              <span className="text-[10px] font-bold text-[#8B1A1A]">#{record.id}</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">{record.subject}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium flex-wrap">
              <button onClick={() => onOpenStore(record.store)} className="flex items-center gap-1.5 hover:text-[#8B1A1A] hover:underline transition-colors font-medium">
                <Building className="w-4 h-4" /> {record.store}
              </button>
              <span>·</span>
              <div className="text-[#8B1A1A] font-bold">{record.luc}</div>
              <span>·</span>
              <div>{formatDate(record.date)}</div>
            </div>
          </div>
          <button aria-label="Fechar detalhes" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-full shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-6 flex-1">
          {hasWorkflow && (
            <Section title={isFinalized ? "Fluxo de Processo · Finalizado" : "Fluxo de Processo"}>
              {isFinalized && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-emerald-800">Processo finalizado</div>
                    <div className="text-xs text-emerald-700 mt-0.5">Por <strong>{record.finalizedBy}</strong> em {record.finalizedAt ? formatDateTime(record.finalizedAt) : "—"}</div>
                    {record.finalReport && <div className="text-xs text-gray-700 mt-2 p-2 bg-white rounded-lg border border-emerald-100 whitespace-pre-wrap">{record.finalReport}</div>}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                {steps.map((step, idx) => {
                  const style = AREA_STYLES[step.area];
                  const StepIcon = style.icon;
                  const isCompleted = step.status === "completed";
                  const isCurrent = step.status === "current" && !isFinalized;
                  const submitted = isStepSubmitted(step);
                  return (
                    <div key={`${step.area}-${idx}`} className="flex flex-col items-center flex-1 relative">
                      {idx > 0 && <div className={`absolute top-6 -left-1/2 w-full h-0.5 ${isCompleted || idx <= currentIdx ? "bg-[#8B1A1A]" : "bg-gray-200"} -z-10`} />}
                      <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 transition-all relative ${isCompleted ? "bg-[#8B1A1A] text-white ring-4 ring-[#8B1A1A]/20" : isCurrent ? `${style.bg} ${style.text} ring-4 ${style.ring}/30` : "bg-gray-100 text-gray-400"}`}>
                        <StepIcon className="w-5 h-5 md:w-6 md:h-6" />
                        {submitted && !isCompleted && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] md:text-xs font-bold text-center ${isCurrent ? style.text : isCompleted ? "text-[#8B1A1A]" : "text-gray-500"}`}>{step.area}</div>
                      {isCurrent && <div className={`text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>Em curso</div>}
                    </div>
                  );
                })}
              </div>

              {/* Per-step cards */}
              <div className="space-y-2.5">
                {steps.map((step, idx) => (
                  <StepCard
                    key={`${step.area}-${idx}-card`}
                    recordId={record.id}
                    step={step}
                    stepIndex={idx}
                    isCurrent={step.status === "current" && !isFinalized}
                    isCompleted={step.status === "completed"}
                    isLocked={isFinalized || step.status === "pending"}
                    currentUser={currentUserName}
                  />
                ))}
              </div>

              {/* Actions */}
              {!isFinalized && (
                <div className="mt-4 space-y-2">
                  <div className="flex gap-2">
                    <button onClick={() => revertWorkflow(record.id, currentUserName)} disabled={!canRevert} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${canRevert ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                      <ArrowLeft className="w-4 h-4" /> Retornar
                    </button>
                    {!atLastStep && (
                      <button
                        onClick={() => advanceWorkflow(record.id, currentUserName)}
                        disabled={!canAdvance || !currentStepSubmitted}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold ${canAdvance && currentStepSubmitted ? "bg-[#8B1A1A] text-white hover:bg-[#a43030] shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                      >
                        Avançar <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                    {atLastStep && (
                      <FinalizeButton
                        recordId={record.id}
                        disabled={!currentStepSubmitted}
                        currentUser={currentUserName}
                      />
                    )}
                  </div>
                  {!currentStepSubmitted && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>Preencha a <strong>entrega da área atual</strong> antes de avançar ou finalizar o processo.</span>
                    </div>
                  )}
                </div>
              )}

              {isFinalized && (
                <button
                  onClick={() => reopenProcess(record.id, currentUserName)}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Unlock className="w-4 h-4" /> Reabrir processo
                </button>
              )}
            </Section>
          )}

          <Section title="Descrição">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{record.details}</p>
          </Section>

          {record.kind === "notificacao" && (
            <NotificationDetail record={record} currentUser={currentUserName} />
          )}

          <div className="grid grid-cols-2 gap-3">
            {record.taxonomy && <InfoBox label="Categoria" value={record.taxonomy} />}
            {record.result && <InfoBox label="Resultado" value={<StatusBadge value={record.result} />} />}
            {record.status && <InfoBox label="Status" value={<StatusBadge value={record.status} />} />}
            {record.amount !== undefined && <InfoBox label="Valor" value={formatBRL(record.amount)} />}
            {record.dueDate && <InfoBox label="Prazo" value={formatDate(record.dueDate)} />}
          </div>

          {(linkedRecords.length > 0 || relatedBackRefs.length > 0) && (
            <Section title={`Vinculações (${linkedRecords.length + relatedBackRefs.length})`}>
              <div className="space-y-2">
                {linkedRecords.map((r) => <LinkedRecordItem key={r.id} record={r} direction="out" onClick={() => onOpenLinked(r)} />)}
                {relatedBackRefs.map((r) => <LinkedRecordItem key={r.id} record={r} direction="in" onClick={() => onOpenLinked(r)} />)}
              </div>
            </Section>
          )}

          <Section title={`Evidências (${record.attachments.length})`}>
            {record.attachments.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhuma evidência anexada.</p>
            ) : (
              <div className="grid gap-2">
                {record.attachments.map((a, i) => {
                  const hasData = !!getAttachmentHref(a);
                  return (
                    <div
                      key={a.id || `${a.name}-${i}`}
                      className={`flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50 transition-all group ${hasData ? "hover:border-[#8B1A1A] cursor-pointer" : ""}`}
                      onClick={() => hasData && setViewerAtt(a)}
                      title={hasData ? "Clique para visualizar" : "Anexo sem conteúdo disponível"}
                    >
                      <div className="p-2 bg-white rounded-lg text-[#8B1A1A] shadow-sm"><FileText className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{a.name}</div>
                        <div className="text-[10px] text-gray-500 uppercase font-bold">{a.size}{a.mimeType ? ` · ${a.mimeType.split("/")[1] || a.mimeType}` : ""}</div>
                      </div>
                      <button
                        type="button"
                        disabled={!hasData}
                        onClick={(e) => { e.stopPropagation(); downloadAttachment(a); }}
                        className={`p-1.5 rounded-lg transition-colors ${hasData ? "text-gray-400 hover:text-[#8B1A1A] hover:bg-white" : "text-gray-200 cursor-not-allowed"}`}
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>

        <div className="p-5 md:p-6 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-3 sticky bottom-0">
          {record.kind === "notificacao" && (
            <button onClick={() => exportNotificationHTML(record)} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4" /> Exportar notificação
            </button>
          )}
          <button onClick={onOpenAudit} className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
            <History className="w-4 h-4" /> Log de Auditoria ({record.audit.length})
          </button>
          {!isReadOnly && (
            <div className="flex gap-2">
              <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-[#8B1A1A] text-[#8B1A1A] rounded-xl text-sm font-bold hover:bg-[#FAF7F2]">
                <Edit3 className="w-4 h-4" /> Editar
              </button>
              <button onClick={onDelete} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#8B1A1A] text-white rounded-xl text-sm font-bold hover:bg-[#a43030]">
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <AttachmentViewerHost attachment={viewerAtt} onClose={() => setViewerAtt(null)} />
    </motion.div>
  );
}

function StepCard({ recordId, step, stepIndex, isCurrent, isCompleted, isLocked, currentUser }: { recordId: string; step: WorkflowStep; stepIndex: number; isCurrent: boolean; isCompleted: boolean; isLocked: boolean; currentUser: string }) {
  const style = AREA_STYLES[step.area];
  const Icon = style.icon;
  const [open, setOpen] = useState(isCurrent);
  const [deliverable, setDeliverable] = useState(step.deliverable || "");
  const [files, setFiles] = useState(step.stepAttachments || []);
  const [comment, setComment] = useState("");
  const [focused, setFocused] = useState(false);
  const submitted = isStepSubmitted(step);

  useEffect(() => {
    if (!focused) setDeliverable(step.deliverable || "");
    setFiles(step.stepAttachments || []);
  }, [step.deliverable, step.stepAttachments, focused]);

  useEffect(() => {
    if (!focused) return;
    if (deliverable === (step.deliverable || "")) return;
    const t = setTimeout(() => {
      submitStepWork(recordId, stepIndex, { deliverable, attachments: files }, currentUser);
    }, 180);
    return () => clearTimeout(t);
  }, [deliverable, focused, files, recordId, stepIndex, currentUser, step.deliverable]);

  function saveWork() {
    submitStepWork(recordId, stepIndex, { deliverable, attachments: files }, currentUser);
  }

  const stepFileInput = useRef<HTMLInputElement | null>(null);
  const [stepViewerAtt, setStepViewerAtt] = useState<Attachment | null>(null);

  async function handleStepFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const validFiles = Array.from(list).filter(f => {
      if (f.size > 25 * 1024 * 1024) {
        alert(`O arquivo ${f.name} excede o limite de 25MB.`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    const added = await filesToAttachments(validFiles);
    const next = [...files, ...added];
    setFiles(next);
    submitStepWork(recordId, stepIndex, { deliverable, attachments: next }, currentUser);
  }

  function removeFile(att: Attachment) {
    const next = files.filter((f) => (f.id || f.name) !== (att.id || att.name));
    setFiles(next);
    submitStepWork(recordId, stepIndex, { deliverable, attachments: next }, currentUser);
  }

  function sendComment() {
    if (!comment.trim()) return;
    addStepComment(recordId, stepIndex, comment, currentUser);
    setComment("");
  }

  const comments = step.comments || [];
  const headerBg = isCompleted ? "bg-[#FAF7F2]" : isCurrent ? style.bg : "bg-gray-50";
  const headerText = isCompleted ? "text-[#6e150e]" : isCurrent ? style.text : "text-gray-500";

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isCurrent ? `border-[#8B1A1A]/40 shadow-sm` : "border-gray-100"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 p-3 ${headerBg} hover:brightness-95 transition-all`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-[#8B1A1A] text-white" : isCurrent ? "bg-white/70" : "bg-white"} ${headerText}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className={`text-sm font-bold ${headerText}`}>{stepIndex + 1}. {step.area}</div>
          <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            {isCompleted && step.completedBy && <span>Concluído por {step.completedBy} · {step.completedAt ? formatDate(step.completedAt) : ""}</span>}
            {isCurrent && !submitted && <span className="inline-flex items-center gap-1 text-amber-700 font-bold"><AlertCircle className="w-3 h-3" /> Entrega pendente</span>}
            {isCurrent && submitted && <span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><CheckCircle2 className="w-3 h-3" /> Entrega registrada</span>}
            {!isCurrent && !isCompleted && <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Aguardando etapa anterior</span>}
            {comments.length > 0 && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {comments.length}</span>}
            {(step.stepAttachments?.length || 0) > 0 && <span className="inline-flex items-center gap-1"><Paperclip className="w-3 h-3" /> {step.stepAttachments!.length}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="p-4 bg-white space-y-4">
          {/* Entrega / Deliverable */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Entrega da Área {step.area}</label>
            {isLocked || isCompleted ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 border border-gray-100 rounded-xl min-h-[60px]">
                {step.deliverable || <span className="italic text-gray-400">Sem entrega registrada.</span>}
              </div>
            ) : (
              <>
                <textarea
                  maxLength={1000}
                  value={deliverable}
                  onChange={(e) => setDeliverable(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => { setFocused(false); saveWork(); }}
                  rows={3}
                  placeholder={placeholderFor(step.area)}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[10px] text-gray-400">Salvo automaticamente. Documentos e comentários são opcionais.</p>
                  {submitted && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Salvo</span>}
                </div>
              </>
            )}
          </div>

          {/* Anexos */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Documentos & Evidências</label>
            <div className="space-y-1.5">
              {files.map((f, i) => {
                const hasData = !!getAttachmentHref(f);
                return (
                  <div key={f.id || `${f.name}-${i}`} className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl bg-gray-50">
                    <FileText className="w-4 h-4 text-[#8B1A1A] shrink-0" />
                    <button
                      type="button"
                      disabled={!hasData}
                      onClick={() => hasData && setStepViewerAtt(f)}
                      className={`flex-1 min-w-0 text-left ${hasData ? "cursor-pointer hover:text-[#8B1A1A]" : "cursor-default"}`}
                      title={hasData ? "Visualizar" : ""}
                    >
                      <div className="text-xs font-bold text-gray-800 truncate">{f.name}</div>
                      <div className="text-[9px] text-gray-500 uppercase">{f.size}</div>
                    </button>
                    <button
                      type="button"
                      disabled={!hasData}
                      onClick={() => downloadAttachment(f)}
                      className={`p-1 rounded ${hasData ? "text-gray-400 hover:text-[#8B1A1A]" : "text-gray-200 cursor-not-allowed"}`}
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {!isLocked && !isCompleted && (
                      <button aria-label="Remover anexo" onClick={() => removeFile(f)} className="text-gray-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                );
              })}
              {!isLocked && !isCompleted && (
                <>
                  <input
                    ref={stepFileInput}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => { handleStepFiles(e.target.files); e.target.value = ""; }}
                  />
                  <button
                    type="button"
                    onClick={() => stepFileInput.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:border-[#8B1A1A] hover:bg-[#FAF7F2] transition-all text-xs font-bold text-gray-400 hover:text-[#8B1A1A]"
                  >
                    <Upload className="w-4 h-4" /> Anexar documento
                  </button>
                </>
              )}
              {(isLocked || isCompleted) && files.length === 0 && (
                <p className="text-xs text-gray-400 italic">Nenhum anexo registrado.</p>
              )}
            </div>
          </div>

          {/* Comentários */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Comentários ({comments.length})</label>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {comments.length === 0 && <p className="text-xs text-gray-400 italic">Nenhum comentário nesta etapa.</p>}
              {comments.map((c) => (
                <div key={c.id} className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#6e150e]">{c.user}</span>
                    <span className="text-[10px] text-gray-400">{formatDateTime(c.at)}</span>
                  </div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap">{c.text}</div>
                </div>
              ))}
            </div>
            {!isLocked && (
              <div className="mt-2 flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendComment(); }}
                  placeholder={`Comentar como ${step.area}...`}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                />
                <button onClick={sendComment} disabled={!comment.trim()} className={`px-3 rounded-xl ${comment.trim() ? "bg-[#8B1A1A] text-white hover:bg-[#a43030]" : "bg-gray-100 text-gray-400"} transition-all`}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <AttachmentViewerHost attachment={stepViewerAtt} onClose={() => setStepViewerAtt(null)} />
    </div>
  );
}

function placeholderFor(area: Area): string {
  switch (area) {
    case "Engenharia":
      return "Ex.: Laudo técnico emitido. Viabilidade elétrica confirmada com adequação do disjuntor principal...";
    case "Arquitetura":
      return "Ex.: Projeto revisado conforme manual do lojista. Fachada aprovada com ajustes de comunicação visual...";
    case "Brigada":
      return "Ex.: Rota de fuga validada. AVCB vigente. Extintores dentro do prazo. Liberação emitida...";
    default:
      return "Descreva o resultado desta etapa...";
  }
}

function FinalizeButton({ recordId, disabled, currentUser }: { recordId: string; disabled: boolean; currentUser: string }) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");

  function confirm() {
    finalizeProcess(recordId, currentUser, report);
    setOpen(false);
    setReport("");
  }

  return (
    <>
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"}`}
      >
        <CheckCircle2 className="w-4 h-4" /> Finalizar Processo
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Finalizar Processo</h3>
                <p className="text-xs text-gray-500">Registre o parecer conclusivo e encerre o fluxo.</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Parecer Final (Opcional)</label>
              <textarea
                maxLength={1000}
                value={report}
                onChange={(e) => setReport(e.target.value)}
                rows={4}
                placeholder="Resumo da conclusão, recomendações e próximos passos..."
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium resize-none focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
              />
              <p className="text-[11px] text-gray-500">Após finalizar, o processo ficará bloqueado para edição (pode ser reaberto por gestores).</p>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={confirm} className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-sm">Confirmar Finalização</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LinkedRecordItem({ record, direction, onClick }: { record: OpRecord; direction: "in" | "out"; onClick: () => void }) {
  const KindIcon = KIND_META[record.kind].icon;
  return (
    <button onClick={onClick} className="w-full text-left flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-white hover:border-[#8B1A1A] hover:bg-[#FAF7F2]/50 transition-all group">
      <div className="p-2 bg-[#FAF7F2] rounded-lg text-[#8B1A1A]">
        {direction === "in" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[#8B1A1A] mb-0.5">
          <KindIcon className="w-3 h-3" />
          {KIND_META[record.kind].label} · #{record.id}
        </div>
        <div className="text-sm font-medium text-gray-900 truncate">{record.subject}</div>
        <div className="text-[10px] text-gray-500">{direction === "in" ? "Gerou este registro" : "Vinculado a"}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#8B1A1A]" />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{title}</h3>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

/* ---------- Notification detail (read-only archive: conversation + attachments) ---------- */
function NotificationDetail({ record }: { record: OpRecord; currentUser: string }) {
  const conversation = record.conversation || [];
  return (
    <div className="space-y-6">
      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-2 text-xs text-indigo-800">
        <Info className="w-4 h-4 shrink-0" />
        <span>Notificação importada de <strong>{record.externalSource || "sistema externo"}</strong>{record.externalRef ? ` · Ref. ${record.externalRef}` : ""}. Registro arquivado, somente leitura.</span>
      </div>

      <Section title={`Conversa (${conversation.length})`}>
        {conversation.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhuma mensagem registrada.</p>
        ) : (
          <div className="space-y-3">
            {conversation.map((m) => {
              const fromLojista = m.from === "lojista";
              return (
                <div key={m.id} className={`flex ${fromLojista ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 border ${fromLojista ? "bg-white border-gray-200" : "bg-[#FAF7F2] border-[#E8DCCB]"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${fromLojista ? "text-indigo-700" : "text-[#8B1A1A]"}`}>
                        {fromLojista ? "Lojista" : "Gestão"}
                      </span>
                      <span className="text-[10px] text-gray-400">· {m.author}</span>
                    </div>
                    <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{m.text}</div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.attachments.map((a, i) => (
                          <button
                            key={a.id || `${a.name}-${i}`}
                            type="button"
                            onClick={() => { if (getAttachmentHref(a)) downloadAttachment(a); }}
                            className="w-full flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white text-left"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-xs font-medium text-gray-700 truncate flex-1">{a.name}</span>
                            <span className="text-[10px] text-gray-400">{a.size}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1.5">{formatDateTime(m.at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

function exportNotificationHTML(r: OpRecord) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
  const fmt = (s?: string) => (s ? new Date(s).toLocaleString("pt-BR") : "—");
  const conv = (r.conversation || []).map((m) => `
    <div class="msg ${m.from}">
      <div class="msg-head"><strong>${m.from === "lojista" ? "Lojista" : "Gestão"}</strong> · ${esc(m.author)} <span class="muted">— ${fmt(m.at)}</span></div>
      <div class="msg-body">${esc(m.text).replace(/\n/g, "<br>")}</div>
      ${(m.attachments || []).map((a) => `<div class="att">📎 ${esc(a.name)} <span class="muted">(${esc(a.size)})</span></div>`).join("")}
    </div>`).join("");
  const atts = (r.attachments || []).map((a) => `<li>${esc(a.name)} <span class="muted">(${esc(a.size)})</span></li>`).join("");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(r.id)} — ${esc(r.subject)}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; max-width: 760px; margin: 32px auto; padding: 0 20px; color: #111827; }
    h1 { color: #8B1A1A; margin: 0 0 4px; font-size: 22px; }
    h2 { color: #8B1A1A; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; margin-top: 28px; }
    h3 { font-size: 13px; margin: 0 0 6px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
    .muted { color: #9ca3af; font-size: 12px; }
    .section { background: #faf7f2; border: 1px solid #e8dccb; border-radius: 12px; padding: 14px 16px; }
    .msg { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 8px; background: #fff; }
    .msg.gestao { background: #faf7f2; border-color: #e8dccb; }
    .msg-head { font-size: 12px; margin-bottom: 4px; color: #374151; }
    .msg-body { font-size: 14px; line-height: 1.5; }
    .att { font-size: 12px; color: #4b5563; margin-top: 4px; }
    .resolved { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 12px 14px; }
    .pending { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 14px; color: #92400e; }
    ul { padding-left: 18px; }
  </style></head><body>
  <h1>${esc(r.subject)}</h1>
  <div class="meta">
    <strong>${esc(r.id)}</strong> · ${esc(r.store)} (${esc(r.luc)}) · ${fmt(r.date)}<br>
    Origem: ${esc(r.externalSource || "—")}${r.externalRef ? ` · Ref. ${esc(r.externalRef)}` : ""}
  </div>
  <h2>Descrição</h2>
  <div class="section">${esc(r.details).replace(/\n/g, "<br>")}</div>
  <h2>Anexos da notificação</h2>
  ${atts ? `<ul>${atts}</ul>` : `<p class="muted">Nenhum anexo.</p>`}
  <h2>Conversa</h2>
  ${conv || `<p class="muted">Nenhuma mensagem.</p>`}
  </body></html>`;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.id}_${r.store.replace(/\s+/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function AuditModal({ record, onClose }: { record: OpRecord; onClose: () => void }) {
  const [logs, setLogs] = useState<import("../recordsStore").AuditEntry[]>(record.audit || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!record.id.includes("-")) { setLoading(false); return; }
    const kind = record.kind;
    const idNum = parseInt(record.id.split("-")[1] || "0");
    if (idNum > 0) {
      import("../api").then(api => {
        api.getAuditoria(kind, idNum)
          .then(res => {
            const fetchedLogs: import("../recordsStore").AuditEntry[] = res.map(r => ({
              at: r.data_hora || new Date().toISOString(),
              user: r.usuario,
              action: (r.acao as any) || "update",
              field: r.campo,
              before: r.valor_anterior,
              after: r.valor_novo,
            }));
            // Mescla com logs locais recém-criados que talvez não estejam no DB ainda, ou usa apenas os do DB se o DB estiver atualizado.
            // Aqui vamos usar a combinação do DB (que tem IDs e timestamps reais) e confiar nele como fonte da verdade.
            if (fetchedLogs.length > 0) {
              setLogs(fetchedLogs);
            }
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      });
    } else {
      setLoading(false);
    }
  }, [record]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FAF7F2] rounded-lg"><History className="w-5 h-5 text-[#8B1A1A]" /></div>
            <div>
              <h2 className="font-bold text-gray-900">Histórico — {record.id}</h2>
              <p className="text-xs text-gray-500">Log detalhado de alterações</p>
            </div>
          </div>
          <button aria-label="Fechar formulário de processo" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="text-center text-sm text-gray-500 py-4">Carregando histórico...</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-sm text-gray-500 py-4">Nenhum histórico registrado.</div>
          ) : (
            <div className="relative border-l-2 border-gray-100 ml-3 space-y-5">
              {logs.map((a, i) => (
                <div key={i} className="ml-6 relative">
                  <span className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#8B1A1A] z-10" />
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{formatDateTime(a.at)}</div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-sm font-bold text-gray-900">{a.action === "create" ? "Registro Criado" : a.action === "update" ? "Campo Alterado" : "Status Atualizado"}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Responsável: <strong>{a.user}</strong></div>
                    {a.field && <div className="mt-2 text-xs p-2 bg-white rounded border border-gray-100"><span className="font-bold text-gray-400">{a.field}:</span> <span className="text-gray-400 line-through mr-1">{a.before}</span> <span className="text-[#8B1A1A] font-bold">{a.after}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Smart Form ---------- */
function SmartForm({ currentUserArea, currentUserName, editing, prefillKind, allRecords, onClose, onSaved }: { currentUserArea: Area; currentUserName: string; editing: OpRecord | null; prefillKind: RecordKind | null; allRecords: OpRecord[]; onClose: () => void; onSaved: (m: string) => void }) {
  const currentProfile = useProfile();
  const canEditFineLimit = currentProfile === "master";
  const registeredUsers = useUsers();
  const CURRENT_MIN_WAGE = 1622;
  const [kind, setKind] = useState<RecordKind | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.kind || editing?.kind || prefillKind || ""; } catch { return editing?.kind || prefillKind || ""; }
    });
    const [area, setArea] = useState<Area | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.area || editing?.area || ""; } catch { return editing?.area || ""; }
    });
    const [vistoriaAreas, setVistoriaAreas] = useState<Area[]>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.vistoriaAreas || (editing?.kind === "vistoria" ? [(editing.area as Area), ...(editing.additionalAreas || [])] : []); } catch { return editing?.kind === "vistoria" ? [(editing.area as Area), ...(editing.additionalAreas || [])] : []; }
    });
    const [inspectionDate, setInspectionDate] = useState<string>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.inspectionDate || editing?.inspectionDate?.slice(0, 10) || ""; } catch { return editing?.inspectionDate?.slice(0, 10) || ""; }
    });
    const [inspector, setInspector] = useState<string>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.inspector || editing?.inspector || ""; } catch { return editing?.inspector || ""; }
    });
    const [store, setStore] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.store || editing?.store || ""; } catch { return editing?.store || ""; }
    });
    const [storeQuery, setStoreQuery] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.storeQuery || editing?.store || ""; } catch { return editing?.store || ""; }
    });
    const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
    const [luc, setLuc] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.luc || editing?.luc || ""; } catch { return editing?.luc || ""; }
    });
    const [subject, setSubject] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.subject || editing?.subject || ""; } catch { return editing?.subject || ""; }
    });
    const [details, setDetails] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.details || editing?.details || ""; } catch { return editing?.details || ""; }
    });
    const [amount, setAmount] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.amount || editing?.amount?.toString() || ""; } catch { return editing?.amount?.toString() || ""; }
    });
    const [taxonomy, setTaxonomy] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.taxonomy || editing?.taxonomy || ""; } catch { return editing?.taxonomy || ""; }
    });
    const [taxonomyQuery, setTaxonomyQuery] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.taxonomyQuery || editing?.taxonomy || ""; } catch { return editing?.taxonomy || ""; }
    });
    const [taxonomyDropdownOpen, setTaxonomyDropdownOpen] = useState(false);
    const [status, setStatus] = useState(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.status || editing?.status || ""; } catch { return editing?.status || ""; }
    });
    const [result, setResult] = useState<"Aprovado" | "Reprovado" | "Aprovado com ressalvas" | "">(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.result || editing?.result || ""; } catch { return editing?.result || ""; }
    });


    const [files, setFiles] = useState<Attachment[]>(() => {
      try { const d = JSON.parse(sessionStorage.getItem("draft_smart_form")||""); return d.files || editing?.attachments || []; } catch { return editing?.attachments || []; }
    });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enableWorkflow, setEnableWorkflow] = useState(!!editing?.workflowSteps);
  const [selectedAreas, setSelectedAreas] = useState<Area[]>(editing?.workflowSteps?.map((s) => s.area) || []);
  const [linkedIds, setLinkedIds] = useState<string[]>(editing?.linkedRecordIds || []);
  const [dueDate, setDueDate] = useState<string>(editing?.dueDate?.slice(0, 10) || "");
  const [priority, setPriority] = useState<string>(editing?.priority || "");
  const [minWage, setMinWage] = useState<number>(CURRENT_MIN_WAGE);
  const [editingMinWage, setEditingMinWage] = useState(false);
  const [minWageInput, setMinWageInput] = useState<string>(String(CURRENT_MIN_WAGE));
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [formViewerAtt, setFormViewerAtt] = useState<Attachment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStoreLocked = useMemo(() => {
    if (!editing) return false;
    const hasDependents = allRecords.some(x => x.linkedRecordIds?.includes(editing.id));
    if (hasDependents) return true;
    if (editing.linkedRecordIds && editing.linkedRecordIds.length > 0) return true;
    return false;
  }, [editing, allRecords]);

  async function handleAddFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const validFiles = Array.from(list).filter(f => {
      if (f.size > 25 * 1024 * 1024) {
        alert(`O arquivo ${f.name} excede o limite de 25MB.`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    const added = await filesToAttachments(validFiles);
    setFiles((prev) => [...prev, ...added]);
  }

  const OCORRENCIA_CATEGORIES = [
    "Arquitetura e Paisagismo",
    "Conservação e Resíduos",
    "Manutenção e Engenharia",
    "Segurança e Brigada",
  ];
  const VISTORIA_CATEGORIES = ["Reforma loja", "Novo contrato"];
  const MULTA_CATEGORIES = [
    "Arquitetura e Paisagismo",
    "Conservação e Resíduos",
    "Manutenção e Engenharia",
    "Segurança e Brigada",
  ];

  const KIND_CATEGORIES: Record<string, string[]> = {
    ocorrencia: OCORRENCIA_CATEGORIES,
    vistoria: VISTORIA_CATEGORIES,
    multa: MULTA_CATEGORIES,
  };

  const activeCategories = Array.from(new Set(
    kind ? KIND_CATEGORIES[kind] : [...OCORRENCIA_CATEGORIES, ...VISTORIA_CATEGORIES, ...MULTA_CATEGORIES]
  )).sort((a, b) => a.localeCompare(b));

  const filteredCategories = activeCategories.filter(c => c.toLowerCase().includes(taxonomyQuery.toLowerCase()));

  const filteredStores = STORES_INFO
    .filter((s) => s.name.toLowerCase().includes(storeQuery.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Reset status & linked IDs when kind changes
  useEffect(() => {
    if (!editing) {
      setStatus("Pendente");
      setLinkedIds([]);
      setAmount("");
      setResult("");
    }
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // Drop linked records that no longer satisfy the cross-field constraint
  // (e.g. changing the store on a multa invalidates links to ocorrências of the old store).
  useEffect(() => {
    if (linkedIds.length === 0) return;
    const stillValid = linkedIds.filter((id) => {
      const r = allRecords.find((x) => x.id === id);
      if (!r) return false;
      if (kind === "multa") return r.kind === "ocorrencia" && (!store || r.store === store);
      if (kind === "notificacao") return (r.kind === "vistoria" || r.kind === "multa") && (!store || r.store === store);
      return false;
    });
    if (stillValid.length !== linkedIds.length) setLinkedIds(stillValid);
  }, [store, kind, allRecords]); // eslint-disable-line react-hooks/exhaustive-deps


  const availableForLink = useMemo(() => {
    return allRecords.filter((r) => {
      if (editing && r.id === editing.id) return false;
      if (kind === "multa") {
        if (!store) return r.kind === "ocorrencia";
        return r.store === store && r.kind === "ocorrencia";
      }
      if (kind === "notificacao") {
        return (!store || r.store === store) && (r.kind === "vistoria" || r.kind === "multa");
      }
      return false;
    });
  }, [allRecords, store, kind, editing]);

  function clearError(field: string) {
    setErrors((prev) => { if (!prev[field]) return prev; const next = { ...prev }; delete next[field]; return next; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!kind) e.kind = "* Preenchimento obrigatório";
    if (!store.trim()) e.store = "* Preenchimento obrigatório";
    if (!luc.trim()) e.luc = "* Preenchimento obrigatório";
    if (!subject.trim()) e.subject = "* Preenchimento obrigatório";
    if (kind !== "multa" && !details.trim()) e.details = "* Preenchimento obrigatório";
    if (kind === "vistoria" && vistoriaAreas.length === 0) e.area = "* Preenchimento obrigatório";
    if (kind !== "vistoria" && kind !== "multa" && !area) e.area = "* Preenchimento obrigatório";
    if (kind === "vistoria" && !inspectionDate) e.inspectionDate = "* Preenchimento obrigatório";
    if (kind === "vistoria" && !inspector.trim()) e.inspector = "* Preenchimento obrigatório";
    if (!taxonomy) e.taxonomy = "* Preenchimento obrigatório";
    if (kind === "notificacao" && !dueDate) e.dueDate = "* Preenchimento obrigatório";
    if (kind === "notificacao" && linkedIds.length === 0) e.linkedIds = "* Preenchimento obrigatório";
    if (kind === "multa" && (!amount || parseFloat(amount) <= 0)) e.amount = "* Preenchimento obrigatório";
    else if (kind === "multa" && amount) {
      const v = parseFloat(amount);
      if (v > minWage) e.amount = `O valor deve ser ≤ R$ ${minWage.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`;
      else if (v < minWage / 2) e.amount = `O valor deve ser ≥ R$ ${(minWage / 2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.`;
    }
    if (kind === "multa" && linkedIds.length === 0) e.linkedIds = "* Preenchimento obrigatório";
    if ((kind === "multa" || kind === "notificacao") && linkedIds.length > 0 && store.trim()) {
      const invalid = linkedIds.some((id) => {
        const r = allRecords.find((x) => x.id === id);
        if (!r) return true;
        if (r.store !== store.trim()) return true;
        if (kind === "multa") return r.kind !== "ocorrencia";
        if (kind === "notificacao") return r.kind !== "vistoria" && r.kind !== "multa";
        return false;
      });
      if (invalid) e.linkedIds = "* Vínculo inválido para esta loja. Selecione uma ocorrência da loja escolhida.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function selectStore(name: string) {
    setStore(name);
    const info = STORES_INFO.find((s) => s.name === name);
    if (info) setLuc(info.luc);
  }


  useEffect(() => {
    try {
      sessionStorage.setItem("draft_smart_form", JSON.stringify({
        kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, taxonomyQuery, status, result, files
      }));
    } catch (e) {
      console.warn("Could not save draft to sessionStorage", e);
    }
  }, [kind, area, vistoriaAreas, inspectionDate, inspector, store, storeQuery, luc, subject, details, amount, taxonomy, taxonomyQuery, status, result, files]);

  async function submit() {

    if (!validate()) return;
    const effectiveArea: Area =
      kind === "multa" ? (MULTA_CATEGORY_TO_AREA[taxonomy] || area) :
      kind === "vistoria" ? (vistoriaAreas[0] || area) :
      area;
    const base = {
      kind,
      area: effectiveArea,
      store: store.trim(),
      luc: luc.trim(),
      author: currentUserName,
      subject: subject.trim(),
      details: kind === "multa" ? "" : details.trim(),
      taxonomy: taxonomy || undefined,
      attachments: files,
      status: (kind === "multa" || kind === "notificacao") ? status : undefined,
      result: undefined,
      additionalAreas: kind === "vistoria" && vistoriaAreas.length > 1 ? vistoriaAreas.slice(1) : undefined,
      inspectionDate: kind === "vistoria" && inspectionDate ? new Date(inspectionDate).toISOString() : undefined,
      inspector: kind === "vistoria" ? inspector.trim() || undefined : undefined,
      amount: kind === "multa" ? parseFloat(amount) : undefined,
      workflowSteps: undefined,
      currentStepIndex: undefined,
      linkedRecordIds: linkedIds.length > 0 ? linkedIds : undefined,
      dueDate: kind === "notificacao" && dueDate ? new Date(dueDate).toISOString() : undefined,
      priority: priority as any,
    };
    
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateRecord(editing.id, base, currentUserName);
        sessionStorage.removeItem("draft_smart_form");
        onSaved("Registro atualizado");
      } else {
        await createRecord({ ...base, currentUser: currentUserName });
        sessionStorage.removeItem("draft_smart_form");
        onSaved("Registro criado");
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, submit: err?.message || "Não foi possível salvar.", linkedIds: err?.message }));
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleLink(id: string) {
    setLinkedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    clearError("linkedIds");
  }

  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; }, [submit]);

  const handleFormKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA" || tag === "SELECT") return;
    e.preventDefault();
    submitRef.current();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto flex flex-col"
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleFormKeyDown}
      >
        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{editing ? `Editar ${editing.id}` : "Novo Registro"}</h2>
          <button aria-label="Fechar formulário principal" onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Tipo de Registro <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(["ocorrencia", "vistoria", "multa"] as RecordKind[]).map((k) => {
                const Icon = KIND_META[k].icon;
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => { setKind(k); setTaxonomy(""); clearError("kind"); }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 md:p-4 rounded-2xl border-2 text-xs font-bold transition-all ${active ? "border-[#8B1A1A] bg-[#8B1A1A] text-white shadow-md" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    <Icon className="w-5 h-5" />
                    {KIND_META[k].label}
                  </button>
                );
              })}
            </div>
            {errors.kind && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.kind}</p>}
          </div>

          {/* Área */}
          {kind !== "multa" && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                Área Responsável <span className="text-[#8B1A1A] ml-1 text-sm">*</span> {kind === "vistoria" && <span className="text-gray-400 font-semibold normal-case tracking-normal">(selecione uma ou mais)</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["Arquitetura", "Engenharia", "Brigada"] as Area[]).map((a) => {
                  const s = AREA_STYLES[a];
                  const Icon = s.icon;
                  const active = kind === "vistoria" ? vistoriaAreas.includes(a) : area === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        if (kind === "vistoria") {
                          setVistoriaAreas((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
                        } else {
                          setArea(a);
                        }
                        clearError("area");
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-all ${active ? `${s.bg} ${s.text} ${s.border} shadow-sm` : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{a}</span>
                      <span className="sm:hidden">{a.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
              {errors.area && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.area}</p>}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Categoria <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                maxLength={100}
                value={taxonomyDropdownOpen ? taxonomyQuery : taxonomy}
                onChange={(e) => {
                  setTaxonomyQuery(e.target.value);
                  setTaxonomyDropdownOpen(true);
                  if (!e.target.value) setTaxonomy("");
                  clearError("taxonomy");
                }}
                onFocus={() => {
                  setTaxonomyQuery("");
                  setTaxonomyDropdownOpen(true);
                }}
                onBlur={() => setTimeout(() => setTaxonomyDropdownOpen(false), 150)}
                placeholder="Buscar categoria..."
                className={`w-full border-2 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${errors.taxonomy ? "border-red-500" : "border-gray-200"}`}
              />
              {taxonomyDropdownOpen && filteredCategories.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onMouseDown={() => {
                        setTaxonomy(cat);
                        setTaxonomyQuery(cat);
                        setTaxonomyDropdownOpen(false);
                        clearError("taxonomy");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#FAF7F2] hover:text-[#8B1A1A] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.taxonomy && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.taxonomy}</p>}
          </div>

          {/* Loja e LUC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Loja <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  maxLength={100}
                  value={storeQuery}
                  disabled={isStoreLocked}
                  onChange={(e) => {
                    setStoreQuery(e.target.value);
                    setStoreDropdownOpen(true);
                    if (!e.target.value) { setStore(""); setLuc(""); }
                    clearError("store");
                  }}
                  onFocus={() => setStoreDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setStoreDropdownOpen(false), 150)}
                  placeholder="Buscar loja..."
                  className={`w-full border-2 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${errors.store ? "border-red-500" : "border-gray-200"} ${isStoreLocked ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white text-gray-700"}`}
                />
                {storeDropdownOpen && !isStoreLocked && filteredStores.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredStores.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onMouseDown={() => {
                          selectStore(s.name);
                          setStoreQuery(s.name);
                          setStoreDropdownOpen(false);
                          clearError("store");
                          clearError("luc");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-[#FAF7F2] hover:text-[#8B1A1A] transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                      >
                        <span className="block truncate">{s.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">{s.luc}</span>
                      </button>
                    ))}
                  </div>
                )}
                {storeDropdownOpen && !isStoreLocked && storeQuery && filteredStores.length === 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 px-4 py-3 text-xs text-gray-400 italic">
                    Nenhuma loja encontrada.
                  </div>
                )}
              </div>
              {isStoreLocked && <p className="mt-1.5 text-[10px] font-bold text-gray-400">Loja não pode ser alterada pois o registro possui vínculos.</p>}
              {errors.store && !isStoreLocked && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.store}</p>}
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">LUC <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
              <input
                type="text"
                maxLength={100}
                value={luc}
                onChange={(e) => { setLuc(e.target.value); clearError("luc"); }}
                disabled={!!store}
                placeholder="Ex: L2-104"
                className={`w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${errors.luc ? "border-red-500" : "border-gray-200"} ${!!store ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white text-gray-700"}`}
              />
              {errors.luc && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.luc}</p>}
            </div>
          </div>

          <FormInput label={<>Assunto <span className="text-[#8B1A1A] ml-1 text-sm">*</span></>} value={subject} onChange={(v) => { setSubject(v); clearError("subject"); }} error={errors.subject} placeholder="Título resumido" />

          {kind !== "multa" && (
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Descrição <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
              <textarea
                maxLength={1000}
                value={details}
                onChange={(e) => { setDetails(e.target.value); clearError("details"); }}
                rows={3}
                placeholder="Descreva detalhadamente..."
                className={`w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${errors.details ? "border-red-500" : "border-gray-200"}`}
              />
              {errors.details && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.details}</p>}
            </div>
          )}

          {/* Conditional Fields */}
          {kind === "vistoria" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormInput label={<>Data da Vistoria <span className="text-[#8B1A1A] ml-1 text-sm">*</span></>} type="date" value={inspectionDate} onChange={(v) => { setInspectionDate(v); clearError("inspectionDate"); }} error={errors.inspectionDate} />
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Responsável pela Vistoria <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
                <select
                  value={inspector}
                  onChange={(e) => { setInspector(e.target.value); clearError("inspector"); }}
                  className={`w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] appearance-none ${errors.inspector ? "border-red-500" : "border-gray-200"}`}
                >
                  <option value="">Selecionar vistoriador...</option>
                  {registeredUsers.map((u) => (
                    <option key={u.id} value={u.nome}>{u.nome} — {u.cargo}</option>
                  ))}
                </select>
                {errors.inspector && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.inspector}</p>}
              </div>
            </div>
          )}

          {kind === "multa" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* Valor (R$) com validação de salário mínimo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Valor (R$) <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
                    {canEditFineLimit && (
                      <button
                        type="button"
                        onClick={() => setEditingMinWage(!editingMinWage)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B1A1A] hover:underline"
                      >
                        <Edit3 className="w-3 h-3" /> Editar limite
                      </button>
                    )}
                  </div>
                  {editingMinWage && (
                    <div className="mb-2 flex items-center gap-2 p-2.5 bg-[#FAF7F2] border border-[#8B1A1A]/20 rounded-xl">
                      <span className="text-[10px] font-bold text-gray-500 shrink-0 whitespace-nowrap">Salário mínimo (R$):</span>
                      <input
                        type="number"
                        value={minWageInput}
                        onChange={(e) => setMinWageInput(e.target.value)}
                        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B1A1A]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const v = parseFloat(minWageInput);
                          if (v > 0) { setMinWage(v); setMinWageInput(String(v)); }
                          setEditingMinWage(false);
                        }}
                        className="px-2.5 py-1 bg-[#8B1A1A] text-white rounded-lg text-[10px] font-bold shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  )}
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); clearError("amount"); }}
                    placeholder="0.00"
                    min={0}
                    step="0.01"
                    className={`w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${errors.amount ? "border-red-500" : "border-gray-200"}`}
                  />
                  {/* Warning: value > min wage */}
                  {amount && parseFloat(amount) > minWage && (
                    <p className="mt-1.5 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      O valor deve ser ≤ R$ {minWage.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {/* Warning: value < min wage / 2 */}
                  {amount && parseFloat(amount) > 0 && parseFloat(amount) < minWage / 2 && (
                    <p className="mt-1.5 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      O valor deve ser ≥ R$ {(minWage / 2).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {errors.amount && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.amount}</p>}
                </div>
                <FormSelect label="Status" value={status} onChange={setStatus} options={["Pendente", "Faturada", "Cancelada"]} />
              </div>

              {/* Obrigatório: vínculo */}
              <div className="border-2 border-dashed border-[#8B1A1A]/30 bg-[#FAF7F2] rounded-2xl p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="p-1.5 bg-[#8B1A1A] text-white rounded-lg"><Link2 className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#6e150e]">Vinculação Obrigatória</h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">Toda multa deve estar vinculada a uma <strong>ocorrência</strong> que a originou.</p>
                  </div>
                </div>
                {!store ? (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> Selecione a loja para listar ocorrências.</div>
                ) : availableForLink.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">Nenhuma ocorrência prévia para esta loja. Registre uma ocorrência antes de aplicar a multa.</div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {availableForLink.map((r) => {
                      const active = linkedIds.includes(r.id);
                      const KindIcon = KIND_META[r.kind].icon;
                      return (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => toggleLink(r.id)}
                          className={`w-full text-left flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${active ? "border-[#8B1A1A] bg-white" : "border-transparent bg-white/60 hover:bg-white"}`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${active ? "bg-[#8B1A1A] border-[#8B1A1A]" : "border-gray-300"}`}>
                            {active && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8B1A1A]">
                              <KindIcon className="w-3 h-3" /> {KIND_META[r.kind].label} · #{r.id}
                            </div>
                            <div className="text-xs font-medium text-gray-800 truncate">{r.subject}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.linkedIds && <p className="mt-2 text-xs text-red-600 font-bold">{errors.linkedIds}</p>}
              </div>
            </>
          )}

          {kind === "notificacao" && (
            <div className="space-y-4">
              {/* Status da Notificação */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Status da Notificação</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Pendente", "Enviada", "Recebida"] as const).map((s) => {
                    const active = status === s;
                    const colorMap: Record<string, string> = {
                      Pendente: "border-amber-400 bg-amber-50 text-amber-700",
                      Enviada:  "border-blue-400 bg-blue-50 text-blue-700",
                      Recebida: "border-emerald-400 bg-emerald-50 text-emerald-700",
                    };
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-xs font-bold transition-all ${active ? colorMap[s] + " shadow-sm" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${active ? (s === "Pendente" ? "bg-amber-500" : s === "Enviada" ? "bg-blue-500" : "bg-emerald-500") : "bg-gray-300"}`} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prazo */}
              <FormInput label={<>Prazo <span className="text-[#8B1A1A] ml-1 text-sm">*</span></>} type="date" value={dueDate} onChange={(v) => { setDueDate(v); clearError("dueDate"); }} error={errors.dueDate} />

              {/* Vincular a ocorrências */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Vincular a ocorrência existente <span className="text-[#8B1A1A] ml-1 text-sm">*</span></label>
                {!store ? (
                  <div className={`text-xs text-gray-500 italic p-2.5 bg-gray-50 rounded-xl border ${errors.linkedIds ? "border-red-500" : "border-gray-100"}`}>Selecione a loja para listar ocorrências relacionáveis.</div>
                ) : (
                  <div className={`space-y-1.5 max-h-40 overflow-y-auto bg-gray-50 rounded-xl p-2 border ${errors.linkedIds ? "border-red-500" : "border-gray-100"}`}>
                    {availableForLink.length === 0 && <div className="text-xs text-gray-400 italic p-2">Sem ocorrências anteriores para esta loja.</div>}
                    {availableForLink.map((r) => {
                      const active = linkedIds.includes(r.id);
                      const KindIcon = KIND_META[r.kind].icon;
                      return (
                        <button type="button" key={r.id} onClick={() => toggleLink(r.id)} className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition-all ${active ? "bg-white border border-[#8B1A1A]" : "hover:bg-white border border-transparent"}`}>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "bg-[#8B1A1A] border-[#8B1A1A]" : "border-gray-300"}`}>
                            {active && <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>}
                          </div>
                          <KindIcon className="w-3 h-3 text-[#8B1A1A]" />
                          <span className="text-[11px] font-bold text-[#8B1A1A]">#{r.id}</span>
                          <span className="text-xs text-gray-700 truncate flex-1">{r.subject}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {errors.linkedIds && <p className="mt-1.5 text-xs text-red-600 font-bold">{errors.linkedIds}</p>}
              </div>
            </div>
          )}

          {/* Anexos / Evidências */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Evidências e Anexos</label>
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { handleAddFiles(e.target.files); e.target.value = ""; }}
            />
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="py-4 border-2 border-dashed border-[#8B1A1A]/30 bg-[#FAF7F2] rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-[#8B1A1A] transition-all group"
              >
                <Camera className="w-5 h-5 text-[#8B1A1A]" />
                <span className="text-xs font-bold text-[#8B1A1A]">Tirar Foto</span>
              </button>
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="py-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:border-[#8B1A1A] hover:bg-[#FAF7F2] transition-all group"
              >
                <Upload className="w-5 h-5 text-gray-300 group-hover:text-[#8B1A1A]" />
                <span className="text-xs font-bold text-gray-400 group-hover:text-[#8B1A1A]">Upload Documento</span>
              </button>
            </div>
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => {
                  const hasData = !!getAttachmentHref(f);
                  return (
                    <div key={f.id || `${f.name}-${i}`} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-[#8B1A1A] shrink-0" />
                      <button
                        type="button"
                        disabled={!hasData}
                        onClick={() => hasData && setFormViewerAtt(f)}
                        className={`flex-1 min-w-0 text-left text-[11px] font-bold text-gray-700 truncate ${hasData ? "hover:text-[#8B1A1A]" : ""}`}
                        title={hasData ? "Visualizar" : ""}
                      >
                        {f.name} <span className="text-gray-400 font-normal">· {f.size}</span>
                      </button>
                      <button
                        type="button"
                        disabled={!hasData}
                        onClick={() => downloadAttachment(f)}
                        className={`p-1 rounded ${hasData ? "text-gray-400 hover:text-[#8B1A1A]" : "text-gray-200 cursor-not-allowed"}`}
                        title="Baixar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-gray-300 hover:text-red-500"
                        title="Remover"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {errors.submit && (
          <div className="px-5 pb-3">
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r flex gap-2 items-start">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-red-800">{errors.submit}</p>
            </div>
          </div>
        )}

        <div className="p-5 md:p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <button onClick={() => { sessionStorage.removeItem("draft_smart_form"); sessionStorage.removeItem("draft_smart_form");
    onClose();
  }} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-[#8B1A1A] text-white text-sm font-bold hover:bg-[#a43030] shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </motion.div>

      <CameraCaptureHost
        open={cameraOpen}
        onCapture={(att) => { setFiles((prev) => [...prev, att]); setCameraOpen(false); }}
        onClose={() => setCameraOpen(false)}
      />
      <AttachmentViewerHost attachment={formViewerAtt} onClose={() => setFormViewerAtt(null)} />
    </motion.div>
  );
}

function FormInput({ label, value, onChange, error, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-2 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${error ? "border-red-500" : "border-gray-200"}`}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-bold">{error}</p>}
    </div>
  );
}

function SimplePagination({ page, setPage, total, perPage }: { page: number; setPage: (p: number) => void; total: number; perPage: number }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);
    return range;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-white">
      <span className="text-xs text-gray-500 order-2 sm:order-1">
        Exibindo <span className="font-bold text-gray-700">{from}–{to}</span> de <span className="font-bold text-gray-700">{total}</span> {total === 1 ? "evento" : "eventos"}
      </span>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          title="Primeira página"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 -mr-1 inline-block" />
          <ChevronLeft className="w-3.5 h-3.5 inline-block" />
        </button>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          title="Página anterior"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => setPage(p as number)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                page === p
                  ? "bg-[#8B1A1A] text-white border-[#8B1A1A] shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-[#FAF7F2] hover:border-[#8B1A1A]/30 hover:text-[#8B1A1A]"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          title="Próxima página"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          title="Última página"
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 -mr-1 inline-block" />
          <ChevronRight className="w-3.5 h-3.5 inline-block" />
        </button>
      </div>
    </div>
  );
}

function FormSelect({ label, value, onChange, options, error }: any) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none border-2 rounded-2xl px-4 py-3 pr-10 text-sm font-semibold text-gray-700 bg-white shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B1A1A] ${error ? "border-red-500" : "border-gray-200"}`}
        >
          <option value="">Selecione...</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-bold">{error}</p>}
    </div>
  );
}
