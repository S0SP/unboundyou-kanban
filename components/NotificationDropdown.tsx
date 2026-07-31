'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Activity as ActivityIcon, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { activities, unreadActivities, setUnreadActivities, clearAllActivities, currentUser } = useStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadActivities > 0) setUnreadActivities(0);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUnreadActivities(0);
    toast.success('All notifications marked as read');
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await clearAllActivities();
    toast.success('Notifications cleared');
    setIsOpen(false);
  };

  const isActivityUnread = (createdAtString: string) => {
    if (!currentUser?.settings?.last_read_activities_at) return true;
    const lastRead = new Date(currentUser.settings.last_read_activities_at).getTime();
    return new Date(createdAtString).getTime() > lastRead;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="p-2.5 rounded-xl border transition-colors relative shadow-sm"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-muted)',
        }}
      >
        <Bell size={18} strokeWidth={2.5} />
        {unreadActivities > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unreadActivities > 9 ? '9+' : unreadActivities}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right border"
            style={{
              backgroundColor: 'var(--bg-panel)',
              borderColor: 'var(--border-base)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-base)',
              }}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                <ActivityIcon size={16} className="text-indigo-500" />
                Recent Activity
              </h3>
              <div className="flex items-center gap-3">
                {unreadActivities > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold transition-colors flex items-center gap-1 hover:text-indigo-500"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Check size={13} /> Mark read
                  </button>
                )}
                {activities.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-semibold transition-colors flex items-center gap-1 hover:text-red-500"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Trash2 size={13} /> Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-[350px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <Bell size={20} style={{ color: 'var(--text-faint)' }} />
                  </div>
                  You&apos;re all caught up!
                </div>
              ) : (
                <div className="flex flex-col">
                  {activities.slice(0, 20).map((activity, idx) => {
                    const unread = isActivityUnread(activity.created_at);
                    return (
                      <div
                        key={activity.id}
                        className="px-4 py-3.5 flex gap-3 relative transition-colors"
                        style={{
                          backgroundColor: unread ? 'rgba(99,102,241,0.06)' : 'transparent',
                          borderBottom: idx !== activities.length - 1 ? '1px solid var(--border-base)' : undefined,
                        }}
                      >
                        {unread && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600" />
                        )}
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                          style={{
                            backgroundColor: unread ? 'rgba(99,102,241,0.15)' : 'var(--bg-elevated)',
                            color: unread ? '#818CF8' : 'var(--text-muted)',
                          }}
                        >
                          <ActivityIcon size={14} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 pr-4">
                          <p
                            className="text-sm leading-snug"
                            style={{
                              color: unread ? 'var(--text-primary)' : 'var(--text-muted)',
                              fontWeight: unread ? 600 : 400,
                            }}
                          >
                            {activity.message}
                          </p>
                          <span className="text-xs mt-1 font-medium" style={{ color: 'var(--text-faint)' }}>
                            {timeAgo(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
