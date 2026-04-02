'use client';

import { useState, useMemo } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import { usePaginatedApi } from '@/lib/usePaginatedApi';
import Pagination from '@/components/admin/Pagination';
import SortTh from '@/components/admin/SortTh';
import ImageUpload from '@/components/admin/ImageUpload';
import { exportCsv } from '@/lib/exportCsv';

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE:   'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  RENTED:      'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  MAINTENANCE: 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
};
const STATUSES = ['AVAILABLE', 'RENTED', 'MAINTENANCE'];
const EMPTY = { brand: '', model: '', year: '', registration: '', pricePerDay: '', status: 'AVAILABLE', imageUrl: '', description: '' };
const LIMIT = 15;

export default function AdminVehicles() {
  const { toasts, toast, remove } = useToast();

  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [modal,   setModal]   = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form,    setForm]    = useState<any>(EMPTY);
  const [formErr, setFormErr] = useState('');
  const [saving,  setSaving]  = useState(false);

  const extraParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search)  p.search = search;
    if (statusF) p.status = statusF;
    return p;
  }, [search, statusF]);

  const { data: vehicles, total, totalPages, page, sortBy, sortDir, loading, goToPage, toggleSort, refresh } =
    usePaginatedApi<any>({ url: '/admin/vehicles', limit: LIMIT, initialSort: 'createdAt', extraParams });

  const openAdd  = () => { setForm(EMPTY); setFormErr(''); setEditing(null); setModal('add'); };
  const openEdit = (v: any) => {
    setForm({ brand: v.brand, model: v.model, year: String(v.year), registration: v.registration,
      pricePerDay: String(v.pricePerDay), status: v.status, imageUrl: v.imageUrl ?? '', description: v.description ?? '' });
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
        await apiClient.post('/admin/vehicles', payload);
        toast('Vehicle added', 'success');
      } else {
        await apiClient.patch(`/admin/vehicles/${editing.id}`, payload);
        toast('Vehicle updated', 'success');
      }
      setModal(null); refresh();
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? 'Failed to save vehicle.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/admin/vehicles/${id}`);
      toast('Vehicle deleted', 'success'); refresh();
    } catch { toast('Failed to delete vehicle', 'error'); }
    setConfirm(null);
  };

  const handleExport = () => {
    const rows = vehicles.map(v => ({
      ID:           v.id,
      Brand:        v.brand,
      Model:        v.model,
      Year:         v.year,
      Registration: v.registration,
      PricePerDay:  Number(v.pricePerDay).toFixed(2),
      Status:       v.status,
      Description:  v.description ?? '',
    }));
    exportCsv(`vehicles-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Fleet</h1>
          <p className="subtitle mt-1 text-sm">Add, edit or remove vehicles from the fleet.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="rounded-xl border border-[#3a3a3a] px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:border-[#fe7f32]/40 hover:text-[#fe7f32]"
            style={{ color: 'var(--text-soft)' }}>
            ↓ CSV
          </button>
          <button onClick={openAdd} className="rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
            + Add Vehicle
          </button>
        </div>
      </section>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brand, model, plate..."
          className="flex-1 min-w-[180px] rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
        <select value={statusF} onChange={e => setStatusF(e.target.value)}
          className="rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32]">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe7f32] border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="glass-panel scan-lines rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#3a3a3a]">
                  <SortTh col="brand"       label="Vehicle"   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <SortTh col="registration" label="Plate"    sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell" />
                  <SortTh col="year"        label="Year"      sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                  <SortTh col="pricePerDay" label="Price/Day" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                  <SortTh col="status"      label="Status"    sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-[#888888]">No vehicles found</td></tr>
                ) : vehicles.map((v: any) => (
                  <tr key={v.id} className="border-b border-[#3a3a3a]/40 transition" style={{ borderColor: 'var(--line-soft)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {v.imageUrl && (
                          <img src={v.imageUrl} alt={v.brand} className="h-9 w-14 rounded-lg object-cover border border-[#3a3a3a]" />
                        )}
                        <div>
                          <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{v.brand} {v.model}</p>
                          {v.description && <p className="text-[10px] truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>{v.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-soft)' }}>{v.registration}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-soft)' }}>{v.year}</td>
                    <td className="px-4 py-3 hidden md:table-cell font-semibold text-[#fe7f32]">${Number(v.pricePerDay).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[v.status] ?? ''}`}>{v.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirm === v.id ? (
                        <span className="inline-flex gap-1">
                          <button onClick={() => handleDelete(v.id)} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171] hover:bg-[#f87171]/30">Confirm</button>
                          <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#3a3a3a]/40 px-2 py-1 text-[10px] text-[#aaaaaa]">Cancel</button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-1">
                          <button onClick={() => openEdit(v)} className="rounded-lg border border-[#fe7f32]/30 bg-[#fe7f32]/10 px-2 py-1 text-[10px] text-[#fe7f32] hover:bg-[#fe7f32]/20">Edit</button>
                          <button onClick={() => setConfirm(v.id)} className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-2 py-1 text-[10px] text-[#ffc8cf] hover:bg-[#2a0e14]">Delete</button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPage={goToPage} />
        </>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest page-title">{modal === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}</h2>
              <button onClick={() => setModal(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Image upload */}
              <ImageUpload
                value={form.imageUrl}
                onChange={url => setForm((x: any) => ({ ...x, imageUrl: url }))}
                label="Vehicle Image"
              />

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'brand',        label: 'Brand',       placeholder: 'Toyota' },
                { key: 'model',        label: 'Model',       placeholder: 'Camry' },
                { key: 'year',         label: 'Year',        placeholder: '2023', type: 'number' },
                { key: 'registration', label: 'Plate',       placeholder: 'AB-1234' },
                { key: 'pricePerDay',  label: 'Price / Day', placeholder: '80', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                  <input type={f.type ?? 'text'} value={form[f.key]}
                    onChange={e => setForm((x: any) => ({ ...x, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Status</label>
                <select value={form.status} onChange={e => setForm((x: any) => ({ ...x, status: e.target.value }))}
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32]">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm((x: any) => ({ ...x, description: e.target.value }))} rows={2}
                  placeholder="Optional description..."
                  className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32] resize-none" />
              </div>
            </div>
            {formErr && <p className="mt-3 text-[11px] text-[#f87171]">{formErr}</p>}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 rounded-xl border border-[#3a3a3a] py-2.5 text-xs font-bold uppercase tracking-wider text-[#aaaaaa] hover:text-[#eeeeee] transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/15 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fe7f32] hover:bg-[#fe7f32]/25 transition disabled:opacity-50">
                {saving ? 'Saving...' : modal === 'add' ? 'Add Vehicle' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
