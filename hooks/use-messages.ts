import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage, suggestReply, Message, Conversation } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

function sortMessagesByDate(messages: Message[]) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** Verdadeiro quando `candidate` é a versão confirmada pelo servidor de uma mensagem otimista de saída. */
function isOptimisticCounterpart(candidate: Message, optimistic: Message) {
  return (
    optimistic.id.startsWith("optimistic-") &&
    candidate.direction === optimistic.direction &&
    candidate.body === optimistic.body &&
    !candidate.id.startsWith("optimistic-") &&
    Math.abs(
      new Date(candidate.createdAt).getTime() - new Date(optimistic.createdAt).getTime()
    ) < 30_000
  );
}

function mergeMessagesWithApiResponse(
  oldMessages: Message[] | undefined,
  newMessages: Message[]
): Message[] {
  if (!oldMessages || oldMessages.length === 0) return newMessages;

  const transient = oldMessages.filter((old) => {
    if (
      !old.id.startsWith("realtime-") &&
      !old.id.startsWith("optimistic-") &&
      !old.id.startsWith("mock-")
    ) {
      return false;
    }
    if (newMessages.some((n) => n.id === old.id)) {
      return false;
    }
    // Remova os marcadores otimistas assim que a API retornar a mensagem real
    if (old.id.startsWith("optimistic-")) {
      if (newMessages.some((n) => isOptimisticCounterpart(n, old))) {
        return false;
      }
    }
    return true;
  });

  const dedupedMap = new Map<string, Message>();
  [...newMessages, ...transient].forEach((msg) => dedupedMap.set(msg.id, msg));
  return sortMessagesByDate(Array.from(dedupedMap.values()));
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  // 1. Buscar mensagens com polling de 5 segundos (se conversa estiver selecionada)
  const messagesQuery = useQuery({
    queryKey: queryKeys.messages(conversationId ?? ""),
    queryFn: () => (conversationId ? getMessages(conversationId) : Promise.resolve([])),
    enabled: !!conversationId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    // Mesclar a resposta da API com quaisquer mensagens injetadas via SSE já no cache.
    // Isso impede que o polling de 5 segundos apague mensagens apenas em tempo real (mock/SSE).
    structuralSharing: (oldData: unknown, newData: unknown) =>
      mergeMessagesWithApiResponse(oldData as Message[] | undefined, newData as Message[]),
  });

  // 2. Mutation de envio de mensagem com Atualizações Otimistas
  const sendMessageMutation = useMutation({
    mutationFn: ({ text }: { text: string }) => {
      if (!conversationId) throw new Error("Nenhuma conversa selecionada");
      return sendMessage(conversationId, text);
    },
    onMutate: async ({ text }) => {
      if (!conversationId) return;

      // Cancelar qualquer refetch de saída para que elas não sobrescrevam nossa atualização otimista
      await queryClient.cancelQueries({ queryKey: queryKeys.messages(conversationId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations });

      // Snapshot dos valores anteriores
      const previousMessages = queryClient.getQueryData<Message[]>(
        queryKeys.messages(conversationId)
      );
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations
      );

      const optimisticId = `optimistic-${Date.now()}`;

      // Criar uma mensagem otimista temporária
      const optimisticMessage: Message = {
        id: optimisticId,
        direction: "out",
        body: text,
        status: "sent",
        createdAt: new Date().toISOString(),
      };

      // Atualizar a lista de mensagens otimisticamente
      queryClient.setQueryData<Message[]>(queryKeys.messages(conversationId), (old) => [
        ...(old ?? []),
        optimisticMessage,
      ]);

      // Atualizar a lista de conversas otimisticamente (mover conversa selecionada para o topo e definir lastMessage)
      if (previousConversations) {
        queryClient.setQueryData<Conversation[]>(queryKeys.conversations, (old) => {
          if (!old) return [];
          const updated = old.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                lastMessage: text,
                lastMessageAt: new Date().toISOString(),
                unread: 0,
              };
            }
            return conv;
          });
          return [...updated].sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );
        });
      }

      // Retornar um objeto de contexto com os valores snapshotados
      return {
        previousMessages,
        previousConversations,
        optimisticId,
        conversationId,
      };
    },
    onError: (_err, _variables, context) => {
      const targetConversationId = context?.conversationId ?? conversationId;
      if (!targetConversationId) return;

      // Reverter para o estado anterior
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages(targetConversationId),
          context.previousMessages
        );
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(queryKeys.conversations, context.previousConversations);
      }
    },
    onSuccess: (data, _variables, context) => {
      const targetConversationId = context?.conversationId ?? conversationId;
      if (!targetConversationId) return;

      // Substituir o marcador otimista com a mensagem confirmada pelo servidor
      queryClient.setQueryData<Message[]>(
        queryKeys.messages(targetConversationId),
        (old) => {
          if (!old) return [data];

          const optimisticId = context?.optimisticId;
          const withoutOptimistic = optimisticId
            ? old.filter((msg) => msg.id !== optimisticId)
            : old.filter((msg) => !msg.id.startsWith("optimistic-"));

          if (withoutOptimistic.some((msg) => msg.id === data.id)) {
            return sortMessagesByDate(withoutOptimistic);
          }

          return sortMessagesByDate([...withoutOptimistic, data]);
        }
      );
    },
    onSettled: () => {
      if (!conversationId) return;
      // Não invalidar mais a query de mensagens para evitar duplicatas após a substituição otimista
      // Invalidar conversas para manter a ordem da lista atualizada
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });

  // 3. Mutation de Sugestão de Resposta com IA (disparado manualmente)
  const suggestReplyMutation = useMutation({
    mutationFn: () => {
      if (!conversationId) throw new Error("Nenhuma conversa selecionada");
      return suggestReply(conversationId);
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    refetch: messagesQuery.refetch,
    isRefetching: messagesQuery.isRefetching,
    
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendingError: sendMessageMutation.error,

    suggestReply: suggestReplyMutation.mutateAsync,
    isSuggesting: suggestReplyMutation.isPending,
    suggestionError: suggestReplyMutation.error,
  };
}
