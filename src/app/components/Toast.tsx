import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, X, Info, AlertTriangle } from "lucide-react";

type ToastKind = "success" | "info" | "warning";
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastCtx {
  push: (t: Omit<ToastItem, "id">) => void;
}

const Ctx = createContext<ToastCtx>({ push: () => {} });

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-2 sm:px-0" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.kind === "success" ? CheckCircle2 : t.kind === "warning" ? AlertTriangle : Info;
          const palette =
            t.kind === "success"
              ? "border-[#1b5e20] bg-[#e8f5e9] text-[#1b5e20]"
              : t.kind === "warning"
              ? "border-[#b71c1c] bg-[#ffebee] text-[#b71c1c]"
              : "border-[#8B1A1A] bg-white text-[#8B1A1A]";
          return (
            <div
              key={t.id}
              className={`shadow-lg rounded-xl border-l-4 bg-white p-4 flex items-start gap-3 animate-in slide-in-from-right ${palette}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-gray-900">{t.title}</div>
                {t.message && <div className="text-sm text-gray-600 mt-0.5">{t.message}</div>}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="p-1 text-gray-400 hover:text-gray-700 rounded"
                aria-label="Fechar notificação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
