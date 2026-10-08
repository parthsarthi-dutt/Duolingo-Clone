"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/Mascot";
import { auth, ApiError, request } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [successName, setSuccessName] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleGoogle() {
    try {
      const res = await request<{ url: string }>("/api/auth/google");
      window.location.href = res.url;
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : "Google OAuth is not configured on the backend." });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let res;
      if (mode === "register") {
        res = await auth.register({ email, password, display_name: name || email.split("@")[0] });
      } else {
        res = await auth.login({ email, password });
      }
      localStorage.setItem("duo.token", res.token);
      
      // Show animation and speech bubble!
      setSuccessName(res.display_name);
      setTimeout(() => {
        router.push("/learn");
      }, 2500);

    } catch (err) {
      setBusy(false);
      toast({ title: err instanceof ApiError ? err.message : "Authentication failed" });
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-line bg-surface p-6 shadow-xl">
        <div className="relative mb-8 flex flex-col items-center">
          {successName && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border-2 border-line bg-white px-4 py-2 text-[17px] font-extrabold text-ink shadow-sm z-10">
              ¡Hola, {successName}! I am Duo!
              <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-white" />
            </div>
          )}
          
          <div className={successName ? "animate-bounce transition-transform" : ""}>
            <Mascot size={120} mood={successName ? "cheer" : "default"} />
          </div>
          
          {!successName && (
            <h1 className="mt-4 text-[24px] font-extrabold text-ink">
              {mode === "login" ? "Log in" : "Create your profile"}
            </h1>
          )}
        </div>

        {!successName && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-xl border-2 border-line bg-bg px-4 font-semibold text-ink outline-none focus:border-macaw"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-2 border-line bg-bg px-4 font-semibold text-ink outline-none focus:border-macaw"
            />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-2 border-line bg-bg px-4 font-semibold text-ink outline-none focus:border-macaw"
            />
            <Button type="submit" variant="primary" fullWidth disabled={busy || !email || !password}>
              {mode === "login" ? "Log in" : "Create account"}
            </Button>
            
            <div className="relative my-2 flex items-center">
              <div className="flex-grow border-t-2 border-line"></div>
              <span className="mx-4 text-[13px] font-extrabold uppercase text-muted">Or</span>
              <div className="flex-grow border-t-2 border-line"></div>
            </div>

            <Button type="button" variant="blue" fullWidth disabled={busy} onClick={handleGoogle}>
              Continue with Google
            </Button>
          </form>
        )}

        {!successName && (
          <div className="mt-6 flex justify-center border-t-2 border-line pt-6">
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-[15px] font-extrabold text-macaw hover:brightness-125"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
