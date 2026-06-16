import type { Agent, Conversation } from "@/lib/api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`API ${path} respondeu ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Busca o perfil do atendente no servidor (RSC / prefetch). */
export function getMeServer(): Promise<Agent> {
  return serverFetch<Agent>("/me");
}

/** Busca a lista de conversas no servidor (RSC / prefetch). */
export function getConversationsServer(): Promise<Conversation[]> {
  return serverFetch<Conversation[]>("/conversations");
}
