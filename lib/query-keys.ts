export const queryKeys = {
  me: ["me"] as const,
  conversations: ["conversations"] as const,
  messages: (conversationId: string) => ["messages", conversationId] as const,
  typing: (conversationId: string | null) => ["typing", conversationId] as const,
};
