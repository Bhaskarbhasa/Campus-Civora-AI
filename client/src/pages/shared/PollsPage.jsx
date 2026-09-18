import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BarChart2, Clock, Users, CheckCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { pollAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { timeAgo, formatDate } from '../../utils/constants';

export default function PollsPage() {
  const { user } = useAuthStore();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, closed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    question: '', description: '', options: ['', ''], isAnonymous: false, isMultipleChoice: false,
    category: 'general', closeAt: ''
  });

  // State to track which options the user is currently selecting for un-voted polls
  const [selections, setSelections] = useState({});

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { data } = await pollAPI.getAll({ status: activeTab, limit: 50 });
      
      // We need to fetch details for each poll to see if the user voted.
      // But for a simple list, let's just render them. We might need a separate endpoint 
      // or just assume `data.polls` has everything we need. 
      // Wait, getPolls strips out the votes array for privacy. But it doesn't tell us if we voted.
      // We'll rely on the user clicking the poll, or we can just fetch all details.
      // For now, let's fetch details for all of them so we can show results if voted.
      const detailedPolls = await Promise.all(
        data.polls.map(p => pollAPI.getById(p._id).then(res => ({ ...res.data.poll, userVote: res.data.userVote })))
      );
      
      setPolls(detailedPolls);
    } catch (err) {
      toast.error('Failed to load polls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolls(); }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validOptions = formData.options.filter(o => o.trim() !== '');
      if (validOptions.length < 2) return toast.error('Provide at least 2 options.');
      if (!formData.closeAt) return toast.error('Provide a closing date.');

      await pollAPI.create({
        question: formData.question,
        description: formData.description,
        options: validOptions,
        isAnonymous: formData.isAnonymous,
        isMultipleChoice: formData.isMultipleChoice,
        category: formData.category,
        openAt: new Date().toISOString(),
        closeAt: new Date(formData.closeAt).toISOString()
      });
      toast.success('Poll created successfully!');
      setShowCreateModal(false);
      setFormData({ question: '', description: '', options: ['', ''], isAnonymous: false, isMultipleChoice: false, category: 'general', closeAt: '' });
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId) => {
    const selected = selections[pollId];
    if (!selected || selected.length === 0) return toast.error('Select an option first.');

    try {
      await pollAPI.vote(pollId, { selectedOptions: selected });
      toast.success('Vote cast successfully!');
      fetchPolls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error voting');
    }
  };

  const toggleSelection = (pollId, optId, isMultiple) => {
    setSelections(prev => {
      const current = prev[pollId] || [];
      if (isMultiple) {
        if (current.includes(optId)) return { ...prev, [pollId]: current.filter(id => id !== optId) };
        return { ...prev, [pollId]: [...current, optId] };
      }
      return { ...prev, [pollId]: [optId] };
    });
  };

  const canCreatePoll = ['admin', 'super_admin', 'hod', 'dean', 'student_welfare', 'chief_warden'].includes(user?.role);

  return (
    <DashboardLayout
      title="Campus Polls"
      subtitle="Participate in university decisions and surveys."
      actions={
        canCreatePoll && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Create Poll
          </button>
        )
      }
    >
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        {['active', 'closed'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 20, textTransform: 'capitalize' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab} Polls
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1,2,3,4].map(n => <div key={n} className="skeleton" style={{ height: 260, borderRadius: 16 }} />)}
        </div>
      ) : polls.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No polls found</h3>
          <p className="text-secondary text-sm">There are currently no {activeTab} polls.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          <AnimatePresence>
            {polls.map((poll, i) => {
              const hasVoted = !!poll.userVote;
              const isClosed = new Date() > new Date(poll.closeAt) || poll.status === 'closed';
              const showResults = hasVoted || isClosed;

              return (
                <motion.div
                  key={poll._id}
                  className="card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ padding: 24, display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {poll.category}
                    </div>
                    <span style={{ fontSize: 12, color: isClosed ? 'var(--rose)' : 'var(--emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> {isClosed ? 'Closed' : `Closes ${timeAgo(poll.closeAt)}`}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.4 }}>{poll.question}</h3>
                  {poll.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{poll.description}</p>}
                  
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={14} /> {poll.totalVotes} Votes</span>
                    {poll.isAnonymous && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HelpCircle size={14} /> Anonymous</span>}
                    {poll.isMultipleChoice && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} /> Multiple Choice</span>}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 20 }}>
                    {poll.options.map((opt) => {
                      const pct = poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0;
                      const isSelected = (selections[poll._id] || []).includes(opt.id);
                      const userVotedForThis = poll.userVote?.includes(opt.id);

                      if (showResults) {
                        return (
                          <div key={opt.id} style={{ position: 'relative', background: 'var(--bg-secondary)', borderRadius: 8, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pct}%`, background: userVotedForThis ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            <div style={{ padding: '12px 14px', position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 14, fontWeight: userVotedForThis ? 700 : 500, color: userVotedForThis ? 'var(--emerald)' : 'var(--text-primary)' }}>
                                {opt.text} {userVotedForThis && '✓'}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{pct}%</span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={opt.id} 
                          onClick={() => toggleSelection(poll._id, opt.id, poll.isMultipleChoice)}
                          style={{ 
                            padding: '12px 14px', borderRadius: 8, border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            background: isSelected ? 'var(--primary-glow-sm)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: poll.isMultipleChoice ? 4 : '50%', border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`, background: isSelected ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isSelected && <CheckCircle size={12} color="#000" />}
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{opt.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vote Button */}
                  {!showResults && !isClosed && (
                    <button 
                      className="btn btn-primary" 
                      style={{ width: '100%' }}
                      disabled={!(selections[poll._id]?.length > 0)}
                      onClick={() => handleVote(poll._id)}
                    >
                      Submit Vote
                    </button>
                  )}
                  {hasVoted && !isClosed && (
                    <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--emerald)', fontWeight: 600, padding: 10, background: 'rgba(16,185,129,0.1)', borderRadius: 8 }}>
                      ✓ Your vote has been recorded
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Create a Poll</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label className="form-label">Question *</label>
                <input className="form-input" placeholder="e.g. What should be the theme for TechFest?" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} required />
              </div>

              <div>
                <label className="form-label">Description (Optional)</label>
                <textarea className="form-input form-textarea" style={{ minHeight: 60 }} placeholder="Add more context..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Options *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {formData.options.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" placeholder={`Option ${i+1}`} value={opt} onChange={e => {
                        const newOpts = [...formData.options];
                        newOpts[i] = e.target.value;
                        setFormData({...formData, options: newOpts});
                      }} required={i < 2} />
                      {i >= 2 && (
                        <button type="button" className="btn btn-ghost" style={{ padding: '0 12px', color: 'var(--rose)' }} onClick={() => {
                          const newOpts = formData.options.filter((_, idx) => idx !== i);
                          setFormData({...formData, options: newOpts});
                        }}>✕</button>
                      )}
                    </div>
                  ))}
                  {formData.options.length < 6 && (
                    <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setFormData({...formData, options: [...formData.options, '']})}>
                      + Add Option
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select className="form-select" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="policy">Policy</option>
                    <option value="facility">Facility</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Closing Date *</label>
                  <input type="datetime-local" className="form-input" value={formData.closeAt} onChange={e => setFormData({...formData, closeAt: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 4, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isAnonymous} onChange={e => setFormData({...formData, isAnonymous: e.target.checked})} />
                  Anonymous Voting
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={formData.isMultipleChoice} onChange={e => setFormData({...formData, isMultipleChoice: e.target.checked})} />
                  Multiple Choice
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
                  {submitting ? <div className="spinner spinner-sm" /> : 'Publish Poll'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
