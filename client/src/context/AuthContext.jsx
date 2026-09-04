import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, demoLoginApi, getMeApi, getProfileApi, updatePreferencesApi } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('apexpulse_token'));
  const [loading, setLoading] = useState(true);
  const [unitSystem, setUnitSystem] = useState(localStorage.getItem('apexpulse_unit') || 'kg');

  const refreshProfile = async () => {
    try {
      const { data } = await getProfileApi();
      setProfile(data);
      return data;
    } catch (err) {
      console.warn('[Auth] No profile found:', err.response?.data?.error || err.message);
      setProfile(null);
      return null;
    }
  };

  const loadUserData = async (authToken) => {
    try {
      setLoading(true);
      localStorage.setItem('apexpulse_token', authToken);
      setToken(authToken);

      const { data: userData } = await getMeApi();
      setUser(userData);
      if (userData.preferences?.unitSystem) {
        setUnitSystem(userData.preferences.unitSystem);
        localStorage.setItem('apexpulse_unit', userData.preferences.unitSystem);
      }

      await refreshProfile();
    } catch (err) {
      console.error('[Auth] Failed to load user data:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserData(token);
    } else {
      // Auto-load demo user for quick seamless exploration
      demoLoginApi()
        .then((res) => {
          loadUserData(res.data.token);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await loginApi(email, password);
    await loadUserData(data.token);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await registerApi(name, email, password);
    await loadUserData(data.token);
    return data;
  };

  const loadDemo = async () => {
    const { data } = await demoLoginApi();
    await loadUserData(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('apexpulse_token');
    setUser(null);
    setProfile(null);
    setToken(null);
    setLoading(false);
  };

  const toggleUnitSystem = async () => {
    const newUnit = unitSystem === 'kg' ? 'lbs' : 'kg';
    setUnitSystem(newUnit);
    localStorage.setItem('apexpulse_unit', newUnit);
    if (user) {
      try {
        await updatePreferencesApi({ preferences: { unitSystem: newUnit } });
      } catch (e) {
        console.error('Failed to sync unit preference to server', e);
      }
    }
  };

  // Convert weight value for display based on active unit
  const formatWeight = (weightKg, precision = 1) => {
    if (!weightKg && weightKg !== 0) return `0 ${unitSystem}`;
    if (unitSystem === 'lbs') {
      const lbs = weightKg * 2.20462;
      return `${Math.round(lbs * Math.pow(10, precision)) / Math.pow(10, precision)} lbs`;
    }
    return `${Math.round(weightKg * Math.pow(10, precision)) / Math.pow(10, precision)} kg`;
  };

  const toDisplayWeight = (weightKg) => {
    if (!weightKg && weightKg !== 0) return 0;
    if (unitSystem === 'lbs') {
      return Math.round(weightKg * 2.20462 * 10) / 10;
    }
    return Math.round(weightKg * 10) / 10;
  };

  const toKgWeight = (displayWeight) => {
    if (!displayWeight) return 0;
    if (unitSystem === 'lbs') {
      return Math.round((displayWeight / 2.20462) * 10) / 10;
    }
    return displayWeight;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        unitSystem,
        login,
        register,
        loadDemo,
        logout,
        refreshProfile,
        toggleUnitSystem,
        formatWeight,
        toDisplayWeight,
        toKgWeight,
        hasCompletedOnboarding: !!profile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
