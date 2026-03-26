'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import Pagination from '@/components/admin/Pagination';

const VEHICLES_PER_PAGE = 9;

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended'       },
  { value: 'price_asc',   label: 'Price: Low → High' },
  { value: 'price_desc',  label: 'Price: High → Low' },
  { value: 'newest',      label: 'Newest First'       },
];

const SERVICE_TYPES = [
  { value: 'CAR_ONLY',    label: 'Self-Drive',    icon: '🚗' },
  { value: 'WITH_DRIVER', label: 'With Driver',   icon: '🧑‍✈️' },
];

export default function ClientVehicles() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { toasts, toast, remove } = useToast();

  const [vehicles,    setVehicles]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehiclePage, setVehiclePage] = useState(1);

  // ── Filters ──
  const [search,      setSearch]      = useState('');
  const [sort,        setSort]        = useState('recommended');
  const [serviceType, setServiceType] = useState('CAR_ONLY');
  const [startDate,   setStartDate]   = useState(searchParams.get('startDate') ?? '');
  const [endDate,     setEndDate]     = useState(searchParams.get('endDate')   ?? '');
  const [minPrice,    setMinPrice]    = useState(0);
  const [maxPrice,    setMaxPrice]    = useState(99999);
  const [sliderMax,   setSliderMax]   = useState(500);
  const [yearMin,     setYearMin]     = useState('');
  const [yearMax,     setYearMax]     = useState('');

  const today = new Date().toISOString().split('T')[0];

  const fetchVehicles = useCallback((sd = startDate, ed = endDate) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (sd) params.set('startDate', sd);
    if (ed) params.set('endDate',   ed);
    apiClient.get(`/client/vehicles?${params}`)
      .then(res => {
        const data: any[] = res.data ?? [];
        setVehicles(data);
        if (data.length) {
          const top     = Math.max(...data.map(v => Number(v.pricePerDay)));
          const rounded = Math.ceil(top / 50) * 50;
          setSliderMax(rounded);
          setMaxPrice(rounded);
        }
      })
      .catch(() => toast('Failed to load vehicles', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchVehicles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ──
  const days = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const brands = useMemo(() =>
    [...new Set(vehicles.map(v => v.brand))].sort()
  , [vehicles]);

  const years = useMemo(() =>
    [...new Set(vehicles.map(v => Number(v.year)))].sort((a, b) => a - b)
  , [vehicles]);

  const visible = useMemo(() => {
    let list = [...vehicles];

    if (search.trim())
      list = list.filter(v =>
        `${v.brand} ${v.model} ${v.year} ${v.description ?? ''}`.toLowerCase()
          .includes(search.toLowerCase())
      );

    list = list.filter(v => Number(v.pricePerDay) >= minPrice && Number(v.pricePerDay) <= maxPrice);

    if (yearMin) list = list.filter(v => Number(v.year) >= Number(yearMin));
    if (yearMax) list = list.filter(v => Number(v.year) <= Number(yearMax));

    switch (sort) {
      case 'price_asc':  list.sort((a, b) => Number(a.pricePerDay) - Number(b.pricePerDay)); break;
      case 'price_desc': list.sort((a, b) => Number(b.pricePerDay) - Number(a.pricePerDay)); break;
      case 'newest':     list.sort((a, b) => Number(b.year) - Number(a.year)); break;
    }

    return list;
  }, [vehicles, search, minPrice, maxPrice, yearMin, yearMax, sort]);

  const totalVehiclePages = Math.ceil(visible.length / VEHICLES_PER_PAGE);
  const paginatedVehicles = visible.slice((vehiclePage - 1) * VEHICLES_PER_PAGE, vehiclePage * VEHICLES_PER_PAGE);

  const activeFilterCount = [
    search.trim(),
    startDate,
    endDate,
    minPrice > 0 ? '1' : '',
    maxPrice < sliderMax ? '1' : '',
    yearMin,
    yearMax,
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearch(''); setStartDate(''); setEndDate('');
    setMinPrice(0); setMaxPrice(sliderMax);
    setYearMin(''); setYearMax('');
    setVehiclePage(1);
    fetchVehicles('', '');
  };

  const applyDates = () => { fetchVehicles(startDate, endDate); setSidebarOpen(false); };

  // ── Sidebar content ──
  const SidebarContent = () => (
    <div className="flex flex-col gap-6">

      {/* Date availability */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fe7f32]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Availability
        </p>
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-widest text-[#666666]">Pick-up</label>
            <input type="date" min={today} value={startDate}
              onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(''); }}
              className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] [color-scheme:dark] transition" />
          </div>
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-widest text-[#666666]">Return</label>
            <input type="date" min={startDate || today} value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] [color-scheme:dark] transition" />
          </div>
          {days > 0 && (
            <p className="text-center text-[10px] font-semibold text-[#fe7f32]">
              {days} day{days > 1 ? 's' : ''} · est. from ${(visible[0] ? Number(visible[0].pricePerDay) * days : 0).toFixed(0)}
            </p>
          )}
          <button onClick={applyDates}
            className="w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2 text-[10px] font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
            {startDate && endDate ? 'Check Availability' : 'Show All Vehicles'}
          </button>
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fe7f32]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Price / Day
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[9px] uppercase tracking-widest text-[#666666]">Min</label>
              <input type="number" min={0} max={maxPrice} value={minPrice}
                onChange={e => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] transition" />
            </div>
            <span className="mt-4 text-[#555555]">—</span>
            <div className="flex-1">
              <label className="mb-1 block text-[9px] uppercase tracking-widest text-[#666666]">Max</label>
              <input type="number" min={minPrice} max={sliderMax} value={maxPrice}
                onChange={e => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] transition" />
            </div>
          </div>
          <input type="range" min={0} max={sliderMax} step={10} value={maxPrice}
            onChange={e => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#fe7f32] cursor-pointer" />
          <div className="flex justify-between text-[10px] text-[#666666]">
            <span>$0</span><span className="font-bold text-[#fe7f32]">up to ${maxPrice}/day</span>
          </div>
        </div>
      </div>

      {/* Brand */}
      {brands.length > 1 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fe7f32]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
            </svg>
            Brand
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSearch('')}
              className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition
                ${!search ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#888888] hover:text-[#eeeeee]'}`}>
              All
            </button>
            {brands.map(b => (
              <button key={b} onClick={() => setSearch(search === b ? '' : b)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition
                  ${search === b ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#888888] hover:text-[#eeeeee]'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Year range */}
      {years.length > 1 && (
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fe7f32]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Year
          </p>
          <div className="flex items-center gap-2">
            <select value={yearMin} onChange={e => setYearMin(e.target.value)}
              className="flex-1 rounded-xl border border-[#3a3a3a] bg-[#111111] px-2 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] transition">
              <option value="">From</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <span className="text-[#555555]">—</span>
            <select value={yearMax} onChange={e => setYearMax(e.target.value)}
              className="flex-1 rounded-xl border border-[#3a3a3a] bg-[#111111] px-2 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] transition">
              <option value="">To</option>
              {[...years].reverse().map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button onClick={clearAll}
          className="w-full rounded-xl border border-[#3a3a3a] py-2 text-[10px] font-bold uppercase tracking-widest text-[#888888] hover:text-[#f87171] hover:border-[#f87171]/40 transition">
          ✕ Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="flex min-h-screen gap-0">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-60 shrink-0 pr-6 pt-1">
          <SidebarContent />
        </aside>

        {/* ── Mobile sidebar overlay ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10 w-72 overflow-y-auto glass-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-[#eeeeee]">Filters</p>
                <button onClick={() => setSidebarOpen(false)} className="text-[#888888] hover:text-[#eeeeee]">✕</button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Top bar */}
          <div className="glass-panel fade-rise mb-5 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-3">

              {/* Service type toggle */}
              <div className="flex rounded-xl border border-[#3a3a3a] bg-[#111111]/60 p-0.5">
                {SERVICE_TYPES.map(s => (
                  <button key={s.value} onClick={() => setServiceType(s.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition
                      ${serviceType === s.value
                        ? 'bg-[#fe7f32]/15 text-[#fe7f32] border border-[#fe7f32]/30'
                        : 'text-[#888888] hover:text-[#aaaaaa]'}`}>
                    <span>{s.icon}</span>{s.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[160px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search brand, model, year..."
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] pl-8 pr-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32] transition" />
              </div>

              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value)}
                className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32] cursor-pointer transition">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Mobile filter button */}
              <button onClick={() => setSidebarOpen(true)}
                className="relative lg:hidden rounded-xl border border-[#3a3a3a] px-3 py-2.5 text-xs text-[#aaaaaa] hover:text-[#eeeeee] transition">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#fe7f32] text-[8px] font-black text-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Active filter pills */}
            {(startDate || endDate || minPrice > 0 || maxPrice < sliderMax || yearMin || yearMax) && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-[#3a3a3a]/50 pt-3">
                {startDate && endDate && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#fe7f32]/30 bg-[#fe7f32]/10 px-2.5 py-1 text-[10px] text-[#fe7f32]">
                    📅 {startDate} → {endDate}
                    <button onClick={() => { setStartDate(''); setEndDate(''); fetchVehicles('', ''); }} className="hover:text-white">✕</button>
                  </span>
                )}
                {(minPrice > 0 || maxPrice < sliderMax) && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#f3b85a]/30 bg-[#f3b85a]/10 px-2.5 py-1 text-[10px] text-[#f3b85a]">
                    💰 ${minPrice}–${maxPrice}/day
                    <button onClick={() => { setMinPrice(0); setMaxPrice(sliderMax); }} className="hover:text-white">✕</button>
                  </span>
                )}
                {(yearMin || yearMax) && (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#a78bfa]/30 bg-[#a78bfa]/10 px-2.5 py-1 text-[10px] text-[#a78bfa]">
                    🗓 {yearMin || '?'} – {yearMax || '?'}
                    <button onClick={() => { setYearMin(''); setYearMax(''); }} className="hover:text-white">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-[#eeeeee]">
                {loading ? 'Loading...' : `${visible.length} Vehicle${visible.length !== 1 ? 's' : ''}`}
              </h1>
              <p className="text-[11px] text-[#888888]">
                {serviceType === 'WITH_DRIVER' ? '🧑‍✈️ With professional driver' : '🚗 Self-drive rental'}
                {days > 0 && ` · ${days} day${days > 1 ? 's' : ''}`}
              </p>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearAll}
                className="text-[10px] text-[#888888] hover:text-[#f87171] transition underline underline-offset-2">
                Clear all
              </button>
            )}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="glass-panel rounded-2xl p-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
              <p className="mt-3 text-sm text-[#aaaaaa]">Loading vehicles...</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="glass-panel rounded-2xl p-16 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-sm font-bold text-[#eeeeee]">No vehicles match your filters</p>
              <p className="mt-1 text-xs text-[#888888]">Try adjusting the price range, dates, or clearing filters.</p>
              <button onClick={clearAll}
                className="mt-4 rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedVehicles.map((v: any, i: number) => (
                  <VehicleCard key={v.id} v={v} i={i} days={days}
                    onBook={() => router.push(
                      `/client/booking/${v.id}${startDate && endDate ? `?from=${startDate}&to=${endDate}` : ''}`
                    )}
                  />
                ))}
              </div>
              <Pagination page={vehiclePage} totalPages={totalVehiclePages} total={visible.length} limit={VEHICLES_PER_PAGE} onPage={setVehiclePage} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

function VehicleCard({ v, i, days, onBook }: { v: any; i: number; days: number; onBook: () => void }) {
  const isAvailable = v.status === 'AVAILABLE';
  const total = days > 0 ? (Number(v.pricePerDay) * days).toFixed(0) : null;

  return (
    <article
      className="glass-panel slide-in rounded-2xl overflow-hidden flex flex-col group hover:border-[#fe7f32]/40 transition-all duration-300"
      style={{ animationDelay: `${i * 40}ms` }}
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-[#1a1a1a]">
        {v.imageUrl ? (
          <img src={v.imageUrl} alt={`${v.brand} ${v.model}`}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth={0.8} className="h-24 w-24">
              <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/><path d="M5 12h14"/>
            </svg>
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="rounded-full bg-[#f87171]/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              {v.status}
            </span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <div className="rounded-xl border border-[#fe7f32]/30 bg-black/70 px-2.5 py-1.5 backdrop-blur-sm text-right">
            <p className="text-base font-black text-[#fe7f32] leading-none">${Number(v.pricePerDay).toFixed(0)}</p>
            <p className="text-[9px] text-[#888888]">/day</p>
          </div>
        </div>
        {/* Year badge */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-full border border-[#3a3a3a]/80 bg-black/60 px-2 py-0.5 text-[9px] font-bold text-[#aaaaaa] backdrop-blur-sm">
            {v.year}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#fe7f32]">{v.brand}</p>
        <p className="text-lg font-black leading-tight text-[#eeeeee]">{v.model}</p>
        <p className="mt-0.5 text-[11px] text-[#666666]">{v.registration}</p>

        {v.description && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-[#aaaaaa]">{v.description}</p>
        )}

        {/* Total estimate */}
        {total && isAvailable && (
          <div className="mt-3 rounded-xl border border-[#fe7f32]/20 bg-[#fe7f32]/5 px-3 py-2 flex items-center justify-between">
            <p className="text-[10px] text-[#888888]">{days} day{days > 1 ? 's' : ''} total</p>
            <p className="text-sm font-black text-[#fe7f32]">${total}</p>
          </div>
        )}

        <button onClick={onBook} disabled={!isAvailable}
          className="mt-auto pt-3 w-full rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed">
          {isAvailable ? (total ? `Book · $${total}` : 'Book Now') : 'Unavailable'}
        </button>
      </div>
    </article>
  );
}
