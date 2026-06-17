/** Server Component — exibido pelo Suspense enquanto `page.tsx` faz prefetch da API. */
export default function Loading() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      <section className="flex h-full w-full shrink-0 flex-col border-r border-slate-800/80 bg-sidebar-bg lg:w-[380px]">
        <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 py-2">
          <div className="h-3 w-40 animate-pulse rounded bg-slate-700/60" />
        </div>
        <div className="flex items-center gap-3 border-b border-slate-800/80 p-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-800" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-800/80" />
          </div>
        </div>
        <div className="flex-1 space-y-1 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-800" />
                <div className="h-2.5 w-full animate-pulse rounded bg-slate-800/70" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="hidden flex-1 bg-chat-bg lg:flex" />
    </main>
  );
}
