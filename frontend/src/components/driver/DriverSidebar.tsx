'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

const navItems = [
  { label: 'Dashboard',    href: '/driver/dashboard',    icon: '▦' },
  { label: 'Reservations', href: '/driver/reservations', icon: '◇' },
  { label: 'Profile',      href: '/driver/profile',      icon: '◈' },
];

export default function DriverSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm xl:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-[#1a4f68]
        bg-gradient-to-b from-[#071826] to-[#030b14] px-3 py-4 transition-transform duration-300
        xl:static xl:translate-x-0 xl:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <span className="rounded-full border border-[#2e8fb4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c8f2ff]">
            Drivana
          </span>
          <button onClick={onClose} className="text-[#4a8fa8] hover:text-[#c8f2ff] xl:hidden">
            ✕
          </button>
        </div>

        <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.22em] text-[#4a8fa8]">Driver Panel</p>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition
                  ${
                    active
                      ? 'bg-[#2ec5f5]/15 border border-[#2ec5f5]/40 text-[#2ec5f5]'
                      : 'text-[#7eb3c9] hover:bg-[#0d2a3b] hover:text-[#c8f2ff] border border-transparent'
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-[#1a4f68] pt-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl border border-[#7c3d45] bg-[#1a080c] px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#ffc8cf] transition hover:bg-[#2a0e14]"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

