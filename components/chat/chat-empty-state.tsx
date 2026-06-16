import { MessageSquare, Sparkles } from "lucide-react";

/** Server Component — estado vazio do chat (conteúdo estático, zero JS no cliente). */
export function ChatEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-chat-bg p-8 text-center">
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <MessageSquare className="h-10 w-10 text-slate-500" />
        <Sparkles className="absolute -top-1 -right-1 h-6 w-6 animate-pulse text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold tracking-wide text-slate-100">AI Atendimento Inbox</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
        Selecione uma conversa ao lado para visualizar o histórico de mensagens e responder com
        sugestões da Inteligência Artificial.
      </p>

      <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 text-left sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
            Atualização Otimista
          </h3>
          <p className="text-xs text-slate-500">
            As mensagens aparecem na tela instantaneamente ao enviar, melhorando a percepção de
            performance.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Sugestão de Resposta IA
          </h3>
          <p className="text-xs text-slate-500">
            Gere rascunhos contextualizados com OpenAI em um clique, baseando-se no histórico da
            conversa.
          </p>
        </div>
      </div>
    </div>
  );
}
