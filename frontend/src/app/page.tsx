"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api";

/* ── types ── */
interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  registration: string;
  pricePerDay: number;
  imageUrl?: string;
  description?: string;
}

/* ── static content ── */
const FEATURES = [
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Fully Insured Fleet",
    desc: "Every vehicle is comprehensively insured and inspected before each rental.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Round-the-clock assistance for bookings, roadside help, and driver requests.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Professional Drivers",
    desc: "Vetted, licensed drivers available for city rides, events, and long trips.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Flexible Pickup",
    desc: "Choose self-drive or with-driver service. Pick up or get delivered to your door.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Transparent Pricing",
    desc: "No hidden fees. See the full price before you confirm — always.",
  },
  {
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        className="h-6 w-6"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    title: "Real-Time Tracking",
    desc: "Monitor your reservation status live from booking to trip completion.",
  },
];

const SERVICES = [
  {
    num: "01",
    title: "Self-Drive Rental",
    desc: "Pick your car, set your dates, drive yourself.",
    icon: "🚗",
  },
  {
    num: "02",
    title: "Chauffeur Service",
    desc: "Professional driver assigned to your booking.",
    icon: "🧑‍✈️",
  },
  {
    num: "03",
    title: "Airport Transfers",
    desc: "Punctual pickups and drop-offs at any terminal.",
    icon: "✈️",
  },
  {
    num: "04",
    title: "Corporate Packages",
    desc: "Monthly fleet plans for businesses and teams.",
    icon: "🏢",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    role: "Business Traveler",
    text: "Booked a car with driver for a week-long trip. Seamless from start to finish — the driver was professional and the car was spotless.",
    rating: 5,
  },
  {
    name: "James K.",
    role: "Event Planner",
    text: "Used Drivana for a corporate event fleet. The booking process was fast and the vehicles arrived on time. Will use again.",
    rating: 5,
  },
  {
    name: "Amina R.",
    role: "Regular Client",
    text: "I rent monthly for commuting. The pricing is fair, the cars are always clean, and support responds within minutes.",
    rating: 5,
  },
];

const STATS = [
  { label: "Happy Clients", value: "500+" },
  { label: "Trips Completed", value: "2,400+" },
  { label: "Cities Covered", value: "12" },
  { label: "Satisfaction Rate", value: "98%" },
];

