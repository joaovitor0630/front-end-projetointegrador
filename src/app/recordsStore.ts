import { useSyncExternalStore } from "react";
import * as api from "./api";
import { getCurrentPermissions } from "./profileStore";

export type Area = "Arquitetura" | "Engenharia" | "Brigada";
export type RecordKind = "notificacao" | "vistoria" | "multa" | "interacao" | "documento" | "ocorrencia";

export interface AuditEntry {
  at: string;
  user: string;
  action: "create" | "update" | "delete" | "status" | "view";
  field?: string;
  before?: string;
  after?: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  user: string;
  action: "create" | "update" | "delete" | "view";
  recordId: string;
  store: string;
  luc: string;
  kind: RecordKind | "sistema";
  subject: string;
  details?: string;
  externalSource?: string;
}

/**
 * Anexo de registro.
 *
 * Integração com backend (Postgres `bytea`):
 *  - No upload, o frontend converte o File para `dataUrl` (base64) e envia ao endpoint.
 *    O backend decodifica e grava em `attachments.data BYTEA`, retornando `{ id, url }`.
 *  - Ao ler, o backend devolve `{ id, name, size, mimeType, url }` (sem `dataUrl`).
 *    `openAttachment`/`downloadAttachment` usam `url` quando presente e fazem fallback
 *    para `dataUrl` (modo offline / antes da persistência).
 */
export interface Attachment {
  /** ID atribuído pelo backend após persistência (ausente antes do upload). */
  id?: string;
  name: string;
  /** Tamanho legível, ex.: "1.2 MB". */
  size: string;
  /** Bytes brutos — útil para o backend gravar como bytea ou validar limites. */
  sizeBytes?: number;
  mimeType?: string;
  /** Base64 data URL — payload enviado ao backend; nulo após persistência remota. */
  dataUrl?: string;
  /** URL servida pelo backend (ex.: /api/attachments/:id). Preferida quando presente. */
  url?: string;
  uploadedAt?: string;
}

export interface StepComment {
  id: string;
  at: string;
  user: string;
  text: string;
}

/** Mensagem em thread de notificação externa (Portal do Lojista ↔ Gestão). */
export interface NotificationMessage {
  id: string;
  at: string;
  /** "lojista" = enviada pelo lojista; "gestao" = resposta da operação. */
  from: "lojista" | "gestao";
  author: string;
  text: string;
  attachments?: Attachment[];
}

export interface WorkflowStep {
  area: Area;
  status: "completed" | "current" | "pending";
  completedAt?: string;
  completedBy?: string;
  deliverable?: string;
  stepAttachments?: Attachment[];
  comments?: StepComment[];
  startedAt?: string;
}

