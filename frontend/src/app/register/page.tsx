'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await apiClient.post('/auth/register', formData);
      setAuth(data.user, data.token);
      if(data.user.role === 'DRIVER'){
        router.push('/driver/dashboard');
      }else{
        router.push('/client/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6">
      <main className="mx-auto w-full max-w-[1120px]">
        <section className="glass-panel scan-lines overflow-hidden rounded-3xl p-4 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.98fr_1.02fr]">
            <article
              className="rounded-2xl border border-[#1f5f79] p-6 sm:p-8"
              style={{
                backgroundImage:
                  'linear-gradient(130deg, rgba(5,16,24,0.9), rgba(5,16,24,0.45)), url(https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#aaaaaa]">Create Account</p>
              <h1 className="mt-3 text-3xl font-black uppercase leading-[0.9] tracking-tight text-[#f5f5f5] sm:text-5xl">
                Join Drivana
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[#bbbbbb] sm:text-base">
                Build your profile in seconds and unlock instant access to premium vehicles, driver services, and trip management.
              </p>
              <div className="mt-7 grid gap-3 text-[11px] uppercase tracking-[0.16em] text-[#aaaaaa]">
                <span className="rounded-full border border-[#444444] px-3 py-1 text-center">Fast Registration</span>
                <span className="rounded-full border border-[#444444] px-3 py-1 text-center">Secure Authentication</span>
                <span className="rounded-full border border-[#444444] px-3 py-1 text-center">Client and Driver Roles</span>
              </div>
            </article>

            <article className="glass-panel rounded-2xl p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-[#1a5069]/70 pb-4">
                <h2 className="text-xl font-bold uppercase tracking-[0.08em] text-[#eeeeee]">Register</h2>
                <Link href="/" className="text-xs uppercase tracking-[0.14em] text-[#aaaaaa] hover:text-[#eeeeee]">
                  Home
                </Link>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-[#924343] bg-[#2a0f14] px-4 py-3 text-sm text-[#ffb2b2]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-[#aaaaaa]">First Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-[#444444] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#777777] focus:border-[#fe7f32]"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-[#aaaaaa]">Last Name</label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-[#444444] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#777777] focus:border-[#fe7f32]"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-[#aaaaaa]">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-[#444444] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#777777] focus:border-[#fe7f32]"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-[#aaaaaa]">Phone</label>
                    <input
                      type="tel"
                      className="w-full rounded-lg border border-[#444444] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#777777] focus:border-[#fe7f32]"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.15em] text-[#aaaaaa]">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-[#444444] bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#eeeeee] outline-none placeholder:text-[#777777] focus:border-[#fe7f32]"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#fe7f32] py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-[#111111] transition hover:bg-[#59d9ff] disabled:cursor-not-allowed disabled:bg-[#555555] disabled:text-[#8db4c6]"
                >
                  {loading ? 'Loading...' : 'Register'}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-[#bbbbbb]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#c9f3ff] underline underline-offset-4 hover:text-white">
                  Login
                </Link>
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
