import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Download, Camera, RefreshCw, AlertCircle, FileText, ExternalLink } from "lucide-react";
import { Attachment, downloadAttachment, getAttachmentHref, fileToAttachment } from "../recordsStore";

// ─── AttachmentViewer ────────────────────────────────────────────────────────
// Inline preview para imagens (<img>) e PDF (<iframe>). Outros tipos caem
// em fallback com botão de download / abrir em nova aba.

export function AttachmentViewer({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const href = getAttachmentHref(attachment);
  const mime = attachment.mimeType || guessMimeFromName(attachment.name);
  const isImage = mime.startsWith("image/");
  const isPdf = mime === "application/pdf";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] bg-black/80 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 p-3 text-white bg-gradient-to-b from-black/60 to-transparent" onClick={(e) => e.stopPropagation()}>
        <FileText className="w-5 h-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{attachment.name}</div>
          <div className="text-[11px] text-white/60">{attachment.size}{mime ? ` · ${mime}` : ""}</div>
        </div>
        {href && (
          <>
            <button type="button"
              onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
              title="Abrir em nova aba"
              className="p-2 rounded-full hover:bg-white/15"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
            <button type="button"
              onClick={() => downloadAttachment(attachment)}
              title="Baixar"
              className="p-2 rounded-full hover:bg-white/15"
            >
              <Download className="w-5 h-5" />
            </button>
          </>
        )}
        <button type="button" onClick={onClose} title="Fechar" className="p-2 rounded-full hover:bg-white/15">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={(e) => e.stopPropagation()}>
        {!href ? (
          <FallbackMessage text="Anexo sem conteúdo disponível para visualização." />
        ) : isImage ? (
          <img src={href} alt={attachment.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
        ) : isPdf ? (
          <iframe src={href} title={attachment.name} className="w-full h-full bg-white rounded-lg shadow-2xl" />
        ) : (
          <div className="bg-white rounded-2xl p-8 max-w-md text-center space-y-4">
            <FileText className="w-12 h-12 text-[#8B1A1A] mx-auto" />
            <div>
              <h3 className="font-bold text-gray-900">Visualização não suportada</h3>
              <p className="text-sm text-gray-500 mt-1">Este tipo de arquivo ({mime || "desconhecido"}) não pode ser exibido aqui. Baixe ou abra em nova aba.</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button type="button"
                onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" /> Abrir
              </button>
              <button type="button"
                onClick={() => downloadAttachment(attachment)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B1A1A] text-white text-sm font-bold hover:bg-[#a43030]"
              >
                <Download className="w-4 h-4" /> Baixar
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FallbackMessage({ text }: { text: string }) {
  return (
    <div className="text-white/70 text-sm flex items-center gap-2 bg-white/5 px-4 py-3 rounded-xl">
      <AlertCircle className="w-4 h-4" /> {text}
    </div>
  );
}

function guessMimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", heic: "image/heic",
    pdf: "application/pdf",
    txt: "text/plain", csv: "text/csv",
    doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] || "";
}

// ─── CameraCapture ───────────────────────────────────────────────────────────
// Câmera real via getUserMedia; tira a foto em <canvas> e devolve um
// Attachment pronto (dataUrl PNG/JPEG). Aceita troca entre câmera frontal e
// traseira no mobile.

function isCameraBlockedByEnv(): boolean {
  if (typeof window === "undefined") return true;
  if (!window.isSecureContext) return true;
  if (!navigator.mediaDevices?.getUserMedia) return true;
  // Iframes (como o preview do Figma Make) precisam de allow="camera" no host.
  // Sem Permissions-Policy delegada, getUserMedia falha com NotAllowedError
  // antes mesmo de mostrar o prompt do navegador.
  try {
    if (window.self !== window.top) {
      const fp: any = (document as any).featurePolicy || (document as any).permissionsPolicy;
      if (fp?.allowsFeature && !fp.allowsFeature("camera")) return true;
    }
  } catch {
    // cross-origin access throws — assume blocked in iframe
    return true;
  }
  return false;
}

export function CameraCapture({ onCapture, onClose }: { onCapture: (att: Attachment) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewFileRef = useRef<File | null>(null);
  const [ready, setReady] = useState(false);
  const [useNative, setUseNative] = useState<boolean>(() => isCameraBlockedByEnv());
  const triggeredNativeRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      stop();
      setError(null);
      setReady(false);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("unsupported"), { name: "NotSupportedError" });
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e: any) {
        // Restrições de ambiente (iframe sem allow="camera", contexto inseguro,
        // navegador sem suporte) caem direto no caminho nativo, que abre a
        // câmera do sistema operacional via input file.
        const name = e?.name || "";
        const envBlocked = name === "NotAllowedError" || name === "NotSupportedError" || name === "SecurityError" || name === "NotFoundError";
        if (envBlocked) {
          setUseNative(true);
          return;
        }
        setError(e?.message || "Não foi possível acessar a câmera.");
      }
    }
    if (!previewUrl && !useNative) start();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, previewUrl, useNative]);

  // Dispara o seletor nativo automaticamente assim que detectamos que a
  // câmera in-app não funciona neste ambiente.
  useEffect(() => {
    if (!useNative || previewUrl || triggeredNativeRef.current) return;
    triggeredNativeRef.current = true;
    // Não dispara click() automaticamente — navegadores bloqueiam file pickers
    // abertos fora de um gesto real do usuário. O botão "Abrir câmera" na UI
    // (linha ~325) cuida de acionar o input com o clique do usuário.
  }, [useNative, previewUrl]);

  async function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) {
      // Usuário cancelou o file picker — mantém o modal aberto para tentar
      // novamente em vez de fechar (o que causava o bug de "sair da tela").
      return;
    }
    const att = await fileToAttachment(file);
    onCapture(att);
  }

  useEffect(() => () => stop(), []);

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const filename = `foto-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
        const file = new File([blob], filename, { type: "image/jpeg" });
        previewFileRef.current = file;
        setPreviewUrl(URL.createObjectURL(blob));
        stop();
      },
      "image/jpeg",
      0.92,
    );
  }

  async function confirm() {
    const file = previewFileRef.current;
    if (!file) return;
    const att = await fileToAttachment(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onCapture(att);
  }

  function retake() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewFileRef.current = null;
    setPreviewUrl(null);
  }

  function flip() {
    setFacing((f) => (f === "environment" ? "user" : "environment"));
  }

  return (
    <motion.div
      className="fixed inset-0 z-[95] bg-black flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden native input — usado quando getUserMedia está bloqueado
          (ex.: dentro de iframe sem allow="camera"). No mobile, este input
          com capture="environment" abre direto o app de câmera do sistema. */}
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleNativeChange}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent">
        <button type="button" onClick={onClose} className="p-2 bg-white/15 rounded-full hover:bg-white/25" title="Fechar">
          <X className="w-5 h-5" />
        </button>
        <div className="font-bold text-sm">{previewUrl ? "Revisar foto" : "Câmera de Evidência"}</div>
        {!previewUrl && !useNative ? (
          <button type="button" onClick={flip} className="p-2 bg-white/15 rounded-full hover:bg-white/25" title="Trocar câmera">
            <RefreshCw className="w-5 h-5" />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* Stage */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-[#8B1A1A] mx-auto" />
            <p className="text-sm text-gray-700">{error}</p>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-[#8B1A1A] text-white text-sm font-bold hover:bg-[#a43030]">Fechar</button>
          </div>
        ) : useNative && !previewUrl ? (
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm text-center space-y-4">
            <Camera className="w-10 h-10 text-[#8B1A1A] mx-auto" />
            <div>
              <h3 className="font-bold text-gray-900">Abrindo câmera do dispositivo…</h3>
              <p className="text-xs text-gray-500 mt-1">
                Estamos usando a câmera nativa do seu celular. Se o app não abriu, toque em "Abrir câmera" abaixo.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <button type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B1A1A] text-white text-sm font-bold hover:bg-[#a43030]"
              >
                <Camera className="w-4 h-4" /> Abrir câmera
              </button>
            </div>
          </div>
        ) : previewUrl ? (
          <img src={previewUrl} alt="Pré-visualização" className="max-w-full max-h-full object-contain" />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70 text-xs gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Iniciando câmera…
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 flex items-center justify-center gap-6 bg-gradient-to-t from-black/70 to-transparent">
        {previewUrl ? (
          <>
            <button type="button" onClick={retake} className="px-5 py-3 rounded-2xl bg-white/15 text-white font-bold text-sm hover:bg-white/25 backdrop-blur">
              Tirar outra
            </button>
            <button type="button" onClick={confirm} className="px-6 py-3 rounded-2xl bg-[#8B1A1A] text-white font-bold text-sm hover:bg-[#a43030] shadow-lg">
              Usar foto
            </button>
          </>
        ) : (
          !error && !useNative && (
            <button type="button"
              onClick={capture}
              disabled={!ready}
              title="Capturar"
              className="w-18 h-18 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-50 flex items-center justify-center p-1.5 transition-all"
              style={{ width: 72, height: 72 }}
            >
              <div className="w-full h-full bg-white rounded-full shadow-2xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-[#8B1A1A]" />
              </div>
            </button>
          )
        )}
      </div>
    </motion.div>
  );
}

// ─── Convenience wrappers for AnimatePresence ─────────────────────────────────

export function AttachmentViewerHost({ attachment, onClose }: { attachment: Attachment | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {attachment && <AttachmentViewer attachment={attachment} onClose={onClose} />}
    </AnimatePresence>
  );
}

export function CameraCaptureHost({ open, onCapture, onClose }: { open: boolean; onCapture: (att: Attachment) => void; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && <CameraCapture onCapture={onCapture} onClose={onClose} />}
    </AnimatePresence>
  );
}

