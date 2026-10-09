import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Switch 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { complaintAPI } from '../../services/api';
import { COLORS, CATEGORY_ICONS, SHADOWS } from '../../theme/theme';

const CATEGORIES = [
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'plumbing', label: 'Plumbing', icon: '💧' },
  { id: 'internet_connectivity', label: 'Wi-Fi / Net', icon: '🌐' },
  { id: 'hostel_facilities', label: 'Hostel', icon: '🛏️' },
  { id: 'classroom_equipment', label: 'Classroom', icon: '🖥️' },
  { id: 'laboratory_equipment', label: 'Lab Equipment', icon: '🔬' },
  { id: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
  { id: 'civil_maintenance', label: 'Civil Works', icon: '🏗️' },
  { id: 'food_services', label: 'Food / Mess', icon: '🍽️' },
  { id: 'security', label: 'Security', icon: '🛡️' },
  { id: 'library', label: 'Library', icon: '📖' },
  { id: 'general_administration', label: 'General Admin', icon: '🏢' },
];

const BUILDINGS = [
  'Hostel - Koushitaki Bhavan',
  'Hostel - Chandogya Bhavan',
  'Hostel - Aitareya Bhavan',
  'Hostel - Pranava Bhavan',
  'Hostel - Maitri Bhavan',
  'Hostel - Aswini Bhavan',
  'Academic Block 1',
  'Academic Block 2',
  'Central Library',
  'RHISC / VIBES Lab',
  'Computer Science Labs',
  'Campus Canteen',
];

const AI_MESSAGES = [
  '🤖 Google Gemini analyzing natural language description...',
  '📊 Extracting urgency & sentiment metrics...',
  '🔍 Checking 7-day building history for duplicate tickets...',
  '🎯 Predicting priority & departmental dispatch...',
  '✅ Registering ticket with automated SLA deadlines...'
];

