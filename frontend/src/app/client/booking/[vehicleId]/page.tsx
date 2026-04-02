'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const CARD_STYLE = {
  style: {
    base: {
      color: '#eeeeee',
      fontFamily: '"Trebuchet MS", sans-serif',
      fontSize: '14px',
      '::placeholder': { color: '#888888' },
      backgroundColor: 'transparent',
    },
    invalid: { color: '#f87171' },
  },
};

/* ── Inner form — has access to Stripe hooks ── */
function BookingForm({ vehicle, vehicleId }: { vehicle: any; vehicleId: string }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const stripe       = useStripe();
  const elements     = useElements();
  const { toasts, toast, remove } = useToast();

  const [startDate,       setStartDate]       = useState(searchParams.get('from') ?? '');
  const [endDate,         setEndDate]         = useState(searchParams.get('to')   ?? '');
  const [serviceType,     setServiceType]     = useState<'CAR_ONLY' | 'WITH_DRIVER'>('CAR_ONLY');
  const [pickupLocation,  setPickupLocation]  = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [availability,    setAvailability]    = useState<{ available: boolean; conflict: { from: string; to: string } | null } | null>(null);
  const [checkingAvail,   setCheckingAvail]   = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [cardReady,       setCardReady]       = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const checkAvailability = useCallback(async (start: string, end: string) => {
    if (!start || !end || end <= start) { setAvailability(null); return; }
    setCheckingAvail(true);
    try {
      const res = await apiClient.get(`/client/vehicles/${vehicleId}/availability`, {
        params: { startDate: start, endDate: end },
      });
      setAvailability(res.data);
    } catch { setAvailability(null); }
    finally { setCheckingAvail(false); }
  }, [vehicleId]);

  const handleStartDate = (val: string) => { setStartDate(val); checkAvailability(val, endDate); };
  const handleEndDate   = (val: string) => { setEndDate(val);   checkAvailability(startDate, val); };

  useEffect(() => {
    if (startDate && endDate) checkAvailability(startDate, endDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const days       = startDate && endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;
  const basePrice  = days * Number(vehicle?.pricePerDay ?? 0);
  const driverFee  = serviceType === 'WITH_DRIVER' ? days * 50 : 0;
  const insurance  = days > 0 ? 25 : 0;
  const serviceFee = days > 0 ? 15 : 0;
  const totalPrice = basePrice + driverFee + insurance + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) { toast('Stripe not loaded', 'error'); return; }
    if (!startDate || !endDate || days <= 0) { toast('Please select valid dates', 'error'); return; }
    if (availability?.available === false) { toast('Dates not available', 'error'); return; }

    setSubmitting(true);
    try {
      // 1. Create PaymentIntent + reservation on backend
      const { data } = await apiClient.post('/payment/create-intent', {
        vehicleId, startDate, endDate, serviceType,
        pickupLocation:  pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim() || pickupLocation.trim(),
      });

      // 2. Confirm card payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) { toast('Card element not found', 'error'); return; }

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (result.error) {
        toast(result.error.message ?? 'Payment failed', 'error');
        return;
      }

      // 3. Payment succeeded — confirm reservation immediately (don't wait for webhook)
      try {
        await apiClient.post('/payment/confirm-reservation', {
          reservationId: data.reservationId,
          paymentIntentId: result.paymentIntent?.id,
        });
      } catch (confirmErr: any) {
        // Payment went through but confirmation failed — still redirect, admin can fix
        console.error('Confirm reservation failed:', confirmErr?.response?.data);
      }

      toast('Payment successful! Booking confirmed.', 'success');
      setTimeout(() => router.push('/client/reservations'), 1500);
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const canPay = days > 0 && availability?.available !== false && !checkingAvail && cardReady
    && pickupLocation.trim().length > 0;

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#888888]">
        <Link href="/client/vehicles" className="hover:text-[#fe7f32] transition">Fleet</Link>
        <span className="text-[#3a3a3a]">›</span>
        <span className="text-[#fe7f32]">Confirmation</span>
      </div>

      <h1 className="mb-6 text-3xl font-black uppercase tracking-tight text-[#eeeeee] sm:text-4xl">
        Confirm Your Mission
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">

          {/* ── LEFT ── */}
          <div className="flex flex-col gap-5">

            {/* Vehicle card */}
            <article className="glass-panel rounded-2xl overflow-hidden">
              <div className="grid sm:grid-cols-[220px_1fr]">
                <div className="relative h-48 sm:h-full min-h-[180px] overflow-hidden bg-[#111111]">
                  {vehicle?.imageUrl ? (
                    <img src={vehicle.imageUrl} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><span className="text-6xl opacity-10">🚗</span></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-8 left-3">
                    <p className="text-lg font-black text-white">{vehicle?.brand} {vehicle?.model}</p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="mb-4 text-[9px] uppercase tracking-[0.22em] text-[#888888]">Vehicle Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: '📅', label: 'Year',     value: vehicle?.year ?? '—' },
                      { icon: '🪪', label: 'Plate',    value: vehicle?.registration ?? '—' },
                      { icon: '🪑', label: 'Capacity', value: '5 seats' },
                      { icon: '❄️', label: 'Climate',  value: 'Auto A/C' },
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

            {/* Dates & Locations */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#eeeeee]">📅 Itinerary</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">Pickup Date</p>
                  <input type="date" required min={today} value={startDate}
                    onChange={e => handleStartDate(e.target.value)}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold text-[#eeeeee] outline-none focus:border-[#fe7f32] [color-scheme:dark]" />
                </div>
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">Return Date</p>
                  <input type="date" required min={startDate || today} value={endDate}
                    onChange={e => handleEndDate(e.target.value)}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm font-bold text-[#eeeeee] outline-none focus:border-[#fe7f32] [color-scheme:dark]" />
                </div>
              </div>

              {checkingAvail && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#fe7f32] border-t-transparent" />
                  <p className="text-[11px] text-[#888888]">Checking availability...</p>
                </div>
              )}
              {!checkingAvail && availability && (
                <div className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 ${availability.available ? 'border-[#4ade80]/30 bg-[#4ade80]/10' : 'border-[#f87171]/30 bg-[#f87171]/10'}`}>
                  <span>{availability.available ? '✅' : '❌'}</span>
                  <div>
                    <p className={`text-xs font-bold ${availability.available ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                      {availability.available ? 'Available for selected dates' : 'Not available'}
                    </p>
                    {availability.conflict && (
                      <p className="text-[10px] text-[#f87171]">Already booked {availability.conflict.from} → {availability.conflict.to}</p>
                    )}
                  </div>
                </div>
              )}
              {days > 0 && (
                <div className="mt-3">
                  <span className="rounded-full border border-[#fe7f32]/30 bg-[#fe7f32]/10 px-3 py-1 text-[11px] font-bold text-[#fe7f32]">
                    {days} day{days > 1 ? 's' : ''} rental
                  </span>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">📍 Pickup Location *</p>
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={e => setPickupLocation(e.target.value)}
                    placeholder="e.g. 24 Fleet Avenue, Casablanca"
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition placeholder:text-[#555555]"
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">📍 Drop-off Location</p>
                  <input
                    type="text"
                    value={dropoffLocation}
                    onChange={e => setDropoffLocation(e.target.value)}
                    placeholder="Same as pickup if empty"
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition placeholder:text-[#555555]"
                  />
                </div>
              </div>
            </article>

            {/* Service type */}
            <article className="glass-panel rounded-2xl p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#eeeeee]">Service Type</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { value: 'CAR_ONLY',    icon: '🚗',   label: 'Self-Drive',     desc: 'Drive yourself, full freedom' },
                  { value: 'WITH_DRIVER', icon: '🧑‍✈️', label: 'With Chauffeur', desc: '+$50/day · Professional driver' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setServiceType(opt.value)}
                    className={`relative rounded-xl border p-4 text-left transition
                      ${serviceType === opt.value ? 'border-[#fe7f32]/50 bg-[#fe7f32]/10' : 'border-[#3a3a3a] bg-[#1a1a1a] hover:border-[#fe7f32]/30'}`}>
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

          </div>

          {/* ── RIGHT: Payment ── */}
          <div className="flex flex-col gap-4">
            <article className="glass-panel rounded-2xl overflow-hidden sticky top-4">

              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--line-soft)', background: 'rgba(254,127,50,0.08)' }}>
                <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Order Summary</p>
                <p className="text-2xl font-black text-[#fe7f32]">${totalPrice.toFixed(2)}</p>
              </div>

              <div className="p-5 space-y-5">

                {/* Line items */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Rental · {days || '—'} day{days !== 1 ? 's' : ''}</span>
                    <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>${basePrice.toFixed(2)}</span>
                  </div>
                  {serviceType === 'WITH_DRIVER' && (
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>Chauffeur Fee</span>
                      <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>${driverFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Insurance</span>
                    <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>${insurance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Service Fee</span>
                    <span className="font-semibold" style={{ color: 'var(--text-soft)' }}>${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--line-soft)' }}>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total</span>
                    <span className="text-xl font-black text-[#fe7f32]">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Card input */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.8} className="h-3.5 w-3.5">
                      <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>Card Details</p>
                  </div>
                  <div className="rounded-xl border-2 px-4 py-4 transition-all duration-200"
                    style={{
                      borderColor: cardReady ? '#fe7f32' : 'var(--line-soft)',
                      background: 'var(--bg-soft)',
                      boxShadow: cardReady ? '0 0 0 3px rgba(254,127,50,0.1)' : 'none',
                    }}>
                    <CardElement options={CARD_STYLE} onChange={e => setCardReady(e.complete && !e.error)} />
                  </div>
                  {cardReady && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
                      <p className="text-[9px] text-[#4ade80]">Card valid</p>
                    </div>
                  )}
                  <p className="mt-1 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                    Test: 4242 4242 4242 4242 · any future date · any CVC
                  </p>
                </div>

                {/* Pay button */}
                <button type="submit" disabled={submitting || !canPay}
                  className="w-full rounded-xl py-4 text-sm font-black uppercase tracking-widest transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: canPay ? 'linear-gradient(135deg,#fe7f32,#e06820)' : 'var(--bg-soft)',
                    boxShadow: canPay ? '0 8px 24px rgba(254,127,50,0.3)' : 'none',
                    color: canPay ? 'white' : 'var(--text-muted)',
                  }}>
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : availability?.available === false ? '❌ Dates Not Available'
                    : !pickupLocation.trim() && days > 0 ? '📍 Enter Pickup Location'
                    : !cardReady && days > 0 ? '💳 Enter Card Details'
                    : days > 0 ? `Pay $${totalPrice.toFixed(2)}`
                    : 'Select Dates First'}
                </button>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2">
                  {[{ icon: '🔒', text: 'SSL' }, { icon: '⚡', text: 'Instant' }, { icon: '↩️', text: 'Refundable' }].map(b => (
                    <div key={b.text} className="flex flex-col items-center gap-1 rounded-xl border py-2"
                      style={{ borderColor: 'var(--line-soft)', background: 'var(--bg-card)' }}>
                      <span className="text-sm">{b.icon}</span>
                      <p className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{b.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-center text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  Powered by <span className="font-bold text-[#fe7f32]">Stripe</span> · We never store card details
                </p>
              </div>
            </article>

            <button type="button" onClick={() => router.back()}
              className="rounded-xl border py-2.5 text-xs font-bold uppercase tracking-widest transition hover:border-[#fe7f32]/30"
              style={{ borderColor: 'var(--line-soft)', color: 'var(--text-soft)' }}>
              ← Back to Fleet
            </button>
          </div>

        </div>
      </form>
    </>
  );
}

/* ── Outer wrapper — provides Stripe context ── */
export default function BookingPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [vehicle,      setVehicle]      = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [loading,      setLoading]      = useState(true);

  // Verification form state
  const [vAge,          setVAge]          = useState('');
  const [vLicenseYear,  setVLicenseYear]  = useState('');
  const [vLicenseFile,  setVLicenseFile]  = useState<File | null>(null);
  const [vLicensePreview, setVLicensePreview] = useState('');
  const [vSubmitting,   setVSubmitting]   = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/client/vehicles/${vehicleId}`),
      apiClient.get('/client/verification'),
    ])
      .then(([vRes, verRes]) => { setVehicle(vRes.data); setVerification(verRes.data); })
      .catch(() => { toast('Failed to load page', 'error'); router.push('/client/vehicles'); })
      .finally(() => setLoading(false));
  }, [vehicleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadToCloudinaryDirect = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '');
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload failed');
    return data.secure_url;
  };

  const submitVerification = async () => {
    if (!vAge || parseInt(vAge) < 20) { toast('You must be at least 20 years old', 'error'); return; }
    const licenseAge = new Date().getFullYear() - parseInt(vLicenseYear);
    if (!vLicenseYear || licenseAge < 2) { toast('License must be at least 2 years old', 'error'); return; }
    if (!vLicenseFile) { toast('Please upload your license photo', 'error'); return; }

    setVSubmitting(true);
    try {
      const licensePhotoUrl = await uploadToCloudinaryDirect(vLicenseFile);
      await apiClient.post('/client/verification', {
        age: parseInt(vAge),
        licenseYear: vLicenseYear,
        licensePhotoUrl,
      });
      toast('Verification submitted! Awaiting admin approval.', 'success');
      setVerification({ status: 'PENDING' });
    } catch (err: any) {
      toast(err?.response?.data?.message ?? 'Submission failed', 'error');
    } finally {
      setVSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
    </div>
  );

  // Not verified yet — show verification form
  if (!verification || verification.status !== 'APPROVED') {
    const status = verification?.status ?? 'NOT_SUBMITTED';
    return (
      <>
        <ToastContainer toasts={toasts} remove={remove} />
        <div className="mx-auto max-w-lg">
          <div className="mb-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#888888]">
            <Link href="/client/vehicles" className="hover:text-[#fe7f32] transition">Fleet</Link>
            <span>›</span>
            <span className="text-[#fe7f32]">Verification Required</span>
          </div>

          {status === 'PENDING' && (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <span className="text-5xl">⏳</span>
              <h2 className="mt-4 text-xl font-black uppercase text-[#eeeeee]">Verification Pending</h2>
              <p className="mt-2 text-sm text-[#888888]">Your documents are under review. You'll be able to book once an admin approves your account.</p>
              <button onClick={() => router.back()} className="mt-6 rounded-xl border border-[#3a3a3a] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-[#eeeeee] hover:border-[#fe7f32]/40 transition">
                ← Back to Fleet
              </button>
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="mb-4 rounded-xl border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3">
              <p className="text-xs font-bold text-[#f87171]">❌ Verification Rejected</p>
              {verification.rejectionReason && (
                <p className="mt-1 text-[11px] text-[#f87171]/80">Reason: {verification.rejectionReason}</p>
              )}
              <p className="mt-1 text-[11px] text-[#888888]">You can resubmit below.</p>
            </div>
          )}

          {(status === 'NOT_SUBMITTED' || status === 'REJECTED') && (
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="mb-1 text-lg font-black uppercase text-[#eeeeee]">Identity Verification</h2>
              <p className="mb-5 text-[11px] text-[#888888]">Required before making a reservation. Must be 20+ years old with a license older than 2 years.</p>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">Your Age *</p>
                    <input type="number" min={20} max={99} value={vAge} onChange={e => setVAge(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition" />
                    {vAge && parseInt(vAge) < 20 && <p className="mt-1 text-[9px] text-[#f87171]">Must be at least 20</p>}
                  </div>
                  <div>
                    <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">License Obtained Year *</p>
                    <input type="text" value={vLicenseYear} onChange={e => setVLicenseYear(e.target.value)}
                      placeholder="e.g. 2019"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#eeeeee] outline-none focus:border-[#fe7f32] transition" />
                    {vLicenseYear && (new Date().getFullYear() - parseInt(vLicenseYear)) < 2 && (
                      <p className="mt-1 text-[9px] text-[#f87171]">License must be 2+ years old</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[#888888]">License Photo *</p>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-6 cursor-pointer hover:border-[#fe7f32]/50 transition">
                    {vLicensePreview ? (
                      <img src={vLicensePreview} alt="License" className="h-32 rounded-lg object-cover" />
                    ) : (
                      <>
                        <span className="text-3xl">🪪</span>
                        <p className="text-xs text-[#888888]">Click to upload license photo</p>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const f = e.target.files?.[0] ?? null;
                      setVLicenseFile(f);
                      if (f) setVLicensePreview(URL.createObjectURL(f));
                    }} />
                  </label>
                </div>

                <button onClick={submitVerification} disabled={vSubmitting}
                  className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-widest text-white transition disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#fe7f32,#e06820)' }}>
                  {vSubmitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BookingForm vehicle={vehicle} vehicleId={vehicleId} />
    </Elements>
  );
}
