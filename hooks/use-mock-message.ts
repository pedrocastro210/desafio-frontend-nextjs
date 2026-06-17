import { useQueryClient } from "@tanstack/react-query";
import { Message, Conversation } from "@/lib/api";

const MOCK_MESSAGES = [
  "Olá! Obrigado pelo retorno. Como andam as coisas?",
  "Certo, entendi perfeitamente. Você consegue verificar isso para mim?",
  "Poderia me enviar mais detalhes sobre o serviço?",
  "Perfeito! Fico no aguardo.",
  "Muito obrigado pela ajuda hoje! 👍",
  "Você teria um tempo para uma chamada rápida?",
  "Isso resolve meu problema, valeu!",
  "Pode me passar o número do pedido?",
  "Consegui resolver aqui, muito obrigado!",
];

export function useMockMessage() {
  const queryClient = useQueryClient();

  const triggerMockMessage = (conversationId: string, activeConversationId: string | null) => {
    // 1. Definir indicador de digitação
    queryClient.setQueryData(["typing", conversationId], true);

    // 2. Aguardar 3 segundos, então enviar mensagem
    setTimeout(() => {
      // Limpar indicador de digitação
      queryClient.setQueryData(["typing", conversationId], false);

      const body = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
      
      const message: Message = {
        id: `mock-${Date.now()}`,
        direction: "in",
        body,
        status: "read",
        createdAt: new Date().toISOString(),
      };

      // Update messages cache
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        if (!old) return undefined; // Não criar cache se chat não estiver aberto
        return [...old, message];
      });

      // Atualizar cache de conversas
      queryClient.setQueryData<Conversation[]>(["conversations"], (old) => {
        if (!old) return [];
        const updated = old.map((conv) => {
          if (conv.id === conversationId) {
            const isActive = conversationId === activeConversationId;
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
          (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      });
    }, 3000);
  };

  return { triggerMockMessage };
}
