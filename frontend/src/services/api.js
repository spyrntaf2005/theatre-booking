import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ⚠️ Αλλαξε το IP με το IP του υπολογιστή σου (βρες το με: ifconfig | grep inet)
// Αν τρέχεις σε Android emulator: http://10.0.2.2:3000
// Αν τρέχεις σε physical device: http://192.168.x.x:3000
const BASE_URL = 'http://192.168.1.161:3000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: Προσθέτει JWT token σε κάθε request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// AUTH
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);

// THEATRES
export const getTheatres = (params) => api.get('/theatres', { params });
export const getTheatreById = (id) => api.get(`/theatres/${id}`);

// SHOWS
export const getShows = (params) => api.get('/shows', { params });
export const getShowById = (id) => api.get(`/shows/${id}`);

// SHOWTIMES
export const getShowtimes = (showId) => api.get('/showtimes', { params: { showId } });
export const getShowtimeById = (id) => api.get(`/showtimes/${id}`);

// SEATS
export const getSeats = (showtimeId) => api.get('/seats', { params: { showtimeId } });

// RESERVATIONS
export const createReservation = (data) => api.post('/reservations', data);
export const getUserReservations = () => api.get('/user/reservations');
export const cancelReservation = (id) => api.delete(`/reservations/${id}`);
export const deleteReservation = (id) => api.delete(`/user/reservations/${id}`);

// USER
export const getUserProfile = () => api.get('/user/profile');

export default api;
