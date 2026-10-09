import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { petitionAPI, pollAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';
import { useAuth } from '../../store/authStore';

const PETITION_STATUS_CONFIG = {
  active: { label: 'Active', color: COLORS.primary, bg: COLORS.primaryLight },
  under_review: { label: 'Under Review', color: COLORS.amber, bg: COLORS.amberLight },
  approved: { label: 'Approved', color: COLORS.emerald, bg: COLORS.emeraldLight },
  implemented: { label: 'Implemented', color: COLORS.emerald, bg: COLORS.emeraldLight },
  rejected: { label: 'Rejected', color: COLORS.rose, bg: COLORS.roseLight },
  closed: { label: 'Closed', color: COLORS.textMuted, bg: COLORS.bgSecondary },
};

const TARGET_TYPES = [
  { id: 'university', label: 'University-Wide' },
  { id: 'department', label: 'Department' },
  { id: 'hostel', label: 'Hostel Block' },
];

export default function GovernanceScreen({ navigation }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('petitions'); // 'petitions' | 'polls'
  
  // Petitions state
  const [petitions, setPetitions] = useState([]);
  const [petitionsLoading, setPetitionsLoading] = useState(true);
  const [petitionFilter, setPetitionFilter] = useState('All');
  const [newPetitionModal, setNewPetitionModal] = useState(false);
  const [creatingPetition, setCreatingPetition] = useState(false);
  
  // New petition form state
  const [petTitle, setPetTitle] = useState('');
  const [petDesc, setPetDesc] = useState('');
  const [petPurpose, setPetPurpose] = useState('');
  const [petOutcome, setPetOutcome] = useState('');
  const [petTargetType, setPetTargetType] = useState('university');
  const [petTargetVal, setPetTargetVal] = useState('');

  // Polls state
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [votingPollId, setVotingPollId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchPetitions = async () => {
    try {
      const res = await petitionAPI.getAll();
      const list = res.data?.petitions || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setPetitions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to fetch petitions', err);
      setPetitions([]);
    } finally {
      setPetitionsLoading(false);
    }
  };

  const fetchPolls = async () => {
    try {
      const res = await pollAPI.getAll();
      const list = res.data?.polls || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setPolls(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to fetch polls', err);
      setPolls([]);
    } finally {
      setPollsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'petitions') {
      await fetchPetitions();
    } else {
      await fetchPolls();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPetitions();
    fetchPolls();
  }, []);

  // Handle Petition Sign / Support
  const handleSignPetition = async (petitionId) => {
    try {
      await petitionAPI.support(petitionId, 'Supported from Campus Civora mobile app');
      Alert.alert('Petition Signed! ✍️', 'Thank you for making your voice heard.');
      fetchPetitions();
    } catch (err) {
      Alert.alert('Notice', err.response?.data?.message || 'You may have already signed this petition.');
    }
  };

  // Handle Create Petition
  const handleCreatePetition = async () => {
    if (!petTitle.trim() || !petDesc.trim() || !petPurpose.trim() || !petOutcome.trim()) {
      Alert.alert('Incomplete Form', 'Please fill out all required fields.');
      return;
    }

    setCreatingPetition(true);
    try {
      const payload = {
        title: petTitle.trim(),
        description: petDesc.trim(),
        purpose: petPurpose.trim(),
        expectedOutcome: petOutcome.trim(),
        targetCommunity: {
          type: petTargetType,
          value: petTargetType === 'university' ? 'Campus-Wide' : (petTargetVal || user?.department || 'General'),
        },
      };

      await petitionAPI.create(payload);
      setCreatingPetition(false);
      setNewPetitionModal(false);
      
      // Reset form
      setPetTitle('');
      setPetDesc('');
      setPetPurpose('');
      setPetOutcome('');
      setPetTargetVal('');

      Alert.alert('Success 🎉', 'Your campus petition has been published.');
      fetchPetitions();
    } catch (err) {
      setCreatingPetition(false);
      Alert.alert('Error', err.response?.data?.message || 'Could not create petition.');
    }
  };

  // Handle Poll Vote
  const handleVotePoll = async (pollId, optionId) => {
    setVotingPollId(pollId);
    try {
      await pollAPI.vote(pollId, [optionId]);
      Alert.alert('Vote Recorded! 🗳️', 'Your response has been added to the university tally.');
      fetchPolls();
    } catch (err) {
      Alert.alert('Notice', err.response?.data?.message || 'You may have already voted in this poll.');
    } finally {
      setVotingPollId(null);
    }
  };

  // Safe string helper for target community
  const formatCommunity = (target) => {
    if (!target) return 'Amrita University';
    if (typeof target === 'string') return target;
    if (typeof target === 'object') {
      const typeStr = target.type ? target.type.toUpperCase() : 'CAMPUS';
      const valStr = target.value ? `: ${target.value}` : '';
      return `${typeStr}${valStr}`;
    }
    return 'Amrita University';
  };

  const filteredPetitions = petitions.filter(p => {
    if (petitionFilter === 'All') return true;
    return p.status === petitionFilter.toLowerCase().replace(/ /g, '_');
  });

  const renderPetitionItem = ({ item }) => {
    if (!item) return null;
    const statusCfg = PETITION_STATUS_CONFIG[item.status] || { label: item.status || 'Active', color: COLORS.primary, bg: COLORS.primaryLight };
    const supportCount = item.supportCount || (item.supportVotes ? item.supportVotes.length : 0);
    const targetGoal = 50; // default milestone
    const progressPct = Math.min(Math.round((supportCount / targetGoal) * 100), 100);

    const hasSigned = Array.isArray(item.supportVotes) && item.supportVotes.some(v => 
      (v.userId?._id || v.userId || v) === (user?._id || user?.id)
    );

    return (
      <View style={[styles.card, SHADOWS.card]}>
        {/* Top Badges */}
        <View style={styles.cardTopRow}>
          <View style={styles.targetBadge}>
            <Text style={styles.targetBadgeText}>🏛️ {formatCommunity(item.targetCommunity)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Title & Creator */}
        <Text style={styles.cardTitle}>{item.title || 'Untitled Petition'}</Text>
        <Text style={styles.cardMeta}>
          Proposed by {item.creatorId?.name || 'Student'} • {new Date(item.createdAt || Date.now()).toLocaleDateString()}
        </Text>

        {/* Description snippet */}
        <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>

        {/* AI Summary Chip if present */}
        {item.aiSummary && (
          <View style={styles.aiSummaryBox}>
            <Text style={styles.aiSummaryLabel}>🤖 Gemini AI Synthesis:</Text>
            <Text style={styles.aiSummaryText} numberOfLines={2}>{item.aiSummary}</Text>
          </View>
        )}

        {/* Signatures Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              <Text style={{ fontWeight: '800', color: COLORS.textPrimary }}>{supportCount}</Text> of {targetGoal} Signatures
            </Text>
            <Text style={styles.progressPercent}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.cardActions}>
          {hasSigned ? (
            <View style={styles.signedBadge}>
              <Text style={styles.signedBadgeText}>✓ You Signed This Petition</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.signBtn, item.status !== 'active' && styles.disabledBtn]}
              onPress={() => handleSignPetition(item._id || item.id)}
              disabled={item.status !== 'active'}
            >
              <Text style={styles.signBtnText}>✍️ Sign Petition (Support)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPollItem = ({ item }) => {
    if (!item) return null;
    const totalVotes = item.totalVotes || (item.options ? item.options.reduce((acc, o) => acc + (o.voteCount || 0), 0) : 0);
    const isClosed = item.status === 'closed' || (item.closeAt && new Date() > new Date(item.closeAt));
    const isVotingThis = votingPollId === (item._id || item.id);

    return (
      <View style={[styles.card, SHADOWS.card]}>
        <View style={styles.cardTopRow}>
          <View style={[styles.targetBadge, { backgroundColor: COLORS.cyanLight }]}>
            <Text style={[styles.targetBadgeText, { color: COLORS.cyan }]}>
              📊 {(item.category || 'General').toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isClosed ? COLORS.bgSecondary : COLORS.emeraldLight }]}>
            <Text style={[styles.statusBadgeText, { color: isClosed ? COLORS.textMuted : COLORS.emerald }]}>
              {isClosed ? 'Closed' : 'Active'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{item.question || 'Campus Poll'}</Text>
        {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}

        <Text style={styles.pollTotalText}>Total Votes: {totalVotes} Student{totalVotes === 1 ? '' : 's'}</Text>

        {/* Options List */}
        <View style={styles.pollOptionsContainer}>
          {(item.options || []).map((opt) => {
            const count = opt.voteCount || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

            return (
              <TouchableOpacity
                key={opt.id || opt.text}
                style={[styles.pollOptionBtn, isClosed && styles.pollOptionBtnDisabled]}
                onPress={() => !isClosed && handleVotePoll(item._id || item.id, opt.id)}
                disabled={isClosed || isVotingThis}
                activeOpacity={0.7}
              >
                <View style={[styles.pollOptionFill, { width: `${pct}%` }]} />
                <View style={styles.pollOptionContent}>
                  <Text style={styles.pollOptionText}>{opt.text}</Text>
                  <Text style={styles.pollOptionVotes}>{count} ({pct}%)</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {item.closeAt && (
          <Text style={styles.pollExpiry}>
            Closes: {new Date(item.closeAt).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSubtitle}>CAMPUS DEMOCRACY & CIVIC VOICE</Text>
          <TouchableOpacity 
            style={styles.newActionBtn}
            onPress={() => setNewPetitionModal(true)}
          >
            <Text style={styles.newActionBtnText}>+ Propose</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>University Governance</Text>

        {/* Segmented Tab Bar */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'petitions' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('petitions')}
          >
            <Text style={[styles.segmentText, activeTab === 'petitions' && styles.segmentTextActive]}>
              📜 Petitions ({petitions.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'polls' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('polls')}
          >
            <Text style={[styles.segmentText, activeTab === 'polls' && styles.segmentTextActive]}>
              🗳️ Polls ({polls.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === 'petitions' ? (
        <View style={{ flex: 1 }}>
          {/* Status Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {['All', 'Active', 'Under Review', 'Approved'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, petitionFilter === f && styles.filterChipActive]}
                onPress={() => setPetitionFilter(f)}
              >
                <Text style={[styles.filterChipText, petitionFilter === f && styles.filterChipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {petitionsLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Loading campus petitions...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredPetitions}
              keyExtractor={(item) => item._id || item.id || String(Math.random())}
              renderItem={renderPetitionItem}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>📜</Text>
                  <Text style={styles.emptyTitle}>No Petitions Found</Text>
                  <Text style={styles.emptySub}>
                    Be the first to advocate for campus improvement or facility upgrades.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {pollsLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={styles.loadingText}>Loading campus polls...</Text>
            </View>
          ) : (
            <FlatList
              data={polls}
              keyExtractor={(item) => item._id || item.id || String(Math.random())}
              renderItem={renderPollItem}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={{ fontSize: 44, marginBottom: 12 }}>🗳️</Text>
                  <Text style={styles.emptyTitle}>No Active Polls</Text>
                  <Text style={styles.emptySub}>
                    Administrative or student body polls will appear here when scheduled.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* New Petition Modal */}
      <Modal visible={newPetitionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>CAMPUS ADVOCACY</Text>
                <Text style={styles.modalTitle}>Propose a Petition</Text>
              </View>
              <TouchableOpacity onPress={() => setNewPetitionModal(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Petition Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Extended Central Library Hours During Exam Week"
                placeholderTextColor={COLORS.textDisabled}
                value={petTitle}
                onChangeText={setPetTitle}
              />

              <Text style={styles.fieldLabel}>Detailed Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Explain the background and why this change is essential..."
                placeholderTextColor={COLORS.textDisabled}
                multiline
                value={petDesc}
                onChangeText={setPetDesc}
              />

              <Text style={styles.fieldLabel}>Purpose / Motivation *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Provide quiet study spaces past 9 PM"
                placeholderTextColor={COLORS.textDisabled}
                value={petPurpose}
                onChangeText={setPetPurpose}
              />

              <Text style={styles.fieldLabel}>Expected Outcome *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Improved semester performance and safer late study"
                placeholderTextColor={COLORS.textDisabled}
                value={petOutcome}
                onChangeText={setPetOutcome}
              />

              <Text style={styles.fieldLabel}>Target Community</Text>
              <View style={styles.targetRow}>
                {TARGET_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.targetChip, petTargetType === t.id && styles.targetChipActive]}
                    onPress={() => setPetTargetType(t.id)}
                  >
                    <Text style={[styles.targetChipText, petTargetType === t.id && styles.targetChipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {petTargetType !== 'university' && (
                <TextInput
                  style={[styles.textInput, { marginTop: 8 }]}
                  placeholder={petTargetType === 'department' ? 'e.g. CCE, CSE, ECE' : 'e.g. Koushitaki Bhavan'}
                  placeholderTextColor={COLORS.textDisabled}
                  value={petTargetVal}
                  onChangeText={setPetTargetVal}
                />
              )}

              <TouchableOpacity
                style={[styles.submitBtn, creatingPetition && styles.disabledBtn]}
                onPress={handleCreatePetition}
                disabled={creatingPetition}
              >
                {creatingPetition ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Petition to Campus</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  newActionBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  newActionBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.card,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 56,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginRight: 8,
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
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  aiSummaryBox: {
    backgroundColor: COLORS.violetLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.violet,
  },
  aiSummaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.violet,
    marginBottom: 2,
  },
  aiSummaryText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  cardActions: {
    marginTop: 8,
  },
  signBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  signedBadge: {
    backgroundColor: COLORS.emeraldLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.emerald,
  },
  signedBadgeText: {
    color: COLORS.emerald,
    fontWeight: '700',
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pollTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  pollOptionsContainer: {
    marginBottom: 10,
  },
  pollOptionBtn: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
    height: 44,
    justifyContent: 'center',
  },
  pollOptionBtnDisabled: {
    opacity: 0.85,
  },
  pollOptionFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  pollOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  pollOptionVotes: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pollExpiry: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textMuted,
    padding: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: COLORS.bgPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  targetRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  targetChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 8,
    marginRight: 6,
  },
  targetChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  targetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  targetChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
