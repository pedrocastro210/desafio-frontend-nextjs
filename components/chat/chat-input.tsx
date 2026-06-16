"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, Music } from "lucide-react";
import { AiSuggestion } from "@/lib/api";

interface ChatInputProps {
  conversationId: string | null;
  onSend: (text: string) => Promise<any>;
  onSuggest: () => Promise<AiSuggestion>;
  isSending: boolean;
  isSuggesting: boolean;
}

interface SelectedFile {
  name: string;
  type: "image" | "document" | "audio";
  base64: string;
  size: string;
}

export function ChatInput({
  conversationId,
  onSend,
  onSuggest,
  isSending,
  isSuggesting,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focar input quando uma conversa é aberta
  useEffect(() => {
    if (!conversationId) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [conversationId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending) return;

    let payload = text;
    if (selectedFile) {
      payload = JSON.stringify({
        type: selectedFile.type,
        name: selectedFile.name,
        size: selectedFile.size,
        url: selectedFile.base64,
      });
    }

    const currentText = text;
    const currentFile = selectedFile;
    
    // Limpar estados imediatamente
    setText("");
    setSelectedFile(null);
    setShowError(false);

    try {
      await onSend(payload);
      inputRef.current?.focus();
    } catch (err) {
      // Restaurar estados se falhar
      setText(currentText);
      setSelectedFile(currentFile);
      setErrorMessage("Erro ao enviar mensagem. Tente novamente.");
      setShowError(true);
    }
  };

  const handleSuggest = async () => {
    if (isSuggesting) return;
    setShowError(false);

    try {
      const data = await onSuggest();
      if (data && data.suggestion) {
        setText(data.suggestion);
        inputRef.current?.focus();
      }
    } catch (err) {
      setErrorMessage("Erro ao obter sugestão da IA.");
      setShowError(true);
    }
  };

  // Converter arquivo selecionado para base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Forçar limite de tamanho de 600KB para ajustar bem os payloads da API
    if (file.size > 600 * 1024) {
      setErrorMessage("O arquivo é muito grande. Limite de 600KB.");
      setShowError(true);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      let type: "image" | "document" | "audio" = "document";
      if (file.type.startsWith("image/")) type = "image";
      else if (file.type.startsWith("audio/")) type = "audio";

      const sizeKb = Math.round(file.size / 1024);
      const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)}MB` : `${sizeKb}KB`;

      setSelectedFile({
        name: file.name,
        type,
        base64,
        size: sizeStr,
      });
      setShowError(false);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Limpar input de arquivo
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="border-t border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-md">
      {/* Seção de visualização de arquivo */}
      {selectedFile && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            {selectedFile.type === "image" ? (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                <img
                  src={selectedFile.base64}
                  alt="Previa do anexo"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : selectedFile.type === "audio" ? (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                <Music className="h-6 w-6" />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-400">
                <FileText className="h-6 w-6" />
              </div>
            )}

            <div className="min-w-0 flex-col">
              <p className="truncate text-xs font-semibold text-slate-100">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedFile.size}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="rounded-full bg-slate-700/50 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Remover anexo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Alerta de erro toast */}
      {showError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-500/30 px-3 py-2 text-xs text-red-300 animate-fadeIn">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setShowError(false)}
            className="ml-auto font-semibold hover:text-red-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex gap-2">
          {/* Botão de Sugestão com IA */}
          <button
            type="button"
            onClick={handleSuggest}
            disabled={isSuggesting || !!selectedFile}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isSuggesting
                ? "animate-pulse-glow border-indigo-500 bg-indigo-950/20 text-indigo-300"
                : "border-indigo-500/30 bg-indigo-950/10 text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-950/30 active:scale-[0.98]"
            }`}
            title="Sugerir resposta com IA baseado no histórico"
          >
            <Sparkles className={`h-4 w-4 shrink-0 ${isSuggesting ? "animate-spin" : ""}`} />
            {isSuggesting ? "Pensando..." : "Sugerir IA"}
          </button>

          {/* Botão de Anexo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isSuggesting || !!selectedFile}
            className="flex items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/30 p-2.5 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            title="Anexar arquivo (Imagem, Áudio, PDF)"
          >
            <Paperclip className="h-4.5 w-4.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf,audio/*"
            className="hidden"
          />
        </div>

        {/* Container do Formulário */}
        <form onSubmit={handleSend} className="flex-1 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedFile ? "Arquivo anexado pronto para envio..." : "Digite uma mensagem..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSuggesting || !!selectedFile}
            className="flex-1 rounded-xl bg-slate-800/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 border border-slate-700/30 focus:border-indigo-500/50 focus:bg-slate-800/80 outline-none transition-all disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || isSending}
            className={`flex items-center justify-center rounded-xl p-2.5 text-slate-900 transition-all cursor-pointer ${
              (!text.trim() && !selectedFile) || isSending
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.96]"
            }`}
            aria-label="Enviar mensagem"
          >
            <Send className="h-5 w-5 shrink-0" />
          </button>
        </form>
      </div>
    </div>
  );
}
