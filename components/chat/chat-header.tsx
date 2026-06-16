"use client";

import { Conversation } from "@/lib/api";
import { Phone, Video, MoreVertical, ArrowLeft, Bot } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void; // Botão de voltar mobile
}

import { useMockMessage } from "@/hooks/use-mock-message";
import { formatPhoneNumber } from "@/lib/utils";

export function ChatHeader({ conversation, onBack }: ChatHeaderProps) {
  const { id, contactName, contactPhone, avatarColor } = conversation;
  const { triggerMockMessage } = useMockMessage();

  // Query typing status from React Query cache para o indicador de digitação
  const { data: isTyping } = useQuery({
    queryKey: ["typing", id],
    queryFn: () => false,
    initialData: false,
    staleTime: Infinity,
  });

  // Formato iniciais
  const initials = contactName
    ? contactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CT";

  const avatarBgStyle = avatarColor ? { backgroundColor: avatarColor } : { backgroundColor: "#4f46e5" };

  return (
    <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-6 py-3.5 backdrop-blur-md">
      {/* Área da esquerda: Botão de voltar & Informações */}
      <div className="flex items-center gap-3">
        {/* Botão de voltar mobile */}
        <button
          onClick={onBack}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden cursor-pointer"
          aria-label="Voltar para a lista"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Avatar do Contato */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm"
          style={avatarBgStyle}
        >
          {initials}
        </div>

        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-100 truncate max-w-[150px] sm:max-w-xs">
            {contactName}
          </span>
          {isTyping ? (
            <span className="text-xs font-semibold text-emerald-400 animate-pulse">
              Digitando...
            </span>
          ) : (
            <span className="text-xs text-slate-400">{formatPhoneNumber(contactPhone)}</span>
          )}
        </div>
      </div>

      {/* Área da direita: Ações */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => triggerMockMessage(id, id)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-colors cursor-pointer"
          title="Simular mensagem recebida (Mock)"
        >
          <Bot className="h-4.5 w-4.5" />
        </button>
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          title="Chamada de voz (Demonstração)"
        >
          <Phone className="h-4.5 w-4.5" />
        </button>
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          title="Chamada de vídeo (Demonstração)"
        >
          <Video className="h-4.5 w-4.5" />
        </button>
        <button
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          title="Mais opções"
        >
          <MoreVertical className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
