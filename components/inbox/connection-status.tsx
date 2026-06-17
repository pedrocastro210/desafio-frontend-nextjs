/** Server Component — banner de conexão renderizado no HTML inicial. */
export function ConnectionStatus({
  agentName,
  conversationCount,
}: {
  agentName: string;
  conversationCount: number;
}) {
  return (
    <div
      className="border-b border-emerald-500/20 bg-emerald-950/20 px-4 py-2 text-xs text-emerald-300"
      role="status"
      aria-live="polite"
    >
      ✓ Conectado como <strong className="font-semibold text-emerald-200">{agentName}</strong> —{" "}
      {conversationCount} conversas carregadas.
    </div>
  );
}