export interface OpRecord {
  id: string;
  kind: RecordKind;
  /** Opcional: notificações importadas de outro sistema não têm vínculo com área operacional. */
  area?: Area;
  store: string;
  luc: string;
  date: string;
  author: string;
  subject: string;
  details: string;
  /** Identifica registros importados de outro sistema (ex.: Portal do Lojista). */
  externalSource?: string;
  externalRef?: string;
  status?: string;
  amount?: number;
  counterpartArea?: Area;
  taxonomy?: string;
  result?: "Aprovado" | "Aprovado com ressalvas" | "Reprovado";
  additionalAreas?: Area[];
  inspectionDate?: string;
  inspector?: string;
  attachments: Attachment[];
  audit: AuditEntry[];
  workflowSteps?: WorkflowStep[];
  currentStepIndex?: number;
  linkedRecordIds?: string[];
  dueDate?: string;
  priority?: "Baixa" | "Média" | "Alta";
  processStatus?: "em_andamento" | "finalizado" | "cancelado";
  finalizedAt?: string;
  finalizedBy?: string;
  finalReport?: string;
  /** Conversa registrada na notificação externa (lojista ↔ gestão). */
  conversation?: NotificationMessage[];
  /** Resumo do que foi resolvido / encaminhamento final da notificação. */
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface StoreInfo {
  name: string;
  luc: string;
  segment: string;
  piso: string;
  contact: string;
  phone: string;
  email: string;
  policyActive: boolean;
  sinceOpened: string;
}

export let STORES_INFO: StoreInfo[] = [
  { name: "Zara", luc: "L2-104", segment: "Vestuário", piso: "L2", contact: "Carlos Mendes", phone: "(62) 98765-4321", email: "zara.flamboyant@lojas.com.br", policyActive: true, sinceOpened: "2018-03-12" },
  { name: "Renner", luc: "L2-205", segment: "Vestuário", piso: "L2", contact: "Roberto Costa", phone: "(62) 97777-8888", email: "renner.flamboyant@lojas.com.br", policyActive: false, sinceOpened: "2015-09-01" },
  { name: "Sabor & Cia Alimentação", luc: "L1-012", segment: "Alimentação", piso: "L1", contact: "Júlia Prado", phone: "(62) 93333-2222", email: "contato@saborecia.com.br", policyActive: true, sinceOpened: "2020-06-20" },
  { name: "C&A", luc: "L1-203", segment: "Vestuário", piso: "L1", contact: "Camila Barros", phone: "(62) 92222-1111", email: "flamboyant@cea.com.br", policyActive: true, sinceOpened: "2014-02-10" },
  { name: "Havaianas", luc: "L2-301", segment: "Calçados", piso: "L2", contact: "Paula Rios", phone: "(62) 94444-9999", email: "havaianas.flamboyant@alpargatas.com.br", policyActive: true, sinceOpened: "2019-11-05" },
  { name: "Nike", luc: "L1-105", segment: "Esportes", piso: "L1", contact: "Rafael Teixeira", phone: "(62) 95555-4444", email: "nike.flamboyant@sbf.com.br", policyActive: true, sinceOpened: "2017-07-18" },
  { name: "Farmácia São Paulo", luc: "L2-401", segment: "Saúde", piso: "L2", contact: "Dra. Helena Souza", phone: "(62) 96666-5555", email: "fsp.flamboyant@dpsp.com.br", policyActive: true, sinceOpened: "2016-04-01" },
];

let state: OpRecord[] = [];

// ─── Mapping tables: Frontend ↔ Postgres ENUMs ──────────────────────────────

const AREA_TO_DB: Record<string, string> = {
  Arquitetura: "Arq",
  Engenharia: "Eng",
  Brigada: "Bri",
};
const DB_TO_AREA: Record<string, Area> = {
  Arq: "Arquitetura",
  Eng: "Engenharia",
  Bri: "Brigada",
};

// Ocorrência categories: frontend → DB ENUM
const OCORRENCIA_CAT_TO_DB: Record<string, string> = {
  "Manutenção e Engenharia": "Manutenção",
  "Conservação e Resíduos": "Conservação de resíduos",
  "Arquitetura e Paisagismo": "Arquitetura e Paisagismo",
  "Segurança e Brigada": "Segurança",
};
const DB_TO_OCORRENCIA_CAT: Record<string, string> = {};
for (const [k, v] of Object.entries(OCORRENCIA_CAT_TO_DB)) {
  DB_TO_OCORRENCIA_CAT[v] = k;
}

// Vistoria categories: frontend uses "Reforma loja" / "Novo contrato"
// DB ENUM uses "Reformar loja" / "Novo Contrato" (note capitalization)
const VISTORIA_CAT_TO_DB: Record<string, string> = {
  "Reforma loja": "Reformar loja",
  "Novo contrato": "Novo Contrato",
  "Reformar loja": "Reformar loja",
  "Novo Contrato": "Novo Contrato",
};
const DB_TO_VISTORIA_CAT: Record<string, string> = {
  "Reformar loja": "Reforma loja",
  "Novo Contrato": "Novo contrato",
};

let isLoaded = false;
export async function loadRecords(force = false) {
  if (isLoaded && !force) return;
  try {
    const [ocorrencias, multas, vistorias] = await Promise.all([
      api.getOcorrencias(),
      api.getMultas(),
      api.getVistorias(),
    ]);

    // get lojas to map IDs to names
    const lojas = await api.getLojas().catch(() => []);
    const lojaMap = new Map(lojas.map(l => [l.loja_id, l]));

    if (lojas.length > 0) {
      STORES_INFO = lojas.map(l => {
        const existing = STORES_INFO.find(s => s.luc === l.luc);
        return {
          name: l.nome,
          luc: l.luc,
          segment: existing?.segment || "Variedades",
          piso: existing?.piso || "L1",
          contact: existing?.contact || "Não informado",
          phone: existing?.phone || "(00) 00000-0000",
          email: existing?.email || "contato@loja.com",
          policyActive: existing?.policyActive || false,
          sinceOpened: existing?.sinceOpened || "2024-01-01",
        };
      });
    }

    const mapped: OpRecord[] = [];

    // Map Ocorrencias
    const ocorrenciasMapped = await Promise.all(ocorrencias.map(async (o) => {
      const l = lojaMap.get(o.loja_id);
      const anexos = await api.getAnexosByOcorrencia(o.ocorrencia_id!).catch(() => []);
      const attachments: Attachment[] = anexos.map(a => ({
        id: String(a.anexo_id),
        name: a.nome_arquivo,
        size: formatBytes(a.tamanho_bytes),
        sizeBytes: a.tamanho_bytes,
        mimeType: a.tipo_mime,
        url: api.getAnexoDownloadUrl(a.anexo_id!),
      }));
      return {
        id: "OCO-" + o.ocorrencia_id,
        kind: "ocorrencia" as const,
        area: DB_TO_AREA[o.area_responsavel] || ("Engenharia" as any),
        store: l ? l.nome : "Desconhecida",
        luc: l ? l.luc : "---",
        date: o.data_registro || nowIso(),
        author: "Sistema",
        subject: o.assunto,
        details: o.descricao,
        taxonomy: DB_TO_OCORRENCIA_CAT[o.categoria] || o.categoria,
        attachments,
        audit: [],
      } as OpRecord;
    }));
    mapped.push(...ocorrenciasMapped);

    // Map Multas
    const multasMapped = await Promise.all(multas.map(async (m) => {
      // we need to find the store from the ocorrencia
      const oc = ocorrencias.find(x => x.ocorrencia_id === m.ocorrencia_id);
      const l = oc ? lojaMap.get(oc.loja_id) : null;
      const anexos = await api.getAnexosByMulta(m.multa_id!).catch(() => []);
      const attachments: Attachment[] = anexos.map(a => ({
        id: String(a.anexo_id),
        name: a.nome_arquivo,
        size: formatBytes(a.tamanho_bytes),
        sizeBytes: a.tamanho_bytes,
        mimeType: a.tipo_mime,
        url: api.getAnexoDownloadUrl(a.anexo_id!),
      }));
      return {
        id: "MUL-" + m.multa_id,
        kind: "multa" as const,
        area: oc ? (DB_TO_AREA[oc.area_responsavel] || ("Engenharia" as any)) : ("Engenharia" as any),
        store: l ? l.nome : "Desconhecida",
        luc: l ? l.luc : "---",
        date: nowIso(),
        author: "Sistema",
        subject: m.assunto,
        details: "",
        taxonomy: m.categoria, // DB Enum is exactly equal to Frontend format for multas
        amount: m.valor_multa,
        status: m.status === "Faturada" ? "Paga" : m.status === "Cancelada" ? "Cancelada" : "Não paga",
        attachments,
        audit: [],
        linkedRecordIds: ["OCO-" + m.ocorrencia_id],
      } as OpRecord;
    }));
    mapped.push(...multasMapped);

    // Map Vistorias
    const vistoriasMapped = await Promise.all(vistorias.map(async (v) => {
      const l = lojaMap.get(v.loja_id);
      const anexos = await api.getAnexosByVistoria(v.vistoria_id!).catch(() => []);
      const attachments: Attachment[] = anexos.map(a => ({
        id: String(a.anexo_id),
        name: a.nome_arquivo,
        size: formatBytes(a.tamanho_bytes),
        sizeBytes: a.tamanho_bytes,
        mimeType: a.tipo_mime,
        url: api.getAnexoDownloadUrl(a.anexo_id!),
      }));
      return {
        id: "VIS-" + v.vistoria_id,
        kind: "vistoria" as const,
        area: DB_TO_AREA[v.area_responsavel] || ("Engenharia" as any),
        store: l ? l.nome : "Desconhecida",
        luc: l ? l.luc : "---",
        date: v.data_registro || nowIso(),
        author: "Sistema",
        subject: v.assunto || "",
        details: v.descricao,
        taxonomy: DB_TO_VISTORIA_CAT[v.categoria] || v.categoria,
        attachments,
        audit: [],
      } as OpRecord;
    }));
    mapped.push(...vistoriasMapped);

    state = [...mapped];
    isLoaded = true;
    emit();
  } catch (err) {
    console.error("Failed to load records", err);
  }
}

let activities: ActivityLog[] = [];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getAll() {
  return state;
}

export function getAllActivities() {
  return activities;
}

export function useRecords() {
  return useSyncExternalStore(subscribe, getAll, getAll);
}

export function useActivities() {
  return useSyncExternalStore(subscribe, getAllActivities, getAllActivities);
}

function nowIso() {
  return new Date().toISOString();
}

function genId(kind: RecordKind) {
  const prefix: Record<RecordKind, string> = {
    notificacao: "NOT",
    vistoria: "VIS",
    multa: "MUL",
    interacao: "INT",
    documento: "DOC",
    ocorrencia: "OCO",
  };
  const n = (Date.now() % 100000) + Math.floor(Math.random() * 1000);
  return `${prefix[kind]}-${n}`;
}

function logActivity(activity: Omit<ActivityLog, "id">) {
  const id = `ACT-${(Date.now() % 100000) + Math.floor(Math.random() * 1000)}`;
  activities = [{ ...activity, id }, ...activities];
  emit();
}

export async function createRecord(input: Omit<OpRecord, "id" | "audit" | "date"> & { currentUser: string; date?: string }) {
  // Integity checks
  const linked = (input.linkedRecordIds ?? []) as string[];
  if (input.kind === "multa") {
    const ok = linked.length > 0 && linked.every((lid) => {
      const t = state.find((x) => x.id === lid);
      return !!t && t.kind === "ocorrencia" && t.store === input.store;
    });
    if (!ok) throw new Error("Multa deve estar vinculada a uma ocorrência da mesma loja.");
  }

  let finalId = genId(input.kind);
  
  try {
    const lojas = await api.getLojas().catch(() => []);
    let loja = lojas.find(l => l.luc === input.luc);
    if (!loja && input.luc && input.store) {
      loja = await api.createLoja({ nome: input.store, luc: input.luc, segmento: "Varejo" }).catch(() => undefined);
    }
    const loja_id = loja ? loja.loja_id : 1;

    if (input.kind === "ocorrencia") {
      const res = await api.createOcorrencia({
        loja_id,
        area_responsavel: AREA_TO_DB[input.area || "Engenharia"] || "Eng",
        categoria: OCORRENCIA_CAT_TO_DB[input.taxonomy || "Manutenção e Engenharia"] || "Manutenção",
        assunto: input.subject,
        descricao: input.details,
      });
      finalId = "OCO-" + res.ocorrencia_id;
    } else if (input.kind === "multa") {
      const linkedOcoId = linked[0] ? parseInt(linked[0].replace("OCO-", "")) : 0;
      const res = await api.createMulta({
        ocorrencia_id: linkedOcoId,
        categoria: input.taxonomy || "Manutenção e Engenharia", // Already matches DB enum
        assunto: input.subject,
        valor_multa: input.amount || 0,
        status: input.status === "Paga" ? "Faturada" : "Pendente",
      });
      finalId = "MUL-" + res.multa_id;
    } else if (input.kind === "vistoria") {
      const res = await api.createVistoria({
        loja_id,
        usuario_id: 1, // default
        area_responsavel: AREA_TO_DB[input.area || "Engenharia"] || "Eng",
        categoria: VISTORIA_CAT_TO_DB[input.taxonomy || "Reforma loja"] || "Reformar loja",
        assunto: input.subject,
        descricao: input.details,
      });
      finalId = "VIS-" + res.vistoria_id;
    }

    // Upload attachments
    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        if (att.dataUrl) {
          const b64 = api.extractBase64(att.dataUrl);
          await api.createAnexo({
            nome_arquivo: att.name,
            tipo_mime: att.mimeType || "application/octet-stream",
            tamanho_bytes: att.sizeBytes || 0,
            conteudo: b64,
            ocorrencia_id: input.kind === "ocorrencia" ? parseInt(finalId.replace("OCO-", "")) : undefined,
            multa_id: input.kind === "multa" ? parseInt(finalId.replace("MUL-", "")) : undefined,
            vistoria_id: input.kind === "vistoria" ? parseInt(finalId.replace("VIS-", "")) : undefined,
          });
        }
      }
    }

  } catch (err) {
    console.error("Failed to create record in backend", err);
    throw new Error(err instanceof Error ? err.message : "Erro no servidor ao salvar registro.");
  }

  const rec: OpRecord = {
    ...input,
    id: finalId,
    date: input.date || nowIso(),
    audit: [{ at: nowIso(), user: input.currentUser, action: "create" }],
  };
  state = [rec, ...state];
  
  api.createAuditoria({
    entidade_tipo: rec.kind,
    entidade_id: parseInt(rec.id.replace(/[^0-9]/g, "")),
    acao: "create",
    usuario: input.currentUser,
    detalhes: rec.subject,
  }).catch(e => console.error("Audit log error:", e));
  logActivity({
    at: nowIso(),
    user: input.currentUser,
    action: "create",
    recordId: rec.id,
    store: rec.store,
    luc: rec.luc,
    kind: rec.kind,
    subject: rec.subject
  });
  emit();
  return rec;
}

