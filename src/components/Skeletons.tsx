export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-1 py-2">
      <span className="skeleton h-10 w-10 rounded-lg" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="skeleton block h-3 w-3/5 rounded-md" />
        <span className="skeleton block h-2.5 w-2/5 rounded-md" />
      </span>
    </div>
  );
}

export function ListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-1 p-1" aria-busy="true" aria-label="Memuat">
      {Array.from({ length: rows }, (_, index) => (
        <RowSkeleton key={index} />
      ))}
    </div>
  );
}

export function TileSkeleton() {
  return (
    <div aria-hidden="true">
      <span className="skeleton block aspect-[4/3] w-full rounded-2xl border border-white/5" />
      <span className="mt-2.5 space-y-1.5">
        <span className="skeleton block h-3 w-4/5 rounded-md" />
        <span className="skeleton block h-2.5 w-2/5 rounded-md" />
      </span>
    </div>
  );
}

export function GridSkeleton({
  items = 18,
  className = 'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={`${className} mt-4`} aria-busy="true" aria-label="Memuat">
      {Array.from({ length: items }, (_, index) => (
        <TileSkeleton key={index} />
      ))}
    </div>
  );
}

export function CarouselRowSkeleton() {
  return (
    <section className="mt-8" aria-busy="true" aria-label="Memuat">
      <span className="skeleton block h-4.5 w-44 rounded-md px-1" />
      <div className="no-scrollbar -mx-3 mt-3 flex gap-3 overflow-hidden px-3 pb-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="w-52 shrink-0 sm:w-60">
            <TileSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

export function StreamSkeleton() {
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-850/40"
      aria-busy="true"
      aria-label="Menghubungkan"
    >
      <div className="w-52 space-y-2.5 px-6">
        <span className="skeleton block h-2.5 w-1/2 rounded-md" />
        <span className="skeleton block h-3.5 w-3/4 rounded-md" />
        <span className="skeleton block h-2 w-2/5 rounded-md" />
      </div>
    </div>
  );
}
