import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Search, Edit, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { userAPI } from '../../services/api';
import { ROLE_LABELS, formatDate, getInitials } from '../../utils/constants';

const ROLES = Object.keys(ROLE_LABELS);

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'student', department: '', designation: '', hostelBlock: '' });
  const [saving, setSaving] = useState(false);
  const LIMIT = 15;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const { data } = await userAPI.getAll(params);
      // The backend returns { success: true, data: [...], count: X }
      setUsers(data.data || []);
      setTotal(data.count || 0);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const handleSave = async () => {
    if (!form.name || !form.email || !form.role) return toast.error('Name, email, and role are required.');
    setSaving(true);
    try {
      if (editUser) {
        await userAPI.update(editUser._id, form);
        toast.success('User updated successfully.');
      } else {
        await userAPI.create(form);
        toast.success('User created! They can log in with OTP.');
      }
      setShowModal(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: 'student', department: '', designation: '', hostelBlock: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user.');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (userId, name) => {
    if (!confirm(`Deactivate ${name}? They will lose access.`)) return;
    try {
      await userAPI.deactivate(userId);
      toast.success('User deactivated.');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    }
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', role: 'student', department: '', designation: '', hostelBlock: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, role: user.role, department: user.department || '', designation: user.designation || '', hostelBlock: user.hostelBlock || '' });
    setShowModal(true);
  };

  const ROLE_COLORS = {
    student: '#00D4FF', warden: '#8B5CF6', chief_warden: '#F59E0B', maintenance_supervisor: '#F97316',
    electrician: '#F59E0B', plumber: '#06B6D4', hod: '#10B981', dean: '#8B5CF6', student_welfare: '#EC4899',
    principal: '#F43F5E', director: '#F43F5E', super_admin: '#FF0080', registrar: '#6366F1',
  };

  return (
    <DashboardLayout
      title="User Management"
      subtitle={`${total} registered users`}
      actions={
        <button className="btn btn-primary" onClick={openCreate} id="create-user-btn">
          <UserPlus size={16} /> Add User
        </button>
      }
    >
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="input-icon" />
          <input
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            id="user-search"
          />
        </div>
        <select className="form-select" style={{ width: 200 }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} id="role-filter">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* User Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['User', 'Role', 'Department', 'Email', 'Status', 'Last Login', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div className="skeleton" style={{ height: 16, borderRadius: 8 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found.</td>
                </tr>
              ) : users.map((user, i) => (
                <motion.tr
                  key={user._id}
                  style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: `${ROLE_COLORS[user.role] || '#8B9BB4'}20`,
                        border: `1px solid ${ROLE_COLORS[user.role] || '#8B9BB4'}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: ROLE_COLORS[user.role] || '#8B9BB4', flexShrink: 0,
                      }}>
                        {user.profilePhoto?.url ? <img src={user.profilePhoto.url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(user.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                        {user.rollNumber && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.rollNumber}</div>}
                        {user.designation && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.designation}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: `${ROLE_COLORS[user.role] || '#8B9BB4'}20`,
                      color: ROLE_COLORS[user.role] || '#8B9BB4',
                    }}>
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {user.department || user.hostelBlock || '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: user.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                      color: user.isActive ? 'var(--emerald)' : 'var(--rose)',
                    }}>
                      {user.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)} id={`edit-user-${i}`}>
                        <Edit size={13} />
                      </button>
                      {user.isActive ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(user._id, user.name)} id={`deactivate-user-${i}`}>
                          <UserX size={13} />
                        </button>
                      ) : (
                        <button className="btn btn-sm" style={{ background: 'var(--emerald)', color: '#fff', border: 'none' }} onClick={async () => {
                          try {
                            await userAPI.update(user._id, { isActive: true });
                            toast.success(`${user.name} is now Active!`);
                            fetchUsers();
                          } catch (err) {
                            toast.error('Failed to activate user.');
                          }
                        }} id={`activate-user-${i}`}>
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost btn-sm" disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Dr. Suresh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} id="user-name-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" placeholder="user@amrita.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editUser} id="user-email-input" />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} id="user-role-select">
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input className="form-input" placeholder="e.g., CSE, ECE" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input className="form-input" placeholder="e.g., Head Warden" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hostel Block</label>
                  <select className="form-select" value={form.hostelBlock} onChange={(e) => setForm({ ...form, hostelBlock: e.target.value })}>
                    <option value="">N/A</option>
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                  </select>
                </div>
              </div>

              {!editUser && (
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  ℹ️ The user will receive a login OTP on their email when they first access the platform.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} id="save-user-btn">
                {saving ? <div className="spinner spinner-sm" /> : (editUser ? 'Save Changes' : 'Create User')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
