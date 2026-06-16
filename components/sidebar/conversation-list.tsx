"use client";

import { useConversations } from "@/hooks/use-conversations";
import { ConversationItem } from "./conversation-item";
import { SearchBar } from "./search-bar";
import { Skeleton } from "../ui/skeleton";
import { MessageSquareOff, AlertCircle } from "lucide-react";

import { VirtualList } from "../ui/virtual-list";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const {
    conversations,
    filteredConversations,
    isLoading,
    isError,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    refetch,
  } = useConversations();

  // Computar total de mensagens não lidas
  const totalUnreadCount = conversations 
    ? conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0)
    : 0;

  return (
    <div className="flex flex-col h-full bg-sidebar-bg">
      {/* Header de Busca e Filtros */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filter={filter}
        setFilter={setFilter}
        unreadCount={totalUnreadCount}
      />

      {/* Corpo da Lista de Conversas */}
      <div className="flex-1 min-h-0">
        {isLoading && (
          <div className="space-y-1 overflow-y-auto h-full p-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-4 border-b border-slate-900/30">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-3.5 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full overflow-y-auto">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm">Erro ao carregar conversas</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !isError && filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full overflow-y-auto">
            <MessageSquareOff className="h-8 w-8 text-slate-500 mb-2" />
            <p className="text-sm">Nenhuma conversa encontrada</p>
            {searchTerm && (
              <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca</p>
            )}
          </div>
        )}

        {!isLoading && !isError && filteredConversations.length > 0 && (
          <VirtualList
            items={filteredConversations}
            itemHeight={76}
            className="h-full"
            renderItem={(conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isSelected={selectedId === conv.id}
                onSelect={() => onSelect(conv.id)}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
