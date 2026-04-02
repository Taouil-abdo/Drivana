'use client';

import { useState, useMemo, useEffect } from 'react';
import apiClient from '@/lib/api';
import ToastContainer from '@/components/admin/Toast';
import { useToast } from '@/lib/useToast';
import { usePaginatedApi } from '@/lib/usePaginatedApi';
import Pagination from '@/components/admin/Pagination';
import SortTh from '@/components/admin/SortTh';

const STATUS_STYLE: Record<string, string> = {
  APPROVED:  'bg-[#fe7f32]/20 text-[#fe7f32] border-[#fe7f32]/30',
  PENDING:   'bg-[#f3b85a]/20 text-[#f3b85a] border-[#f3b85a]/30',
  REJECTED:  'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30',
  SUSPENDED: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30',
};

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'];
const LIMIT   = 15;

export default function AdminDrivers() {
  const { toasts, toast, remove } = useToast();
  const [filter,  setFilter]  = useState('ALL');
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [users,   setUsers]   = useState<any[]>([]);
  const [viewer,  setViewer]  = useState<{ type: string; url: string } | null>(null);
  const [addMode, setAddMode] = useState<'new' | 'existing'>('new');
  const [addForm, setAddForm] = useState({
    // new user fields
    firstName: '', lastName: '', email: '', phone: '', password: '',
    // existing user
    userId: '',
    // driver fields
    licenseNumber: '', experienceYears: '',
    licenseDocumentUrl: '', insuranceDocumentUrl: '', photo: '',
  });
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [licenseFile,  setLicenseFile]  = useState<File | null>(null);
  const [insFile,      setInsFile]      = useState<File | null>(null);
  const [photoPreview,   setPhotoPreview]   = useState('');
  const [licensePreview, setLicensePreview] = useState('');
  const [insPreview,     setInsPreview]     = useState('');
  const [addErr, setAddErr] = useState('');
  const [adding, setAdding] = useState(false);

  const extraParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (search)           p.search = search;
    if (filter !== 'ALL') p.status = filter;
    return p;
  }, [search, filter]);

  const { data: drivers, total, totalPages, page, sortBy, sortDir, loading, goToPage, toggleSort, refresh } =
    usePaginatedApi<any>({ url: '/admin/drivers', limit: LIMIT, initialSort: 'createdAt', extraParams });

  useEffect(() => {
    apiClient.get('/admin/users').then(res => {
      const driverUserIds = new Set(drivers.map((d: any) => d.user?.id));
      const all = res.data?.data ?? res.data ?? [];
      setUsers(all.filter((u: any) => !driverUserIds.has(u.id)));
    }).catch(() => {});
  }, [drivers]);

  const action = async (id: string, endpoint: string) => {
    try {
      if (endpoint === 'delete') {
        await apiClient.delete(`/admin/drivers/${id}`);
        toast('Driver removed', 'success');
      } else {
        await apiClient.patch(`/admin/drivers/${id}/${endpoint}`);
        toast(`Driver ${endpoint}d`, 'success');
      }
      refresh();
    } catch { toast(`Failed to ${endpoint} driver`, 'error'); }
    setConfirm(null);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
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

  const handleAdd = async () => {
    if (!addForm.licenseNumber || !addForm.experienceYears) {
      setAddErr('License number and experience are required.'); return;
    }
    if (addMode === 'existing' && !addForm.userId) {
      setAddErr('Please select a user.'); return;
    }
    if (addMode === 'new' && (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.password)) {
      setAddErr('First name, last name, email and password are required.'); return;
    }
    setAdding(true); setAddErr('');
    try {
      // Upload images if files selected
      let photoUrl      = addForm.photo;
      let licenseUrl    = addForm.licenseDocumentUrl;
      let insuranceUrl  = addForm.insuranceDocumentUrl;
      if (photoFile)   photoUrl     = await uploadToCloudinary(photoFile);
      if (licenseFile) licenseUrl   = await uploadToCloudinary(licenseFile);
      if (insFile)     insuranceUrl = await uploadToCloudinary(insFile);

      const payload: any = {
        licenseNumber:        addForm.licenseNumber,
        experienceYears:      Number(addForm.experienceYears),
        licenseDocumentUrl:   licenseUrl   || undefined,
        insuranceDocumentUrl: insuranceUrl || undefined,
        photo:                photoUrl     || undefined,
      };
      if (addMode === 'existing') {
        payload.userId = addForm.userId;
      } else {
        payload.firstName = addForm.firstName;
        payload.lastName  = addForm.lastName;
        payload.email     = addForm.email;
        payload.phone     = addForm.phone || undefined;
        payload.password  = addForm.password;
      }

      await apiClient.post('/admin/drivers', payload);
      setShowAdd(false);
      setAddForm({ firstName: '', lastName: '', email: '', phone: '', password: '', userId: '', licenseNumber: '', experienceYears: '', licenseDocumentUrl: '', insuranceDocumentUrl: '', photo: '' });
      setPhotoFile(null); setLicenseFile(null); setInsFile(null);
      setPhotoPreview(''); setLicensePreview(''); setInsPreview('');
      toast('Driver added successfully', 'success');
      refresh();
    } catch (e: any) {
      setAddErr(e?.response?.data?.message ?? 'Failed to add driver.');
    } finally { setAdding(false); }
  };

  return (
    <>
      <ToastContainer toasts={toasts} remove={remove} />

      <section className="glass-panel scan-lines fade-rise mb-4 rounded-2xl p-4 sm:p-5 flex items-start justify-between">
        <div>
          <p className="section-label text-[10px] uppercase tracking-[0.24em]">Admin Control Center</p>
          <h1 className="page-title mt-1 text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">Drivers</h1>
          <p className="subtitle mt-1 text-sm">Add, approve, suspend or remove drivers.</p>
        </div>
        <button onClick={() => { setShowAdd(true); setAddErr(''); }}
          className="rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#fe7f32] hover:bg-[#fe7f32]/20 transition">
          + Add Driver
        </button>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition
              ${filter === f ? 'border-[#fe7f32]/50 bg-[#fe7f32]/15 text-[#fe7f32]' : 'border-[#3a3a3a] text-[#aaaaaa] hover:text-[#eeeeee]'}`}>
            {f}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="ml-auto rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-1.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
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
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Driver</th>
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>License</th>
                  <SortTh col="experienceYears" label="Exp."   sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                  <SortTh col="rating"          label="Rating" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                  <th className="px-4 py-3 text-left text-[9px] uppercase tracking-[0.12em] hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Documents</th>
                  <SortTh col="status" label="Status" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <th className="px-4 py-3 text-right text-[9px] uppercase tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-[#888888]">No drivers found</td></tr>
                ) : drivers.map((d: any) => (
                  <tr key={d.id} className="border-b transition" style={{ borderColor: 'var(--line-soft)' }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{d.user?.firstName} {d.user?.lastName}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell" style={{ color: 'var(--text-soft)' }}>{d.licenseNumber}</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-soft)' }}>{d.experienceYears} yrs</td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-soft)' }}>{Number(d.rating ?? 0).toFixed(1)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {d.photo && <button onClick={() => setViewer({ type: 'Photo', url: d.photo })} className="rounded-full border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-2 py-0.5 text-[9px] uppercase text-[#fe7f32]">Photo</button>}
                        {d.licenseDocumentUrl && <button onClick={() => setViewer({ type: 'License', url: d.licenseDocumentUrl })} className="rounded-full border border-[#f3b85a]/40 bg-[#f3b85a]/10 px-2 py-0.5 text-[9px] uppercase text-[#f3b85a]">License</button>}
                        {d.insuranceDocumentUrl && <button onClick={() => setViewer({ type: 'Insurance', url: d.insuranceDocumentUrl })} className="rounded-full border border-[#a78bfa]/40 bg-[#a78bfa]/10 px-2 py-0.5 text-[9px] uppercase text-[#a78bfa]">Insurance</button>}
                        {!d.photo && !d.licenseDocumentUrl && !d.insuranceDocumentUrl && <span className="text-[10px] text-[#888888]">No docs</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[d.status] ?? ''}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirm === d.id ? (
                        <span className="inline-flex gap-1">
                          <button onClick={() => action(d.id, 'delete')} className="rounded-lg bg-[#f87171]/20 px-2 py-1 text-[10px] text-[#f87171]">Confirm</button>
                          <button onClick={() => setConfirm(null)} className="rounded-lg bg-[#3a3a3a]/40 px-2 py-1 text-[10px] text-[#aaaaaa]">Cancel</button>
                        </span>
                      ) : (
                        <span className="inline-flex gap-1 flex-wrap justify-end">
                          {d.status === 'PENDING'   && <button onClick={() => action(d.id, 'approve')} className="rounded-lg border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-2 py-1 text-[10px] text-[#fe7f32]">Approve</button>}
                          {d.status === 'PENDING'   && <button onClick={() => action(d.id, 'reject')}  className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-2 py-1 text-[10px] text-[#f87171]">Reject</button>}
                          {d.status === 'APPROVED'  && <button onClick={() => action(d.id, 'suspend')} className="rounded-lg border border-[#a78bfa]/40 bg-[#a78bfa]/10 px-2 py-1 text-[10px] text-[#a78bfa]">Suspend</button>}
                          {d.status === 'SUSPENDED' && <button onClick={() => action(d.id, 'approve')} className="rounded-lg border border-[#fe7f32]/40 bg-[#fe7f32]/10 px-2 py-1 text-[10px] text-[#fe7f32]">Restore</button>}
                          <button onClick={() => setConfirm(d.id)} className="rounded-lg border border-[#7c3d45] bg-[#1a080c] px-2 py-1 text-[10px] text-[#ffc8cf]">Remove</button>
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

      {/* Add Driver Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest page-title">Add Driver</h2>
              <button onClick={() => setShowAdd(false)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>

            {/* Mode toggle */}
            <div className="mb-4 flex rounded-xl border border-[#3a3a3a] overflow-hidden">
              {(['new', 'existing'] as const).map(m => (
                <button key={m} onClick={() => setAddMode(m)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition
                    ${addMode === m ? 'bg-[#fe7f32]/20 text-[#fe7f32]' : 'text-[#888888] hover:text-[#eeeeee]'}`}>
                  {m === 'new' ? '+ New User' : 'Existing User'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {addMode === 'new' ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: 'firstName', label: 'First Name', placeholder: 'John' },
                      { key: 'lastName',  label: 'Last Name',  placeholder: 'Doe' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{f.label} *</label>
                        <input value={(addForm as any)[f.key]} onChange={e => setAddForm(x => ({ ...x, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Email *</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm(x => ({ ...x, email: e.target.value }))}
                      placeholder="driver@example.com"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Phone</label>
                      <input value={addForm.phone} onChange={e => setAddForm(x => ({ ...x, phone: e.target.value }))}
                        placeholder="+212600000000"
                        className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Password *</label>
                      <input type="password" value={addForm.password} onChange={e => setAddForm(x => ({ ...x, password: e.target.value }))}
                        placeholder="min 6 chars"
                        className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Select Existing User *</label>
                  <select value={addForm.userId} onChange={e => setAddForm(f => ({ ...f, userId: e.target.value }))}
                    className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] outline-none focus:border-[#fe7f32]">
                    <option value="">— choose a user —</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>)}
                  </select>
                </div>
              )}

              <div className="border-t border-[#3a3a3a] pt-3">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#fe7f32]">Driver Details</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>License Number *</label>
                    <input value={addForm.licenseNumber} onChange={e => setAddForm(x => ({ ...x, licenseNumber: e.target.value }))}
                      placeholder="DL-123456"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Years of Experience *</label>
                    <input type="number" min={0} value={addForm.experienceYears} onChange={e => setAddForm(x => ({ ...x, experienceYears: e.target.value }))}
                      placeholder="5"
                      className="w-full rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#eeeeee] placeholder-[#888888] outline-none focus:border-[#fe7f32]" />
                  </div>
                </div>
              </div>

              {/* Photo uploads */}
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Profile Photo', preview: photoPreview, onChange: (f: File) => { setPhotoFile(f); setPhotoPreview(URL.createObjectURL(f)); } },
                  { label: 'License Doc',   preview: licensePreview, onChange: (f: File) => { setLicenseFile(f); setLicensePreview(URL.createObjectURL(f)); } },
                  { label: 'Insurance Doc', preview: insPreview, onChange: (f: File) => { setInsFile(f); setInsPreview(URL.createObjectURL(f)); } },
                ].map(u => (
                  <div key={u.label}>
                    <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{u.label}</label>
                    <label className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#3a3a3a] bg-[#1a1a1a] p-3 cursor-pointer hover:border-[#fe7f32]/50 transition" style={{ minHeight: 72 }}>
                      {u.preview ? (
                        <img src={u.preview} alt={u.label} className="h-12 w-full rounded-lg object-cover" />
                      ) : (
                        <><span className="text-xl">📎</span><p className="text-[9px] text-[#888888]">Upload</p></>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) u.onChange(f); }} />
                    </label>
                  </div>
                ))}
              </div>

              {addErr && <p className="text-[11px] text-[#f87171]">{addErr}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-[#3a3a3a] py-2.5 text-xs font-bold uppercase tracking-wider text-[#aaaaaa] hover:text-[#eeeeee] transition">Cancel</button>
                <button onClick={handleAdd} disabled={adding}
                  className="flex-1 rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/15 py-2.5 text-xs font-bold uppercase tracking-wider text-[#fe7f32] hover:bg-[#fe7f32]/25 transition disabled:opacity-50">
                  {adding ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest page-title">{viewer.type}</h2>
              <button onClick={() => setViewer(null)} style={{ color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[#3a3a3a] bg-[#1c1c1c] p-3">
              {/\.(png|jpe?g|webp|gif)$/i.test(viewer.url) ? (
                <img src={viewer.url} alt={viewer.type} className="mx-auto max-h-[60vh] w-auto rounded-lg object-contain" />
              ) : (
                <div className="space-y-3 text-center py-6">
                  <p className="text-sm text-[#eeeeee]">Preview not available.</p>
                  <a href={viewer.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-[#fe7f32]/40 bg-[#fe7f32]/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#fe7f32] hover:bg-[#fe7f32]/25">
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