export async function updateRecord(id: string, patch: Partial<OpRecord>, currentUser: string) {
  const record = state.find(r => r.id === id);
  if (!record) return;

  // Cross-field integrity: a multa MUST be linked to an "ocorrencia" of the same store;
  // a notificacao MUST be linked to a vistoria/multa of the same store. Reject otherwise.
  const nextKind = (patch.kind ?? record.kind) as RecordKind;
  const nextStore = (patch.store ?? record.store) as string;
  const nextLinked = (patch.linkedRecordIds ?? record.linkedRecordIds ?? []) as string[];
  if (nextKind === "multa") {
    const ok = nextLinked.length > 0 && nextLinked.every((lid) => {
      const t = state.find((x) => x.id === lid);
      return !!t && t.kind === "ocorrencia" && t.store === nextStore;
    });
    if (!ok) throw new Error("Multa deve estar vinculada a uma ocorrência da mesma loja.");
  }
  if (nextKind === "notificacao" && nextLinked.length > 0) {
    const ok = nextLinked.every((lid) => {
      const t = state.find((x) => x.id === lid);
      return !!t && (t.kind === "vistoria" || t.kind === "multa") && t.store === nextStore;
    });
    if (!ok) throw new Error("Notificação deve referenciar vistoria/multa da mesma loja.");
  }

  // Se o usuário tentar mudar a loja, bloquear caso o registro seja alvo de vínculos (ex: Multa vinculada à Ocorrência)
  if (nextStore !== record.store) {
    const hasDependents = state.some(x => x.linkedRecordIds?.includes(id));
    if (hasDependents) {
      throw new Error("Não é possível alterar a loja deste registro pois ele está vinculado a outros registros (ex: Multas/Notificações).");
    }
  }

  try {
    const nextArea = patch.area || record.area || "Eng";
    const nextTaxonomy = patch.taxonomy || record.taxonomy || "Manutenção";

    // Resolve loja_id from the record's LUC to avoid hardcoding
    const lojas = await api.getLojas().catch(() => []);
    const recordLuc = patch.luc || record.luc;
    const loja = lojas.find(l => l.luc === recordLuc);
    const loja_id = loja ? loja.loja_id : (lojas.length > 0 ? lojas[0].loja_id : 1);
    
    if (record.kind === "ocorrencia") {
      await api.updateOcorrencia(parseInt(id.replace("OCO-", "")), {
        loja_id,
        area_responsavel: AREA_TO_DB[nextArea] || "Eng",
        categoria: OCORRENCIA_CAT_TO_DB[nextTaxonomy] || "Manutenção",
        assunto: patch.subject || record.subject,
        descricao: patch.details || record.details,
      });
    } else if (record.kind === "multa") {
      const nextStatus = patch.status || record.status;
      let dbStatus: string = "Pendente";
      if (nextStatus === "Paga" || nextStatus === "Faturada") dbStatus = "Faturada";
      else if (nextStatus === "Cancelada") dbStatus = "Cancelada";

      await api.updateMulta(parseInt(id.replace("MUL-", "")), {
        ocorrencia_id: record.linkedRecordIds ? parseInt(record.linkedRecordIds[0].replace("OCO-", "")) : 0,
        categoria: nextTaxonomy, // Multa matches DB directly
        assunto: patch.subject || record.subject,
        valor_multa: patch.amount !== undefined ? patch.amount : (record.amount || 0),
        status: dbStatus,
      });
    } else if (record.kind === "vistoria") {
      await api.updateVistoria(parseInt(id.replace("VIS-", "")), {
        loja_id,
        usuario_id: 1, // TODO: resolve from logged-in user when backend auth is implemented
        area_responsavel: AREA_TO_DB[nextArea] || "Eng",
        categoria: VISTORIA_CAT_TO_DB[nextTaxonomy] || "Reformar loja",
        assunto: patch.subject || record.subject,
        descricao: patch.details || record.details,
      });
    }
  } catch (e) { 
    console.error("update backend error", e); 
    throw new Error(e instanceof Error ? e.message : "Erro no servidor ao atualizar registro.");
  }

  state = state.map((r) => {
    if (r.id !== id) return r;
    const audit: AuditEntry[] = [...r.audit];
    Object.keys(patch).forEach((k) => {
      const key = k as keyof OpRecord;
      if (key === "audit" || key === "id") return;
      const before = r[key];
      const after = patch[key];
      if (before !== after) {
        const atStr = nowIso();
        const actionStr = key === "status" ? "status" : "update";
        const beforeStr = before !== undefined ? String(before) : "—";
        const afterStr = after !== undefined ? String(after) : "—";
        audit.push({
          at: atStr,
          user: currentUser,
          action: actionStr,
          field: String(key),
          before: beforeStr,
          after: afterStr,
        });
        api.createAuditoria({
          entidade_tipo: record.kind,
          entidade_id: parseInt(id.replace(/[^0-9]/g, "")),
          acao: actionStr,
          usuario: currentUser,
          campo: String(key),
          valor_anterior: beforeStr,
          valor_novo: afterStr,
        }).catch(e => console.error("Audit log error:", e));
      }
    });
    return { ...r, ...patch, audit };
  });

  logActivity({
    at: nowIso(),
    user: currentUser,
    action: "update",
    recordId: id,
    store: record.store,
    luc: record.luc,
    kind: record.kind,
    subject: record.subject
  });
  emit();
}

