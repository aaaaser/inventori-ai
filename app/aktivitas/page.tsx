'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Plus, Edit3, Trash2, CheckCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth-context';
import { AuditLogRecord } from '@/lib/types';

export default function AktivitasPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/audit-logs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('TAMBAH')) {
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40';
    }
    if (action.includes('APPROVE') || action.includes('SETUJUI')) {
      return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40';
    }
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('TOLAK')) {
      return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40';
    }
    return 'text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CREATE')) return Plus;
    if (action.includes('APPROVE')) return CheckCircle;
    if (action.includes('DELETE') || action.includes('REJECT')) return Trash2;
    if (action.includes('UPDATE')) return Edit3;
    return Activity;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-neutral-900 dark:text-neutral-100" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
              LOG AKTIVITAS & AUDIT TRAIL
            </h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Riwayat lengkap mutasi aset, persetujuan peminjaman, dan aktivitas akun di sistem sekolah.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Perbarui Log
        </Button>
      </header>

      {/* Audit Log Timeline */}
      {isLoading ? (
        <Loading message="Memuat riwayat audit trail..." />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Belum ada catatan aktivitas"
          description="Aktivitas mutasi inventaris dan persetujuan akan tercatat otomatis di sini."
        />
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => {
            const Icon = getActionIcon(log.action);
            const color = getActionColor(log.action);
            const formattedTime = new Date(log.created_at).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <Card key={log.id} className="p-3.5 flex items-start gap-3">
                <div className={`p-2 rounded-sm shrink-0 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Tabel: {log.entity_table} (ID: {log.entity_id})
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-relaxed mt-1">
                    {log.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      Oleh: {log.user_name || 'Sistem'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formattedTime}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
