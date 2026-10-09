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
  Platform,
  ScrollView 
} from 'react-native';
import { useAuth } from '../../store/authStore';
import { authAPI } from '../../services/api';
import { COLORS, SHADOWS } from '../../theme/theme';

export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [roleType, setRoleType] = useState('student'); // 'student' | 'staff'
  
  // Login form
  const [email, setEmail] = useState('student@ch.students.amrita.edu');
  const [password, setPassword] = useState('password123');
  
  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDept, setRegDept] = useState('CCE');
  const [regHostel, setRegHostel] = useState('Koushitaki Bhavan');
  const [regYear, setRegYear] = useState('3rd Year');
  const [staffRole, setStaffRole] = useState('warden');
  
  // OTP & Set Password form
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    
    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  const handleRegister = async () => {
    if (!regName || !regEmail) {
      Alert.alert('Missing Fields', 'Please enter your full name and university email.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        isStaffRequest: roleType === 'staff',
        role: roleType === 'staff' ? staffRole : 'student',
        department: regDept,
        hostelBlock: regHostel,
        year: regYear,
      };

      const res = await authAPI.register(payload);
      setLoading(false);

      if (res.data.isPendingAdmin) {
        Alert.alert(
          'Staff Request Submitted', 
          'Your staff registration request has been submitted. Please wait for an administrator to approve your account.'
        );
        setMode('login');
      } else {
        Alert.alert('OTP Sent', `A 6-digit verification code was sent to ${regEmail}.`);
        setMode('otp');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Registration Error', err.response?.data?.message || 'Could not register. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(regEmail.trim().toLowerCase(), otpCode.trim());
      setLoading(false);

      if (res.data.requiresPasswordSetup && res.data.tempToken) {
        setTempToken(res.data.tempToken);
        Alert.alert('OTP Verified', 'Please set your permanent password to complete setup.');
      } else if (res.data.accessToken) {
        Alert.alert('Account Verified', 'Your account is verified! You can now log in.');
        setEmail(regEmail);
        setMode('login');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid OTP code.');
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Password Requirement', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authAPI.setPassword(tempToken, newPassword);
      setLoading(false);
      Alert.alert('Setup Complete', 'Password set successfully! You can now log in.');
      setEmail(regEmail);
      setPassword(newPassword);
      setMode('login');
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to set password.');
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* University Header */}
        <View style={styles.header}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>🎓 AMRITA VISHWA VIDYAPEETHAM</Text>
          </View>
          <Text style={styles.title}>Campus CIVORA AI</Text>
          <Text style={styles.subtitle}>Smart Governance & Issue Lifecycle Platform</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, SHADOWS.card]}>
          {/* Mode Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity 
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabButtonText, mode === 'login' && styles.tabButtonTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabButtonText, mode === 'register' && styles.tabButtonTextActive]}>
                Register
              </Text>
            </TouchableOpacity>

            {mode === 'otp' && (
              <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
                <Text style={[styles.tabButtonText, styles.tabButtonTextActive]}>Verify OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ============ LOGIN MODE ============ */}
          {mode === 'login' && (
            <View>
              <Text style={styles.inputLabel}>University Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. rollnumber@ch.students.amrita.edu"
                placeholderTextColor={COLORS.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textDisabled}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In to Campus Civora →</Text>
                )}
              </TouchableOpacity>

              {/* 1-Tap Quick Demo Logins */}
              <View style={styles.quickAccountsBox}>
                <Text style={styles.quickAccountsTitle}>QUICK 1-TAP DEMO ACCOUNTS</Text>
                <View style={styles.quickRow}>
                  <TouchableOpacity 
                    style={styles.quickChip}
                    onPress={() => fillDemo('student@ch.students.amrita.edu', 'password123')}
                  >
                    <Text style={styles.quickChipIcon}>👨‍🎓</Text>
                    <Text style={styles.quickChipText}>Student</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickChip}
                    onPress={() => fillDemo('admin@ch.amrita.edu', 'password123')}
                  >
                    <Text style={styles.quickChipIcon}>👑</Text>
                    <Text style={styles.quickChipText}>Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickChip}
                    onPress={() => fillDemo('supervisor@ch.amrita.edu', 'password123')}
                  >
                    <Text style={styles.quickChipIcon}>🔧</Text>
                    <Text style={styles.quickChipText}>Supervisor</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.quickChip}
                    onPress={() => fillDemo('b_babu@ch.amrita.edu', 'password123')}
                  >
                    <Text style={styles.quickChipIcon}>🛡️</Text>
                    <Text style={styles.quickChipText}>Warden</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* ============ REGISTER MODE ============ */}
          {mode === 'register' && (
            <View>
              {/* Student vs Staff toggle */}
              <View style={styles.roleToggleRow}>
                <TouchableOpacity 
                  style={[styles.roleChip, roleType === 'student' && styles.roleChipActive]}
                  onPress={() => setRoleType('student')}
                >
                  <Text style={[styles.roleChipText, roleType === 'student' && styles.roleChipTextActive]}>
                    👨‍🎓 Student
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.roleChip, roleType === 'staff' && styles.roleChipActive]}
                  onPress={() => setRoleType('staff')}
                >
                  <Text style={[styles.roleChipText, roleType === 'staff' && styles.roleChipTextActive]}>
                    🏛️ Staff / Faculty
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Bhaskar Rao Valeti"
                placeholderTextColor={COLORS.textDisabled}
                value={regName}
                onChangeText={setRegName}
              />

              <Text style={styles.inputLabel}>
                {roleType === 'student' ? 'Student Email (@ch.students.amrita.edu)' : 'Staff Email (@ch.amrita.edu)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={roleType === 'student' ? 'ch.en.u4cce23055@ch.students.amrita.edu' : 'faculty@ch.amrita.edu'}
                placeholderTextColor={COLORS.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                value={regEmail}
                onChangeText={setRegEmail}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Department</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="CCE, CSE, ECE..."
                    placeholderTextColor={COLORS.textDisabled}
                    value={regDept}
                    onChangeText={setRegDept}
                  />
                </View>

                {roleType === 'student' ? (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Year</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="1st, 2nd, 3rd..."
                      placeholderTextColor={COLORS.textDisabled}
                      value={regYear}
                      onChangeText={setRegYear}
                    />
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Role</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="warden, hod..."
                      placeholderTextColor={COLORS.textDisabled}
                      value={staffRole}
                      onChangeText={setStaffRole}
                    />
                  </View>
                )}
              </View>

              <Text style={styles.inputLabel}>Hostel Block / Lab</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Koushitaki Bhavan / Central Lab"
                placeholderTextColor={COLORS.textDisabled}
                value={regHostel}
                onChangeText={setRegHostel}
              />

              <TouchableOpacity 
                style={styles.primaryBtn} 
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {roleType === 'student' ? 'Send Verification OTP →' : 'Submit Staff Registration Request →'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ============ OTP VERIFICATION MODE ============ */}
          {mode === 'otp' && (
            <View>
              <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor={COLORS.textDisabled}
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                onChangeText={setOtpCode}
              />

              {tempToken ? (
                <View>
                  <Text style={styles.inputLabel}>Set Permanent Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    placeholderTextColor={COLORS.textDisabled}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />

                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={handleSetPassword}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Set Password & Finish →</Text>}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.primaryBtn} 
                  onPress={handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Verify OTP Code →</Text>}
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={styles.secondaryLink}
                onPress={() => setMode('login')}
              >
                <Text style={styles.secondaryLinkText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Google Gemini 3.6 Flash Zero-Shot AI Routing Engine</Text>
          <Text style={styles.footerSubText}>Department of CCE • Amrita Chennai Campus</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgePill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.bgCard,
    ...SHADOWS.card,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
    ...SHADOWS.card,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  secondaryLinkText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  quickAccountsBox: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  quickAccountsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  quickChip: {
    flex: 1,
    backgroundColor: COLORS.bgSecondary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  quickChipIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 11,
    color: COLORS.textDisabled,
    marginTop: 2,
  },
});