export async function deleteRecord(id: string, currentUser: string) {
  const r = state.find((x) => x.id === id);
  if (!r) return;

  const hasDependents = state.some(x => x.linkedRecordIds?.includes(id));
  if (hasDependents) {
    throw new Error("Não é possível excluir este registro pois possui outros registros dependentes (ex: Multas/Notificações). Exclua-os primeiro.");
  }

  try {
    if (r.kind === "ocorrencia") {
      await api.deleteOcorrencia(parseInt(id.replace("OCO-", "")));
    } else if (r.kind === "multa") {
      await api.deleteMulta(parseInt(id.replace("MUL-", "")));
    } else if (r.kind === "vistoria") {
      await api.deleteVistoria(parseInt(id.replace("VIS-", "")));
    }
  } catch (err) {
    console.error("Falha ao deletar do backend", err);
    throw new Error("Erro no servidor ao deletar registro.");
  }

  api.createAuditoria({
    entidade_tipo: r.kind,
    entidade_id: parseInt(id.replace(/[^0-9]/g, "")),
    acao: "delete",
    usuario: currentUser,
    detalhes: r.subject,
  }).catch(e => console.error("Audit log error:", e));

  state = state.filter((x) => x.id !== id);
  
  logActivity({
    at: nowIso(),
    user: currentUser,
    action: "delete",
    recordId: id,
    store: r.store,
    luc: r.luc,
    kind: r.kind,
    subject: r.subject
  });
  emit();
}

