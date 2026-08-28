// Shown instantly on navigation to /doctors while the real (dynamic,
// searchParams-driven) page fetches -- without this, Next.js has nothing to
// prefetch/stream and the click on "See all doctors" just sits frozen on
// the previous page until the whole render is ready. Shape mirrors the
// real page.tsx: back-link, heading row, then a card grid.
export default function DoctorsLoading() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] flex-1 bg-[#f7fbfb]">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 h-4 w-28 animate-pulse rounded-full bg-[#e1e9ec]" />

        <div className="flex items-center gap-3">
          <span className="size-11 shrink-0 animate-pulse rounded-2xl bg-[#e1e9ec]" />
          <div className="grid gap-2">
            <div className="h-7 w-48 animate-pulse rounded-full bg-[#e1e9ec]" />
            <div className="h-4 w-64 animate-pulse rounded-full bg-[#e1e9ec]" />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[1.5rem] bg-white ring-1 ring-[#dfe8eb]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
