'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import apiClient from '@/lib/api';

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE:   'bg-[#42d99a]/20 text-[#42d99a] border-[#42d99a]/30',
  RENTED:      'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  MAINTENANCE: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};

const STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE'];
const EMPTY = { brand: '', model: '', year: '', registration: '', pricePerDay: '', status: 'AVAILABLE', imageUrl: '', description: '' };

export default function AdminVehicles() {
  const { user } = useAuthStore();
  const router   = useRouter();

  const [mounted,  setMounted]  = useState(false);
  const [sidebar,  setSidebar]  = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [confirm,  setConfirm]  = useState<string | null>(null);
  const [modal,    setModal]    = useState<'add' | 'edit' | null>(null);
  const [editing,  setEditing]  = useState<any>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const [formErr,  setFormErr]  = useState('');
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user)                 { router.push('/login');     return; }
    if (user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    fetchVehicles();
  }, [mounted, user]);

  const fetchVehicles = async () => {
    try {
      const res = await apiClient.get('/admin/vehicles');
      setVehicles(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setForm(EMPTY); setFormErr(''); setEditing(null); setModal('add');
  };

  const openEdit = (v: any) => {
    setForm({
      brand: v.brand, model: v.model, year: String(v.year),
      registration: v.registration, pricePerDay: String(v.pricePerDay),
      status: v.status, imageUrl: v.imageUrl ?? '', description: v.description ?? '',
    });
    setFormErr(''); setEditing(v); setModal('edit');
  };

  const handleSave = async () => {
    if (!form.brand || !form.model || !form.year || !form.registration || !form.pricePerDay) {
      setFormErr('Brand, model, year, registration and price are required.'); return;
    }
    setSaving(true); setFormErr('');
    const payload = { ...form, year: Number(form.year), pricePerDay: Number(form.pricePerDay) };
    try {
      if (modal === 'add') {
        const res = await apiClient.post('/admin/vehicles', payload);
        setVehicles(v => [res.data, ...v]);
      } else {
        const res = await apiClient.patch(`/admin/vehicles/${editing.id}`, payload);
        setVehicles(v => v.map(x => x.id === editing.id ? res.data : x));
      }
      setModal(null);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? 'Failed to save vehicle.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/vehicles/${id}`);
      setVehicles(v => v.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
    setConfirm(null);
  };

  if (!mounted || !user || user.role !== 'ADMIN') return null;

  const visible = vehicles.filter(v =>
    (!statusF || v.status === statusF) &&
    (!search  || `${v.brand} ${v.model} ${v.registration}`.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen">
      <AdminSidebar isOpen={sidebar} onClose={() => setSidebar(false)} />

      <div className="flex-1 overflow-x-hidden px-3 py-4 sm:px-5">

        {/* Mobile topbar */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#1f5972] bg-[#051a28]/80 p-3 xl:hidden">
          <button onClick={() => setSidebar(true)} className="glass-panel rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#c8f2ff]">Menu</button>
          <p className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">Admin</p>
          <span className="text-xs text-[#4a8fa8]">Panel</span>
        </div>

        {/* Header */}
        <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#79afc5]">Admin Control Center</p>
            <h1 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight text-[#e8fbff] sm:text-3xl">Fleet</h1>
            <p className="mt-1 text-sm text-[#9cc1d1]">Add, edit or remove vehicles from the fleet.</p>
          </div>
          <button
            onClick={openAdd}
            className="rounded-xl border border-[#2ec5f5]/40 bg-[#2ec5f5]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#2ec5f5] hover:bg-[#2ec5f5]/20 transition"
          >
            + Add Vehicle
          </button>
        </section>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search brand, model, plate..."
            className="flex-1 min-w-[180px] rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
          />
          <select
            value={statusF}
            onChange={e => setStatusF(e.target.value)}
            className="rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2 text-xs text-[#c8f2ff] outline-none focus:border-[#2ec5f5]"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {STATUSES.map(s => (
            <div key={s} className="glass-panel rounded-2xl p-3 text-center">
              <p className="text-lg font-black text-[#e4f9ff]">{vehicles.filter(v => v.status === s).length}</p>
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#7eaec4]">{s}</p>
            </div>
          ))}
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
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Plate</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Year</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Price/Day</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#4a8fa8]">No vehicles found</td></tr>
                ) : visible.map((v: any) => (
                  <tr key={v.id} className="border-b border-[#0d2e42] hover:bg-[#0a2233]/60 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#ddf8ff]">{v.brand} {v.model}</p>
                      {v.description && <p className="text-[10px] text-[#7ea8bc] truncate max-w-[160px]">{v.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-[#c8f2ff] hidden sm:table-cell">{v.registration}</td>
                    <td className="px-4 py-3 text-[#c8f2ff] hidden md:table-cell">{v.year}</td>
                    <td className="px-4 py-3 text-[#c8f2ff] hidden md:table-cell">${Number(v.pricePerDay).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[v.status] ?? ''}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirm === v.id ? (
                        <span className="inline-flex gap-1">
                          <button onClick={() => handleDelete(v.id)} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/30">Confirm</button>
                          <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#1e5670]/40 px-2 py-1 text-[10px] text-[#7ea8bc]">Cancel</button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-1">
                          <button onClick={() => openEdit(v)} className="rounded-lg border border-[#2ec5f5]/30 bg-[#2ec5f5]/10 px-2 py-1 text-[10px] text-[#2ec5f5] hover:bg-[#2ec5f5]/20">Edit</button>
                          <button onClick={() => setConfirm(v.id)} className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-2 py-1 text-[10px] text-[#ffc8cf] hover:bg-[#2a0e14]">Delete</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#e8fbff]">
                {modal === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}
              </h2>
              <button onClick={() => setModal(null)} className="text-[#4a8fa8] hover:text-[#c8f2ff]">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'brand',        label: 'Brand',        placeholder: 'Toyota' },
                { key: 'model',        label: 'Model',        placeholder: 'Camry' },
                { key: 'year',         label: 'Year',         placeholder: '2023', type: 'number' },
                { key: 'registration', label: 'Plate',        placeholder: 'AB-1234' },
                { key: 'pricePerDay',  label: 'Price / Day',  placeholder: '80', type: 'number' },
              ].map(f => (
                <div key={f.key} className={f.key === 'brand' || f.key === 'registration' ? 'col-span-2 sm:col-span-1' : ''}>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">{f.label}</label>
                  <input
                    type={f.type ?? 'text'}
                    value={form[f.key]}
                    onChange={e => setForm((x: any) => ({ ...x, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm((x: any) => ({ ...x, status: e.target.value }))}
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] outline-none focus:border-[#2ec5f5]"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={e => setForm((x: any) => ({ ...x, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5]"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-widest text-[#4a8fa8]">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm((x: any) => ({ ...x, description: e.target.value }))}
                  rows={2}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-[#1e5670] bg-[#051a28] px-3 py-2.5 text-xs text-[#c8f2ff] placeholder-[#4a8fa8] outline-none focus:border-[#2ec5f5] resize-none"
                />
              </div>
            </div>

            {formErr && <p className="mt-3 text-[11px] text-[#f87171]">{formErr}</p>}

            <div className="mt-4 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-[#1e5670] py-2.5 text-xs font-bold uppercase tracking-wider text-[#7ea8bc] hover:text-[#c8f2ff] transition">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl border border-[#2ec5f5]/40 bg-[#2ec5f5]/15 py-2.5 text-xs font-bold uppercase tracking-wider text-[#2ec5f5] hover:bg-[#2ec5f5]/25 transition disabled:opacity-50">
                {saving ? 'Saving...' : modal === 'add' ? 'Add Vehicle' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
