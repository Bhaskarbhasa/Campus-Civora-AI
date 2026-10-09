import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useAuth } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('student@ch.students.amrita.edu');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Campus Civora AI</Text>
          <Text style={styles.subtitle}>Intelligent Campus Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#8B8BA7"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#8B8BA7"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.quickFillContainer}>
            <Text style={styles.quickFillLabel}>Quick Test Accounts:</Text>
            <View style={styles.quickFillButtons}>
              <TouchableOpacity 
                style={styles.quickFillBtn}
                onPress={() => fillCredentials('student@ch.students.amrita.edu', 'password123')}
              >
                <Text style={styles.quickFillBtnText}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickFillBtn}
                onPress={() => fillCredentials('admin@ch.amrita.edu', 'password123')}
              >
                <Text style={styles.quickFillBtnText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickFillBtn}
                onPress={() => fillCredentials('supervisor@ch.amrita.edu', 'password123')}
              >
                <Text style={styles.quickFillBtnText}>Supervisor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8BA7',
  },
  card: {
    backgroundColor: '#1A1A2E',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#0F0F1A',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  loginButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickFillContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3E',
    paddingTop: 16,
  },
  quickFillLabel: {
    color: '#8B8BA7',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  quickFillButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickFillBtn: {
    flex: 1,
    backgroundColor: '#2A2A3E',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D3D5C',
  },
  quickFillBtnText: {
    color: '#6C63FF',
    fontSize: 12,
    fontWeight: '600',
  },
});
