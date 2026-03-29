import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getProfile, logout as logoutAPI } from '../api/endpoints';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getProfile()
        .then(r => setUser(r.data.user))
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, refreshToken, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = async () => {
    try { await logoutAPI(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  const refreshUser = () =>
    getProfile().then(r => setUser(r.data.user)).catch(() => {});

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
