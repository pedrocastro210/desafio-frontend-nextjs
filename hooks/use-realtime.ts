import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Message, Conversation } from "@/lib/api";

export function useRealtime(activeConversationId: string | null) {
  const queryClient = useQueryClient();

  // Ref para sempre acessar o último ID de conversa ativa dentro dos handlers SSE
  // sem causar o efeito a ser executado novamente e reconectar
  const activeConversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let connected = false;

    const handleTyping = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { conversationId: string; isTyping: boolean };
        queryClient.setQueryData(["typing", data.conversationId], data.isTyping);

        // Auto-limpar indicador de digitação após 5 segundos como uma proteção
        if (data.isTyping) {
          setTimeout(() => {
            queryClient.setQueryData(["typing", data.conversationId], false);
          }, 5000);
        }
      } catch (err) {
        console.error("[SSE] Error parsing typing event:", err);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { conversationId: string; message: Message };
        const { conversationId, message } = data;

        // 1. MESCLAR a nova mensagem no cache de mensagens
        // Se uma mensagem otimista com o mesmo corpo/direção existe, substitua-a.
        const existing = queryClient.getQueryData<Message[]>(["messages", conversationId]) ?? [];

        // Encontrar um marcador otimista que corresponde a esta mensagem
        const optimisticMatch = existing.find(
          (m) =>
            m.id.startsWith("optimistic-") &&
            m.body === message.body &&
            m.direction === message.direction
        );

        if (optimisticMatch) {
          // Substituir a entrada otimista com a mensagem real
          queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
            if (!old) return [message];
            return old.map((m) => (m.id === optimisticMatch.id ? message : m));
          });
        } else {
          // Prevenir duplicatas de mensagens reais (mesmo conteúdo dentro de 2s)
          const duplicate = existing.some(
            (m) =>
              m.body === message.body &&
              m.direction === message.direction &&
              Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 2000
          );
          if (!duplicate) {
            queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
              if (!old) return [message];
              if (old.some((m) => m.id === message.id)) return old;
              return [...old, message];
            });
          }
        }

        // 2. Atualizar a visualização da conversa lateral e o badge de não lido
        queryClient.setQueryData<Conversation[]>(["conversations"], (old) => {
          if (!old) return [];

          const updated = old.map((conv) => {
            if (conv.id === conversationId) {
              const isActive = conversationId === activeConversationIdRef.current;
              return {
                ...conv,
                lastMessage: message.body,
                lastMessageAt: message.createdAt,
                unread: isActive ? 0 : (conv.unread || 0) + 1,
              };
            }
            return conv;
          });

          return [...updated].sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
        });
      } catch (err) {
        console.error("[SSE] Error parsing message event:", err);
      }
    };

    const connect = (ids: string[]) => {
      if (connected) return; // Guarda: evitar múltiplas conexões
      connected = true;

      const idsParam = ids.join(",");
      const url = idsParam
        ? `/api/realtime?ids=${encodeURIComponent(idsParam)}`
        : "/api/realtime";

      eventSource = new EventSource(url);

      eventSource.addEventListener("connected", () => {
        console.log("[SSE] Connected with IDs:", idsParam || "(none yet)");
      });

      eventSource.addEventListener("typing", handleTyping);
      eventSource.addEventListener("message", handleMessage);

      // NÃO reconectar em caso de erro — deixar o navegador lidar com a retenção natural via EventSource
      eventSource.addEventListener("error", () => {
        console.warn("[SSE] Connection dropped. Browser will retry automatically.");
      });
    };

    // Tentar conectar imediatamente se conversas já estiverem no cache
    const cached = queryClient.getQueryData<Conversation[]>(["conversations"]);
    const cachedIds = cached?.map((c) => c.id) ?? [];

    if (cachedIds.length > 0) {
      connect(cachedIds);
    } else {
      // Aguardar conversas para carregar, então reconectar com IDs reais (executa apenas uma vez)
      const unsubscribe = queryClient.getQueryCache().subscribe((evt) => {
        if (connected) {
          unsubscribe(); // Já conectado, parar de observar
          return;
        }
        if (evt.type === "updated") {
          const key = JSON.stringify(evt.query.queryKey);
          if (key === JSON.stringify(["conversations"])) {
            const convs = queryClient.getQueryData<Conversation[]>(["conversations"]);
            const ids = convs?.map((c) => c.id) ?? [];
            if (ids.length > 0) {
              unsubscribe();
              connect(ids);
            }
          }
        }
      });

      // Fallback: se conversas nunca carregam dentro de 10s, conectar sem IDs
      const fallback = setTimeout(() => {
        if (!connected) connect([]);
      }, 10000);

      return () => {
        unsubscribe();
        clearTimeout(fallback);
        eventSource?.close();
        connected = false;
      };
    }

    return () => {
      eventSource?.close();
      connected = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);
}
