import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, Plus } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Topbar({ title, subtitle, onMenuToggle, actions }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button className="hamburger-btn" onClick={onMenuToggle} id="menu-toggle-btn">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div style={{ flex: 1 }}>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <p className="text-xs text-muted" style={{ marginTop: 1 }}>{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="topbar-actions">
        {actions}

        <button
          className="notification-btn"
          onClick={() => navigate('/student/notifications')}
          id="notifications-btn"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* User avatar */}
        <div
          style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#FFFFFF',
            cursor: 'pointer', flexShrink: 0
          }}
          onClick={() => navigate('/profile')}
          title={user?.name}
        >
          {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      </div>
    </header>
  );
}