export default function NewComplaintScreen({ navigation }) {
  const [category, setCategory] = useState('electrical');
  const [building, setBuilding] = useState('Hostel - Koushitaki Bhavan');
  const [floor, setFloor] = useState('1');
  const [room, setRoom] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  
  const [imageUri, setImageUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (submitting) {
      interval = setInterval(() => {
        setAiMessageIndex((prev) => (prev + 1) % AI_MESSAGES.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  const pickImage = async (useCamera = false) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
        if (!result.canceled && result.assets?.length > 0) {
          setImageUri(result.assets[0].uri);
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
        if (!result.canceled && result.assets?.length > 0) {
          setImageUri(result.assets[0].uri);
        }
      }
    } catch (err) {
      console.warn('Image picker error', err);
      Alert.alert('Notice', 'Could not open camera or gallery.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing Details', 'Please provide both an issue title and description.');
      return;
    }

    if (!room.trim()) {
      Alert.alert('Missing Location', 'Please provide a room number or specific area.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('priority', isEmergency ? 'emergency' : priority);
      formData.append('isEmergency', String(isEmergency));
      formData.append('isPublic', String(isPublic));
      
      const locationObj = {
        building: building,
        floor: floor ? `Floor ${floor}` : 'Ground',
        room: room.trim(),
        specificArea: `${building}, Floor ${floor}, Room ${room.trim()}`
      };
      formData.append('location', JSON.stringify(locationObj));

      if (imageUri) {
        const filename = imageUri.split('/').pop() || 'evidence.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('evidence', { uri: imageUri, name: filename, type });
      }

      await complaintAPI.create(formData);
      setSubmitting(false);

      Alert.alert(
        'Complaint Submitted! 🚀', 
        'Gemini AI has processed your complaint, categorized it, and assigned SLA response deadlines.',
        [
          { 
            text: 'View My Complaints', 
            onPress: () => {
              setTitle(''); setDescription(''); setRoom(''); setImageUri(null);
              navigation.navigate('Complaints');
            }
          }
        ]
      );
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Submission Error', err.response?.data?.message || 'Could not submit complaint. Please check connection.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={styles.headerSubtitle}>NEW GRIEVANCE REPORT</Text>
          {navigation?.canGoBack?.() && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 2, paddingHorizontal: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>← Back</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.headerTitle}>Report Campus Fault</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Step 1: Category */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <Text style={styles.sectionHeader}>1. SELECT FAULT CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryTile, category === cat.id && styles.categoryTileActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text style={styles.categoryTileIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryTileText, category === cat.id && styles.categoryTileTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 2: Location */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <Text style={styles.sectionHeader}>2. CAMPUS LOCATION</Text>
          
          <Text style={styles.inputLabel}>Building / Hostel Block</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {BUILDINGS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.buildingChip, building === b && styles.buildingChipActive]}
                onPress={() => setBuilding(b)}
              >
                <Text style={[styles.buildingChipText, building === b && styles.buildingChipTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Floor Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1, 2, 3..."
                placeholderTextColor={COLORS.textDisabled}
                keyboardType="number-pad"
                value={floor}
                onChangeText={setFloor}
              />
            </View>

            <View style={{ flex: 2 }}>
              <Text style={styles.inputLabel}>Room / Lab / Area *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Room 204, RHISC Lab"
                placeholderTextColor={COLORS.textDisabled}
                value={room}
                onChangeText={setRoom}
              />
            </View>
          </View>
        </View>

        {/* Step 3: Issue Details */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <Text style={styles.sectionHeader}>3. ISSUE DETAILS</Text>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ceiling fan not working & making noise"
            placeholderTextColor={COLORS.textDisabled}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.inputLabel}>Detailed Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the exact fault. Gemini AI uses this description to calculate urgency and detect duplicates..."
            placeholderTextColor={COLORS.textDisabled}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          {/* Emergency Toggle */}
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>🚨 Emergency Fault</Text>
              <Text style={styles.toggleSub}>Immediate safety risk, water leakage, or power sparking (2h SLA)</Text>
            </View>
            <Switch
              value={isEmergency}
              onValueChange={setIsEmergency}
              trackColor={{ false: COLORS.borderSubtle, true: COLORS.rose }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Visibility Toggle */}
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>👥 Community Visible</Text>
              <Text style={styles.toggleSub}>Allow fellow hostel/class mates to see and upvote this issue</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: COLORS.borderSubtle, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Step 4: Photographic Evidence */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <Text style={styles.sectionHeader}>4. ATTACH EVIDENCE (OPTIONAL)</Text>
          <Text style={styles.evidenceHint}>Upload photo to speed up technician verification.</Text>

          {imageUri ? (
            <View style={styles.imagePreviewBox}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageText}>✕ Remove Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerRow}>
              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(true)}>
                <Text style={styles.pickerBtnIcon}>📷</Text>
                <Text style={styles.pickerBtnText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.pickerBtn} onPress={() => pickImage(false)}>
                <Text style={styles.pickerBtnIcon}>🖼️</Text>
                <Text style={styles.pickerBtnText}>Choose Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Submit Button */}
        {submitting ? (
          <View style={[styles.aiProgressCard, SHADOWS.card]}>
            <ActivityIndicator size="large" color={COLORS.violet} style={{ marginBottom: 10 }} />
            <Text style={styles.aiProgressMessage}>{AI_MESSAGES[aiMessageIndex]}</Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.submitBtn, SHADOWS.card]} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Complaint to AI Engine →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    width: '31%',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  categoryTileActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  categoryTileIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  categoryTileText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryTileTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  buildingChip: {
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  buildingChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  buildingChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  buildingChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    marginTop: 6,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  toggleSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    paddingRight: 10,
  },
  evidenceHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  pickerBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  pickerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  imagePreviewBox: {
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  removeImageBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  removeImageText: {
    color: COLORS.rose,
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  aiProgressCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  aiProgressMessage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B21A8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