// no-op: view events are no longer tracked
export function logView(_recordId: string, _currentUser: string) {}

export function getRecordsByStore(store: string) {
  return state.filter(r => r.store === store).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getStoreSituation(store: string): { level: "healthy" | "attention" | "critical"; label: string; openFines: number; openFinesCount: number; activeProcesses: number; failedInspections: number } {
  const rs = state.filter(r => r.store === store);
  const openFinesList = rs.filter(r => r.kind === "multa" && r.status !== "Paga");
  const openFines = openFinesList.reduce((s, r) => s + (r.amount || 0), 0);
  const activeProcesses = rs.filter(r => r.kind === "interacao" && r.processStatus !== "finalizado" && r.workflowSteps && r.workflowSteps.length > 0).length;
  const failedInspections = rs.filter(r => r.kind === "vistoria" && r.result === "Reprovado").length;

  let level: "healthy" | "attention" | "critical" = "healthy";
  let label = "Regular";
  if (openFines > 3000 || failedInspections > 0) { level = "critical"; label = "Crítico"; }
  else if (openFinesList.length > 0 || activeProcesses > 0) { level = "attention"; label = "Atenção"; }
  return { level, label, openFines, openFinesCount: openFinesList.length, activeProcesses, failedInspections };
}

export function canEdit(r: OpRecord, currentArea: Area) {
  // Check if current user has edit permission from profile
  const perms = getCurrentPermissions();
  if (!perms.editRecords) return false;
  return true;
}

export function isStepSubmitted(step: WorkflowStep) {
  return !!(step.deliverable && step.deliverable.trim().length > 0);
}

export function submitStepWork(recordId: string, stepIndex: number, patch: { deliverable?: string; attachments?: Attachment[] }, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || !record.workflowSteps) return;
  const steps = [...record.workflowSteps];
  const current = steps[stepIndex];
  if (!current) return;
  steps[stepIndex] = {
    ...current,
    deliverable: patch.deliverable !== undefined ? patch.deliverable : current.deliverable,
    stepAttachments: patch.attachments !== undefined ? patch.attachments : current.stepAttachments,
    startedAt: current.startedAt || nowIso(),
  };
  updateRecord(recordId, { workflowSteps: steps }, currentUser);
}

