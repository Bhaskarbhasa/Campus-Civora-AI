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
  Animated
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { complaintAPI } from '../../services/api';

const AI_MESSAGES = [
  'AI Agent scanning text...',
  'Analyzing sentiment...',
  'Checking for duplicates...',
  'Determining priority...',
  'Routing to department...'
];

export default function NewComplaintScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('electrical');
  const [building, setBuilding] = useState('Hostel');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [isEmergency, setIsEmergency] = useState(false);
  
  const [imageUri, setImageUri] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (submitting) {
      interval = setInterval(() => {
        setAiMessageIndex((prev) => (prev + 1) % AI_MESSAGES.length);
      }, 600);
    }
    return () => clearInterval(interval);
  }, [submitting]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        // Fallback to gallery
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
      console.warn('Camera/gallery picker error:', e);
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
    if (!title || !description || !room) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('isEmergency', String(isEmergency));
      
      const locationObj = {
        building: building || 'Hostel Block A',
        floor: floor || '1',
        room: room || '101'
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
      Alert.alert('Complaint submitted!', 'AI is analyzing your report.', [
        { text: 'OK', onPress: () => {
          // Reset form
          setStep(1); setTitle(''); setDescription(''); setImageUri(null);
          navigation.navigate('Complaints');
        }}
      ]);
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit complaint');
    }
  };

  if (submitting) {
    return (
      <View style={styles.aiOverlay}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.aiMessage}>{AI_MESSAGES[aiMessageIndex]}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Complaint</Text>
        <Text style={styles.stepText}>Step {step} of 3</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Category</Text>
            {/* Using a simple custom selector for demo purposes instead of standard picker to match dark theme easily */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
              {['electrical', 'plumbing', 'internet_connectivity', 'housekeeping', 'civil_maintenance'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.pill, category === cat && styles.pillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Building</Text>
            <View style={styles.row}>
              {['Hostel', 'Academic Block', 'Lab', 'Other'].map(bldg => (
                <TouchableOpacity 
                  key={bldg} 
                  style={[styles.pill, building === bldg && styles.pillActive, { marginBottom: 10 }]}
                  onPress={() => setBuilding(bldg)}
                >
                  <Text style={[styles.pillText, building === bldg && styles.pillTextActive]}>{bldg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Floor Number</Text>
            <TextInput style={styles.input} placeholder="e.g. 2" placeholderTextColor="#8B8BA7" value={floor} onChangeText={setFloor} keyboardType="numeric" />

            <Text style={styles.label}>Room Number</Text>
            <TextInput style={styles.input} placeholder="e.g. 204" placeholderTextColor="#8B8BA7" value={room} onChangeText={setRoom} />

            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} placeholder="Brief title of the issue" placeholderTextColor="#8B8BA7" value={title} onChangeText={setTitle} />

            <Text style={styles.label}>Description</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              placeholder="Detailed description..." 
              placeholderTextColor="#8B8BA7" 
              value={description} 
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.row}>
              {['low', 'medium', 'high', 'emergency'].map(pri => (
                <TouchableOpacity 
                  key={pri} 
                  style={[styles.pill, priority === pri && styles.pillActive]}
                  onPress={() => setPriority(pri)}
                >
                  <Text style={[styles.pillText, priority === pri && styles.pillTextActive]}>{pri}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rowBtnContainer}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]} onPress={() => setStep(3)}>
                <Text style={styles.primaryButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.label}>Evidence (Optional but recommended)</Text>
            
            {!imageUri ? (
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.cameraText}>Take a Photo</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.previewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.rowBtnContainer}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]} onPress={handleSubmit}>
                <Text style={styles.primaryButtonText}>Submit Complaint</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  aiOverlay: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiMessage: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 20,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1A1A2E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepText: {
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 20,
  },
  stepContent: {
    paddingBottom: 40,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  textArea: {
    height: 120,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pill: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  pillActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  pillText: {
    color: '#8B8BA7',
    textTransform: 'capitalize',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2A2A3E',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    flex: 1,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rowBtnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cameraButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A3E',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  cameraIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cameraText: {
    color: '#8B8BA7',
    fontSize: 16,
  },
  previewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageBtn: {
    marginTop: 10,
    padding: 10,
  },
  removeImageText: {
    color: '#F43F5E',
    fontWeight: 'bold',
  }
});
