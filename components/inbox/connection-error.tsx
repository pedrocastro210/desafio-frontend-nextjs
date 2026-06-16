import { AlertCircle } from "lucide-react";

/** Server Component — erro de conexão renderizado no servidor quando o prefetch falha. */
export function ConnectionError() {
  return (
    <div
      className="flex items-center gap-2 border-b border-red-500/30 bg-red-950/40 px-4 py-2 text-xs text-red-300"
      role="alert"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
      <span>
        Não consegui conectar. Confira{" "}
        <code className="rounded bg-red-950/60 px-1">NEXT_PUBLIC_API_URL</code> no seu{" "}
        <code className="rounded bg-red-950/60 px-1">.env.local</code>.
      </span>
    </div>
  );
}