export function addStepComment(recordId: string, stepIndex: number, text: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || !record.workflowSteps) return;
  const steps = [...record.workflowSteps];
  const current = steps[stepIndex];
  if (!current) return;
  const comment: StepComment = {
    id: `CM-${Math.floor(Math.random() * 100000)}`,
    at: nowIso(),
    user: currentUser,
    text: text.trim(),
  };
  steps[stepIndex] = { ...current, comments: [...(current.comments || []), comment] };
  updateRecord(recordId, { workflowSteps: steps }, currentUser);
}

export function advanceWorkflow(recordId: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || !record.workflowSteps || record.currentStepIndex === undefined) return;
  const currentStep = record.workflowSteps[record.currentStepIndex];
  if (!isStepSubmitted(currentStep)) return;

  const nextIndex = record.currentStepIndex + 1;
  if (nextIndex >= record.workflowSteps.length) return;

  const updatedSteps = [...record.workflowSteps];
  updatedSteps[record.currentStepIndex] = {
    ...updatedSteps[record.currentStepIndex],
    status: "completed",
    completedAt: nowIso(),
    completedBy: currentUser,
  };
  updatedSteps[nextIndex] = {
    ...updatedSteps[nextIndex],
    status: "current",
    startedAt: nowIso(),
  };

  updateRecord(recordId, {
    workflowSteps: updatedSteps,
    currentStepIndex: nextIndex,
    area: updatedSteps[nextIndex].area,
  }, currentUser);
}

