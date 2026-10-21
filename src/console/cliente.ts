"use client";

/** Chamadas do console ao servidor. So o console fala com a API; o cartucho nunca. */
import type { Progresso } from "@/lib/progresso";

export type Eu = { username: string; progresso: Progresso };

export type Fechamento = { timeMs: number; erros: number; nota: number; recorde: boolean; primeira: boolean };

export type PlacarDados = {
  geral: { username: string; total: number; fases: number }[];
  porFase: Record<string, { username: string; timeMs: number; erros: number }[]>;
  dia: {
    dia: string;
    faseId: string;
    top: { username: string; nota: number }[];
    fecharam: string[];
    devendo: string[];
  };
};

export class ErroApi extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly campo?: string,
  ) {
    super(message);
  }
}

async function chamar<T>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const response = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ErroApi(data.error ?? "Algo deu errado", response.status, data.campo);
  return data as T;
}

export const api = {
  entrar: (username: string, password: string) =>
    chamar<{ username: string }>("/api/auth/login", { method: "POST", body: { username, password } }),
  cadastrar: (username: string, password: string, codigo: string) =>
    chamar<{ username: string }>("/api/auth/signup", { method: "POST", body: { username, password, codigo } }),
  sair: () => chamar<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  eu: () => chamar<Eu>("/api/eu"),
  comecar: (faseId: string) => chamar<{ id: string }>("/api/tentativas", { method: "POST", body: { faseId } }),
  erro: (id: string) => chamar<{ ok: true }>(`/api/tentativas/${id}/erro`, { method: "POST" }),
  fechar: (id: string) => chamar<Fechamento>(`/api/tentativas/${id}/fechar`, { method: "POST" }),
  placar: () => chamar<PlacarDados>("/api/placar"),
};
