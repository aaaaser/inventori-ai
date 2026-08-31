'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';

const DEV_ACCOUNTS = [
  { label: 'Super Admin', user: 'superadmin', pass: 'SuperAdmin123!', role: 'SUPER_ADMIN' },
  { label: 'Operator', user: 'operator', pass: 'Operator123!', role: 'OPERATOR' },
  { label: 'Kepala Sekolah', user: 'kepsek', pass: 'Kepsek123!', role: 'KEPALA_SEKOLAH' },
  { label: 'Waka Sarpras', user: 'sarpras', pass: 'Sarpras123!', role: 'WAKA_SARPRAS' },
  { label: 'Kakom RPL', user: 'kakom.rpl', pass: 'KakomRPL123!', role: 'KAKOM (RPL)' },
  { label: 'Kakom ATPH', user: 'kakom.atph', pass: 'KakomATPH123!', role: 'KAKOM (ATPH)' },
  { label: 'Kakom TBSM', user: 'kakom.tbsm', pass: 'KakomTBSM123!', role: 'KAKOM (TBSM)' },
  { label: 'Laboran RPL', user: 'laboran.rpl', pass: 'LaboranRPL123!', role: 'LABORAN (RPL)' },
  { label: 'Laboran ATPH', user: 'laboran.atph', pass: 'LaboranATPH123!', role: 'LABORAN (ATPH)' },
  { label: 'Laboran TBSM', user: 'laboran.tbsm', pass: 'LaboranTBSM123!', role: 'LABORAN (TBSM)' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('superadmin');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Username atau Email wajib diisi');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Password wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(identifier, password);
      if (res.success) {
        showToast('Login berhasil! Selamat datang.', 'success');
        router.push('/dashboard');
      } else {
        setErrorMessage(res.message || 'Login gagal');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectDevAccount = (acc: (typeof DEV_ACCOUNTS)[0]) => {
    setIdentifier(acc.user);
    setPassword(acc.pass);
    setErrorMessage('');
    showToast(`Akun ${acc.label} dipilih`, 'info');
  };

  return (
    <div className="py-6 sm:py-10 flex flex-col items-center justify-center min-h-[75vh]">
      {/* Back button to landing */}
      <div className="w-full max-w-sm mb-4">
        <Link
          id="btn-back-landing"
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-md p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-bold font-mono text-neutral-950 dark:text-white tracking-tight">
              SISTEM INVENTARIS SEKOLAH
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Masuk untuk mengelola aset dan peminjaman
            </p>
          </div>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-sm text-xs text-red-600 dark:text-red-400 font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <Input
                id="input-identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="superadmin atau superadmin@local.test"
                className="pl-9 text-xs"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Input
                id="input-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 text-xs"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <Button
            id="btn-login-submit"
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Masuk ke Aplikasi
          </Button>
        </form>

        {/* Development Quick Role Switcher */}
        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
            <span>Pilih Cepat Akun Development:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
            {DEV_ACCOUNTS.map((acc) => (
              <button
                key={acc.user}
                type="button"
                onClick={() => selectDevAccount(acc)}
                className={`px-2 py-1.5 text-[10px] font-medium rounded-sm border text-left truncate transition-colors cursor-pointer ${
                  identifier === acc.user
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 border-neutral-900 dark:border-white font-bold'
                    : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <div className="truncate font-semibold">{acc.label}</div>
                <div className="text-[9px] opacity-75 truncate font-mono">{acc.user}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