export function finalizeProcess(recordId: string, currentUser: string, finalReport?: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || !record.workflowSteps || record.currentStepIndex === undefined) return;
  const lastIdx = record.workflowSteps.length - 1;
  if (record.currentStepIndex !== lastIdx) return;
  const currentStep = record.workflowSteps[lastIdx];
  if (!isStepSubmitted(currentStep)) return;

  const updatedSteps = [...record.workflowSteps];
  updatedSteps[lastIdx] = {
    ...updatedSteps[lastIdx],
    status: "completed",
    completedAt: nowIso(),
    completedBy: currentUser,
  };
  updateRecord(recordId, {
    workflowSteps: updatedSteps,
    processStatus: "finalizado",
    finalizedAt: nowIso(),
    finalizedBy: currentUser,
    finalReport: finalReport?.trim() || undefined,
  }, currentUser);
}

// ─── Attachment helpers ──────────────────────────────────────────────────────
//
// O backend persistirá os anexos em Postgres como BYTEA. Hoje guardamos o
// arquivo como `dataUrl` (base64) in-memory; o contrato com o servidor deve
// ser:
//   POST /api/records/:id/attachments   body: { name, mimeType, size, data: base64 }
//   GET  /api/attachments/:id           → stream com Content-Type/Disposition
// Trocar `fileToAttachment` por uma chamada de upload e popular `id`/`url` no
// retorno é suficiente — a UI já lê `url` antes de cair para `dataUrl`.

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const v = bytes / Math.pow(1024, i);
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: formatBytes(file.size),
        sizeBytes: file.size,
        mimeType: file.type || "application/octet-stream",
        dataUrl: typeof reader.result === "string" ? reader.result : undefined,
        uploadedAt: nowIso(),
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToAttachments(files: FileList | File[]): Promise<Attachment[]> {
  return Promise.all(Array.from(files).map(fileToAttachment));
}

