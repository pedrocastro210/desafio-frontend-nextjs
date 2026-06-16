"use client";

import { Message } from "@/lib/api";
import { Check, CheckCheck, Clock, FileText, Download, Play, Pause, X } from "lucide-react";
import { useState } from "react";

interface ChatBubbleProps {
  message: Message;
}

import { MediaPayload, parseMediaMessage } from "@/lib/utils";

export function ChatBubble({ message }: ChatBubbleProps) {
  const { id, direction, body, status, createdAt } = message;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isInbound = direction === "in";
  const isOptimistic = id.startsWith("optimistic-");

  // Formatar hora (HH:MM)
  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "";

  // Tentativa de parsear o payload de mídia
  const media = parseMediaMessage(body);

  // Renderizar o conteúdo de mídia com base no seu tipo
  const renderMediaContent = (mediaPayload: MediaPayload) => {
    switch (mediaPayload.type) {
      case "image":
        return (
          <div className="space-y-1">
            <div 
              onClick={() => setLightboxOpen(true)}
              className="relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 cursor-pointer shadow-inner group transition-transform hover:scale-[1.01]"
            >
              <img
                src={mediaPayload.url}
                alt={mediaPayload.name}
                className="max-h-60 max-w-full object-cover rounded-xl"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs bg-slate-900/80 px-2 py-1 rounded text-white font-medium">Ver imagem</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">{mediaPayload.name}</p>

            {/* Modal de Lightbox */}
            {lightboxOpen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fadeIn"
                onClick={() => setLightboxOpen(false)}
              >
                <button 
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 rounded-full bg-slate-800/80 p-2 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
                <img
                  src={mediaPayload.url}
                  alt={mediaPayload.name}
                  className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                />
              </div>
            )}
          </div>
        );

      case "document":
        return (
          <div className="flex items-center gap-3 bg-slate-900/40 border border-slate-700/30 p-3 rounded-xl min-w-[240px] max-w-sm hover:bg-slate-900/70 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-400">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100">{mediaPayload.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{mediaPayload.size}</p>
            </div>
            <a
              href={mediaPayload.url}
              download={mediaPayload.name}
              className="rounded-full bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Baixar arquivo"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col gap-1.5 min-w-[240px] max-w-sm bg-slate-900/30 border border-slate-700/30 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <audio 
                controls 
                src={mediaPayload.url} 
                className="w-full h-8 opacity-90 accent-emerald-500 rounded-lg outline-none bg-slate-950/50" 
              />
            </div>
            <p className="text-[10px] text-slate-400 px-1 truncate">{mediaPayload.name}</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex w-full ${isInbound ? "justify-start" : "justify-end"} mb-3`}>
      {/* Container da Bolha */}
      <div
        className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
          isInbound
            ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/20"
            : "bg-emerald-600 text-emerald-50 rounded-tr-none"
        } ${media ? "p-2 pb-5" : ""}`}
      >
        {/* Renderizar mídia ou mensagem de texto simples */}
        {media ? (
          renderMediaContent(media)
        ) : (
          <p className="whitespace-pre-wrap break-words pr-12">{body}</p>
        )}

        {/* Área de Informações (Hora & Ícones de Status) */}
        <div className={`absolute right-2 bottom-1.5 flex items-center gap-1 text-[9px] text-slate-300 ${media ? "bottom-1" : ""}`}>
          <span>{time}</span>
          
          {!isInbound && (
            <span className="flex items-center shrink-0">
              {isOptimistic ? (
                <Clock className="h-3 w-3 text-emerald-200/60 animate-spin" />
              ) : status === "sent" ? (
                <Check className="h-3.5 w-3.5 text-slate-400" />
              ) : status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
              ) : status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-sky-400" />
              ) : null}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