export default function Home() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Search card state ──
  const [serviceType, setServiceType] = useState<'CAR_ONLY' | 'WITH_DRIVER'>('CAR_ONLY');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [brand,       setBrand]       = useState('');
  const [searching,   setSearching]   = useState(false);
  const [results,     setResults]     = useState<Vehicle[] | null>(null);
  const [searchErr,   setSearchErr]   = useState('');
  const resultsRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchErr('');
    if (!startDate || !endDate) { setSearchErr('Please select both dates.'); return; }
    if (endDate <= startDate)   { setSearchErr('Return date must be after pick-up date.'); return; }
    setSearching(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (brand.trim()) params.set('brand', brand.trim());
      const res = await apiClient.get(`/client/vehicles?${params}`);
      setResults(res.data ?? []);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      setSearchErr('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const days = startDate && endDate
    ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  useEffect(() => {
    apiClient
      .get("/client/vehicles")
      .then((r) => setVehicles(r.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, []);

  const fleetCount = vehicles.length;
  const minPrice = vehicles.length
    ? Math.min(...vehicles.map((v) => Number(v.pricePerDay)))
    : 0;

  return (
    <div className="min-h-screen">
      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 border-b border-[#3a3a3a]/50 bg-[#1a1a1a]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#fe7f32] to-[#0a8ab5] shadow-lg shadow-[#fe7f32]/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-[#f5f5f5]">
              Drivana
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {["About", "Services", "Testimonials", "Contact"].map(
              (n) => (
                <a
                  key={n}
                  href={`#${n.toLowerCase()}`}
                  className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] transition hover:bg-[#2a2a2a] hover:text-[#eeeeee]"
                >
                  {n}
                </a>
              ),
            )}
            <Link
              href="/vehicles"
              className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[#fe7f32] transition hover:bg-[#fe7f32]/10"
            >
              Fleet
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl border border-[#3a3a3a] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#aaaaaa] transition hover:text-[#eeeeee] sm:block"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fe7f32] transition hover:bg-[#fe7f32]/20"
            >
              Get Started
            </Link>
            <button
              onClick={() => setMenuOpen((m) => !m)}
              className="rounded-lg p-2 text-[#aaaaaa] hover:bg-[#2a2a2a] md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5"
              >
                {menuOpen ? (
                  <path d="M18 6 6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-[#3a3a3a]/40 bg-[#1a1a1a] px-5 py-3 md:hidden">
            {["About", "Fleet", "Services", "Testimonials", "Contact"].map(
              (n) => (
                <a
                  key={n}
                  href={`#${n.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 text-xs font-semibold uppercase tracking-wider text-[#aaaaaa] hover:text-[#eeeeee]"
                >
                  {n}
                </a>
              ),
            )}
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] overflow-hidden flex items-center">
        {/* Background image */}
        <div className="absolute inset-0 -z-10"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2
          }}
        />
         {/* Dark overlay with gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111111]/97 via-[#1a1a1a]/85 to-[#111111]/60" />

        {/* Glow orbs */}
        <div className="absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[#fe7f32]/10 blur-[120px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[#e06820]/10 blur-[100px] pointer-events-none" />
        <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-[#fe7f32]/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

            {/* ── Left: copy ── */}
            <div className="fade-rise">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#fe7f32]/25 bg-[#fe7f32]/8 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#fe7f32] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#fe7f32]" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#fe7f32]">
                  {fleetCount > 0 ? `${fleetCount} Vehicles Available Now` : "Premium Car Rental Platform"}
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-black uppercase leading-[0.88] tracking-tight text-[#f5f5f5]">
                Drive<br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-[#fe7f32] to-[#ff9f5a] bg-clip-text text-transparent">
                    Your Way.
                  </span>
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-[#fe7f32] to-transparent" />
                </span>
              </h1>

              <p className="mt-7 max-w-lg text-base leading-7 text-[#bbbbbb] sm:text-lg">
                Premium vehicles, professional drivers, and effortless booking — all in one platform.
              </p>

              {/* Trust badges */}
              <div className="mt-5 flex flex-wrap gap-3">
                {[
                  { icon: '✓', text: minPrice > 0 ? `From $${minPrice}/day` : 'Best Rates' },
                  { icon: '✓', text: 'No hidden fees' },
                  { icon: '✓', text: 'Cancel anytime' },
                ].map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5 rounded-full border border-[#3a3a3a] bg-[#1c1c1c]/60 px-3 py-1 text-xs text-[#aaaaaa] backdrop-blur-sm">
                    <span className="text-[#fe7f32]">{b.icon}</span> {b.text}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/vehicles"
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-[#111111] shadow-xl shadow-[#fe7f32]/20 transition-all hover:shadow-[#fe7f32]/40 hover:scale-[1.02]">
                  <span className="relative z-10">Book a Vehicle</span>
                  <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
                </Link>
                <a href="/vehicles"
                  className="rounded-xl border border-[#444444]/60 bg-[#1e1e1e]/50 px-7 py-3.5 text-sm font-bold uppercase tracking-widest text-[#eeeeee] backdrop-blur-sm transition hover:bg-[#2a2a2a] hover:border-[#fe7f32]/40">
                  Explore Fleet →
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-10 flex items-center gap-4 border-t border-[#3a3a3a]/30 pt-6">
                <div className="flex -space-x-2">
                  {['S','J','A','M'].map((l, i) => (
                    <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-gradient-to-br from-[#fe7f32]/30 to-[#e06820]/30 text-[10px] font-black text-[#fe7f32]">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-[#f3b85a] text-xs">★★★★★</div>
                  <p className="text-[11px] text-[#888888]">Trusted by 500+ clients</p>
                </div>
              </div>
            </div>

            {/* ── Right: search card ── */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-[#fe7f32]/5 blur-2xl" />
              <div className="relative rounded-3xl border border-[#3a3a3a]/60 bg-[#1c1c1c]/80 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl">
                {/* Card header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#888888]">Live Availability</p>
                    <p className="mt-0.5 text-base font-black uppercase tracking-wide text-[#eeeeee]">Find Your Ride</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#fe7f32]/20 bg-[#fe7f32]/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.8} className="h-5 w-5">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                  </div>
                </div>

                <form className="space-y-3" onSubmit={handleSearch}>
                  {/* Service type */}
                  <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#3a3a3a] bg-[#111111]/60 p-1">
                    {([['CAR_ONLY', '🚗 Self-Drive'], ['WITH_DRIVER', '🧑‍✈️ With Driver']] as const).map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setServiceType(val)}
                        className={`rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition
                          ${serviceType === val ? 'bg-[#fe7f32]/15 text-[#fe7f32] border border-[#fe7f32]/30' : 'text-[#888888] hover:text-[#aaaaaa]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Brand filter */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                        <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
                      </svg>
                    </span>
                    <input
                      value={brand} onChange={e => setBrand(e.target.value)}
                      placeholder="Brand (optional — e.g. Toyota)"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111]/60 pl-9 pr-3 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#888888] focus:border-[#fe7f32] transition"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </span>
                      <input type="date" min={today} value={startDate}
                        onChange={e => { setStartDate(e.target.value); setResults(null); }}
                        className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111]/60 pl-9 pr-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition [color-scheme:dark]" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </span>
                      <input type="date" min={startDate || today} value={endDate}
                        onChange={e => { setEndDate(e.target.value); setResults(null); }}
                        className="w-full rounded-xl border border-[#3a3a3a] bg-[#111111]/60 pl-9 pr-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition [color-scheme:dark]" />
                    </div>
                  </div>

                  {/* Duration pill */}
                  {days > 0 && (
                    <p className="text-center text-[11px] text-[#fe7f32] font-semibold">
                      {days} day{days > 1 ? 's' : ''} selected
                    </p>
                  )}

                  {searchErr && (
                    <p className="text-[11px] text-[#f87171]">{searchErr}</p>
                  )}

                  <button type="submit" disabled={searching}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] py-3.5 text-xs font-bold uppercase tracking-widest text-[#111111] shadow-lg shadow-[#fe7f32]/20 transition hover:shadow-[#fe7f32]/35 hover:scale-[1.01] disabled:opacity-60 disabled:scale-100">
                    {searching ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#111] border-t-transparent" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                    )}
                    {searching ? 'Searching...' : 'Search Available Cars'}
                  </button>
                </form>

                {/* Inline results */}
                {results !== null && (
                  <div ref={resultsRef} className="mt-4 border-t border-[#3a3a3a]/60 pt-4">
                    {results.length === 0 ? (
                      <p className="text-center text-xs text-[#888888] py-3">
                        No vehicles available for those dates.{' '}
                        <button onClick={() => { setStartDate(''); setEndDate(''); setResults(null); }}
                          className="text-[#fe7f32] underline">Clear dates</button>
                      </p>
                    ) : (
                      <>
                        <p className="mb-3 text-[10px] uppercase tracking-widest text-[#888888]">
                          {results.length} vehicle{results.length > 1 ? 's' : ''} available
                        </p>
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                          {results.map(v => (
                            <div key={v.id}
                              className="flex items-center gap-3 rounded-xl border border-[#3a3a3a] bg-[#111111]/60 p-3 hover:border-[#fe7f32]/40 transition">
                              {v.imageUrl ? (
                                <img src={v.imageUrl} alt={v.brand}
                                  className="h-12 w-16 shrink-0 rounded-lg object-cover border border-[#3a3a3a]" />
                              ) : (
                                <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-[#3a3a3a] bg-[#1c1c1c] text-[#3a3a3a]">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="h-7 w-7">
                                    <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>
                                  </svg>
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-[#eeeeee]">{v.brand} {v.model}</p>
                                <p className="text-[10px] text-[#888888]">{v.year}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-black text-[#fe7f32]">${Number(v.pricePerDay).toFixed(0)}<span className="text-[9px] font-normal text-[#888888]">/day</span></p>
                                {days > 0 && <p className="text-[9px] text-[#888888]">${(Number(v.pricePerDay) * days).toFixed(0)} total</p>}
                              </div>
                              <Link
                                href={`/client/booking/${v.id}?from=${startDate}&to=${endDate}`}
                                className="shrink-0 rounded-lg border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
                                Book
                              </Link>
                            </div>
                          ))}
                        </div>
                        {results.length > 3 && (
                          <Link href={`/client/vehicles?startDate=${startDate}&endDate=${endDate}`}
                            className="mt-3 block text-center text-[10px] text-[#fe7f32] hover:underline">
                            View all {results.length} vehicles →
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                )}

                <p className="mt-4 text-center text-[10px] text-[#3a7a96]">
                  Free cancellation · No credit card required to search
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#111111] to-transparent pointer-events-none" />
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section className="border-y border-[#3a3a3a]/40 bg-[#1c1c1c]/80 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-[#3a3a3a]/40 px-5 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="slide-in px-6 py-6 text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <p className="text-2xl font-black text-[#fe7f32] sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-[#888888]">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ABOUT / FEATURES
      ══════════════════════════════════════════ */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
            Why Drivana
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-4xl">
            Built for the Modern Traveler
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#aaaaaa]">
            We combine a premium fleet with professional service so every trip —
            short or long — feels effortless.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article
              key={i}
              className="glass-panel slide-in rounded-2xl p-5 transition hover:border-[#fe7f32]/40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#fe7f32]/30 bg-[#fe7f32]/10 text-[#fe7f32]">
                {f.icon}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#f0f0f0]">
                {f.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#aaaaaa]">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FLEET — REAL DATA
      ══════════════════════════════════════════ */}
      <section
        id="fleet"
        className="border-t border-[#3a3a3a]/30 bg-[#1c1c1c]/40 py-20"
      >
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
                Our Fleet
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-4xl">
                Available Vehicles
              </h2>
              <p className="mt-2 text-sm text-[#aaaaaa]">
                {fleetCount > 0
                  ? `${fleetCount} vehicles ready to book right now.`
                  : "Browse our curated collection."}
              </p>
            </div>
            <Link
              href="/vehicles"
              className="rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#fe7f32] transition hover:bg-[#fe7f32]/20"
            >
              View All & Book →
            </Link>
          </div>

          {loadingVehicles ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="glass-panel rounded-2xl py-16 text-center">
              <p className="text-sm text-[#888888]">
                No vehicles available right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.slice(0, 6).map((v, i) => (
                <article
                  key={v.id}
                  className="glass-panel slide-in group overflow-hidden rounded-2xl transition hover:border-[#fe7f32]/40 hover:shadow-lg hover:shadow-[#fe7f32]/5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-[#222222]">
                    {v.imageUrl ? (
                      <img
                        src={v.imageUrl}
                        alt={`${v.brand} ${v.model}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3a3a3a"
                          strokeWidth={1}
                          className="h-20 w-20"
                        >
                          <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
                          <circle cx="7.5" cy="17.5" r="1.5" />
                          <circle cx="16.5" cy="17.5" r="1.5" />
                          <path d="M5 12h14" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="rounded-full border border-[#fe7f32]/40 bg-[#fe7f32]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#fe7f32]">
                        Available
                      </span>
                    </div>
                    <div className="absolute right-3 top-3">
                      <span className="rounded-xl border border-[#3a3a3a] bg-[#111111]/80 px-2 py-1 text-[11px] font-black text-[#fe7f32]">
                        ${Number(v.pricePerDay).toFixed(0)}
                        <span className="text-[9px] font-normal text-[#888888]">
                          /day
                        </span>
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black text-[#f0f0f0]">
                          {v.brand} {v.model}
                        </h3>
                        <p className="text-[11px] text-[#888888]">
                          {v.year} · {v.registration}
                        </p>
                      </div>
                    </div>
                    {v.description && (
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#aaaaaa]">
                        {v.description}
                      </p>
                    )}
                    <Link
                      href="/register"
                      className="mt-4 block w-full rounded-xl border border-[#fe7f32]/30 bg-[#fe7f32]/8 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-[#fe7f32] transition hover:bg-[#fe7f32]/15"
                    >
                      Book This Car
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {vehicles.length > 6 && (
            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="inline-block rounded-xl border border-[#3a3a3a] px-6 py-3 text-xs font-bold uppercase tracking-widest text-[#aaaaaa] transition hover:border-[#fe7f32]/40 hover:text-[#fe7f32]"
              >
                See All {fleetCount} Vehicles →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SERVICES
      ══════════════════════════════════════════ */}
      <section id="services" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
              What We Offer
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-4xl">
              Services Tailored
              <br />
              to Every Need
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#aaaaaa]">
              Whether you need a car for a day, a driver for a week, or a full
              corporate fleet — Drivana has a plan for you.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <article
                  key={s.num}
                  className="glass-panel rounded-2xl p-4 transition hover:border-[#fe7f32]/40"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#f0f0f0]">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-[11px] leading-5 text-[#aaaaaa]">
                    {s.desc}
                  </p>
                </article>
              ))}
            </div>
          </div>
          {/* Visual side */}
          <div className="relative hidden lg:block">
            <div
              className="overflow-hidden rounded-3xl border border-[#3a3a3a]"
              style={{
                backgroundImage:
                  "linear-gradient(160deg, rgba(3,11,20,0.3), rgba(3,11,20,0.85)), url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: "480px",
              }}
            >
              <div className="flex h-full flex-col justify-end p-8">
                <p className="text-xs uppercase tracking-widest text-[#888888]">
                  Premium Experience
                </p>
                <h3 className="mt-2 text-2xl font-black uppercase text-[#f5f5f5]">
                  Every ride, perfectly arranged.
                </h3>
                <Link
                  href="/vehicles"
                  className="mt-5 inline-block w-fit rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#111111]"
                >
                  Start Booking
                </Link>
              </div>
            </div>
            {/* Floating card */}
            <div className="glass-panel absolute -bottom-5 -right-5 rounded-2xl p-4 shadow-xl">
              <p className="text-[10px] uppercase tracking-widest text-[#888888]">
                Avg. Booking Time
              </p>
              <p className="mt-1 text-2xl font-black text-[#fe7f32]">2 min</p>
              <p className="text-[10px] text-[#aaaaaa]">
                From search to confirmed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section
        id="testimonials"
        className="border-t border-[#3a3a3a]/30 bg-[#1c1c1c]/40 py-20"
      >
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-4xl">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <article
                key={i}
                className="glass-panel slide-in rounded-2xl p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Stars */}
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <span key={s} className="text-[#f3b85a]">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm leading-6 text-[#bbbbbb]">"{t.text}"</p>
                <div className="mt-5 flex items-center gap-3 border-t border-[#3a3a3a] pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fe7f32]/30 bg-[#fe7f32]/10 text-xs font-black text-[#fe7f32]">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#f0f0f0]">{t.name}</p>
                    <p className="text-[10px] text-[#888888]">{t.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div
          className="glass-panel overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(3,11,20,0.85), rgba(7,24,38,0.7)), url(https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#fe7f32]/10 blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
            Ready to Ride?
          </p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-5xl">
            Your Next Trip
            <br />
            Starts Here.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#bbbbbb]">
            Create a free account, browse the fleet, and book in under 2
            minutes. No paperwork, no waiting.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="pulse-ring rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] px-8 py-3 text-sm font-bold uppercase tracking-widest text-[#111111] shadow-lg shadow-[#fe7f32]/25"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-[#444444] bg-[#1e1e1e]/70 px-8 py-3 text-sm font-bold uppercase tracking-widest text-[#eeeeee] transition hover:bg-[#2a2a2a]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════ */}
      <section
        id="contact"
        className="border-t border-[#3a3a3a]/30 bg-[#1c1c1c]/40 py-20"
      >
        <div className="mx-auto max-w-6xl px-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#fe7f32]">
                Contact Us
              </p>
              <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#f5f5f5] sm:text-4xl">
                We're Here to Help
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#aaaaaa]">
                Have questions about a booking, pricing, or our driver service?
                Reach out and our team will get back to you fast.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  { icon: "📧", label: "Email", value: "support@drivana.com" },
                  { icon: "📞", label: "Phone", value: "+1 (800) DRIVANA" },
                  {
                    icon: "📍",
                    label: "Address",
                    value: "24 Fleet Avenue, Business District",
                  },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="glass-panel flex items-center gap-4 rounded-2xl px-4 py-3"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#888888]">
                        {c.label}
                      </p>
                      <p className="text-sm font-semibold text-[#eeeeee]">
                        {c.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <article className="glass-panel rounded-3xl p-6">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#eeeeee]">
                Send a Message
              </p>
              <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="First Name"
                    className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#888888] focus:border-[#fe7f32] transition"
                  />
                  <input
                    placeholder="Last Name"
                    className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#888888] focus:border-[#fe7f32] transition"
                  />
                </div>
                <input
                  placeholder="Email Address"
                  type="email"
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#888888] focus:border-[#fe7f32] transition"
                />
                <select className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#aaaaaa] outline-none focus:border-[#fe7f32] transition">
                  <option value="">Subject</option>
                  <option>Booking Inquiry</option>
                  <option>Driver Service</option>
                  <option>Corporate Plan</option>
                  <option>Other</option>
                </select>
                <textarea
                  placeholder="Your message..."
                  rows={4}
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#888888] focus:border-[#fe7f32] transition resize-none"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] py-3 text-xs font-bold uppercase tracking-widest text-[#111111] shadow-lg shadow-[#fe7f32]/20 transition hover:shadow-[#fe7f32]/35"
                >
                  Send Message
                </button>
              </form>
            </article>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="border-t border-[#3a3a3a]/40 bg-[#111111]">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#fe7f32] to-[#0a8ab5]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth={2}
                    className="h-3.5 w-3.5"
                  >
                    <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
                    <circle cx="7.5" cy="17.5" r="1.5" />
                    <circle cx="16.5" cy="17.5" r="1.5" />
                  </svg>
                </div>
                <span className="text-sm font-black uppercase tracking-[0.2em] text-[#f5f5f5]">
                  Drivana
                </span>
              </div>
              <p className="text-xs leading-5 text-[#888888]">
                Premium car rental and driver service platform. Built for modern
                travelers.
              </p>
            </div>
            {[
              {
                title: "Platform",
                links: [
                  "Browse Fleet",
                  "Book a Driver",
                  "Pricing",
                  "How It Works",
                ],
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Press", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#2e6a85]">
                  {col.title}
                </p>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-xs text-[#888888] transition hover:text-[#eeeeee]"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#3a3a3a]/40 pt-6">
            <p className="text-[11px] text-[#2e6a85]">
              © 2026 Drivana. All rights reserved.
            </p>
            <div className="flex gap-3">
              {["Twitter", "LinkedIn", "Instagram"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-[11px] text-[#2e6a85] transition hover:text-[#aaaaaa]"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
