import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { authAPI } from '../../services/api';
import { getDashboardRoute, ROLE_LABELS, DEPARTMENTS, HOSTEL_BLOCKS, LABS } from '../../utils/constants';

const STEPS = { LOGIN: 'login', REGISTER: 'register', OTP: 'otp', SET_PASSWORD: 'set_password' };

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, setUser, setAccessToken } = useAuthStore();

  const [step, setStep] = useState(STEPS.LOGIN);
  const [loginType, setLoginType] = useState('student'); // 'student' | 'staff'
  const [registerRole, setRegisterRole] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [registerName, setRegisterName] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setStep(STEPS.REGISTER);
      setLoginType('student');
    }
  }, [location]);

  // --- LOGIN FLOW ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter both email and password.');
    
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    
    if (result.success) {
      toast.success(`Welcome, ${result.user.name}!`);
      navigate(getDashboardRoute(result.user.role));
    } else {
      toast.error(result.error || 'Invalid credentials');
    }
  };

  // --- REGISTRATION FLOW ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !registerName) return toast.error('Please enter your name and email.');
    setIsLoading(true);
    try {
      const role = loginType === 'staff' ? registerRole : 'student';
      const department = document.getElementById('register-dept')?.value || '';
      const hostelBlock = document.getElementById('register-block')?.value || '';
      const year = document.getElementById('register-year')?.value || '';

      const { data } = await authAPI.register({
        name: registerName,
        email,
        isStaffRequest: loginType === 'staff',
        role,
        department,
        hostelBlock,
        year
      });
      
      if (data.isPendingAdmin) {
        toast.success(data.message, { duration: 6000 });
        setStep(STEPS.LOGIN); // Send them back to login page to wait
      } else {
        setUserName(data.name);
        toast.success(`Verification OTP sent to ${email}`);
        setStep(STEPS.OTP);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the 6-digit OTP.');
    setIsLoading(true);
    try {
      const { data } = await authAPI.verifyOTP(email, otpStr);
      if (data.requiresPasswordSetup) {
        setTempToken(data.tempToken);
        setStep(STEPS.SET_PASSWORD);
        toast.success('OTP verified! Please set a secure password.');
      } else {
        // Fallback if they somehow register an existing account
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        setAccessToken(data.accessToken);
        toast.success(`Welcome back, ${data.user.name}!`);
        navigate(getDashboardRoute(data.user.role));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    setIsLoading(true);
    try {
      const { data } = await authAPI.setPassword(tempToken, newPassword);
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setAccessToken(data.accessToken);
      toast.success('Account created! Welcome to Campus Civora.');
      navigate(getDashboardRoute(data.user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.25 }
  };

  return (
    <div className="auth-page" style={{ backgroundImage: 'var(--grad-mesh)' }}>
      {/* Decorative Blur Orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, var(--blue-glow) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, var(--cyan-glow) 0%, transparent 60%)',
        zIndex: 0, pointerEvents: 'none'
      }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Shield size={28} />
          </div>
          <h1>Campus Civora</h1>
          <p>Official University Portal</p>
        </div>

        <AnimatePresence mode="wait">

          {/* Unified Login Step */}
          {step === STEPS.LOGIN && (
            <motion.div key="login" {...fadeUp}>
              
              {/* Type Switcher Tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24 }}>
                <button 
                  type="button"
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: loginType === 'student' ? 'var(--bg-card-hover)' : 'transparent', color: loginType === 'student' ? 'var(--cyan)' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'var(--transition-fast)', cursor: 'pointer' }}
                  onClick={() => setLoginType('student')}
                >
                  <User size={16} /> Student
                </button>
                <button 
                  type="button"
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', border: 'none', background: loginType === 'staff' ? 'var(--bg-card-hover)' : 'transparent', color: loginType === 'staff' ? 'var(--blue)' : 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'var(--transition-fast)', cursor: 'pointer' }}
                  onClick={() => setLoginType('staff')}
                >
                  <Briefcase size={16} /> Staff
                </button>
              </div>

              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                  {loginType === 'student' ? 'Student Portal' : 'Faculty & Staff Portal'}
                </h2>
                <p className="text-sm text-secondary">Sign in with your university email</p>
              </div>

              <form onSubmit={handleLogin} className="flex-col gap-4" style={{ display: 'flex' }}>
                <div className="form-group">
                  <label className="form-label">University Email</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="email-input"
                      type="email"
                      className="form-input"
                      placeholder="yourname@amrita.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end" style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                  <Link to="/forgot-password" className="text-xs text-cyan">Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading} id="login-btn">
                  {isLoading ? <><div className="spinner spinner-sm" /> Signing in...</> : <>Sign In <ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                {loginType === 'student' ? (
                  <>
                    New student?{' '}
                    <button type="button" className="text-cyan font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => setStep(STEPS.REGISTER)}>
                      Register Account
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ display: 'block', marginBottom: 6 }}>
                      Need an account?{' '}
                      <button type="button" className="text-cyan font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => setStep(STEPS.REGISTER)}>
                        Request Access
                      </button>
                    </span>
                    <span>
                      Approved by Admin?{' '}
                      <button type="button" className="text-cyan font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={async () => {
                          if (!email) return toast.error('Please enter your email above first.');
                          setIsLoading(true);
                          try {
                            const { data } = await authAPI.staffSetup(email);
                            setTempToken(data.tempToken);
                            toast.success(data.message);
                            setStep(STEPS.SET_PASSWORD);
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Failed to start setup.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}>
                        Set Password
                      </button>
                    </span>
                  </>
                )}
              </p>
            </motion.div>
          )}

          {/* Registration Step */}
          {step === STEPS.REGISTER && (
            <motion.div key="register" {...fadeUp}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
                  {loginType === 'staff' ? 'Staff Account Request' : 'Student Registration'}
                </h2>
                <p className="text-sm text-secondary">
                  {loginType === 'staff' ? 'Submit a request to the admin for platform access' : 'Use your @ch.students.amrita.edu email'}
                </p>
              </div>

              <form onSubmit={handleRegister} className="flex-col gap-4" style={{ display: 'flex' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <Shield size={16} className="input-icon" />
                    <input
                      id="name-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Arjun Sharma"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">University Email</label>
                  <div className="input-wrapper">
                    <Mail size={16} className="input-icon" />
                    <input
                      id="register-email-input"
                      type="email"
                      className="form-input"
                      placeholder={loginType === 'staff' ? 'e.g., name@amrita.edu' : 'e.g., ch.en.u4cce230555@ch.students.amrita.edu'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {loginType === 'staff' && (
                  <div className="form-group">
                    <label className="form-label">Requested Role</label>
                    <select id="register-role" className="form-input" value={registerRole} onChange={(e) => setRegisterRole(e.target.value)} required style={{ paddingLeft: 12 }}>
                      <option value="" disabled>Select Role...</option>
                      {Object.entries(ROLE_LABELS)
                        .filter(([val]) => val !== 'student' && val !== 'super_admin')
                        .map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dynamic Location/Department fields based on Role */}
                {(loginType === 'student' || ['class_advisor', 'hod', 'faculty'].includes(registerRole)) && (
                  <div className="form-group">
                    <label className="form-label">Department / Branch *</label>
                    <select id="register-dept" className="form-input" required style={{ paddingLeft: 12 }}>
                      <option value="">Select Department...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}

                {(loginType === 'student' || ['warden', 'lab_assistant'].includes(registerRole)) && (
                  <div className="form-group">
                    <label className="form-label">Assigned Location (Hostel/Lab) *</label>
                    <select id="register-block" className="form-input" required style={{ paddingLeft: 12 }}>
                      <option value="">Select Location...</option>
                      {loginType === 'student' || registerRole === 'warden' 
                        ? HOSTEL_BLOCKS.map(b => <option key={b} value={b}>{b}</option>)
                        : LABS.map(l => <option key={l} value={l}>{l}</option>)
                      }
                    </select>
                  </div>
                )}

                {loginType === 'student' && (
                  <div className="form-group">
                    <label className="form-label">Year of Study *</label>
                    <select id="register-year" className="form-input" required style={{ paddingLeft: 12 }}>
                      <option value="">Select Year...</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading} id="register-btn">
                  {isLoading ? <><div className="spinner spinner-sm" /> Processing...</> : <>{loginType === 'staff' ? 'Submit Request' : 'Register'} <ArrowRight size={18} /></>}
                </button>
              </form>

              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13 }}>
                <button type="button" className="text-cyan text-sm font-semibold" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setStep(STEPS.LOGIN)}>
                  ← Back to Sign In
                </button>
              </p>
            </motion.div>
          )}

          {/* OTP Verification Step (Only for Registration) */}
          {step === STEPS.OTP && (
            <motion.div key="otp" {...fadeUp}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Verify Registration</h2>
                <p className="text-sm text-secondary">
                  We sent a 6-digit OTP to<br />
                  <strong style={{ color: 'var(--cyan)' }}>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP}>
                <div className="otp-inputs" style={{ marginBottom: 28 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-input"
                      value={digit}
                      onChange={(e) => handleOTPChange(i, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading} id="verify-otp-btn">
                  {isLoading ? <><div className="spinner spinner-sm" /> Verifying...</> : 'Verify OTP'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Set Password Step */}
          {step === STEPS.SET_PASSWORD && (
            <motion.div key="setpwd" {...fadeUp}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Create Password</h2>
                <p className="text-sm text-secondary">Secure your student account</p>
              </div>

              <form onSubmit={handleSetPassword} className="flex-col gap-4" style={{ display: 'flex' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="new-password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required autoFocus
                    />
                    <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isLoading} id="set-password-btn">
                  {isLoading ? <><div className="spinner spinner-sm" /> Finalizing...</> : 'Create Account'}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
