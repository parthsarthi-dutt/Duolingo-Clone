"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastOptions {
  title: string;
  description?: string;
  icon?: ReactNode;
}

interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastApi {
  toast: (options: ToastOptions) => void;
  /** Shorthand for features the brief lists as placeholders. */
  comingSoon: (feature?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VISIBLE_MS = 3600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-3), { ...options, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, VISIBLE_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      comingSoon: (feature) =>
        toast({
          title: "Coming soon",
          description: feature ? `${feature} isn't available yet.` : "This isn't available yet.",
          icon: <span className="text-2xl">🚧</span>,
        }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex w-full max-w-[400px] animate-rise-in items-center gap-3 rounded-2xl border-2 border-line bg-bg px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
          >
            {item.icon && <span className="flex shrink-0 items-center">{item.icon}</span>}
            <div className="min-w-0">
              <p className="text-[17px] font-extrabold leading-tight text-ink">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-[15px] font-semibold leading-snug text-ink-soft">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}
