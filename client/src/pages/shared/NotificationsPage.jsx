import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { notificationAPI } from '../../services/api';
import { timeAgo } from '../../utils/constants';

const TYPE_ICONS = {
  complaint_update: '📋',
  complaint_assigned: '👷',
  petition_milestone: '✊',
  petition_decision: '⚖️',
  lost_found_match: '🔍',
  system: '⚙️',
  emergency_alert: '🚨',
};

const PRIORITY_COLORS = {
  urgent: 'var(--rose)',
  high: 'var(--amber)',
  normal: 'var(--cyan)',
  low: 'var(--text-muted)',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ page, limit: 20, unreadOnly: unreadOnly ? 'true' : undefined });
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [page, unreadOnly]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success('All notifications marked as read.');
  };

  return (
    <DashboardLayout
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'You\'re all caught up!'}
      actions={
        unreadCount > 0 ? (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead} id="mark-all-read-btn">
            <CheckCheck size={14} /> Mark All Read
          </button>
        ) : null
      }
    >
      {/* Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <div className="tabs">
          <div className={`tab-item ${!unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(false); setPage(1); }}>All</div>
          <div className={`tab-item ${unreadOnly ? 'active' : ''}`} onClick={() => { setUnreadOnly(true); setPage(1); }}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map((n) => <div key={n} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔔</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {unreadOnly ? 'All caught up! Switch to "All" to see past notifications.' : 'Notifications about your complaints, petitions, and more will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((notif, i) => (
            <motion.div
              key={notif._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card"
              style={{
                padding: '16px 20px',
                background: notif.isRead ? 'var(--bg-card)' : 'rgba(0,212,255,0.04)',
                border: notif.isRead ? '1px solid var(--border-subtle)' : '1px solid rgba(0,212,255,0.2)',
                cursor: 'pointer',
              }}
              onClick={() => !notif.isRead && markRead(notif._id)}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${PRIORITY_COLORS[notif.priority] || 'var(--cyan)'}15`,
                  border: `1px solid ${PRIORITY_COLORS[notif.priority] || 'var(--cyan)'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {TYPE_ICONS[notif.type] || '📣'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: 14, fontWeight: notif.isRead ? 600 : 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {notif.title}
                    </h4>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                      {!notif.isRead && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)' }} />
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.message}</p>

                  {notif.priority === 'urgent' && (
                    <span style={{ display: 'inline-flex', marginTop: 6, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', background: 'rgba(244,63,94,0.15)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.3)' }}>
                      URGENT
                    </span>
                  )}
                </div>

                {/* Mark read button */}
                {!notif.isRead && (
                  <button
                    className="btn btn-ghost btn-icon-sm"
                    onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                    title="Mark as read"
                    id={`mark-read-${i}`}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button>
          <span style={{ padding: '6px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn btn-ghost btn-sm" disabled={notifications.length < 20} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </DashboardLayout>
  );
}
