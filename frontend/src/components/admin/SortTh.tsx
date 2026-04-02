'use client';

interface Props {
  col: string;
  label: string;
  sortBy: string;
  sortDir: 'ASC' | 'DESC';
  onSort: (col: string) => void;
  className?: string;
}

export default function SortTh({ col, label, sortBy, sortDir, onSort, className = '' }: Props) {
  const active = sortBy === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`cursor-pointer select-none px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] transition hover:text-[#fe7f32] ${className}`}
      style={{ color: active ? '#fe7f32' : 'var(--text-muted)' }}
    >
      {label}
      <span className="ml-1 opacity-70">
        {active ? (sortDir === 'ASC' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );
}
