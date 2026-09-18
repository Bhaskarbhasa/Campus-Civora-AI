import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, MapPin, Clock, Info, CheckCircle, Tag, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { lostFoundAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { formatDate, timeAgo } from '../../utils/constants';

const ITEM_CATEGORIES = {
  id_card: 'ID Card', wallet: 'Wallet', mobile: 'Mobile Phone', laptop: 'Laptop',
  calculator: 'Calculator', keys: 'Keys', bag: 'Bag / Backpack', book: 'Book / Notebook',
  headphones: 'Headphones', water_bottle: 'Water Bottle', clothing: 'Clothing',
  jewelry: 'Jewelry', charger: 'Charger', other: 'Other'
};

export default function LostFoundPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('lost'); // lost, found, mine
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'lost', itemCategory: 'wallet', itemName: '', description: '',
    color: '', brand: '', location: '', submittedTo: '', dateTime: new Date().toISOString().slice(0, 16),
  });
  const [file, setFile] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const typeParam = activeTab === 'mine' ? '' : activeTab;
      const { data } = await lostFoundAPI.getAll({ type: typeParam, limit: 50 });
      let filtered = data.reports;
      if (activeTab === 'mine') {
        filtered = filtered.filter(r => r.reporterId?._id === user?._id);
      }
      setReports(filtered);
    } catch (err) {
      toast.error('Failed to load items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [activeTab]);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', formData.type);
      fd.append('itemCategory', formData.itemCategory);
      fd.append('itemName', formData.itemName);
      fd.append('description', formData.description);
      if (formData.color) fd.append('color', formData.color);
      if (formData.brand) fd.append('brand', formData.brand);
      if (formData.type === 'lost') fd.append('lastSeenLocation', formData.location);
      else {
        fd.append('foundLocation', formData.location);
        if (formData.submittedTo) fd.append('submittedTo', formData.submittedTo);
      }
      fd.append('dateTime', new Date(formData.dateTime).toISOString());
      
      if (file) {
        fd.append('photos', file);
      }

      await lostFoundAPI.create(fd);
      toast.success(`${formData.type === 'lost' ? 'Lost' : 'Found'} report submitted!`);
      setShowReportModal(false);
      setFormData({ ...formData, itemName: '', description: '', location: '' });
      setFile(null);
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Lost & Found"
      subtitle="Find what you lost, report what you found."
      actions={
        <button className="btn btn-primary" onClick={() => setShowReportModal(true)}>
          <Plus size={16} /> Report Item
        </button>
      }
    >
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        {['lost', 'found', 'mine'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 20, textTransform: 'capitalize' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'mine' ? 'My Reports' : `${tab} Items`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {[1,2,3,4].map(n => <div key={n} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No items found</h3>
          <p className="text-secondary text-sm">There are currently no active {activeTab} reports.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {reports.map((item, i) => (
              <motion.div
                key={item._id}
                className="card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedItem(item)}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              >
                {item.photos?.length > 0 ? (
                  <div style={{ height: 160, width: '100%', background: '#000' }}>
                    <img src={item.photos[0].url} alt={item.itemName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ height: 120, width: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                    📦
                  </div>
                )}
                
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{
                      padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                      background: item.type === 'lost' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                      color: item.type === 'lost' ? 'var(--rose)' : 'var(--emerald)'
                    }}>
                      {item.type}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(item.createdAt)}</span>
                  </div>
                  
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.itemName}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Tag size={14} /> {ITEM_CATEGORIES[item.itemCategory] || item.itemCategory}
                      {item.brand && ` • ${item.brand}`}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <MapPin size={14} /> {item.type === 'lost' ? item.lastSeenLocation : item.foundLocation}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Report an Item</h2>
            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{ flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${formData.type === 'lost' ? 'var(--rose)' : 'var(--border-subtle)'}`, background: formData.type === 'lost' ? 'var(--rose-glow-sm)' : 'transparent', cursor: 'pointer', textAlign: 'center', fontWeight: 700 }}>
                  <input type="radio" name="type" value="lost" checked={formData.type === 'lost'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ display: 'none' }} />
                  I Lost Something
                </label>
                <label style={{ flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${formData.type === 'found' ? 'var(--emerald)' : 'var(--border-subtle)'}`, background: formData.type === 'found' ? 'var(--emerald-glow-sm)' : 'transparent', cursor: 'pointer', textAlign: 'center', fontWeight: 700 }}>
                  <input type="radio" name="type" value="found" checked={formData.type === 'found'} onChange={e => setFormData({...formData, type: e.target.value})} style={{ display: 'none' }} />
                  I Found Something
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={formData.itemCategory} onChange={e => setFormData({...formData, itemCategory: e.target.value})} required>
                    {Object.entries(ITEM_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Item Name *</label>
                  <input className="form-input" placeholder="e.g. Blue Hydroflask" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} required />
                </div>
              </div>

              <div>
                <label className="form-label">Description *</label>
                <textarea className="form-input form-textarea" placeholder="Provide distinguishing details (scratches, stickers, etc.)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Brand (Optional)</label>
                  <input className="form-input" placeholder="e.g. Apple" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Color (Optional)</label>
                  <input className="form-input" placeholder="e.g. Black" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="form-label">{formData.type === 'lost' ? 'Last Seen Location' : 'Found Location'} *</label>
                <input className="form-input" placeholder="e.g. Library 2nd Floor" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
              </div>

              {formData.type === 'found' && (
                <div>
                  <label className="form-label">Handed Over To (Optional)</label>
                  <input className="form-input" placeholder="e.g. Warden, Security Desk, or 'Kept with me'" value={formData.submittedTo} onChange={e => setFormData({...formData, submittedTo: e.target.value})} />
                </div>
              )}

              <div>
                <label className="form-label">Photo (Optional but highly recommended)</label>
                <input type="file" className="form-input" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ padding: '8px 14px' }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowReportModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
                  {submitting ? <div className="spinner spinner-sm" /> : 'Submit Report'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <motion.div className="modal-content" style={{ maxWidth: 600, padding: 0, overflowY: 'auto', maxHeight: '90vh' }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {selectedItem.photos?.length > 0 && (
              <div style={{ width: '100%', height: 300, background: '#000', flexShrink: 0 }}>
                <img src={selectedItem.photos[0].url} alt={selectedItem.itemName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
            )}
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                  background: selectedItem.type === 'lost' ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
                  color: selectedItem.type === 'lost' ? 'var(--rose)' : 'var(--emerald)'
                }}>
                  {selectedItem.type} Item
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Reported {timeAgo(selectedItem.createdAt)}</span>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{selectedItem.itemName}</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>{selectedItem.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Category</div>
                  <div style={{ fontWeight: 600 }}>{ITEM_CATEGORIES[selectedItem.itemCategory] || selectedItem.itemCategory}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Location</div>
                  <div style={{ fontWeight: 600 }}>{selectedItem.type === 'lost' ? selectedItem.lastSeenLocation : selectedItem.foundLocation}</div>
                </div>
                {selectedItem.brand && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Brand</div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.brand}</div>
                  </div>
                )}
                {selectedItem.color && (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Color</div>
                    <div style={{ fontWeight: 600 }}>{selectedItem.color}</div>
                  </div>
                )}
                {selectedItem.type === 'found' && selectedItem.submittedTo && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Handed Over To</div>
                    <div style={{ fontWeight: 600, color: 'var(--emerald)' }}>{selectedItem.submittedTo}</div>
                  </div>
                )}
              </div>

              {/* AI Matches Section */}
              {selectedItem.type === 'lost' && selectedItem.potentialMatches?.length > 0 && (
                <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: 12, padding: 16, marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 700, marginBottom: 12 }}>
                    <Search size={18} /> Civora AI Potential Matches
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {selectedItem.potentialMatches.map((match, idx) => match.matchedReportId && (
                      <div key={idx} style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                        {match.matchedReportId.photos?.length > 0 ? (
                          <img src={match.matchedReportId.photos[0].url} alt="match" style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 48, height: 48, borderRadius: 6, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{match.matchedReportId.itemName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Found Item</div>
                        </div>
                        <button className="btn btn-sm btn-primary">Contact Finder</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedItem(null)}>Close</button>
                {selectedItem.reporterId?._id !== user?._id && (
                  <button className="btn btn-primary" style={{ flex: 2 }}>Contact Reporter</button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
