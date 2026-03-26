'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

export default function BookingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [vehicle,     setVehicle]     = useState<any>(null);
  const [driver,      setDriver]      = useState<any>(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [serviceType, setServiceType] = useState<'CAR_ONLY' | 'WITH_DRIVER'>('CAR_ONLY');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get(`/client/vehicles/${vehicleId}`);
        setVehicle(res.data);
      } catch {
        toast('Vehicle not found', 'error');
        router.push('/client/vehicles');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vehicleId]);

  const days = (() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  })();

  const basePrice    = days * Number(vehicle?.pricePerDay ?? 0);
  const driverFee    = serviceType === 'WITH_DRIVER' ? days * 50 : 0;
  const insurance    = days > 0 ? 25 : 0;
  const serviceFee   = days > 0 ? 15 : 0;
  const totalPrice   = basePrice + driverFee + insurance + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) { toast('Please select dates', 'error'); return; }
    if (days <= 0) { toast('End date must be after start date', 'error'); return; }
    setSubmitting(true);
    try {
      await apiClient.post('/client/reservations', { vehicleId, startDate, endDate, serviceType });
      toast('Mission confirmed!', 'success');
      setTimeout(() => router.push('/client/reservations'), 1200);
    } catch (e: any) {
      toast(e?.response?.data?.message ?? 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
    </div>
  );

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Breadcrumb */}
      <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#888888]">
        <Link href="/client/vehicles" className="hover:text-[#fe7f32] transition">Fleet</Link>
        <span className="text-[#3a3a3a]">›</span>
        <Link href="/client/vehicles" className="hover:text-[#fe7f32] transition">Vehicle Selection</Link>
        <span className="text-[#3a3a3a]">›</span>
        <span className="text-[#fe7f32]">Confirmation</span>
      </div>

      <h1 className="mb-6 text-3xl font-black uppercase tracking-tight text-[#eeeeee] sm:text-4xl">
        Confirm Your Mission
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Vehicle card */}
            <article className="glass-panel rounded-2xl overflow-hidden">
              <div className="grid sm:grid-cols-[220px_1fr]">
                {/* Image */}
                <div className="relative h-48 sm:h-full min-h-[180px] overflow-hidden bg-[#111111]">
                  {vehicle?.imageUrl ? (
                    <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-6xl opacity-10">🚗</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="rounded-full border border-[#fe7f32]/50 bg-[#fe7f32]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#fe7f32]">
                      {vehicle?.category ?? 'Premium'}
                    </span>
                  </div>
                  <div className="absolute bottom-8 left-3">
                    <p className="text-lg font-black text-white">{vehicle?.brand} {vehicle?.model}</p>
                  </div>
                </div>

                {/* Specs */}
                <div className="p-5">
                  <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-[#888888]">Vehicle Performance</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: '⚡', label: 'Power',    value: vehicle?.power    ?? '300 HP' },
                      { icon: '🏎️', label: '0–60',     value: vehicle?.zeroSixty ?? '5.2s' },
                      { icon: '🪑', label: 'Capacity', value: vehicle?.seats    ? `${vehicle.seats} seats` : '5 seats' },
                      { icon: '❄️', label: 'Climate',  value: vehicle?.climate  ?? 'Auto A/C' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2.5 rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5">
                        <span className="text-base">{s.icon}</span>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[#888888]">{s.label}</p>
                          <p className="text-xs font-bold text-[#eeeeee]">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#3a3a3a] pt-3">
                    <p className="text-[10px] uppercase tracking-widest text-[#888888]">Daily Rate</p>
                    <p className="text-xl font-black text-[#fe7f32]">
                      ${Number(vehicle?.pricePerDay).toFixed(2)}<span className="text-xs font-normal text-[#888888]">/day</span>
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Itinerary */}
            <article className="glass-panel rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.8} className="h-4 w-4">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#eeeeee]">Itinerary Details</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">📍 Pickup</p>
                  <input
                    type="date" required min={today}
                    value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold text-[#eeeeee] outline-none focus:border-[#fe7f32] transition [color-scheme:dark]"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">📍 Drop-off</p>
                  <input
                    type="date" required min={startDate || today}
                    value={endDate} onChange={e => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold text-[#eeeeee] outline-none focus:border-[#fe7f32] transition [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Duration badge */}
              {days > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full border border-[#fe7f32]/30 bg-[#fe7f32]/10 px-3 py-1 text-[11px] font-bold text-[#fe7f32]">
                    {days} day{days > 1 ? 's' : ''} rental
                  </span>
                  <span className="text-[10px] text-[#888888]">
                    {startDate && endDate && `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </span>
                </div>
              )}

              {/* Map placeholder */}
              <div className="mt-4 h-32 overflow-hidden rounded-xl border border-[#3a3a3a] bg-[#111111] relative">
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #fe7f32 1px, transparent 1px),
                      linear-gradient(rgba(254,127,50,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(254,127,50,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px, 40px 40px, 40px 40px',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-4 w-4 rounded-full border-2 border-[#fe7f32] bg-[#fe7f32]/30 shadow-lg shadow-[#fe7f32]/40" />
                    <div className="h-6 w-px bg-[#fe7f32]/40" />
                  </div>
                </div>
                <p className="absolute bottom-2 left-3 text-[9px] uppercase tracking-widest text-[#555555]">Pickup location</p>
              </div>
            </article>

            {/* Service type */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#eeeeee]">Service Type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: 'CAR_ONLY',    icon: '🚗', label: 'Self-Drive',     desc: 'Drive yourself, full freedom' },
                  { value: 'WITH_DRIVER', icon: '🧑‍✈️', label: 'With Chauffeur', desc: `+$50/day · Professional driver` },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setServiceType(opt.value)}
                    className={`relative rounded-xl border p-4 text-left transition
                      ${serviceType === opt.value
                        ? 'border-[#fe7f32]/50 bg-[#fe7f32]/10'
                        : 'border-[#3a3a3a] bg-[#1a1a1a] hover:border-[#fe7f32]/30'}`}>
                    {serviceType === opt.value && (
                      <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#fe7f32] text-[8px] text-white">✓</span>
                    )}
                    <span className="text-2xl">{opt.icon}</span>
                    <p className="mt-2 text-xs font-black uppercase tracking-wide text-[#eeeeee]">{opt.label}</p>
                    <p className="mt-0.5 text-[10px] text-[#888888]">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </article>

            {/* Assigned driver (only when WITH_DRIVER) */}
            {serviceType === 'WITH_DRIVER' && (
              <article className="glass-panel rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.8} className="h-4 w-4">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#eeeeee]">Assigned Chauffeur</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#fe7f32]/40 bg-gradient-to-br from-[#2a1a0a] to-[#1a1a1a] text-lg font-black text-[#fe7f32]">
                        D
                      </div>
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#1a1a1a] bg-[#4ade80]" />
                    </div>
                    <div>
                      <p className="font-black text-[#eeeeee]">Auto-Assigned</p>
                      <p className="text-[11px] text-[#888888]">Professional Driver · Available</p>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[10px] text-[#f3b85a]">★ 4.8</span>
                        <span className="text-[10px] text-[#888888]">Verified Driver</span>
                      </div>
                    </div>
                  </div>
                  <span className="rounded-xl border border-[#3a3a3a] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888888]">
                    Auto-Select
                  </span>
                </div>
              </article>
            )}
          </div>

          {/* ── RIGHT COLUMN: Payment Summary ── */}
          <div className="flex flex-col gap-4">
            <article className="glass-panel rounded-2xl p-5 sticky top-4">
              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.24em] text-[#888888]">Payment Summary</p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#aaaaaa]">Rental ({days || '—'} day{days !== 1 ? 's' : ''})</span>
                  <span className="font-semibold text-[#eeeeee]">${basePrice.toFixed(2)}</span>
                </div>
                {serviceType === 'WITH_DRIVER' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#aaaaaa]">Chauffeur Fee</span>
                    <span className="font-semibold text-[#eeeeee]">${driverFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#aaaaaa]">Insurance</span>
                  <span className="font-semibold text-[#eeeeee]">${insurance.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#aaaaaa]">Service Fee</span>
                  <span className="font-semibold text-[#eeeeee]">${serviceFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="my-4 border-t border-[#3a3a3a]" />

              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-widest text-[#888888]">Total Amount</p>
                <p className="text-2xl font-black text-[#fe7f32]">${totalPrice.toFixed(2)}</p>
              </div>

              <div className="my-4 border-t border-[#3a3a3a]" />

              {/* Payment method */}
              <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-[#888888]">Select Payment Method</p>
              <div className="space-y-2">
                {[
                  { icon: '💳', label: 'Card ···· 8842', sub: 'Exp 11/26', active: true },
                  { icon: '🏦', label: 'Bank Transfer',  sub: 'Processing 1–2 days', active: false },
                ].map((m, i) => (
                  <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition
                    ${m.active ? 'border-[#fe7f32]/40 bg-[#fe7f32]/8' : 'border-[#3a3a3a] bg-[#1a1a1a] hover:border-[#fe7f32]/20'}`}>
                    <input type="radio" name="payment" defaultChecked={m.active} className="accent-[#fe7f32]" />
                    <span className="text-base">{m.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-[#eeeeee]">{m.label}</p>
                      <p className="text-[10px] text-[#888888]">{m.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={submitting || days <= 0}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-[#fe7f32] to-[#e06820] py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#fe7f32]/25 transition hover:shadow-[#fe7f32]/40 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {submitting ? 'Processing...' : days > 0 ? `Confirm & Pay — $${totalPrice.toFixed(2)}` : 'Select Dates to Continue'}
              </button>

              <p className="mt-3 text-center text-[9px] leading-4 text-[#555555]">
                By clicking "Confirm & Pay", you agree to the Drivana Terms of Service and rental agreement.
              </p>

              {/* Security badge */}
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#111111] px-3 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.8} className="h-4 w-4 shrink-0">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#fe7f32]">End-to-End Encryption</p>
                  <p className="text-[9px] text-[#555555]">Secure Transaction Protocol 2.0</p>
                </div>
              </div>
            </article>

            {/* Back link */}
            <button type="button" onClick={() => router.back()}
              className="rounded-xl border border-[#3a3a3a] py-2.5 text-xs font-bold uppercase tracking-widest text-[#888888] hover:text-[#eeeeee] hover:border-[#fe7f32]/30 transition">
              ← Back to Fleet
            </button>
          </div>

        </div>
      </form>
    </>
  );
}
