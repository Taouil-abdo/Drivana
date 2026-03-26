'use client';

import { useRef, useState } from 'react';
import { useCloudinaryUpload } from '@/lib/useCloudinaryUpload';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Image' }: Props) {
  const { upload, uploading, progress } = useCloudinaryUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Only image files allowed.'); return; }
    if (file.size > 5 * 1024 * 1024)    { setError('Max file size is 5MB.');       return; }
    setError('');
    try {
      const url = await upload(file);
      onChange(url);
    } catch {
      setError('Upload failed. Check your Cloudinary config.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="col-span-2">
      <label className="mb-1 block text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>

      {/* Preview */}
      {value && (
        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl border" style={{ borderColor: 'var(--line-soft)' }}>
          <img src={value} alt="preview" className="h-full w-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] text-white hover:bg-black/80"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition"
        style={{
          borderColor: dragOver ? '#fe7f32' : 'var(--line-soft)',
          background:  dragOver ? 'rgba(254,127,50,0.05)' : 'transparent',
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 w-full px-6">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#3a3a3a]">
              <div className="h-full rounded-full bg-[#fe7f32] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Uploading {progress}%...</p>
          </div>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fe7f32" strokeWidth={1.5} className="h-8 w-8 opacity-60">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-[11px] font-semibold" style={{ color: 'var(--text-soft)' }}>
              Drop image here or <span className="text-[#fe7f32]">click to browse</span>
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PNG, JPG, WEBP — max 5MB</p>
          </>
        )}
      </div>

      {/* URL fallback input */}
      <div className="mt-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Or paste an image URL..."
          className="w-full rounded-xl border px-3 py-2 text-xs outline-none transition"
          style={{
            borderColor: 'var(--line-soft)',
            background:  'var(--bg-soft)',
            color:       'var(--text-main)',
          }}
        />
      </div>

      {error && <p className="mt-1 text-[11px] text-[#f87171]">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
    </div>
  );
}
