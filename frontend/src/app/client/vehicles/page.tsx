'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const CATEGORIES = [
  { label: 'All Vehicles', icon: '🚗' },
  { label: 'Sedan',        icon: '🚙' },
  { label: 'SUV',          icon: '🛻' },
  { label: 'Electric',     icon: '⚡' },
  { label: 'Luxury',       icon: '💎' },
  { label: 'Sport',        icon: '🏎️' },
];

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
  { value: 'newest',      label: 'Newest First' },
];

const FUEL_TYPES   = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSION = ['Automatic', 'Manual'];

export default function ClientVehicles() {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [vehicles,      setVehicles]      = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('All Vehicles');
  const [sort,          setSort]          = useState('recommended');
  const [maxPrice,      setMaxPrice]      = useState(2000);
  const [sliderMax,     setSliderMax]     = useState(2000);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  useEffect(() => {
    apiClient.get('/client/vehicles')
      .then(res => {
        const data = res.data ?? [];
        setVehicles(data);
        const top = Math.max(...data.map((v: any) => Number(v.pricePerDay)), 500);
        const rounded = Math.ceil(top / 100) * 100;
        setSliderMax(rounded);
        setMaxPrice(rounded);
      })
      .catch(() => toast('Failed to load vehicles', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    let list = [...vehicles];

    if (search)
      list = list.filter(v =>
        `${v.brand} ${v.model} ${v.year} ${v.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
      );

    if (category !== 'All Vehicles') {
      const cat = category.toLowerCase();
      list = list.filter(v =>
        `${v.brand} ${v.model} ${v.description ?? ''}`.toLowerCase().includes(cat)
      );
    }

    list = list.filter(v => Number(v.pricePerDay) <= maxPrice);

    switch (sort) {
      case 'price_asc':  list.sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay)); break;
      case 'price_desc': list.sort((a, b) => Number(b.pricePerDay) - Number(a.pricePerDay)); break;
      case 'newest':     list.sort((a, b) => b.year - a.year); break;
    }

    return list;
  }, [vehicles, search, category, maxPrice, sort]);

  const Sidebar = () => (
    <aside className="flex flex-col gap-5 w-full">
      {/* Category filters */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#888888]">Filters</p>
        <p className="mb-3 text-[9px] uppercase tracking-widest text-[#555555]">Vehicle Type</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(c => (
            <button key={c.label} onClick={() => setCategory(c.label)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition text-left
                ${category === c.label
                  ? 'bg-[#fe7f32]/15 border border-[#fe7f32]/40 text-[#fe7f32]'
                  : 'border border-transparent text-[#aaaaaa] hover:text-[#eeeeee] hover:bg-[#2a2a2a]'}`}>
              <span className="text-sm">{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="mb-3 text-[9px] uppercase tracking-widest text-[#555555]">Price Range</p>
        <input
          type="range" min={0} max={sliderMax} step={10}
          value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#fe7f32] cursor-pointer"
        />
        <div className="mt-1.5 flex justify-between text-[10px] text-[#888888]">
          <span>$0/day</span>
          <span className="text-[#fe7f32] font-bold">${maxPrice}/day</span>
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={() => setSidebarOpen(false)}
        className="w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition"
      >
        Apply Filters
      </button>
    </aside>
  );

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="flex min-h-screen gap-0">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 pr-5 pt-1">
          <Sidebar />
        </aside>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 w-72 glass-panel p-5 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Search bar */}
          <div className="glass-panel fade-rise mb-5 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              <button className="rounded-xl border border-[#fe7f32]/50 bg-[#fe7f32]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#fe7f32]">
                Rent a Car
              </button>
              <button className="rounded-xl border border-[#3a3a3a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#888888] hover:text-[#eeeeee] transition">
                With Driver
              </button>
            </div>
            <div className="flex-1 min-w-[180px] relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] text-sm">🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search brand, model..."
                className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] pl-8 pr-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32] transition"
              />
            </div>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-xl border border-[#3a3a3a] px-3 py-2.5 text-xs text-[#aaaaaa] hover:text-[#eeeeee] transition"
            >
              ⚙ Filters
            </button>
          </div>

          {/* Title row */}
          <div className="mb-4 flex items-end justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-[#eeeeee]">Elite Selection</h1>
              <p className="mt-0.5 text-xs text-[#888888]">
                {loading ? 'Loading...' : `${visible.length} vehicle${visible.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#888888]">Sort by</span>
              <select
                value={sort} onChange={e => setSort(e.target.value)}
                className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] cursor-pointer"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="glass-panel rounded-2xl p-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
              <p className="mt-3 text-sm text-[#aaaaaa]">Loading vehicles...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center">
              <p className="text-3xl mb-3">🚗</p>
              <p className="text-sm text-[#888888]">No vehicles match your filters.</p>
              <button onClick={() => { setSearch(''); setCategory('All Vehicles'); setMaxPrice(sliderMax); }}
                className="mt-4 text-xs text-[#fe7f32] underline underline-offset-2">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((v: any, i: number) => (
                <VehicleCard key={v.id} v={v} i={i} onBook={() => router.push(`/client/booking/${v.id}`)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function VehicleCard({ v, i, onBook }: { v: any; i: number; onBook: () => void }) {
  const isNew = (Date.now() - new Date(v.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const isAvailable = v.status === 'AVAILABLE';

  return (
    <article
      className="glass-panel slide-in rounded-2xl overflow-hidden flex flex-col group hover:border-[#fe7f32]/40 transition-all duration-300"
      style={{ animationDelay: `${i * 50}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-[#1a1a1a]">
        {v.imageUrl ? (
          <img
            src={v.imageUrl}
            alt={`${v.brand} ${v.model}`}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-6xl opacity-20">🚗</span>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isNew && (
            <span className="rounded-full bg-[#fe7f32] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
              New Arrival
            </span>
          )}
          {!isAvailable && (
            <span className="rounded-full bg-[#f87171]/90 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              {v.status}
            </span>
          )}
        </div>
        {/* Price overlay */}
        <div className="absolute bottom-0 right-0 bg-gradient-to-tl from-black/80 to-transparent px-3 pt-4 pb-2 rounded-tl-2xl">
          <span className="text-xl font-black text-[#fe7f32]">${Number(v.pricePerDay).toFixed(0)}</span>
          <span className="text-[10px] text-[#aaaaaa]"> /day</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#fe7f32] font-bold">{v.brand}</p>
        <p className="text-lg font-black text-[#eeeeee] leading-tight">{v.model}</p>
        <p className="mt-0.5 text-[11px] text-[#888888]">{v.year} · {v.registration}</p>

        {v.description && (
          <p className="mt-2 text-[11px] text-[#aaaaaa] line-clamp-2 leading-relaxed">{v.description}</p>
        )}

        {/* Specs row */}
        <div className="mt-3 flex gap-3 border-t border-[#3a3a3a] pt-3">
          <div className="flex items-center gap-1 text-[10px] text-[#888888]">
            <span>🪑</span> <span>5 seats</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#888888]">
            <span>⚙️</span> <span>Auto</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#888888]">
            <span>⛽</span> <span>Petrol</span>
          </div>
        </div>

        <button
          onClick={onBook}
          disabled={!isAvailable}
          className="mt-4 w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isAvailable ? 'Book Now' : 'Unavailable'}
        </button>
      </div>
    </article>
  );
}
