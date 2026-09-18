import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, Star, ThumbsUp, AlertTriangle, CheckCircle, RefreshCw, Upload, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { complaintAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { STATUS_LABELS, CATEGORY_LABELS, CATEGORY_ICONS, PRIORITY_CONFIG, formatDate, timeAgo, getStatusColor } from '../../utils/constants';

const TIMELINE_ICONS = {
  submitted: '📤', ai_processing: '🤖', under_verification: '🔍', verified: '✅',
  approved: '👍', assigned: '👷', work_in_progress: '🔧', waiting_for_materials: '📦',
  quality_inspection: '🔎', completed: '✔️', pending_student_verification: '⏳',
  closed: '🔒', reopened: '🔄', rejected: '❌', escalated: '🚨', duplicate: '🔗',
};

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [satisfiedRating, setSatisfiedRating] = useState(0);
  const [verifyComment, setVerifyComment] = useState('');
  const [supportComment, setSupportComment] = useState('');
  const [chatText, setChatText] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);

  const fetchComplaint = async () => {
    try {
      const { data } = await complaintAPI.getById(id);
      setComplaint(data.complaint);
    } catch { toast.error('Complaint not found.'); navigate(-1); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  const handleVerify = async (satisfied) => {
    if (satisfied && !satisfiedRating) return toast.error('Please rate the resolution first.');
    setSubmittingVerify(true);
    try {
      await complaintAPI.verifyCompletion(id, { satisfied, comment: verifyComment, rating: satisfiedRating });
      toast.success(satisfied ? '✅ Complaint closed. Thank you for your feedback!' : '🔄 Complaint reopened. We\'ll look into it.');
      fetchComplaint();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to submit.'); }
    finally { setSubmittingVerify(false); }
  };

  const handleCommunitySupport = async () => {
    setSubmittingSupport(true);
    try {
      await complaintAPI.addCommunitySupport(id, { comment: supportComment });
      toast.success('✊ Your support has been recorded!');
      fetchComplaint();
    } catch (err) { toast.error(err.response?.data?.message || 'Already supported or error.'); }
    finally { setSubmittingSupport(false); }
  };

  const handleSendChat = async () => {
    if (!chatText.trim()) return;
    setSendingChat(true);
    try {
      await complaintAPI.addComment(id, { text: chatText });
      setChatText('');
      fetchComplaint();
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) return (
    <DashboardLayout title="Complaint Details">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3].map((n) => <div key={n} className="skeleton" style={{ height: 100, borderRadius: 14 }} />)}
      </div>
    </DashboardLayout>
  );

  if (!complaint) return null;

  const isOwner = complaint.complainantId?._id?.toString() === user?._id?.toString();
  const needsVerification = complaint.status === 'pending_student_verification' && isOwner;
  const canSupport = !isOwner && user.role === 'student' && complaint.isPublic;
  const priority = PRIORITY_CONFIG[complaint.priority] || {};
  const alreadySupported = complaint.communitySupport?.some((s) => s.userId?._id?.toString() === user?._id?.toString() || s.userId?.toString() === user?._id?.toString());

  return (
    <DashboardLayout
      title="Complaint Details"
      subtitle={complaint.title}
      actions={
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
      }
    >
      <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>
        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header Card */}
          <motion.div className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Status + Priority Row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className={`status-chip status-${complaint.status}`}>
                {TIMELINE_ICONS[complaint.status]} {STATUS_LABELS[complaint.status]}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                letterSpacing: 0.5, textTransform: 'uppercase',
                background: priority.bg, color: priority.color, border: `1px solid ${priority.border}`,
              }}>
                {complaint.priority === 'emergency' && '🚨 '}{priority.label || complaint.priority}
              </span>
              {complaint.isEmergency && <span className="badge badge-rose">EMERGENCY</span>}
              {complaint.aiAnalysis?.processed && <span className="badge badge-violet">🤖 AI Analyzed</span>}
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{complaint.title}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{complaint.description}</p>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[complaint.category]}</span>
                {CATEGORY_LABELS[complaint.category]}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <MapPin size={14} />
                {[complaint.location?.building, complaint.location?.floor, complaint.location?.room].filter(Boolean).join(' • ')}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <Clock size={14} />
                {formatDate(complaint.createdAt)}
              </div>
            </div>
          </motion.div>

          {/* AI Analysis */}
          {complaint.aiAnalysis?.processed && (
            <motion.div
              className="card"
              style={{ padding: 20, background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>🤖</span> AI Analysis Report
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Suggested Dept.', value: complaint.aiAnalysis.suggestedDepartment },
                  { label: 'Predicted Priority', value: complaint.aiAnalysis.predictedPriority },
                  { label: 'Urgency Score', value: complaint.aiAnalysis.sentimentScore ? `${Math.round(complaint.aiAnalysis.sentimentScore * 100)}%` : null },
                  { label: 'Confidence', value: complaint.aiAnalysis.confidence ? `${Math.round(complaint.aiAnalysis.confidence * 100)}%` : null },
                ].filter((i) => i.value).map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--violet)', textTransform: 'capitalize' }}>{value}</div>
                  </div>
                ))}
              </div>
              {complaint.aiAnalysis.summary && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>AI Summary</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{complaint.aiAnalysis.summary}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Evidence */}
          {complaint.evidenceFiles?.length > 0 && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Evidence Files</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {complaint.evidenceFiles.map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noreferrer">
                    <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {file.fileType === 'image' ? (
                        <img src={file.url} alt={`evidence-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                          {file.fileType === 'video' ? '🎬' : '📄'}
                        </div>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Live Chat / Comments Section */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <MessageSquare size={18} style={{ color: 'var(--cyan)' }} /> Discussion & Updates
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
              {(!complaint.comments || complaint.comments.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  No messages yet. Ask the technician a question or provide an update!
                </div>
              ) : (
                complaint.comments.map((comment, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    gap: 12, 
                    flexDirection: comment.userId?._id?.toString() === user?._id?.toString() || comment.userId?.toString() === user?._id?.toString() ? 'row-reverse' : 'row' 
                  }}>
                    <div style={{ 
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--grad-primary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 12, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 
                    }}>
                      {comment.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                    </div>
                    <div style={{ 
                      background: comment.userId?._id?.toString() === user?._id?.toString() || comment.userId?.toString() === user?._id?.toString() ? 'var(--cyan-glow)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${comment.userId?._id?.toString() === user?._id?.toString() || comment.userId?.toString() === user?._id?.toString() ? 'rgba(0, 212, 255, 0.3)' : 'var(--border-subtle)'}`,
                      padding: '10px 14px', borderRadius: 12, maxWidth: '85%'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{comment.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 11 }}>({comment.role})</span></span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{timeAgo(comment.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                className="form-input form-textarea"
                style={{ flex: 1, minHeight: 44, height: 44, padding: '10px 14px', fontSize: 13, resize: 'none' }}
                placeholder="Type a message to the team..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />
              <button 
                className="btn btn-primary" 
                style={{ height: 44, width: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onClick={handleSendChat}
                disabled={sendingChat || !chatText.trim()}
              >
                {sendingChat ? <div className="spinner spinner-sm" /> : <Send size={18} />}
              </button>
            </div>
          </div>

          {/* Community Support */}
          {complaint.isPublic && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>
                  👥 Community Support ({complaint.communitySupport?.length || 0})
                </h3>
                {complaint.communitySupport?.length > 0 && (
                  <span style={{ fontSize: 13, color: 'var(--cyan)', fontWeight: 600 }}>
                    {complaint.communitySupport.length} student{complaint.communitySupport.length !== 1 ? 's' : ''} affected
                  </span>
                )}
              </div>

              {canSupport && !alreadySupported && (
                <div style={{ marginBottom: 14 }}>
                  <textarea
                    className="form-input form-textarea"
                    style={{ minHeight: 70, marginBottom: 10, fontSize: 13 }}
                    placeholder="Are you affected by the same issue? Leave a comment (optional)..."
                    value={supportComment}
                    onChange={(e) => setSupportComment(e.target.value)}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleCommunitySupport} disabled={submittingSupport} id="support-complaint-btn">
                    {submittingSupport ? <div className="spinner spinner-sm" /> : <ThumbsUp size={14} />}
                    I'm Affected Too
                  </button>
                </div>
              )}

              {alreadySupported && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--cyan-glow-sm)', border: '1px solid var(--border-active)', fontSize: 13, color: 'var(--cyan)', marginBottom: 14 }}>
                  ✅ You've registered your support for this complaint.
                </div>
              )}

              {complaint.communitySupport?.slice(0, 5).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                    {s.userId?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.userId?.name || 'Anonymous'}</span>
                    {s.comment && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Student Verification Panel */}
          {needsVerification && (
            <motion.div
              className="card"
              style={{ padding: 24, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.25)' }}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--amber)' }}>
                ⏳ Please Verify the Resolution
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                The maintenance team has marked this complaint as completed. Please inspect the work and confirm whether the issue has been resolved.
              </p>

              {/* Rating */}
              <div style={{ marginBottom: 16 }}>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Rate the resolution (required if satisfied)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setSatisfiedRating(n)}
                      style={{
                        width: 44, height: 44, borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: n <= satisfiedRating ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        fontSize: 22, transition: 'all 0.2s',
                      }}
                    >
                      {n <= satisfiedRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="form-input form-textarea"
                style={{ minHeight: 80, marginBottom: 16, fontSize: 13 }}
                placeholder="Optional: Describe your experience or what's still not working..."
                value={verifyComment}
                onChange={(e) => setVerifyComment(e.target.value)}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="btn btn-success"
                  onClick={() => handleVerify(true)}
                  disabled={submittingVerify}
                  id="verify-resolved-btn"
                  style={{ flex: 1 }}
                >
                  <CheckCircle size={16} /> Yes, Issue is Resolved
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleVerify(false)}
                  disabled={submittingVerify}
                  id="verify-not-resolved-btn"
                  style={{ flex: 1 }}
                >
                  <RefreshCw size={16} /> Not Resolved, Reopen
                </button>
              </div>
            </motion.div>
          )}

          {/* Closed verification result */}
          {complaint.status === 'closed' && complaint.studentVerification?.verified && (
            <div className="card" style={{ padding: 20, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <CheckCircle size={20} style={{ color: 'var(--emerald)' }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--emerald)' }}>Complaint Resolved & Closed</h3>
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[1,2,3,4,5].map((n) => (
                  <span key={n} style={{ fontSize: 18 }}>{n <= (complaint.studentVerification.rating || 0) ? '⭐' : '☆'}</span>
                ))}
              </div>
              {complaint.studentVerification.comment && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{complaint.studentVerification.comment}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status Timeline */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>📋 Complaint Timeline</h3>
            <div className="timeline">
              {complaint.timeline?.map((event, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot-wrapper">
                    <div className="timeline-dot" style={{ background: `${getStatusColor(event.status)}20`, border: `2px solid ${getStatusColor(event.status)}40` }}>
                      <span style={{ fontSize: 14 }}>{TIMELINE_ICONS[event.status] || '📌'}</span>
                    </div>
                    {i < complaint.timeline.length - 1 && <div className="timeline-line" />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{STATUS_LABELS[event.status] || event.status}</div>
                    <div className="timeline-meta">
                      {event.performedByName} • {timeAgo(event.timestamp)}
                    </div>
                    {event.message && <p className="timeline-desc">{event.message}</p>}
                    {event.evidence?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {event.evidence.map((ev, j) => (
                          <a key={j} href={ev.url} target="_blank" rel="noreferrer">
                            <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                              {ev.type === 'image' ? <img src={ev.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎬</div>}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assignment Details */}
          {complaint.assignedTo && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>👷 Assigned Technician</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                  {complaint.assignedTo.name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '?'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{complaint.assignedTo.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{complaint.assignedTo.designation || complaint.assignedTo.role}</div>
                </div>
              </div>
            </div>
          )}

          {/* SLA Info */}
          {complaint.slaDeadline && complaint.status !== 'closed' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>⏰ SLA Deadline</h3>
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: new Date() > new Date(complaint.slaDeadline) ? 'var(--rose-glow)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${new Date() > new Date(complaint.slaDeadline) ? 'rgba(244,63,94,0.3)' : 'var(--border-subtle)'}`,
              }}>
                <div style={{ fontSize: 13, color: new Date() > new Date(complaint.slaDeadline) ? 'var(--rose)' : 'var(--text-secondary)' }}>
                  {new Date() > new Date(complaint.slaDeadline) ? '⚠️ SLA Deadline Breached' : ''}
                  {formatDate(complaint.slaDeadline)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
