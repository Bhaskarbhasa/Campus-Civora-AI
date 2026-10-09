import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Alert 
} from 'react-native';
import { complaintAPI } from '../../services/api';
import { COLORS, STATUS_CONFIG, CATEGORY_ICONS, SHADOWS } from '../../theme/theme';
import { useAuth } from '../../store/authStore';

export default function ComplaintsScreen({ navigation }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Detail modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      const response = await complaintAPI.getAll();
      const list = response.data?.complaints || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openComplaintDetail = async (complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
    // Fetch latest fresh data with comments
    try {
      const res = await complaintAPI.getById(complaint._id || complaint.id);
      if (res.data?.complaint) {
        setSelectedComplaint(res.data.complaint);
      }
    } catch (err) {
      console.warn('Could not refresh single complaint', err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedComplaint) return;
    setSendingComment(true);
    try {
      const res = await complaintAPI.addComment(selectedComplaint._id || selectedComplaint.id, commentText.trim());
      if (res.data?.complaint) {
        setSelectedComplaint(res.data.complaint);
      }
      setCommentText('');
      fetchComplaints();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not send update.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleSupport = async () => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      await complaintAPI.supportComplaint(selectedComplaint._id || selectedComplaint.id);
      Alert.alert('Success', 'Community support added!');
      // Refresh modal
      const res = await complaintAPI.getById(selectedComplaint._id || selectedComplaint.id);
      if (res.data?.complaint) setSelectedComplaint(res.data.complaint);
      fetchComplaints();
    } catch (err) {
      Alert.alert('Notice', err.response?.data?.message || 'Could not add support.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyCompletion = async (satisfied) => {
    if (!selectedComplaint) return;
    setActionLoading(true);
    try {
      await complaintAPI.verifyCompletion(selectedComplaint._id || selectedComplaint.id, {
        satisfied,
        feedback: satisfied ? 'Work verified and approved by student.' : 'Issue persists, rework requested.'
      });
      Alert.alert(
        satisfied ? 'Verified!' : 'Feedback Submitted', 
        satisfied ? 'Thank you for verifying completion.' : 'Complaint has been reopened for technician rework.'
      );
      setModalVisible(false);
      fetchComplaints();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatLocation = (loc) => {
    if (!loc) return 'Campus Location';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      return [loc.building, loc.floor ? `Floor ${loc.floor}` : '', loc.room ? `Room ${loc.room}` : '']
        .filter(Boolean)
        .join(' • ') || 'Campus Location';
    }
    return 'Campus Location';
  };

  const filteredComplaints = (complaints || []).filter(c => {
    if (!c) return false;
    const matchesSearch = !searchQuery || 
      (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filter === 'All') return true;
    if (filter === 'Active') return !['completed', 'closed', 'rejected'].includes(c.status);
    if (filter === 'In Progress') return ['assigned', 'work_in_progress'].includes(c.status);
    if (filter === 'Resolved') return ['completed', 'closed'].includes(c.status);
    return true;
  });

  const renderItem = ({ item }) => {
    if (!item) return null;
    const statusCfg = STATUS_CONFIG[item.status] || { label: item.status || 'Submitted', color: COLORS.primary, bg: COLORS.primaryLight, icon: '📄' };
    const categoryIcon = CATEGORY_ICONS[item.category] || '📌';
    const locText = formatLocation(item.location);

    return (
      <TouchableOpacity 
        style={[styles.card, SHADOWS.card]} 
        onPress={() => openComplaintDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryIcon}>{categoryIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Untitled Issue'}</Text>
              <Text style={styles.cardLocation} numberOfLines={1}>📍 {locText}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>
              {statusCfg.icon} {statusCfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaLeft}>
            <Text style={styles.categoryPill}>{item.category?.replace(/_/g, ' ') || 'General'}</Text>
            {item.isEmergency && (
              <View style={styles.emergencyChip}>
                <Text style={styles.emergencyChipText}>🚨 Emergency</Text>
              </View>
            )}
            {item.aiAnalysis?.processed && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>🤖 AI Analyzed</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>COMPLAINT MANAGEMENT</Text>
            <Text style={styles.headerTitle}>Campus Issues & Tickets</Text>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
            <Text style={{ fontSize: 18 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or category..."
            placeholderTextColor={COLORS.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: COLORS.textMuted }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Active', 'In Progress', 'Resolved'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, filter === tab && styles.filterChipActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterChipText, filter === tab && styles.filterChipTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Complaint List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading campus tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
              <Text style={styles.emptyTitle}>No Complaints Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try adjusting your search query' : 'You have not reported any issues yet.'}
              </Text>
            </View>
          }
        />
      )}
      
      {/* Floating Action Button for New Complaint */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewComplaint')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>➕</Text>
      </TouchableOpacity>

      {/* ================= COMPLAINT DETAIL MODAL ================= */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          {selectedComplaint && (
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Modal Top Bar */}
              <View style={styles.modalTopBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalSubHeader}>
                    TICKET #{String(selectedComplaint._id || selectedComplaint.id).substring(18).toUpperCase()}
                  </Text>
                  <Text style={styles.modalMainTitle}>{selectedComplaint.title}</Text>
                </View>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Status & Priority Row */}
              <View style={styles.statusRow}>
                {(() => {
                  const sc = STATUS_CONFIG[selectedComplaint.status] || { label: selectedComplaint.status || 'Active', color: COLORS.primary, bg: COLORS.primaryLight, icon: '📋' };
                  return (
                    <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                      <Text style={[styles.statusPillText, { color: sc.color }]}>
                        {sc.icon} {sc.label}
                      </Text>
                    </View>
                  );
                })()}

                <View style={[styles.priorityPill, selectedComplaint.isEmergency && styles.priorityEmergency]}>
                  <Text style={[styles.priorityPillText, selectedComplaint.isEmergency && styles.priorityEmergencyText]}>
                    {selectedComplaint.isEmergency ? '🚨 EMERGENCY' : `Priority: ${(selectedComplaint.priority || 'medium').toUpperCase()}`}
                  </Text>
                </View>

                {selectedComplaint.aiAnalysis?.processed && (
                  <View style={styles.aiChip}>
                    <Text style={styles.aiChipText}>🤖 Gemini 3.6 Flash</Text>
                  </View>
                )}
              </View>

              {/* Location Card */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionHeading}>📍 LOCATION & CATEGORY</Text>
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyText}>Campus Area:</Text>
                  <Text style={styles.valText}>{formatLocation(selectedComplaint.location)}</Text>
                </View>
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyText}>Category:</Text>
                  <Text style={styles.valText}>{(selectedComplaint.category || 'general').replace(/_/g, ' ')}</Text>
                </View>
                {selectedComplaint.assignedDepartment && (
                  <View style={styles.keyValueRow}>
                    <Text style={styles.keyText}>Assigned Dept:</Text>
                    <Text style={[styles.valText, { color: COLORS.primary, fontWeight: '700' }]}>
                      {selectedComplaint.assignedDepartment}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description Card */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionHeading}>📝 ISSUE DESCRIPTION</Text>
                <Text style={styles.descriptionBody}>{selectedComplaint.description}</Text>
              </View>

              {/* 🤖 GEMINI AI ANALYSIS REPORT */}
              {selectedComplaint.aiAnalysis?.processed && (
                <View style={styles.aiReportCard}>
                  <View style={styles.aiReportHeader}>
                    <Text style={styles.aiReportTitle}>✨ AI Diagnostic & Routing Report</Text>
                    <Text style={styles.aiModelBadge}>Gemini 3.6 Flash</Text>
                  </View>

                  <View style={styles.aiGrid}>
                    <View style={styles.aiMetricBox}>
                      <Text style={styles.aiMetricLabel}>SUGGESTED DEPT</Text>
                      <Text style={styles.aiMetricVal}>{selectedComplaint.aiAnalysis.suggestedDepartment || 'Facilities'}</Text>
                    </View>

                    <View style={styles.aiMetricBox}>
                      <Text style={styles.aiMetricLabel}>PREDICTED PRIORITY</Text>
                      <Text style={styles.aiMetricVal}>{(selectedComplaint.aiAnalysis.predictedPriority || selectedComplaint.priority || 'Medium').toUpperCase()}</Text>
                    </View>

                    <View style={styles.aiMetricBox}>
                      <Text style={styles.aiMetricLabel}>URGENCY SCORE</Text>
                      <Text style={styles.aiMetricVal}>
                        {selectedComplaint.aiAnalysis.sentimentScore ? `${Math.round(selectedComplaint.aiAnalysis.sentimentScore * 100)}%` : '85%'}
                      </Text>
                    </View>

                    <View style={styles.aiMetricBox}>
                      <Text style={styles.aiMetricLabel}>CONFIDENCE</Text>
                      <Text style={styles.aiMetricVal}>
                        {selectedComplaint.aiAnalysis.confidence ? `${Math.round(selectedComplaint.aiAnalysis.confidence * 100)}%` : '92%'}
                      </Text>
                    </View>
                  </View>

                  {selectedComplaint.aiAnalysis.summary && (
                    <View style={styles.aiSummaryContainer}>
                      <Text style={styles.aiSummaryLabel}>AI Executive Summary:</Text>
                      <Text style={styles.aiSummaryContent}>{selectedComplaint.aiAnalysis.summary}</Text>
                    </View>
                  )}

                  {selectedComplaint.aiAnalysis.isDuplicate && (
                    <View style={styles.duplicateWarning}>
                      <Text style={styles.duplicateWarningText}>
                        ⚠️ Potential Duplicate: Flagged by AI as identical to another ticket in this block.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Photographic Evidence */}
              {selectedComplaint.evidenceFiles && selectedComplaint.evidenceFiles.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeading}>📷 EVIDENCE ATTACHED</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {selectedComplaint.evidenceFiles.map((file, idx) => (
                      <View key={idx} style={styles.evidenceThumb}>
                        {file.url ? (
                          <Image source={{ uri: file.url }} style={styles.evidenceImage} />
                        ) : (
                          <Text style={{ color: COLORS.textMuted }}>Document #{idx + 1}</Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Community Support & Actions */}
              <View style={styles.supportBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supportCountText}>
                    👍 {(selectedComplaint.communitySupport || []).length} Students Supported
                  </Text>
                  <Text style={styles.supportSubText}>Upvote to raise urgency with administration</Text>
                </View>
                <TouchableOpacity 
                  style={styles.supportBtn} 
                  onPress={handleSupport}
                  disabled={actionLoading}
                >
                  <Text style={styles.supportBtnText}>+ Support</Text>
                </TouchableOpacity>
              </View>

              {/* Student Completion Verification */}
              {['completed', 'pending_student_verification'].includes(selectedComplaint.status) && (
                <View style={styles.verificationCard}>
                  <Text style={styles.verificationTitle}>⭐ Technician Completed Work</Text>
                  <Text style={styles.verificationDesc}>
                    Please verify if the physical maintenance work was completed satisfactorily.
                  </Text>
                  <View style={styles.verificationActions}>
                    <TouchableOpacity 
                      style={[styles.verifBtn, styles.verifBtnApprove]}
                      onPress={() => handleVerifyCompletion(true)}
                    >
                      <Text style={styles.verifBtnText}>✅ Yes, Verified</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.verifBtn, styles.verifBtnReject]}
                      onPress={() => handleVerifyCompletion(false)}
                    >
                      <Text style={[styles.verifBtnText, { color: COLORS.rose }]}>❌ Needs Rework</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Live Comments & Discussion */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionHeading}>💬 LIVE DISCUSSION & UPDATES</Text>
                {(!selectedComplaint.comments || selectedComplaint.comments.length === 0) ? (
                  <Text style={styles.noCommentsText}>No comments yet. Send a message to technician or warden.</Text>
                ) : (
                  selectedComplaint.comments.map((com, i) => (
                    <View key={i} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{com.name || 'User'}</Text>
                        <Text style={styles.commentRole}>{com.role?.toUpperCase() || 'STUDENT'}</Text>
                      </View>
                      <Text style={styles.commentBody}>{com.text}</Text>
                    </View>
                  ))
                )}

                {/* Add comment bar */}
                <View style={styles.commentInputRow}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Type an update or question..."
                    placeholderTextColor={COLORS.textDisabled}
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity 
                    style={styles.commentSendBtn}
                    onPress={handleAddComment}
                    disabled={sendingComment}
                  >
                    {sendingComment ? (
                      <ActivityIndicator color={COLORS.white} size="small" />
                    ) : (
                      <Text style={styles.commentSendText}>Send</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.bgSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  emergencyChip: {
    backgroundColor: COLORS.roseLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  emergencyChipText: {
    color: COLORS.rose,
    fontSize: 10,
    fontWeight: '700',
  },
  aiBadge: {
    backgroundColor: COLORS.violetLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: COLORS.violet,
    fontSize: 10,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textDisabled,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Modal styles
  modalRoot: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  modalScroll: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalSubHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  modalMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priorityPill: {
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  priorityEmergency: {
    backgroundColor: COLORS.roseLight,
    borderColor: COLORS.rose,
  },
  priorityEmergencyText: {
    color: COLORS.rose,
  },
  aiChip: {
    backgroundColor: COLORS.violetLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.violet,
  },
  infoSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  keyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  valText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  descriptionBody: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  aiReportCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  aiReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiReportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B21A8',
  },
  aiModelBadge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  aiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  aiMetricBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  aiMetricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9333EA',
    marginBottom: 2,
  },
  aiMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  aiSummaryContainer: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  aiSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginBottom: 4,
  },
  aiSummaryContent: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  duplicateWarning: {
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  duplicateWarningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  evidenceThumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.bgSecondary,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  supportBox: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  supportCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  supportSubText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  supportBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  supportBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  verificationCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 4,
  },
  verificationDesc: {
    fontSize: 12,
    color: '#047857',
    marginBottom: 12,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  verifBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  verifBtnApprove: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  verifBtnReject: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.rose,
  },
  verifBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  noCommentsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginVertical: 6,
  },
  commentItem: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  commentRole: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  commentSendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  commentSendText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.elevated,
  },
  fabIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
});
