"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { PageLoading } from "@/components/ui/PageState";
import { request, ApiError } from "@/lib/api";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code provided by Google.");
      return;
    }

    request<{ token: string }>("/api/auth/google/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
      .then((res: { token: string }) => {
        localStorage.setItem("duo.token", res.token);
        router.push("/learn");
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to link Google account.");
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center p-4">
        <Mascot mood="sad" size={150} />
        <h1 className="mt-6 text-[24px] font-extrabold text-ink text-center">{error}</h1>
        <button 
          onClick={() => router.push("/auth")}
          className="mt-6 rounded-2xl bg-primary px-6 py-3 font-extrabold text-white shadow-[0_4px_0_rgb(var(--primary-shadow))] hover:brightness-110 active:translate-y-1 active:shadow-none"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="animate-bounce">
        <Mascot mood="cheer" size={150} />
      </div>
      <h1 className="mt-6 text-[24px] font-extrabold text-ink">Logging you in...</h1>
    </div>
  );
}
