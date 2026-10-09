import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList,
  RefreshControl 
} from 'react-native';
import { useAuth } from '../../store/authStore';
import { complaintAPI } from '../../services/api';
import { COLORS, STATUS_CONFIG, CATEGORY_ICONS, SHADOWS } from '../../theme/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecentComplaints = async () => {
    try {
      const response = await complaintAPI.getAll({ limit: 4 });
      const list = response.data?.complaints || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentComplaints();
  };

  useEffect(() => {
    fetchRecentComplaints();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'U';
    return parts.map(n => n ? n[0] : '').filter(Boolean).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const formatLocation = (loc) => {
    if (!loc) return 'Campus Location';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      return [loc.building, loc.floor ? `Fl. ${loc.floor}` : '', loc.room ? `Rm. ${loc.room}` : '']
        .filter(Boolean)
        .join(' • ') || 'Campus Location';
    }
    return 'Campus Location';
  };

  const renderStatCard = (title, count, icon, color, bg) => (
    <View style={[styles.statCard, SHADOWS.card]}>
      <View style={[styles.statIconCircle, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderComplaintItem = ({ item }) => {
    if (!item) return null;
    const statusCfg = STATUS_CONFIG[item.status] || { label: item.status || 'Active', color: COLORS.primary, bg: COLORS.primaryLight, icon: '📋' };
    const categoryIcon = CATEGORY_ICONS[item.category] || '📌';
    const locText = formatLocation(item.location);

    return (
      <TouchableOpacity 
        style={[styles.complaintCard, SHADOWS.card]}
        onPress={() => navigation.navigate('Complaints')}
        activeOpacity={0.7}
      >
        <View style={styles.complaintHeader}>
          <View style={styles.titleRow}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>{categoryIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.complaintTitle} numberOfLines={1}>{item.title || 'Untitled Issue'}</Text>
              <Text style={styles.complaintLocation} numberOfLines={1}>📍 {locText}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.badgeText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <View style={styles.complaintFooter}>
          <Text style={styles.complaintCategory}>{(item.category || 'general').replace(/_/g, ' ')}</Text>
          {item.aiAnalysis?.processed && (
            <Text style={styles.aiProcessedTag}>🤖 AI Evaluated</Text>
          )}
          <Text style={styles.dateText}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const safeComplaints = complaints || [];
  const totalCount = safeComplaints.length;
  const pendingCount = safeComplaints.filter(c => c && !['completed', 'closed', 'rejected'].includes(c.status)).length;
  const resolvedCount = safeComplaints.filter(c => c && ['completed', 'closed'].includes(c.status)).length;
  const emergencyCount = safeComplaints.filter(c => c && c.isEmergency).length;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Top University Brand Bar */}
      <View style={styles.topBrandBar}>
        <View style={styles.universityBadge}>
          <Text style={styles.universityBadgeText}>🎓 AMRITA VISHWA VIDYAPEETHAM</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </TouchableOpacity>
      </View>

      {/* Greeting Banner */}
      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>{getGreeting()},</Text>
        <Text style={styles.userNameText}>{user?.name || 'Amrita Student'}</Text>
        <Text style={styles.userRolePill}>
          {user?.role?.toUpperCase() || 'STUDENT'} • {user?.department || 'CCE'} {user?.hostelBlock ? `• ${user.hostelBlock}` : ''}
        </Text>
      </View>

      {/* AI Engine Status Chip */}
      <View style={styles.aiEngineBanner}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>⚡</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiEngineTitle}>Gemini 3.6 Flash Active</Text>
          <Text style={styles.aiEngineSubtitle}>Zero-shot complaint triage, duplicate checks & SLA active</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatCard('Total Logged', totalCount, '📑', COLORS.primary, COLORS.primaryLight)}
        {renderStatCard('In Progress', pendingCount, '⏳', COLORS.amber, COLORS.amberLight)}
        {renderStatCard('Resolved', resolvedCount, '✅', COLORS.emerald, COLORS.emeraldLight)}
        {renderStatCard('Emergencies', emergencyCount, '🚨', COLORS.rose, COLORS.roseLight)}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.actionPrimary, SHADOWS.card]}
          onPress={() => navigation.navigate('NewComplaint')}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionTitlePrimary}>Report Issue</Text>
          <Text style={styles.actionSubPrimary}>AI categorizes & routes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.actionSecondary, SHADOWS.card]}
          onPress={() => navigation.navigate('LostFound')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionTitleSecondary}>Lost & Found</Text>
          <Text style={styles.actionSubSecondary}>AI matching engine</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.actionSecondary, SHADOWS.card]}
          onPress={() => navigation.navigate('Complaints')}
        >
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionTitleSecondary}>Track Tickets</Text>
          <Text style={styles.actionSubSecondary}>Timeline & AI reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.actionSecondary, SHADOWS.card]}
          onPress={() => navigation.navigate('Governance')}
        >
          <Text style={styles.actionIcon}>🗳️</Text>
          <Text style={styles.actionTitleSecondary}>Petitions & Polls</Text>
          <Text style={styles.actionSubSecondary}>Student voice & voting</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Issues Feed */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>RECENT CAMPUS TICKETS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Complaints')}>
          <Text style={styles.seeAllText}>View All →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : safeComplaints.length > 0 ? (
        <FlatList
          data={safeComplaints.slice(0, 3)}
          keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
          renderItem={renderComplaintItem}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyCard}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
          <Text style={styles.emptyText}>No recent maintenance issues logged.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  content: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  topBrandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  universityBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  universityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.card,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 14,
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  userRolePill: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  aiEngineBanner: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiEngineTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B21A8',
  },
  aiEngineSubtitle: {
    fontSize: 11,
    color: '#7E22CE',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.bgCard,
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
  },
  actionPrimary: {
    backgroundColor: COLORS.primary,
  },
  actionSecondary: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionTitlePrimary: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  actionSubPrimary: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
  },
  actionTitleSecondary: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  actionSubSecondary: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  complaintCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  complaintTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  complaintLocation: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  complaintCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  aiProcessedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.violet,
    backgroundColor: COLORS.violetLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    color: COLORS.textDisabled,
  },
  emptyCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
