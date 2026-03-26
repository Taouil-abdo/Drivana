'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  PENDING:  'border-[#f3b85a]/30 bg-[#f3b85a]/10 text-[#f3b85a]',
  APPROVED: 'border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80]',
  REJECTED: 'border-[#f87171]/30 bg-[#f87171]/10 text-[#f87171]',
};

export default function AdminVerifications() {
  const { toasts, toast, remove } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [filter,        setFilter]        = useState('PENDING');
  const [loading,       setLoading]       = useState(true);
  const [preview,       setPreview]       = useState<string | null>(null);
  const [rejectModal,   setRejectModal]   = useState<{ id: string } | null>(null);
  const [rejectReason,  setRejectReason]  = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/verifications', { params: { status: filter || undefined } });
      setVerifications(res.data);
    } catch { toast('Failed to load verifications', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const approve = async (id: string) => {
    try {
      await apiClient.patch(`/admin/verifications/${id}/approve`);
      toast('Verification approved', 'success');
      load();
    } catch { toast('Failed to approve', 'error'); }
  };

  const reject = async () => {
    if (!rejectModal) return;
    try {
      await apiClient.patch(`/admin/verifications/${rejectModal.id}/reject`, { reason: rejectReason });
      toast('Verification rejected', 'success');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch { toast('Failed to reject', 'error'); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Client Verifications</h1>
          <p className="subtitle mt-1 text-sm">Review and approve client identity documents.</p>
        </div>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED', ''].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition
                ${filter === s ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#888888] hover:border-[#fe7f32]/30'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : verifications.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-[#888888]">No verifications found.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {verifications.map((v: any) => (
            <article key={v.id} className="glass-panel rounded-2xl overflow-hidden">
              {/* License photo */}
              <div className="relative h-40 bg-[#111111] cursor-pointer" onClick={() => setPreview(v.licensePhotoUrl)}>
                <img src={v.licensePhotoUrl} alt="License" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[9px] text-white">🔍 Click to enlarge</span>
              </div>

              <div className="p-4 space-y-3">
                {/* Client info */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-[#eeeeee]">{v.client?.firstName} {v.client?.lastName}</p>
                    <p className="text-[10px] text-[#888888]">{v.client?.email}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_STYLE[v.status]}`}>
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#888888]">Age</p>
                    <p className="font-bold text-[#eeeeee]">{v.age} years</p>
                  </div>
                  <div className="rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-widest text-[#888888]">License Since</p>
                    <p className="font-bold text-[#eeeeee]">{v.licenseYear} ({new Date().getFullYear() - parseInt(v.licenseYear)}y)</p>
                  </div>
                </div>

                <p className="text-[9px] text-[#888888]">
                  Submitted: {new Date(v.createdAt).toLocaleString()}
                </p>

                {v.rejectionReason && (
                  <p className="text-[10px] text-[#f87171]">Reason: {v.rejectionReason}</p>
                )}

                {v.status === 'PENDING' && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => approve(v.id)}
                      className="flex-1 rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10 py-2 text-[10px] font-bold uppercase tracking-widest text-[#4ade80] hover:bg-[#4ade80]/20 transition">
                      ✓ Approve
                    </button>
                    <button onClick={() => { setRejectModal({ id: v.id }); setRejectReason(''); }}
                      className="flex-1 rounded-xl border border-[#f87171]/30 bg-[#f87171]/10 py-2 text-[10px] font-bold uppercase tracking-widest text-[#f87171] hover:bg-[#f87171]/20 transition">
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* License photo preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="License" className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl" />
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6">
            <h3 className="mb-3 text-sm font-black uppercase text-[#eeeeee]">Rejection Reason</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. License photo is unclear, age requirement not met..."
              rows={3}
              className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2.5 text-xs text-[#eeeeee] outline-none focus:border-[#f87171] resize-none placeholder:text-[#555555]" />
            <div className="mt-3 flex gap-2">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 rounded-xl border border-[#3a3a3a] py-2 text-xs font-bold uppercase text-[#888888] hover:border-[#fe7f32]/30 transition">
                Cancel
              </button>
              <button onClick={reject}
                className="flex-1 rounded-xl border border-[#f87171]/40 bg-[#f87171]/15 py-2 text-xs font-bold uppercase text-[#f87171] hover:bg-[#f87171]/25 transition">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
