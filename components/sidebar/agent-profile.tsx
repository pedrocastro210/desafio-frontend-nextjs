"use client";

import { useMe } from "@/hooks/use-me";
import { User, LogOut, ShieldAlert } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function AgentProfile() {
  const { data: agent, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-800/80 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (isError || !agent) {
    return (
      <div className="flex items-center gap-2 border-b border-slate-800/80 p-4 text-xs text-red-400">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Erro ao carregar perfil</span>
      </div>
    );
  }

  // Busca iniciais
  const initials = agent.name
    ? agent.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "AT";

  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Avatar com fundo dinâmico colorido com base no nome */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-semibold text-indigo-50 shadow-md">
          {initials}
          {/* Indicador de Status (Online) */}
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border border-slate-900 bg-emerald-500" />
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-100">{agent.name}</span>
          <span className="text-xs text-slate-400 capitalize">{agent.role}</span>
        </div>
      </div>

      {/* Botões de Ação se necessário, ex.: Botão de Configurações/Sair (placeholder) */}
      <button 
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        aria-label="Sair"
        title="Sair do painel (Demonstração)"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
