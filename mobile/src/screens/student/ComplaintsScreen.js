import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
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

const CATEGORY_ICONS = {
  electrical: '⚡',
  plumbing: '💧',
  internet_connectivity: '🌐',
  housekeeping: '🧹',
  civil_maintenance: '🏗️',
  general_administration: '🏢'
};

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchComplaints = async () => {
    try {
      const response = await complaintAPI.getAll();
      const list = response.data?.complaints || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setComplaints(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch complaints', error);
      setComplaints([]);
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

  const filteredComplaints = (complaints || []).filter(c => {
    if (!c) return false;
    if (filter === 'All') return true;
    if (filter === 'Active') return !['completed', 'closed', 'rejected'].includes(c.status);
    if (filter === 'Completed') return ['completed', 'closed'].includes(c.status);
    return true;
  });

  const openModal = (complaint) => {
    setSelectedComplaint(complaint);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    const statusText = (item.status || 'submitted').toString().replace(/_/g, ' ').toUpperCase();
    return (
      <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.categoryIcon}>{CATEGORY_ICONS[item.category] || '📄'}</Text>
            <Text style={styles.title} numberOfLines={1}>{item.title || 'Complaint'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || '#6B7280' }]}>
            <Text style={styles.badgeText}>{statusText}</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.date}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
          <Text style={styles.priority}>Priority: <Text style={styles.priorityValue}>{item.priority || 'medium'}</Text></Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Complaints</Text>
      </View>

      <View style={styles.filters}>
        {['All', 'Active', 'Completed'].map(f => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredComplaints}
        keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No complaints found.</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedComplaint && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedComplaint.title}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.badge, { alignSelf: 'flex-start', backgroundColor: STATUS_COLORS[selectedComplaint.status] || '#6B7280', marginBottom: 16 }]}>
                  <Text style={styles.badgeText}>{selectedComplaint.status?.replace(/_/g, ' ').toUpperCase()}</Text>
                </View>

                <Text style={styles.modalLabel}>Description</Text>
                <Text style={styles.modalText}>{selectedComplaint.description}</Text>

                <Text style={styles.modalLabel}>Location</Text>
                <Text style={styles.modalText}>{selectedComplaint.location}</Text>

                {selectedComplaint.aiSummary && (
                  <View style={styles.aiBox}>
                    <Text style={styles.aiBoxTitle}>✨ AI Summary</Text>
                    <Text style={styles.modalText}>{selectedComplaint.aiSummary}</Text>
                  </View>
                )}

                <Text style={styles.modalLabel}>Details</Text>
                <Text style={styles.modalText}>Category: {selectedComplaint.category?.replace(/_/g, ' ')}</Text>
                <Text style={styles.modalText}>Priority: {selectedComplaint.priority}</Text>
                <Text style={styles.modalText}>Created: {new Date(selectedComplaint.createdAt || Date.now()).toLocaleString()}</Text>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0F0F1A',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#1A1A2E',
  },
  filterButtonActive: {
    backgroundColor: '#6C63FF',
  },
  filterText: {
    color: '#8B8BA7',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    paddingTop: 12,
  },
  date: {
    color: '#8B8BA7',
    fontSize: 12,
  },
  priority: {
    color: '#8B8BA7',
    fontSize: 12,
  },
  priorityValue: {
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8B8BA7',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 16,
  },
  closeIcon: {
    color: '#8B8BA7',
    fontSize: 24,
  },
  modalLabel: {
    color: '#8B8BA7',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
  },
  aiBox: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  aiBoxTitle: {
    color: '#6C63FF',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 16,
  }
});
