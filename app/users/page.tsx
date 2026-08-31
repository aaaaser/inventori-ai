'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, Shield, KeyRound, Check, X, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Dialog } from '@/components/ui/Dialog';
import { Loading } from '@/components/ui/Loading';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth-context';
import { UserSession } from '@/lib/types';
import { UserRole, ROLE_LABELS, ALL_ROLES } from '@/lib/rbac';

export default function UsersPage() {
  const { user: currentUser, can } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('LABORAN');
  const [formJurusanId, setFormJurusanId] = useState<string>('1');

  // Reset Password Modal State
  const [resetTarget, setResetTarget] = useState<UserSession | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUsername || !formEmail || !formPassword) {
      showToast('Mohon lengkapi seluruh field formulir', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          username: formUsername,
          email: formEmail,
          password: formPassword,
          role: formRole,
          jurusan_id: formRole === 'KAKOM' || formRole === 'LABORAN' ? Number(formJurusanId) : null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Pengguna baru berhasil ditambahkan!', 'success');
        setIsAddModalOpen(false);
        setFormName('');
        setFormUsername('');
        setFormEmail('');
        setFormPassword('');
        fetchUsers();
      } else {
        showToast(json.message || 'Gagal menambahkan pengguna', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: UserSession) => {
    try {
      const res = await fetch(`/api/users/${targetUser.id}/status`, {
        method: 'PATCH',
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `Status pengguna ${targetUser.name} diubah menjadi ${json.data.is_active ? 'Aktif' : 'Nonaktif'}`,
          'success'
        );
        fetchUsers();
      } else {
        showToast(json.message || 'Gagal mengubah status', 'error');
      }
    } catch (err) {
      showToast('Gagal memperbarui status', 'error');
    }
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetTarget || !newPassword.trim()) {
      showToast('Password baru tidak boleh kosong', 'warning');
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Password untuk ${resetTarget.name} berhasil direset!`, 'success');
        setResetTarget(null);
        setNewPassword('');
      } else {
        showToast(json.message || 'Gagal mereset password', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const canCreateUser = can('user.create');
  const canUpdateUser = can('user.update');

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              PENGGUNA & HAK AKSES (RBAC)
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Manajemen 6 role otentikasi: Super Admin, Kepala Sekolah, Operator, Waka Sarpras, Kakom, & Laboran.
          </p>
        </div>

        {canCreateUser && (
          <Button
            id="btn-tambah-pengguna"
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah Pengguna
          </Button>
        )}
      </header>

      {/* Loading state */}
      {isLoading ? (
        <Loading message="Memuat daftar pengguna & hak akses..." />
      ) : (
        /* Users List */
        <div className="space-y-2.5">
          {users.map((u) => (
            <Card
              key={u.id}
              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {u.name}
                    </h3>
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-sm border border-neutral-300 dark:border-neutral-700">
                      {u.role}
                    </span>
                    {u.jurusan_kode && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-sm border border-blue-200 dark:border-blue-800">
                        {u.jurusan_kode}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                    <span>@{u.username}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100 dark:border-neutral-800">
                {/* Status Badge */}
                <button
                  type="button"
                  onClick={() => canUpdateUser && handleToggleStatus(u)}
                  disabled={!canUpdateUser}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-sm border transition-colors ${
                    u.is_active
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60'
                  } ${canUpdateUser ? 'cursor-pointer hover:opacity-80' : ''}`}
                >
                  {u.is_active ? 'Aktif' : 'Nonaktif'}
                </button>

                {/* Reset Password Button */}
                {canUpdateUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={() => {
                      setResetTarget(u);
                      setNewPassword('');
                    }}
                    leftIcon={<KeyRound className="w-3 h-3" />}
                  >
                    Reset Sandi
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Pengguna Baru"
        description="Daftarkan akun pengguna dan tetapkan role hak akses sistem."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddUserSubmit}
              isLoading={isSubmitting}
            >
              Simpan Pengguna
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nama Lengkap
            </label>
            <Input
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Budi Santoso, S.Kom"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Username
              </label>
              <Input
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="budi.rpl"
                className="text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Password Awal
              </label>
              <Input
                required
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Alamat Email
            </label>
            <Input
              required
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="budi@smk.belajar.id"
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Role Akses
              </label>
              <Select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as UserRole)}
                options={ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] || r }))}
              />
            </div>

            {(formRole === 'KAKOM' || formRole === 'LABORAN') && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Jurusan Keahlian
                </label>
                <Select
                  value={formJurusanId}
                  onChange={(e) => setFormJurusanId(e.target.value)}
                  options={[
                    { value: '1', label: 'RPL (Rekayasa Perangkat Lunak)' },
                    { value: '2', label: 'ATPH (Pertanian & Hortikultura)' },
                    { value: '3', label: 'TBSM (Teknik Sepeda Motor)' },
                  ]}
                />
              </div>
            )}
          </div>
        </form>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title="Reset Password Pengguna"
        description={`Masukkan kata sandi baru untuk akun ${resetTarget?.name}.`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetTarget(null)}
              disabled={isResetting}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleResetPasswordSubmit}
              isLoading={isResetting}
            >
              Simpan Password Baru
            </Button>
          </>
        }
      >
        <div className="space-y-3 pt-1">
          <div className="p-2.5 rounded-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
            <span className="font-semibold text-neutral-900 dark:text-white">
              {resetTarget?.name}
            </span>{' '}
            <span className="text-neutral-500 font-mono">(@{resetTarget?.username})</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Password Baru
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru..."
              className="text-xs"
              autoFocus
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
