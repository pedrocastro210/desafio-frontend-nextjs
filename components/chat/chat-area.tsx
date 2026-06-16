"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { Conversation } from "@/lib/api";
import { ChatHeader } from "./chat-header";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";
import { Skeleton } from "../ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

interface ChatAreaProps {
  conversationId: string | null;
  conversations: Conversation[] | undefined;
  onBack: () => void;
  emptyState: ReactNode;
}

export function ChatArea({
  conversationId,
  conversations,
  onBack,
  emptyState,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Encontrar detalhes da conversa ativa atual
  const activeConversation = conversations?.find((c) => c.id === conversationId);

  const {
    messages,
    isLoading,
    isError,
    refetch,
    sendMessage,
    isSending,
    suggestReply,
    isSuggesting,
  } = useMessages(conversationId);

  // Query typing status from React Query cache para o indicador de digitação
  const { data: isTyping } = useQuery({
    queryKey: queryKeys.typing(conversationId),
    queryFn: () => false,
    initialData: false,
    staleTime: Infinity,
  });

  // Auto scroll para o bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Scroll instantaneamente na carga da conversa, e suavemente na nova mensagem/envio
  useEffect(() => {
    if (conversationId && !isLoading) {
      // Pequeno timeout para garantir que o DOM tenha renderizado as mensagens
      const timer = setTimeout(() => {
        scrollToBottom("auto");
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [conversationId, isLoading]);

  // Scroll suavemente quando o número de mensagens aumenta, enviando, ou o status de digitação muda
  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      scrollToBottom("smooth");
    }
  }, [messages.length, isSending, isTyping]);

  // Case 1: Estado vazio (Nenhuma conversa selecionada)
  if (!conversationId || !activeConversation) {
    return emptyState;
  }

  // Case 2: Estado de loading
  const renderLoadingState = () => (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-chat-bg">
      {[...Array(4)].map((_, i) => {
        const isLeft = i % 2 === 0;
        return (
          <div key={i} className={`flex w-full ${isLeft ? "justify-start" : "justify-end"}`}>
            <Skeleton
              className={`h-14 rounded-2xl ${
                isLeft ? "w-[60%] rounded-tl-none" : "w-[50%] rounded-tr-none"
              }`}
            />
          </div>
        );
      })}
    </div>
  );

  // Case 3: Estado de erro
  const renderErrorState = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-chat-bg p-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
      <h3 className="text-sm font-semibold text-slate-200">Erro ao carregar histórico</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">Não foi possível carregar as mensagens para esta conversa.</p>
      <button
        onClick={() => refetch()}
        className="mt-4 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-chat-bg">
      {/* Header da Conversa Ativa */}
      <ChatHeader conversation={activeConversation} onBack={onBack} />

      {/* Área de Scroll das Mensagens */}
      {isLoading ? (
        renderLoadingState()
      ) : isError ? (
        renderErrorState()
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 bg-chat-bg">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <p className="text-sm">Nenhuma mensagem nesta conversa.</p>
              <p className="text-xs text-slate-600 mt-1">Envie um texto abaixo para iniciar.</p>
            </div>
          ) : (
            messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
          )}
          
          {/* Animação de bounce do indicador de digitação */}
          {isTyping && (
            <div className="flex w-full justify-start py-1">
              <div className="flex items-center space-x-1 rounded-2xl rounded-tl-none bg-slate-800/80 px-4 py-3 shadow-sm border border-slate-700/50">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }}></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}

          {/* Ancora de Scroll */}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      )}

      {/* Caixa de Input */}
      <ChatInput
        conversationId={conversationId}
        onSend={(text) => sendMessage({ text })}
        onSuggest={suggestReply}
        isSending={isSending}
        isSuggesting={isSuggesting}
      />
    </div>
  );
}
