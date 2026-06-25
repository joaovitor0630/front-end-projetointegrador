// Types are defined locally; no need to import from recordsStore (avoids circular dependency).

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";

// Helper for fetching
async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── LOJAS ───────────────────────────────────────────────────────────────────

export interface LojaDB {
  loja_id: number;
  nome: string;
  luc: string;
  segmento: string;
}

export async function getLojas(): Promise<LojaDB[]> {
  return request("/lojas");
}

export async function createLoja(loja: Omit<LojaDB, "loja_id">): Promise<LojaDB> {
  return request("/lojas", { method: "POST", body: JSON.stringify(loja) });
}

export async function updateLoja(id: number, loja: Omit<LojaDB, "loja_id">): Promise<LojaDB> {
  return request(`/lojas/${id}`, { method: "PUT", body: JSON.stringify(loja) });
}

export async function deleteLoja(id: number): Promise<void> {
  return request(`/lojas/${id}`, { method: "DELETE" });
}

// ─── OCORRÊNCIAS ─────────────────────────────────────────────────────────────

export interface OcorrenciaDB {
  ocorrencia_id?: number;
  loja_id: number;
  area_responsavel: string;
  categoria: string;
  assunto: string;
  descricao: string;
  data_registro?: string;
}

export async function getOcorrencias(): Promise<OcorrenciaDB[]> {
  return request("/ocorrencias");
}

export async function createOcorrencia(o: OcorrenciaDB): Promise<OcorrenciaDB> {
  return request("/ocorrencias", { method: "POST", body: JSON.stringify(o) });
}

export async function updateOcorrencia(id: number, o: OcorrenciaDB): Promise<OcorrenciaDB> {
  return request(`/ocorrencias/${id}`, { method: "PUT", body: JSON.stringify(o) });
}

export async function deleteOcorrencia(id: number): Promise<void> {
  return request(`/ocorrencias/${id}`, { method: "DELETE" });
}

// ─── MULTAS ──────────────────────────────────────────────────────────────────

export interface MultaDB {
  multa_id?: number;
  ocorrencia_id: number;
  categoria: string;
  assunto: string;
  valor_multa: number;
  status: string;
}

export async function getMultas(): Promise<MultaDB[]> {
  return request("/multas");
}

export async function createMulta(m: MultaDB): Promise<MultaDB> {
  return request("/multas", { method: "POST", body: JSON.stringify(m) });
}

export async function updateMulta(id: number, m: MultaDB): Promise<MultaDB> {
  return request(`/multas/${id}`, { method: "PUT", body: JSON.stringify(m) });
}

export async function deleteMulta(id: number): Promise<void> {
  return request(`/multas/${id}`, { method: "DELETE" });
}

// ─── VISTORIAS ───────────────────────────────────────────────────────────────

export interface VistoriaDB {
  vistoria_id?: number;
  loja_id: number;
  usuario_id: number;
  area_responsavel: string;
  categoria: string;
  assunto?: string;
  descricao: string;
  data_registro?: string;
}

export async function getVistorias(): Promise<VistoriaDB[]> {
  return request("/vistorias");
}

export async function createVistoria(v: VistoriaDB): Promise<VistoriaDB> {
  return request("/vistorias", { method: "POST", body: JSON.stringify(v) });
}

export async function updateVistoria(id: number, v: VistoriaDB): Promise<VistoriaDB> {
  return request(`/vistorias/${id}`, { method: "PUT", body: JSON.stringify(v) });
}

export async function deleteVistoria(id: number): Promise<void> {
  return request(`/vistorias/${id}`, { method: "DELETE" });
}

// ─── ANEXOS ──────────────────────────────────────────────────────────────────

export interface AnexoDB {
  anexo_id?: number;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  conteudo?: string; // base64, only for upload POST
  ocorrencia_id?: number;
  multa_id?: number;
  vistoria_id?: number;
}

export async function getAnexosByOcorrencia(id: number): Promise<AnexoDB[]> {
  return request(`/anexos?ocorrencia_id=${id}`);
}

export async function getAnexosByMulta(id: number): Promise<AnexoDB[]> {
  return request(`/anexos?multa_id=${id}`);
}

export async function getAnexosByVistoria(id: number): Promise<AnexoDB[]> {
  return request(`/anexos?vistoria_id=${id}`);
}

export async function createAnexo(a: AnexoDB): Promise<AnexoDB> {
  return request("/anexos", { method: "POST", body: JSON.stringify(a) });
}

export async function deleteAnexo(id: number): Promise<void> {
  return request(`/anexos/${id}`, { method: "DELETE" });
}

/**
 * Returns the URL to download/view an attachment's binary content.
 * This URL can be used as `src` for <img> or <iframe> elements.
 */
export function getAnexoDownloadUrl(id: number): string {
  return `${API_BASE}/anexos/${id}/download`;
}

// Extract base64 from dataUrl
export function extractBase64(dataUrl: string): string {
  const parts = dataUrl.split(",");
  return parts.length > 1 ? parts[1] : dataUrl;
}

// ─── AUDITORIA ───────────────────────────────────────────────────────────────

export interface Auditoria {
  auditoria_id?: number;
  entidade_tipo: string;
  entidade_id: number;
  acao: string;
  usuario: string;
  campo?: string;
  valor_anterior?: string;
  valor_novo?: string;
  detalhes?: string;
  data_hora?: string;
}

export async function getAuditoria(tipo: string, id: number): Promise<Auditoria[]> {
  return request(`/auditoria?tipo=${tipo}&id=${id}`);
}

export async function createAuditoria(data: Auditoria): Promise<Auditoria> {
  return request(`/auditoria`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
