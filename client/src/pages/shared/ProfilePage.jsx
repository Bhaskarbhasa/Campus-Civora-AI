import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Camera, Mail, Phone, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuthStore from '../../store/authStore';
import { userAPI } from '../../services/api';
import { ROLE_LABELS, getInitials, formatDate } from '../../utils/constants';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateMe(form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSaving(false); }
  };

  const profileFields = [
    { label: 'Email', value: user?.email, icon: Mail },
    { label: 'Role', value: ROLE_LABELS[user?.role] || user?.role, icon: Building },
    { label: 'Department', value: user?.department, icon: Building },
    { label: 'Roll Number', value: user?.rollNumber, icon: Building },
    { label: 'Hostel Block', value: user?.hostelBlock, icon: Building },
    { label: 'Room Number', value: user?.roomNumber, icon: Building },
    { label: 'Year / Semester', value: user?.year ? `Year ${user.year} / Sem ${user.semester}` : null, icon: Building },
    { label: 'Employee ID', value: user?.employeeId, icon: Building },
    { label: 'Last Login', value: user?.lastLogin ? formatDate(user.lastLogin) : 'N/A', icon: Building },
  ].filter((f) => f.value);

  return (
    <DashboardLayout title="My Profile" subtitle="Manage your account information">
      <div className="grid-2" style={{ gap: 24, alignItems: 'start', maxWidth: 1000 }}>
        {/* Profile Card */}
        <motion.div className="card" style={{ padding: 32, textAlign: 'center' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: '#FFFFFF',
              margin: '0 auto',
              boxShadow: '0 4px 30px rgba(0,212,255,0.4)',
            }}>
              {user?.profilePhoto?.url
                ? <img src={user.profilePhoto.url} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(user?.name)}
            </div>
            <button style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--bg-card)', border: '2px solid var(--bg-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
            }} title="Change photo">
              <Camera size={14} />
            </button>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{user?.name}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{user?.email}</p>

          <span style={{
            display: 'inline-block', padding: '5px 14px', borderRadius: 99,
            fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
            background: 'rgba(0,212,255,0.1)', color: 'var(--cyan)', border: '1px solid rgba(0,212,255,0.2)',
          }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </span>

          <div className="divider" style={{ margin: '20px 0' }} />

          {/* Profile Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            {profileFields.map((f) => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Edit Profile</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                id="profile-name-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-wrapper">
                <Phone size={16} className="input-icon" />
                <input
                  className="form-input"
                  placeholder="+91 9876543210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  id="profile-phone-input"
                />
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)' }}>
              ℹ️ Email, role, and institutional details can only be changed by the administrator.
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-profile-btn">
              {saving ? <div className="spinner spinner-sm" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="divider" style={{ margin: '24px 0' }} />

          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔐 Security</h3>
          <button className="btn btn-ghost btn-sm" id="change-password-btn">Change Password</button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
