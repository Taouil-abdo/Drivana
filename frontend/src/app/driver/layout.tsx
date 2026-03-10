'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import DriverSidebar from '@/components/driver/DriverSidebar';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'DRIVER') {
      router.push('/');
      return;
    }
  }, [mounted, user]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== 'DRIVER') return null;

  return (
    <div className="flex min-h-screen">
      <DriverSidebar isOpen={sidebar} onClose={() => setSidebar(false)} />

      <div className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5">
        {/* Mobile topbar */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#1f5972] bg-[#051a28]/80 p-3 xl:hidden">
          <button
            onClick={() => setSidebar(true)}
            className="glass-panel rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#c8f2ff]"
          >
            Menu
          </button>
          <p className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">Driver</p>
          <span className="text-xs text-[#4a8fa8]">Panel</span>
        </div>

        {children}
      </div>
    </div>
  );
}

