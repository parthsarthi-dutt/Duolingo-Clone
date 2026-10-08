"use client";

import { useEffect, type ReactNode } from "react";
import { SWRConfig } from "swr";

import { ToastProvider } from "@/components/ui/Toast";
import { fetcher } from "@/lib/api";
import { unlockAudio } from "@/lib/audio";

/** Wake the audio engine on the first interaction (browsers block sound before one). */
function useAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
}

export function Providers({ children }: { children: ReactNode }) {
  useAudioUnlock();
  return (
    <SWRConfig 
      value={{ 
        fetcher, 
        revalidateOnFocus: true, 
        dedupingInterval: 1500,
        onError: (error) => {
          if (error?.status === 401) {
            window.location.href = "/auth";
          }
        }
      }}
    >
      <ToastProvider>{children}</ToastProvider>
    </SWRConfig>
  );
}
