'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  Clock,
  LogOut,
  Save,
  CheckCircle2,
  Package,
  Layers,
  FileText,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function ProfilPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Nama dan email wajib diisi', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateProfile({ name: name.trim(), email: email.trim() });
      setIsSaving(false);
      setIsEditing(false);
      showToast('Profil berhasil diperbarui', 'success');
    }, 400);
  };

  const handleLogout = () => {
    logout();
    showToast('Berhasil keluar dari akun', 'info');
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="space-y-4">
        <div className="h-40 bg-neutral-100 dark:bg-neutral-900 rounded-sm animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              PROFIL PENGGUNA
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-6">
            Informasi akun dan hak akses administrator
          </p>
        </div>

        <Button
          id="btn-profile-logout"
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/20"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
        >
          Logout
        </Button>
      </header>

      {/* Profile Overview Card */}
      <Card className="p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-sm bg-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xl font-mono shadow-xs">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-950 dark:text-white">
                  {user.name}
                </h2>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  {user.status || 'Aktif'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <Button
            id="btn-edit-profile"
            variant={isEditing ? 'outline' : 'secondary'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Batal Edit' : 'Edit Informasi'}
          </Button>
        </div>

        {/* Edit Form or Readonly View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Nama Lengkap
                </label>
                <Input
                  id="input-profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <Input
                  id="input-profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Batal
              </Button>
              <Button
                id="btn-save-profile"
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-100 dark:border-neutral-800">
              <Shield className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-400 block">Hak Akses / Role</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-100 dark:border-neutral-800">
              <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-400 block">Tanggal Registrasi</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-100 dark:border-neutral-800">
              <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-400 block">Sesi Terakhir</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                  {formatDate(user.last_login || new Date())}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-sm border border-neutral-100 dark:border-neutral-800">
              <Mail className="w-4 h-4 text-neutral-500 shrink-0" />
              <div>
                <span className="text-[11px] text-neutral-400 block">Status Akun</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Terverifikasi & Aktif
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Quick Navigation Links */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase font-mono tracking-wider">
          Pintasan Cepat
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Link
            href="/dashboard"
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col items-center justify-center text-center gap-1.5"
          >
            <Package className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Dashboard
            </span>
          </Link>

          <Link
            href="/barang"
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col items-center justify-center text-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Katalog
            </span>
          </Link>

          <Link
            href="/notifikasi"
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col items-center justify-center text-center gap-1.5"
          >
            <Bell className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Notifikasi
            </span>
          </Link>

          <Link
            href="/pengaturan"
            className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex flex-col items-center justify-center text-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Pengaturan
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
