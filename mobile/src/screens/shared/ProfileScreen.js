import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { useAuth } from '../../store/authStore';
import { COLORS, SHADOWS } from '../../theme/theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U';
    const parts = name.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return 'U';
    return parts.map(n => n ? n[0] : '').filter(Boolean).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Campus Civora AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: logout 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.univBadge}>
          <Text style={styles.univBadgeText}>🎓 AMRITA VISHWA VIDYAPEETHAM</Text>
        </View>
        <Text style={styles.headerTitle}>Student Profile</Text>
      </View>

      {/* User Card */}
      <View style={[styles.profileCard, SHADOWS.card]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Student Name'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'student@ch.students.amrita.edu'}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            🛡️ {(user?.role || 'STUDENT').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Campus Info Section */}
      <View style={[styles.infoCard, SHADOWS.card]}>
        <Text style={styles.sectionHeader}>ACADEMIC & RESIDENTIAL DETAILS</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department</Text>
          <Text style={styles.infoValue}>{user?.department || 'CCE (Computer & Communication)'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hostel Block</Text>
          <Text style={styles.infoValue}>{user?.hostelBlock || 'Koushitaki Bhavan'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Academic Year</Text>
          <Text style={styles.infoValue}>{user?.year ? `${user.year} Year` : '3rd Year'}</Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Account Status</Text>
          <Text style={[styles.infoValue, { color: COLORS.emerald, fontWeight: '700' }]}>
            ✓ Verified Amrita Student
          </Text>
        </View>
      </View>

      {/* AI & Infrastructure Engine Diagnostics */}
      <View style={[styles.infoCard, SHADOWS.card]}>
        <Text style={styles.sectionHeader}>CAMPUS CIVORA AI ENGINE</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AI Model</Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>⚡ Gemini 3.6 Flash</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cloud API</Text>
          <Text style={styles.infoValue}>Render Production (Live)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database</Text>
          <Text style={styles.infoValue}>MongoDB Atlas Multi-AZ</Text>
        </View>

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Mobile Client</Text>
          <Text style={styles.infoValue}>v1.0.3 (Build 4) Production</Text>
        </View>
      </View>

      {/* Quick Navigation Links */}
      <View style={[styles.infoCard, SHADOWS.card]}>
        <Text style={styles.sectionHeader}>QUICK SHORTCUTS</Text>

        <TouchableOpacity 
          style={styles.navRow} 
          onPress={() => navigation.navigate('Complaints')}
        >
          <Text style={styles.navIcon}>📋</Text>
          <Text style={styles.navText}>View My Active Tickets</Text>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navRow} 
          onPress={() => navigation.navigate('Governance')}
        >
          <Text style={styles.navIcon}>🗳️</Text>
          <Text style={styles.navText}>Campus Petitions & Polls</Text>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navRow, { borderBottomWidth: 0 }]} 
          onPress={() => navigation.navigate('LostFound')}
        >
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navText}>Lost & Found Recovery Hub</Text>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out of Campus Civora</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Campus Civora AI • Department of CCE • Amrita Vishwa Vidyapeetham
      </Text>
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
  header: {
    marginBottom: 16,
  },
  univBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  univBadgeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgSecondary,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  aiTag: {
    backgroundColor: COLORS.violetLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiTagText: {
    color: COLORS.violet,
    fontSize: 11,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgSecondary,
  },
  navIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  navText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  navArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  logoutBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.rose,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: COLORS.rose,
    fontWeight: '700',
    fontSize: 14,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
