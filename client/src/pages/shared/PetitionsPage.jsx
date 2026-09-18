import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, ThumbsUp, ThumbsDown, CheckCircle, FileText, Target, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { petitionAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { timeAgo, DEPARTMENTS, HOSTEL_BLOCKS } from '../../utils/constants';

export default function PetitionsPage() {
  const { user } = useAuthStore();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // active, reviewing, mine
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '', description: '', purpose: '', expectedOutcome: '', targetCommunityType: 'university', targetCommunityValue: ''
  });

  const fetchPetitions = async () => {
    setLoading(true);
    try {
      const { data } = await petitionAPI.getAll({ limit: 50 });
      let filtered = data.petitions;
      
      if (activeTab === 'active') filtered = filtered.filter(p => p.status === 'active');
      else if (activeTab === 'reviewing') filtered = filtered.filter(p => p.status === 'under_review' || p.status === 'approved' || p.status === 'implemented');
      else if (activeTab === 'mine') filtered = filtered.filter(p => p.creatorId?._id === user?._id);
      
      setPetitions(filtered);
    } catch (err) {
      toast.error('Failed to load petitions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPetitions(); }, [activeTab]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await petitionAPI.create({
        title: formData.title,
        description: formData.description,
        purpose: formData.purpose,
        expectedOutcome: formData.expectedOutcome,
        targetCommunity: {
          type: formData.targetCommunityType,
          value: formData.targetCommunityValue || null
        }
      });
      toast.success('Petition created successfully!');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', purpose: '', expectedOutcome: '', targetCommunityType: 'university', targetCommunityValue: '' });
      setActiveTab('mine');
      fetchPetitions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create petition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (id, support) => {
    try {
      await petitionAPI.vote(id, { vote: support ? 'support' : 'oppose' });
      toast.success(support ? 'You signed this petition!' : 'You opposed this petition.');
      fetchPetitions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error voting');
    }
  };

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionData, setDecisionData] = useState({ id: null, decision: '', response: '' });

  const submitDecision = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await petitionAPI.decide(decisionData.id, { decision: decisionData.decision, response: decisionData.response });
      toast.success(`Petition ${decisionData.decision}d successfully!`);
      setShowDecisionModal(false);
      fetchPetitions();
    } catch (err) {
      toast.error('Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Campus Petitions"
      subtitle="Voice your concerns and gather community support."
      actions={
        user?.role === 'student' && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Start Petition
          </button>
        )
      }
    >
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24, display: 'flex', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        {['active', 'reviewing', 'mine'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 20, textTransform: 'capitalize' }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'mine' ? 'My Petitions' : `${tab} Petitions`}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {[1,2,3].map(n => <div key={n} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : petitions.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📜</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No petitions found</h3>
          <p className="text-secondary text-sm">Be the change you want to see. Start a petition!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <AnimatePresence>
            {petitions.map((petition, i) => {
              const totalVotes = petition.supportCount + petition.oppositionCount;
              const supportPct = totalVotes > 0 ? (petition.supportCount / totalVotes) * 100 : 0;
              const hasVotedSupport = petition.supportVotes?.some(v => v.userId === user?._id);
              const hasVotedOppose = petition.oppositionVotes?.some(v => v.userId === user?._id);
              
              return (
                <motion.div
                  key={petition._id}
                  className="card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                          {petition.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><Target size={12} style={{ display: 'inline', marginBottom: -2 }}/> {petition.targetCommunity.type.replace('_', ' ')} {petition.targetCommunity.value && `- ${petition.targetCommunity.value}`}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{petition.title}</h3>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>{petition.description}</p>
                    </div>
                  </div>

                  {/* AI Summary Banner */}
                  {petition.aiSummary && (
                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 24 }}>🤖</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>AI Summary</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{petition.aiSummary}</div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                      <span style={{ color: 'var(--emerald)', fontWeight: 600 }}><Users size={12} style={{ display: 'inline', marginBottom: -2 }}/> {petition.supportCount} Signatures</span>
                      {petition.thresholdReached && <span style={{ color: 'var(--amber)', fontWeight: 600 }}><AlertCircle size={12} style={{ display: 'inline', marginBottom: -2 }}/> Threshold Reached</span>}
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${supportPct}%`, background: 'var(--emerald)' }} />
                      <div style={{ width: `${100 - supportPct}%`, background: 'var(--rose)' }} />
                    </div>
                  </div>

                  {/* Official Response Banner */}
                  {petition.officialResponse && (
                    <div style={{ padding: 16, borderRadius: 8, background: petition.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', border: `1px solid ${petition.status === 'approved' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`, marginTop: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: petition.status === 'approved' ? 'var(--emerald)' : 'var(--rose)', textTransform: 'uppercase', marginBottom: 4 }}>
                        Official Response from Management
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>{petition.officialResponse}</div>
                      {petition.respondedBy && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                          Responded by: {petition.respondedBy.name} ? {timeAgo(petition.respondedAt)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer / Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Started by <strong style={{ color: 'var(--text-primary)' }}>{petition.creatorId?.name || 'A Student'}</strong> ? {timeAgo(petition.createdAt)}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 10 }}>
                      {((user?.role === 'student_welfare' && petition.status === 'under_review') || (user?.role === 'director' && petition.status === 'escalated')) ? (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => { setDecisionData({ id: petition._id, decision: 'approve', response: '' }); setShowDecisionModal(true); }}>Approve Petition</button>
                          <button className="btn btn-sm" style={{ background: 'var(--rose-glow)', color: 'var(--rose)', border: '1px solid var(--rose)' }} onClick={() => { setDecisionData({ id: petition._id, decision: 'reject', response: '' }); setShowDecisionModal(true); }}>Reject Petition</button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="btn btn-sm" 
                            style={{ 
                              background: hasVotedSupport ? 'var(--emerald-glow)' : 'var(--bg-secondary)', 
                              color: hasVotedSupport ? 'var(--emerald)' : 'var(--text-primary)',
                              border: `1px solid ${hasVotedSupport ? 'var(--emerald)' : 'var(--border-subtle)'}`
                            }}
                            onClick={() => handleVote(petition._id, true)}
                            disabled={petition.status !== 'active'}
                          >
                            <ThumbsUp size={14} /> Sign
                          </button>
                          <button 
                            className="btn btn-sm" 
                            style={{ 
                              background: hasVotedOppose ? 'var(--rose-glow)' : 'var(--bg-secondary)', 
                              color: hasVotedOppose ? 'var(--rose)' : 'var(--text-primary)',
                              border: `1px solid ${hasVotedOppose ? 'var(--rose)' : 'var(--border-subtle)'}`
                            }}
                            onClick={() => handleVote(petition._id, false)}
                            disabled={petition.status !== 'active'}
                          >
                            <ThumbsDown size={14} /> Oppose
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Start a Petition</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label className="form-label">Petition Title *</label>
                <input className="form-input" placeholder="e.g. Extend Library Hours during Finals" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>

              <div>
                <label className="form-label">Detailed Description *</label>
                <textarea className="form-input form-textarea" style={{ minHeight: 100 }} placeholder="Explain the problem and why this matters..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>

              <div>
                <label className="form-label">Purpose *</label>
                <input className="form-input" placeholder="e.g. To improve academic environment" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Target Community</label>
                  <select className="form-select" value={formData.targetCommunityType} onChange={e => setFormData({...formData, targetCommunityType: e.target.value})}>
                    <option value="university">Entire University</option>
                    <option value="department">Specific Department</option>
                    <option value="hostel">Specific Hostel</option>
                  </select>
                </div>
                  {formData.targetCommunityType !== 'university' && (
                    <div style={{ flex: 1 }}>
                      <label className="form-label">Specify {formData.targetCommunityType === 'department' ? 'Department' : 'Hostel'}</label>
                      <select 
                        className="form-select" 
                        value={formData.targetCommunityValue} 
                        onChange={e => setFormData({...formData, targetCommunityValue: e.target.value})} 
                        required
                      >
                        <option value="">Select...</option>
                        {formData.targetCommunityType === 'department' 
                          ? DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)
                          : HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)
                        }
                      </select>
                    </div>
                  )}
              </div>

              <div>
                <label className="form-label">Expected Outcome *</label>
                <input className="form-input" placeholder="What action do you want management to take?" value={formData.expectedOutcome} onChange={e => setFormData({...formData, expectedOutcome: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
                  {submitting ? <div className="spinner spinner-sm" /> : 'Launch Petition'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      
      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="modal-overlay" onClick={() => setShowDecisionModal(false)}>
          <motion.div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
              {decisionData.decision === 'approve' ? 'Approve Petition' : 'Reject Petition'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Please provide an official response. This statement will be permanently visible to all students on the petition card.
            </p>
            <form onSubmit={submitDecision} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Official Response / Remarks *</label>
                <textarea 
                  className="form-input form-textarea" 
                  style={{ minHeight: 120 }} 
                  placeholder="e.g. We have reviewed this request and management has decided to..." 
                  value={decisionData.response} 
                  onChange={e => setDecisionData({...decisionData, response: e.target.value})} 
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowDecisionModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn" 
                  disabled={submitting} 
                  style={{ 
                    flex: 2, 
                    background: decisionData.decision === 'approve' ? 'var(--emerald)' : 'var(--rose)',
                    color: '#fff',
                    border: 'none'
                  }}
                >
                  {submitting ? <div className="spinner spinner-sm" /> : `Confirm ${decisionData.decision === 'approve' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