export function getAttachmentHref(att: Attachment): string | undefined {
  return att.url || att.dataUrl;
}

export function openAttachment(att: Attachment) {
  const href = getAttachmentHref(att);
  if (!href) return;
  window.open(href, "_blank", "noopener,noreferrer");
}

export function downloadAttachment(att: Attachment) {
  const href = getAttachmentHref(att);
  if (!href) return;
  const a = document.createElement("a");
  a.href = href;
  a.download = att.name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function addNotificationMessage(recordId: string, text: string, attachments: Attachment[] | undefined, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || record.kind !== "notificacao") return;
  const msg: NotificationMessage = {
    id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    at: nowIso(),
    from: "gestao",
    author: currentUser,
    text: text.trim(),
    attachments: attachments && attachments.length > 0 ? attachments : undefined,
  };
  const conversation = [...(record.conversation || []), msg];
  updateRecord(recordId, { conversation }, currentUser);
}

export function resolveNotification(recordId: string, resolution: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || record.kind !== "notificacao") return;
  updateRecord(recordId, {
    resolution: resolution.trim(),
    resolvedAt: nowIso(),
    resolvedBy: currentUser,
  }, currentUser);
}

export function reopenNotification(recordId: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || record.kind !== "notificacao") return;
  updateRecord(recordId, {
    resolution: undefined,
    resolvedAt: undefined,
    resolvedBy: undefined,
  }, currentUser);
}

export function reopenProcess(recordId: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || record.processStatus !== "finalizado") return;
  updateRecord(recordId, { processStatus: "em_andamento", finalizedAt: undefined, finalizedBy: undefined }, currentUser);
}

export function revertWorkflow(recordId: string, currentUser: string) {
  const record = state.find(r => r.id === recordId);
  if (!record || !record.workflowSteps || record.currentStepIndex === undefined) return;

  const prevIndex = record.currentStepIndex - 1;
  if (prevIndex < 0) return;

  const updatedSteps = [...record.workflowSteps];
  updatedSteps[record.currentStepIndex] = {
    ...updatedSteps[record.currentStepIndex],
    status: "pending",
  };
  updatedSteps[prevIndex] = {
    ...updatedSteps[prevIndex],
    status: "current",
    completedAt: undefined,
    completedBy: undefined,
  };

  updateRecord(recordId, {
    workflowSteps: updatedSteps,
    currentStepIndex: prevIndex,
    area: updatedSteps[prevIndex].area,
  }, currentUser);
}
