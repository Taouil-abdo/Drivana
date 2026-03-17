'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';

const STATUS_STYLE: Record<string, string> = {
  APPROVED:  'bg-[#42d99a]/20 text-[#42d99a] border-[#42d99a]/30',
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  REJECTED:  'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
  SUSPENDED: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30',
};

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];

export default function AdminDrivers() {
  const { toasts, toast, remove } = useToast();

  const [drivers,  setDrivers]  = useState<any[]>([]);
  const [users,    setUsers]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('ALL');
  const [search,   setSearch]   = useState('');
  const [confirm,  setConfirm]  = useState<string | null>(null);
  const [showAdd,  setShowAdd]  = useState(false);
  const [addForm,  setAddForm]  = useState({
    userId: '',
    licenseNumber: '',
    experienceYears: '',
    licenseDocumentUrl: '',
    insuranceDocumentUrl: '',
    photo: '',
  });
  const [addErr,   setAddErr]   = useState('');
  const [adding,   setAdding]   = useState(false);
  const [viewer,   setViewer]   = useState<{ type: 'photo' | 'license' | 'insurance'; url: string } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [d, u] = await Promise.all([
        apiClient.get('/admin/drivers'),
        apiClient.get('/admin/users'),
      ]);
      setDrivers(d.data ?? []);
      const driverUserIds = new Set((d.data ?? []).map((x: any) => x.user?.id));
      setUsers((u.data ?? []).filter((x: any) => !driverUserIds.has(x.id)));
    } catch { toast('Failed to load drivers', 'error'); }
    finally { setLoading(false); }
  };

  const action = async (id: string, endpoint: string, newStatus?: string) => {
    try {
      if (endpoint === 'delete') {
        await apiClient.delete(`/admin/drivers/${id}`);
        setDrivers(d => d.filter(x => x.id !== id));
        toast('Driver removed', 'success');
      } else {
        await apiClient.patch(`/admin/drivers/${id}/${endpoint}`);
        if (newStatus) setDrivers(d => d.map(x => x.id === id ? { ...x, status: newStatus } : x));
        toast(`Driver ${endpoint}d`, 'success');
      }
    } catch { toast(`Failed to ${endpoint} driver`, 'error'); }
    setConfirm(null);
  };

  const handleAdd = async () => {
    if (!addForm.userId || !addForm.licenseNumber || !addForm.experienceYears) {
      setAddErr('All fields are required.'); return;
    }
    setAdding(true); setAddErr('');
    try {
      await apiClient.post('/admin/drivers', {
        userId: addForm.userId,
        licenseNumber: addForm.licenseNumber,
        experienceYears: Number(addForm.experienceYears),
        licenseDocumentUrl: addForm.licenseDocumentUrl || undefined,
        insuranceDocumentUrl: addForm.insuranceDocumentUrl || undefined,
        photo: addForm.photo || undefined,
      });
      setShowAdd(false);
      setAddForm({
        userId: '',
        licenseNumber: '',
        experienceYears: '',
        licenseDocumentUrl: '',
        insuranceDocumentUrl: '',
        photo: '',
      });
      toast('Driver added successfully', 'success');
      await fetchAll();
    } catch (e: any) {
      setAddErr(e?.response?.data?.message ?? 'Failed to add driver.');
    } finally { setAdding(false); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'ALL' ? drivers.length : drivers.filter(d => d.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const visible = drivers.filter(d => {
    const matchFilter = filter === 'ALL' || d.status === filter;
    const matchSearch = !search ||
      `${d.user?.firstName} ${d.user?.lastName} ${d.user?.email} ${d.licenseNumber}`
        .toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Admin Control Center</p>
          <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Drivers</h1>
          <p className="mt-1 text-sm text-[#9cc1d1]">Add, approve, suspend or remove drivers.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddErr(''); }}
          className="rounded-xl border border-[#2ec5f5]/40 bg-[#2ec5f5]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#2ec5f5] hover:bg-[#2ec5f5]/20 transition"
        >
          + Add Driver
        </button>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f ? 'border-[#2ec5f5]/50 bg-[#2ec5f5]/15 text-[#2ec5f5]' : 'border-[#1e5670] text-[#7ea8bc] hover:text-[#c8f2ff]'}`}
          >
            {f} <span className="ml-1 opacity-70">{counts[f]}</span>
          </button>
        ))}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="ml-auto rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-1.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
        />
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#2ec5f5] border-t-transparent" />
        </div>
      ) : (
        <div className="glass-panel scan-lines rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1e5670] text-[#4a8fa8] uppercase tracking-[0.12em]">
                <th className="px-4 py-3 text-left">Driver</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">License</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Exp.</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Rating</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Documents</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-[#4a8fa8]">No drivers found</td></tr>
              ) : visible.map((d: any) => (
                <tr key={d.id} className="border-b border-[#0d2e42] hover:bg-[#0a2233]/60 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#ddf8ff]">{d.user?.firstName} {d.user?.lastName}</p>
                    <p className="text-[10px] text-[#7ea8bc]">{d.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-[#c8f2ff] hidden sm:table-cell">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-[#c8f2ff] hidden md:table-cell">{d.experienceYears} yrs</td>
                  <td className="px-4 py-3 text-[#c8f2ff] hidden md:table-cell">{d.rating ?? 0}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {d.photo && (
                        <button
                          type="button"
                          onClick={() => setViewer({ type: 'photo', url: d.photo })}
                          className="rounded-full border border-[#2ec5f5]/40 bg-[#2ec5f5]/10 px-2 py-0.5 text-[9px] uppercase text-[#2ec5f5] hover:bg-[#2ec5f5]/20"
                        >
                          Photo
                        </button>
                      )}
                      {d.licenseDocumentUrl && (
                        <button
                          type="button"
                          onClick={() => setViewer({ type: 'license', url: d.licenseDocumentUrl })}
                          className="rounded-full border border-[#f3b85a]/40 bg-[#f3b85a]/10 px-2 py-0.5 text-[9px] uppercase text-[#f3b85a] hover:bg-[#f3b85a]/20"
                        >
                          License
                        </button>
                      )}
                      {d.insuranceDocumentUrl && (
                        <button
                          type="button"
                          onClick={() => setViewer({ type: 'insurance', url: d.insuranceDocumentUrl })}
                          className="rounded-full border border-[#a78bfa]/40 bg-[#a78bfa]/10 px-2 py-0.5 text-[9px] uppercase text-[#a78bfa] hover:bg-[#a78bfa]/20"
                        >
                          Insurance
                        </button>
                      )}
                      {!d.photo && !d.licenseDocumentUrl && !d.insuranceDocumentUrl && (
                        <span className="text-[10px] text-[#4a8fa8]">No docs</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[d.status] ?? ''}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirm === d.id ? (
                      <span className="inline-flex gap-1">
                        <button onClick={() => action(d.id, 'delete')} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/30">Confirm</button>
                        <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#1e5670]/40 px-2 py-1 text-[10px] text-[#7ea8bc]">Cancel</button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-1 flex-wrap justify-end">
                        {d.status === 'PENDING'   && <button onClick={() => action(d.id, 'approve', 'APPROVED')} className="rounded-lg border border-[#42d99a]/40 bg-[#42d99a]/10 px-2 py-1 text-[10px] text-[#42d99a] hover:bg-[#42d99a]/20">Approve</button>}
                        {d.status === 'PENDING'   && <button onClick={() => action(d.id, 'reject',  'REJECTED')} className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/20">Reject</button>}
                        {d.status === 'APPROVED'  && <button onClick={() => action(d.id, 'suspend', 'SUSPENDED')} className="rounded-lg border border-[#a78bfa]/40 bg-[#a78bfa]/10 px-2 py-1 text-[10px] text-[#a78bfa] hover:bg-[#a78bfa]/20">Suspend</button>}
                        {d.status === 'SUSPENDED' && <button onClick={() => action(d.id, 'approve', 'APPROVED')} className="rounded-lg border border-[#42d99a]/40 bg-[#42d99a]/10 px-2 py-1 text-[10px] text-[#42d99a] hover:bg-[#42d99a]/20">Restore</button>}
                        <button onClick={() => setConfirm(d.id)} className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-2 py-1 text-[10px] text-[#ffc8cf] hover:bg-[#2a0e14]">Remove</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">Add Driver</h2>
              <button onClick={() => setShowAdd(false)} className="text-[#4a8fa8] hover:text-[#c8f2ff]">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Select User</label>
                <select value={addForm.userId} onChange={e => setAddForm(f => ({ ...f, userId: e.target.value }))}
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] outline-none focus:border-[#2ec5f5]">
                  <option value="">— choose a user —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">License Number</label>
                <input value={addForm.licenseNumber} onChange={e => setAddForm(f => ({ ...f, licenseNumber: e.target.value }))}
                  placeholder="e.g. DL-123456"
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Years of Experience</label>
                <input type="number" min="0" value={addForm.experienceYears} onChange={e => setAddForm(f => ({ ...f, experienceYears: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">License Document URL</label>
                <input
                  value={addForm.licenseDocumentUrl}
                  onChange={e => setAddForm(f => ({ ...f, licenseDocumentUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Insurance Document URL</label>
                <input
                  value={addForm.insuranceDocumentUrl}
                  onChange={e => setAddForm(f => ({ ...f, insuranceDocumentUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Profile Photo URL</label>
                <input
                  value={addForm.photo}
                  onChange={e => setAddForm(f => ({ ...f, photo: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
                />
              </div>
              {addErr && <p className="text-[11px] text-[#f87171]">{addErr}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-[#1e5670] py-2.5 text-xs font-bold uppercase tracking-wider text-[#7ea8bc] hover:text-[#c8f2ff] transition">Cancel</button>
                <button onClick={handleAdd} disabled={adding} className="flex-1 rounded-xl border border-[#2ec5f5]/40 bg-[#2ec5f5]/15 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2ec5f5] hover:bg-[#2ec5f5]/25 transition disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">
                {viewer.type === 'photo' ? 'Driver Photo' : viewer.type === 'license' ? 'License Document' : 'Insurance Document'}
              </h2>
              <button onClick={() => setViewer(null)} className="text-[#4a8fa8] hover:text-[#c8f2ff]">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[#1e5670] bg-[#051a28] p-3">
              {/\.(png|jpe?g|webp|gif)$/i.test(viewer.url) ? (
                <img
                  src={viewer.url}
                  alt={viewer.type}
                  className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain"
                />
              ) : (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-[#c8f2ff]">Preview not available. Open the document in a new tab.</p>
                  <a
                    href={viewer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-[#2ec5f5]/40 bg-[#2ec5f5]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#2ec5f5] hover:bg-[#2ec5f5]/25"
                  >
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
