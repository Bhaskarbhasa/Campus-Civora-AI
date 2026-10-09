import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  FlatList 
} from 'react-native';
import { useAuth } from '../../store/authStore';
import { complaintAPI } from '../../services/api';

const STATUS_COLORS = {
  submitted: '#6C63FF',
  ai_processing: '#F59E0B',
  under_verification: '#3B82F6',
  verified: '#10B981',
  approved: '#10B981',
  assigned: '#F97316',
  work_in_progress: '#F97316',
  completed: '#10B981',
  closed: '#6B7280',
  rejected: '#F43F5E',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentComplaints = async () => {
    try {
      const response = await complaintAPI.getAll({ limit: 3 });
      const list = response.data?.complaints || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
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

  const renderStatCard = (title, count, color) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statCount, { color }]}>{count}</Text>
    </View>
  );

  const renderComplaintItem = ({ item }) => {
    if (!item) return null;
    const statusText = (item.status || 'submitted').toString().replace(/_/g, ' ').toUpperCase();
    const categoryText = (item.category || 'general').toString().replace(/_/g, ' ');
    return (
      <View style={styles.complaintCard}>
        <View style={styles.complaintHeader}>
          <Text style={styles.complaintTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>
        <Text style={styles.complaintCategory}>{categoryText}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.name || 'Student'}</Text>
      </View>

      <View style={styles.statsGrid}>
        {renderStatCard('Total Complaints', complaints.length, '#FFFFFF')}
        {renderStatCard('Pending', (complaints || []).filter(c => c && !['completed', 'closed', 'rejected'].includes(c.status)).length, '#F59E0B')}
        {renderStatCard('Resolved', (complaints || []).filter(c => c && ['completed', 'closed'].includes(c.status)).length, '#10B981')}
        {renderStatCard('Notifications', '0', '#6C63FF')}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NewComplaint')}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Report Issue</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#2A2A3E' }]}
          onPress={() => navigation.navigate('LostFound')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Lost & Found</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
      ) : complaints.length > 0 ? (
        <FlatList
          data={complaints.slice(0, 3)}
          keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
          renderItem={renderComplaintItem}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recent complaints.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#8B8BA7',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1A1A2E',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statTitle: {
    color: '#8B8BA7',
    fontSize: 12,
    marginBottom: 8,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#6C63FF',
    flex: 1,
    marginHorizontal: 4,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  complaintCard: {
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  complaintTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  complaintCategory: {
    color: '#8B8BA7',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
  },
  emptyText: {
    color: '#8B8BA7',
  }
});
