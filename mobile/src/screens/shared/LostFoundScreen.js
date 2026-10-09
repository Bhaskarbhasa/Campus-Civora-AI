import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  TextInput,
  ScrollView,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { lostFoundAPI } from '../../services/api';

export default function LostFoundScreen() {
  const [activeTab, setActiveTab] = useState('Lost Items');
  const [items, setItems] = useState([]);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemType, setNewItemType] = useState('lost'); // 'lost' or 'found'
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [location, setLocation] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await lostFoundAPI.getAll();
      const list = response.data?.reports || response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setItems(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to fetch items', error);
      setItems([]);
    }
  };

  const filteredItems = items.filter(item => 
    (activeTab === 'Lost Items' && item.type === 'lost') ||
    (activeTab === 'Found Items' && item.type === 'found')
  );

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        const libResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
        if (!libResult.canceled && libResult.assets && libResult.assets.length > 0) {
          setImageUri(libResult.assets[0].uri);
        }
        return;
      }

      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Camera error:', e);
      try {
        const libResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
        if (!libResult.canceled && libResult.assets && libResult.assets.length > 0) {
          setImageUri(libResult.assets[0].uri);
        }
      } catch (err) {
        Alert.alert('Notice', 'Could not open camera or gallery.');
      }
    }
  };

  const handleSubmit = async () => {
    if (!description || !location) {
      Alert.alert('Error', 'Description and Location are required');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', newItemType);
      
      const categoryMap = {
        'Electronics': 'mobile',
        'Books & Notes': 'book',
        'IDs & Cards': 'id_card',
        'Clothing': 'clothing',
        'Accessories': 'bag',
        'Others': 'other'
      };
      const validCategory = categoryMap[category] || 'other';
      formData.append('itemCategory', validCategory);
      formData.append('itemName', brand ? `${brand} ${category}` : `${category} item`);
      formData.append('description', description);
      formData.append('color', color || 'Unknown');
      formData.append('brand', brand || 'Unknown');
      formData.append('dateTime', new Date().toISOString());
      
      if (newItemType === 'lost') {
        formData.append('lastSeenLocation', location);
      } else {
        formData.append('foundLocation', location);
        if (submittedTo) formData.append('submittedTo', submittedTo);
      }
      formData.append('locationDetails', location);

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('photos', { uri: imageUri, name: filename, type });
      }

      await lostFoundAPI.create(formData);
      Alert.alert('Success', 'Item reported successfully');
      setModalVisible(false);
      
      // Reset form
      setDescription(''); setColor(''); setBrand(''); setLocation(''); setSubmittedTo(''); setImageUri(null);
      fetchItems();
    } catch (error) {
      console.error('Failed to report item', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to report item');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.category} - {item.brand}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === 'resolved' ? '#10B981' : '#F59E0B' }]}>
          <Text style={styles.badgeText}>{item.status || 'open'}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc}>{item.description}</Text>
      <Text style={styles.cardMeta}>Location: {item.location}</Text>
      <Text style={styles.cardDate}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lost & Found</Text>
      </View>

      <View style={styles.tabContainer}>
        {['Lost Items', 'Found Items'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} to display.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.typeToggle}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newItemType === 'lost' && styles.toggleBtnActive]}
                  onPress={() => setNewItemType('lost')}
                >
                  <Text style={[styles.toggleText, newItemType === 'lost' && styles.toggleTextActive]}>I Lost Something</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, newItemType === 'found' && styles.toggleBtnActive]}
                  onPress={() => setNewItemType('found')}
                >
                  <Text style={[styles.toggleText, newItemType === 'found' && styles.toggleTextActive]}>I Found Something</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} placeholder="e.g. Electronics, Wallet" placeholderTextColor="#8B8BA7" value={category} onChangeText={setCategory} />

              <Text style={styles.label}>Description</Text>
              <TextInput style={styles.input} placeholder="Detailed description..." placeholderTextColor="#8B8BA7" value={description} onChangeText={setDescription} multiline />

              <Text style={styles.label}>Brand</Text>
              <TextInput style={styles.input} placeholder="e.g. Apple, Nike" placeholderTextColor="#8B8BA7" value={brand} onChangeText={setBrand} />

              <Text style={styles.label}>Color</Text>
              <TextInput style={styles.input} placeholder="e.g. Black" placeholderTextColor="#8B8BA7" value={color} onChangeText={setColor} />

              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} placeholder="Where was it lost/found?" placeholderTextColor="#8B8BA7" value={location} onChangeText={setLocation} />

              {newItemType === 'found' && (
                <>
                  <Text style={styles.label}>Submitted To</Text>
                  <TextInput style={styles.input} placeholder="e.g. Student Welfare Office" placeholderTextColor="#8B8BA7" value={submittedTo} onChangeText={setSubmittedTo} />
                </>
              )}

              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Text style={styles.imagePickerText}>{imageUri ? 'Image Selected ✓' : 'Take a Photo'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                <Text style={styles.submitBtnText}>Submit</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1A1A2E' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#1A1A2E' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#6C63FF' },
  tabText: { color: '#8B8BA7', fontWeight: 'bold' },
  activeTabText: { color: '#6C63FF' },
  list: { padding: 16, paddingBottom: 80 },
  card: { backgroundColor: '#1A1A2E', padding: 16, borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  cardDesc: { color: '#D1D1E9', marginBottom: 8 },
  cardMeta: { color: '#8B8BA7', fontSize: 12, marginBottom: 4 },
  cardDate: { color: '#8B8BA7', fontSize: 12 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#8B8BA7', fontSize: 16 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6C63FF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: '#FFF', fontSize: 32, marginTop: -4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1A1A2E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  closeIcon: { color: '#8B8BA7', fontSize: 24 },
  typeToggle: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#0F0F1A', borderRadius: 8, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#6C63FF' },
  toggleText: { color: '#8B8BA7', fontWeight: 'bold' },
  toggleTextActive: { color: '#FFF' },
  label: { color: '#FFF', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0F0F1A', borderRadius: 8, padding: 12, color: '#FFF', borderWidth: 1, borderColor: '#2A2A3E' },
  imagePickerBtn: { backgroundColor: '#2A2A3E', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, borderWidth: 1, borderColor: '#6C63FF', borderStyle: 'dashed' },
  imagePickerText: { color: '#6C63FF', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
