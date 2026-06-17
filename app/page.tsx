import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { ConnectionError } from "@/components/inbox/connection-error";
import { ConnectionStatus } from "@/components/inbox/connection-status";
import { InboxWorkspace } from "@/components/inbox/inbox-workspace";
import { getConversationsServer, getMeServer } from "@/lib/api-server";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * Server Component — prefetch de `/me` e `/conversations` no servidor,
 * hidratação do cache React Query e composição de ilhas client apenas onde há interatividade.
 */
export default async function Home() {
  const queryClient = getQueryClient();

  const [meResult, conversationsResult] = await Promise.allSettled([
    queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: getMeServer }),
    queryClient.fetchQuery({
      queryKey: queryKeys.conversations,
      queryFn: getConversationsServer,
    }),
  ]);

  const apiReady =
    meResult.status === "fulfilled" && conversationsResult.status === "fulfilled";

  const connectionBanner = apiReady ? (
    <ConnectionStatus
      agentName={meResult.value.name}
      conversationCount={conversationsResult.value.length}
    />
  ) : (
    <ConnectionError />
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InboxWorkspace
        connectionBanner={connectionBanner}
        chatEmptyState={<ChatEmptyState />}
      />
    </HydrationBoundary>
  );
}
