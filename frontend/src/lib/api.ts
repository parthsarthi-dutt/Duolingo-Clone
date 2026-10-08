import type {
  AnswerResult,
  Leaderboard,
  LessonSession,
  Path,
  Profile,
  Quests,
  SessionMode,
  SessionSummary,
  ShopItem,
  Submission,
  User,
} from "./types";

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

/** An error response from the API, carrying its machine-readable `code`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("duo.token") : null;
    const headers: Record<string, string> = { "Content-Type": "application/json", ...(init?.headers as any) };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(0, "network_error", "Can't reach the server. Is the backend running?");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new ApiError(
      response.status,
      detail?.code ?? "request_failed",
      detail?.message ?? "Something went wrong. Please try again.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

/** SWR cache keys double as the GET paths. */
export const keys = {
  me: "/api/me",
  path: "/api/path",
  leaderboard: "/api/leaderboard",
  quests: "/api/quests",
  profile: "/api/profile",
  shop: "/api/shop",
} as const;

/** Parameterised cache keys (kept apart from `keys`, which is iterated to refresh progress). */
export const guidebookKey = (unitId: number) => `/api/units/${unitId}/guidebook`;
export const reviewKey = (sessionId: number) => `/api/sessions/${sessionId}/review`;

export const fetcher = <T>(path: string) => request<T>(path);

export const api = {
  me: () => request<User>(keys.me),
  path: () => request<Path>(keys.path),
  leaderboard: () => request<Leaderboard>(keys.leaderboard),
  quests: () => request<Quests>(keys.quests),
  profile: () => request<Profile>(keys.profile),
  shop: () => request<ShopItem[]>(keys.shop),

  updateMe: (changes: { display_name?: string; daily_goal_xp?: number }) =>
    request<User>(keys.me, { method: "PATCH", body: JSON.stringify(changes) }),

  startSession: (mode: SessionMode, skillId?: number) =>
    post<LessonSession>("/api/sessions", { mode, skill_id: skillId ?? null }),
  submitAnswer: (sessionId: number, exerciseId: number, submission: Submission) =>
    post<AnswerResult>(`/api/sessions/${sessionId}/answers`, {
      exercise_id: exerciseId,
      ...submission,
    }),
  completeSession: (sessionId: number) =>
    post<SessionSummary>(`/api/sessions/${sessionId}/complete`),
  abandonSession: (sessionId: number) => post<void>(`/api/sessions/${sessionId}/abandon`),

  claimChest: (skillId: number) =>
    post<{ gems_awarded: number; user: User }>(`/api/skills/${skillId}/claim`),
  purchase: (itemKey: string) =>
    post<{ message: string; user: User }>("/api/shop/purchase", { item_key: itemKey }),

  advanceDay: (days: number) => post<User>("/api/dev/advance-day", { days }),
  resetProgress: () => post<User>("/api/dev/reset"),
};

export const auth = {
  login: (body: any) => post<{ token: string; user_id: number; display_name: string }>("/api/auth/login", body),
  register: (body: any) => post<{ token: string; user_id: number; display_name: string }>("/api/auth/register", body),
  getProviders: () => request<{ email: boolean; google: boolean }>("/api/auth/providers"),
  logout: () => {
    localStorage.removeItem("duo.token");
    window.location.href = "/auth";
  },
};
