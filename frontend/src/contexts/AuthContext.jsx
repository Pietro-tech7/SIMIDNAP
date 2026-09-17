import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarUsuario = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    const userResponse = await api.get('/users/me');
    setUser(userResponse.data);
    return response.data;
  };

  const register = async (email, password, full_name) => {
    const response = await api.post('/auth/register', { email, password, full_name });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const refreshUser = async () => {
    await carregarUsuario();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);