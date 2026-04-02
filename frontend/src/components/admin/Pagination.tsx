'use client';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}

export default function Pagination({ page, totalPages, total, limit, onPage }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-30"
          style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
          ←
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`e${i}`} className="px-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>…</span>
          ) : (
            <button key={p} onClick={() => onPage(p as number)}
              className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition"
              style={{
                borderColor: p === page ? '#fe7f32' : 'var(--line-soft)',
                background:  p === page ? 'rgba(254,127,50,0.15)' : 'transparent',
                color:       p === page ? '#fe7f32' : 'var(--text-soft)',
              }}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
          className="rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition disabled:opacity-30"
          style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
          →
        </button>
      </div>
    </div>
  );
}
