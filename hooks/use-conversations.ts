import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getConversations, Conversation } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useState, useMemo, useRef, useEffect } from "react";

export type ConversationFilter = "all" | "unread";

export function useConversations(selectedId: string | null = null) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  
  // Rastrear timestamps de leitura locais para que a polling do backend não sobrescreva nosso estado local "read"
  const localReadTimestamps = useRef<Record<string, string>>({});

  const query = useQuery({
    queryKey: queryKeys.conversations,
    queryFn: getConversations,
    refetchInterval: 5000, // Polling a cada 5 segundos para manter a lista atualizada
    refetchIntervalInBackground: false, // Pausar quando a janela estiver em segundo plano
    select: (data) => {
      // Aplicar timestamps de leitura locais
      return data.map((conv) => {
        const localReadAt = localReadTimestamps.current[conv.id];
        // Se já lemos localmente e a última mensagem não mudou desde que lemos, mantemos unread = 0
        if (localReadAt && new Date(conv.lastMessageAt).getTime() <= new Date(localReadAt).getTime()) {
          return { ...conv, unread: 0 };
        }
        return conv;
      });
    },
  });

  // Sempre que selectedId mudar, marcar como lido localmente instantaneamente
  useEffect(() => {
    if (selectedId && query.data) {
      const conv = query.data.find(c => c.id === selectedId);
      if (conv && conv.unread > 0) {
        localReadTimestamps.current[selectedId] = conv.lastMessageAt;
        
        // Atualizar instantaneamente o cache para que o badge desapareça imediatamente
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (old) => {
          if (!old) return old;
          return old.map(c => c.id === selectedId ? { ...c, unread: 0 } : c);
        });
      }
    }
  }, [selectedId, query.data, queryClient]);

  const filteredConversations = useMemo(() => {
    if (!query.data) return [];

    return query.data.filter((conv) => {
      // Aplicar filtros de aba
      if (filter === "unread" && conv.unread === 0) {
        return false;
      }

      // Aplicar filtros de termo de busca
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        const matchesName = conv.contactName.toLowerCase().includes(term);
        const matchesPhone = conv.contactPhone.includes(term);
        const matchesLastMessage = conv.lastMessage?.toLowerCase().includes(term) ?? false;
        
        return matchesName || matchesPhone || matchesLastMessage;
      }

      return true;
    });
  }, [query.data, searchTerm, filter]);

  return {
    ...query,
    conversations: query.data,
    filteredConversations,
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
  };
}
