"use client";

import { Search, X } from "lucide-react";
import { ConversationFilter } from "@/hooks/use-conversations";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filter: ConversationFilter;
  setFilter: (filter: ConversationFilter) => void;
  unreadCount: number;
}

export function SearchBar({
  searchTerm,
  setSearchTerm,
  filter,
  setFilter,
  unreadCount,
}: SearchBarProps) {
  return (
    <div className="space-y-3 p-4">
      {/* Container do Input de Busca */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar conversa ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl bg-slate-800/50 py-2.5 pl-10 pr-9 text-sm text-slate-100 placeholder-slate-400 outline-none border border-slate-700/30 focus:border-indigo-500/50 focus:bg-slate-800/80 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 rounded-full p-0.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Controle de Filtros Segmentados */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-indigo-600 text-indigo-50 shadow-sm shadow-indigo-600/10"
              : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all ${
            filter === "unread"
              ? "bg-indigo-600 text-indigo-50 shadow-sm shadow-indigo-600/10"
              : "bg-slate-800/30 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          }`}
        >
          Não lidas
          {unreadCount > 0 && (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === "unread"
                  ? "bg-indigo-900/50 text-indigo-200"
                  : "bg-indigo-600 text-indigo-50"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
