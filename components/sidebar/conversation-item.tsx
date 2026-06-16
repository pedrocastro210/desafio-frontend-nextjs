"use client";

import { Conversation } from "@/lib/api";
import { MessageSquareOff, Bot, Camera, FileText, Mic } from "lucide-react";

import { useQuery } from "@tanstack/react-query";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

import { formatMessageTime, parseMediaMessage } from "@/lib/utils";
import { useMockMessage } from "@/hooks/use-mock-message";

export function ConversationItem({ conversation, isSelected, onSelect }: ConversationItemProps) {
  const { id, contactName, contactPhone, avatarColor, unread, lastMessage, lastMessageAt } = conversation;
  const { triggerMockMessage } = useMockMessage();
  const mediaPayload = parseMediaMessage(lastMessage || "");

  // Query typing status from React Query cache para o indicador de digitação
  const { data: isTyping } = useQuery({
    queryKey: ["typing", id],
    queryFn: () => false,
    initialData: false,
    staleTime: Infinity,
  });

  // Formato iniciais do avatar
  const initials = contactName
    ? contactName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "CT";

  // Usar avatarColor se fornecido, fallback para um neutro
  const avatarBgStyle = avatarColor ? { backgroundColor: avatarColor } : { backgroundColor: "#4f46e5" };

  return (
    <button
      onClick={onSelect}
      className={`relative flex h-[76px] w-full items-center gap-3 border-b border-slate-900/30 p-4 text-left transition-all outline-none cursor-pointer ${
        isSelected
          ? "bg-slate-800/40 border-l-4 border-indigo-500 pl-3 text-slate-100"
          : "hover:bg-slate-800/20 text-slate-300 hover:text-slate-100 border-l-4 border-transparent pl-3"
      }`}
    >
      {/* Avatar do Contato */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm"
        style={avatarBgStyle}
      >
        {initials}
      </div>

      {/* Área de Detalhes */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold tracking-wide text-slate-100">
            {contactName}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0">
            {formatMessageTime(lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className="truncate text-xs flex items-center gap-1.5">
            {isTyping ? (
              <span className="font-semibold text-emerald-400 animate-pulse">Digitando...</span>
            ) : mediaPayload ? (
              <span className="flex items-center gap-1 text-slate-400">
                {mediaPayload.type === "image" && <Camera className="h-3 w-3" />}
                {mediaPayload.type === "document" && <FileText className="h-3 w-3" />}
                {mediaPayload.type === "audio" && <Mic className="h-3 w-3" />}
                <span>
                  {mediaPayload.type === "image" ? "Imagem" : mediaPayload.type === "audio" ? "Áudio" : "Documento"}
                </span>
              </span>
            ) : (
              <span className="text-slate-400 truncate">
                {lastMessage || <span className="italic text-slate-500">Nenhuma mensagem</span>}
              </span>
            )}
          </p>

          {/* Botões de Ação e badge de não lido */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão discreto (usando div para evitar erro HTML aninhado <button>) */}
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                triggerMockMessage(id, isSelected ? id : null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  triggerMockMessage(id, isSelected ? id : null);
                }
              }}
              className="text-slate-500 hover:text-emerald-400 p-0.5 rounded transition-colors cursor-pointer"
              title="Simular mensagem recebida"
            >
              <Bot className="w-3.5 h-3.5" />
            </div>

            {/* Badge de não lido */}
            {unread > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-slate-950">
                {unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
