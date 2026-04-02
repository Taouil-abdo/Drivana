'use client';

import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${className}`}
      style={{
        borderColor: isDark ? 'rgba(58,58,58,0.6)' : 'rgba(254,127,50,0.25)',
        background:  isDark ? 'rgba(28,28,28,0.6)'  : 'rgba(255,255,255,0.7)',
        color:       isDark ? '#fe7f32'              : '#555555',
      }}
    >
      {/* iOS-style toggle track */}
      <div
        className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300"
        style={{ background: isDark ? '#3a3a3a' : '#fe7f32' }}
      >
        {/* thumb */}
        <span
          className="absolute flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white shadow-md transition-all duration-300"
          style={{
            width: '18px',
            height: '18px',
            left: isDark ? '3px' : 'calc(100% - 21px)',
          }}
        >
          <span className="text-[8px] leading-none">{isDark ? '🌙' : '☀️'}</span>
        </span>
      </div>

      <span style={{ color: isDark ? '#aaaaaa' : '#444444' }}>
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </span>

      <span className="ml-auto text-sm leading-none opacity-60">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
