import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('apexpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] 401 Unauthorized encountered.');
      // Avoid redirecting if on demo login
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginApi = (email, password) => api.post('/auth/login', { email, password });
export const registerApi = (name, email, password) => api.post('/auth/register', { name, email, password });
export const demoLoginApi = () => api.post('/auth/demo');
export const getMeApi = () => api.get('/auth/me');
export const updatePreferencesApi = (data) => api.put('/auth/preferences', data);

// Profile Endpoints
export const getProfileApi = () => api.get('/profile');
export const saveProfileApi = (profileData) => api.post('/profile', profileData);
export const reassessProfileApi = (data) => api.post('/profile/reassess', data);

// Strength Benchmarking Endpoints
export const estimate1RMApi = (data) => api.post('/strength/estimate', data);
export const getBenchmarksApi = () => api.get('/strength/benchmarks');
export const getStrengthHistoryApi = () => api.get('/strength/history');

// Programs Endpoints
export const getActiveProgramApi = () => api.get('/programs/active');
export const regenerateProgramApi = (data) => api.post('/programs/regenerate', data);
export const swapProgramExerciseApi = (data) => api.post('/programs/swap-exercise', data);
export const applyAdaptationApi = (payload) => api.post('/programs/adapt', payload);

// Workout Endpoints
export const getWorkoutsApi = () => api.get('/workouts');
export const logWorkoutApi = (workoutData) => api.post('/workouts', workoutData);
export const syncOfflineWorkoutsApi = (queue) => api.post('/workouts/sync-offline', { queue });

// AI Coach Endpoints
export const chatWithCoachApi = (message, conversationHistory) => api.post('/coach/chat', { message, conversationHistory });
export const getExerciseSubstitutesApi = (exerciseId) => api.get(`/coach/substitutes/${exerciseId}`);
export const getExerciseFormCuesApi = (slug) => api.get(`/coach/form-cues/${slug}`);

// Leaderboard & Badges Endpoints
export const getCohortLeaderboardApi = () => api.get('/leaderboard/cohort');
export const getUserBadgesApi = () => api.get('/leaderboard/badges');

// Exercise Library
export const getExercisesApi = (params) => api.get('/exercises', { params });

export default api;
