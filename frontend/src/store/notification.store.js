'use client';

import { create } from 'zustand';
import api from '@/services/api';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async (token) => {
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await api.get('/notifications', token);
      const list = res.data || [];
      const unread = list.filter((n) => !n.readAt).length;
      set({ notifications: list, unreadCount: unread });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      if (state.notifications.some((n) => n._id === notification._id)) return {};
      const newList = [notification, ...state.notifications];
      const newUnread = newList.filter((n) => !n.readAt).length;
      return { notifications: newList, unreadCount: newUnread };
    });
  },

  markRead: async (id, token) => {
    try {
      const res = await api.post(`/notifications/${id}/read`, {}, token);
      set((state) => {
        const newList = state.notifications.map((n) => (n._id === id ? res.data : n));
        const newUnread = newList.filter((n) => !n.readAt).length;
        return { notifications: newList, unreadCount: newUnread };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  },

  markAllRead: async (token) => {
    try {
      await api.post('/notifications/read-all', {}, token);
      set((state) => {
        const newList = state.notifications.map((n) => ({
          ...n,
          readAt: n.readAt || new Date().toISOString(),
        }));
        return { notifications: newList, unreadCount: 0 };
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  },

  deleteNotification: async (id, token) => {
    try {
      await api.delete(`/notifications/${id}`, token);
      set((state) => {
        const newList = state.notifications.filter((n) => n._id !== id);
        const newUnread = newList.filter((n) => !n.readAt).length;
        return { notifications: newList, unreadCount: newUnread };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }
}));

export default useNotificationStore;
