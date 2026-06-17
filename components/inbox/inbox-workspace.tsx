"use client";

import { useState, type ReactNode } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { AgentProfile } from "@/components/sidebar/agent-profile";
import { ConversationList } from "@/components/sidebar/conversation-list";
import { ChatArea } from "@/components/chat/chat-area";

interface InboxWorkspaceProps {
  connectionBanner: ReactNode;
  chatEmptyState: ReactNode;
}

/**
 * Client island — concentra estado interativo (conversa selecionada, envio, busca).
 * O shell estático e o prefetch de dados vivem no Server Component pai (`app/page.tsx`).
 */
export function InboxWorkspace({ connectionBanner, chatEmptyState }: InboxWorkspaceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { conversations } = useConversations(selectedId);

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      <section
        className={`${
          selectedId ? "hidden lg:flex" : "flex"
        } h-full min-h-0 w-full shrink-0 flex-col border-r border-slate-800/80 bg-sidebar-bg lg:w-[380px]`}
        aria-label="Lista de Conversas"
      >
        {connectionBanner}
        <AgentProfile />
        <div className="min-h-0 flex-1">
          <ConversationList selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </section>

      <section
        className={`${
          selectedId ? "flex" : "hidden lg:flex"
        } min-w-0 flex-1 flex-col bg-chat-bg`}
        aria-label="Visualização do Chat"
      >
        <ChatArea
          conversationId={selectedId}
          conversations={conversations}
          onBack={() => setSelectedId(null)}
          emptyState={chatEmptyState}
        />
      </section>
    </main>
  );
}
