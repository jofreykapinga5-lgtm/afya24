// Covers page.tsx's content area on first load and, more usefully, every
// lateral navigation between the dashboard's tabs (Overview/Book a call/
// Doctors/History/Payments/Files) once the persistent shell (layout.tsx) is
// already mounted -- those switches would otherwise show nothing while the
// next tab's data fetches. Shape mirrors the Overview page's own card grid.
export default function AccountDashboardLoading() {
  return (
    <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
        <div className="mx-auto size-20 animate-pulse rounded-full bg-[#e1e9ec]" />
        <div className="mt-4 grid justify-items-center gap-2">
          <div className="h-4 w-28 animate-pulse rounded-full bg-[#e1e9ec]" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-[#e1e9ec]" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#f8fbfd]" />
          ))}
        </div>
      </article>

      <article className="rounded-[1.35rem] bg-white p-5 shadow-[0_14px_40px_-35px_rgba(8,50,115,0.65)] ring-1 ring-[#dfe8eb]">
        <div className="h-4 w-48 animate-pulse rounded-full bg-[#e1e9ec]" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded-full bg-[#e1e9ec]" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-[#f8fbfd]" />
          ))}
        </div>
      </article>
    </section>
  );
}
