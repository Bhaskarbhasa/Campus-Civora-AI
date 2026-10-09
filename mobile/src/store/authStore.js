import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

// Fallback base64 decoder since React Native doesn't have atob natively built-in the same way browsers do
const decodeBase64 = (str) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  str = String(str).replace(/[=]+$/, '');
  if (str.length % 4 === 1) {
    throw new Error('Invalid base64 string.');
  }
  for (let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeBase64(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parsing JWT', e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      const storedToken = await AsyncStorage.getItem('campus_token');
      const storedUser = await AsyncStorage.getItem('campus_user');
      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(parseJwt(storedToken));
          }
        } else {
          setUser(parseJwt(storedToken));
        }
      }
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email.trim(), password);
      const { accessToken: newToken, user: userData } = response.data;
      
      await AsyncStorage.setItem('campus_token', newToken);
      if (userData) {
        await AsyncStorage.setItem('campus_user', JSON.stringify(userData));
        setUser(userData);
      } else {
        setUser(parseJwt(newToken));
      }
      setToken(newToken);
      return { success: true };
    } catch (error) {
      console.error('Login error', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed. Please check credentials or network.' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['campus_token', 'campus_user']);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
