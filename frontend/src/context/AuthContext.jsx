import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('talenttwin_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
          } else {
            localStorage.removeItem('talenttwin_token');
          }
        } catch (error) {
          console.error('Failed to authenticate token:', error);
          localStorage.removeItem('talenttwin_token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('talenttwin_token', res.data.data.token);
      setUser(res.data.data.user);
    }
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    if (res.data.success) {
      localStorage.setItem('talenttwin_token', res.data.data.token);
      setUser(res.data.data.user);
    }
    return res.data;
  };

  const googleAuth = async (credential) => {
    const res = await api.post('/auth/google', { credential });
    if (res.data.success) {
      if (res.data.data.action === 'LOGIN_SUCCESS') {
        localStorage.setItem('talenttwin_token', res.data.data.token);
        setUser(res.data.data.user);
      }
    }
    return res.data;
  };

  const googleLink = async (credential, employeeCode) => {
    const res = await api.post('/auth/google/link', { credential, employeeCode });
    if (res.data.success) {
      localStorage.setItem('talenttwin_token', res.data.data.token);
      setUser(res.data.data.user);
    }
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('talenttwin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleAuth, googleLink, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
