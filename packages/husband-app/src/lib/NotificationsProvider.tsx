import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Notification } from "../types";
import { listNotifications, markAllNotificationsRead, subscribeToNotifications } from "./api";
import { useAuth } from "./AuthProvider";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotifications(await listNotifications(session.user.id));
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    let channel: RealtimeChannel | undefined;
    channel = subscribeToNotifications(session.user.id, (n) => {
      setNotifications((prev) => [n, ...prev]);
    });
    return () => {
      channel?.unsubscribe();
    };
  }, [session]);

  async function markAllRead() {
    if (!session) return;
    await markAllNotificationsRead(session.user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, loading, refresh, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
