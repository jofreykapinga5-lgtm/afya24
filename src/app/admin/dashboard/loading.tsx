// admin/dashboard/page.tsx is a single flat page (no separate layout) that
// fires ~8 queries in parallel before it can render anything, including its
// own sidebar shell -- without this, the whole shell just doesn't exist
// until every query settles. Shape approximates that shell (sidebar +
// header + KPI row) so staff see the dashboard's outline immediately after
// signing in, not a blank/frozen tab.
export default function AdminDashboardLoading() {
  return (
    <main className="min-h-[100dvh] bg-[#edf3f6] px-3 py-3 sm:px-5 lg:px-6">
      <div className="mx-auto grid w-full max-w-7xl rounded-[1.75rem] bg-[#f8fbfd] shadow-[0_28px_90px_-50px_rgba(8,50,115,0.55)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-[#dfe8eb] bg-white p-5 lg:block lg:h-[calc(100dvh-1.5rem)]">
          <div className="h-8 w-28 animate-pulse rounded-full bg-[#e1e9ec]" />
          <div className="mt-8 grid gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f4f8f9]" />
            ))}
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex items-center justify-between gap-4 border-b border-[#e1e9ec] px-4 py-4 sm:px-6">
            <div className="grid gap-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-[#e1e9ec]" />
              <div className="h-7 w-44 animate-pulse rounded-full bg-[#e1e9ec]" />
            </div>
            <div className="h-10 w-24 animate-pulse rounded-full bg-[#e1e9ec]" />
          </header>

          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5 sm:p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-[#dfe8eb]" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
