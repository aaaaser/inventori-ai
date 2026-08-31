import { eq, desc } from 'drizzle-orm';
import { db, schema, hasDatabaseUrl } from '@/db/index';
import { AppNotification } from '@/lib/types';

export const isDatabaseLive = () => Boolean(db && hasDatabaseUrl);

// Fallback in-memory notifications
let fallbackNotifications: AppNotification[] = [
  {
    id: 1,
    user_id: 'usr-1',
    title: 'Barang baru ditambah',
    message: 'Laptop ThinkPad T14s Gen 3 (LP-001) berhasil didaftarkan ke inventaris.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 menit lalu
  },
  {
    id: 2,
    user_id: 'usr-1',
    title: 'Barang diperbarui',
    message: 'Stok Monitor Dell UltraSharp 27" 4K (MN-002) diperbarui menjadi 8 unit.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 menit lalu
  },
  {
    id: 3,
    user_id: 'usr-1',
    title: 'Data barang berubah',
    message: 'Kondisi Kursi Ergonomis Mesh Pro (KS-003) diverifikasi dalam keadaan Baik.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 jam lalu
  },
  {
    id: 4,
    user_id: 'usr-1',
    title: 'Peringatan Stok Kritis',
    message: 'Printer Laser Multifungsi HP (PR-004) tersisa hanya 3 unit.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 hari lalu
  },
];

let nextNotificationId = 5;

export async function getAllNotifications(userId: string = 'usr-1'): Promise<AppNotification[]> {
  if (isDatabaseLive() && db) {
    try {
      const records = await db
        .select()
        .from(schema.notifications)
        .orderBy(desc(schema.notifications.created_at))
        .limit(30);

      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          user_id: r.user_id,
          title: r.title,
          message: r.message,
          is_read: Boolean(r.is_read),
          created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        }));
      }
    } catch (err) {
      console.warn('Neon query notifications failed, using in-memory:', err);
    }
  }

  return [...fallbackNotifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getUnreadNotificationCount(userId: string = 'usr-1'): Promise<number> {
  const notifs = await getAllNotifications(userId);
  return notifs.filter((n) => !n.is_read).length;
}

export async function addNotification(
  title: string,
  message: string,
  userId: string = 'usr-1'
): Promise<AppNotification> {
  if (isDatabaseLive() && db) {
    try {
      const inserted = await db
        .insert(schema.notifications)
        .values({
          user_id: userId,
          title,
          message,
          is_read: false,
        })
        .returning();

      if (inserted && inserted.length > 0) {
        const r = inserted[0];
        return {
          id: r.id,
          user_id: r.user_id,
          title: r.title,
          message: r.message,
          is_read: Boolean(r.is_read),
          created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        };
      }
    } catch (err) {
      console.warn('Failed to insert notification into Neon, using fallback:', err);
    }
  }

  const newNotif: AppNotification = {
    id: nextNotificationId++,
    user_id: userId,
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  };
  fallbackNotifications.unshift(newNotif);
  return newNotif;
}

export async function markNotificationAsRead(id: number): Promise<boolean> {
  if (isDatabaseLive() && db) {
    try {
      await db
        .update(schema.notifications)
        .set({ is_read: true })
        .where(eq(schema.notifications.id, id));
      return true;
    } catch (err) {
      console.warn('Failed to mark notification read in Neon:', err);
    }
  }

  const item = fallbackNotifications.find((n) => n.id === id);
  if (item) {
    item.is_read = true;
    return true;
  }
  return false;
}

export async function markAllNotificationsAsRead(userId: string = 'usr-1'): Promise<boolean> {
  if (isDatabaseLive() && db) {
    try {
      await db
        .update(schema.notifications)
        .set({ is_read: true })
        .where(eq(schema.notifications.user_id, userId));
      return true;
    } catch (err) {
      console.warn('Failed to mark all read in Neon:', err);
    }
  }

  fallbackNotifications.forEach((n) => {
    n.is_read = true;
  });
  return true;
}
