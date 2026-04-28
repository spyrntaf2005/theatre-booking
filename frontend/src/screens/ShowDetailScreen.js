import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { getShowtimes } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C3AED',
  background: '#0F0F1A',
  card: '#1A1A2E',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  border: '#2A2A4A',
  success: '#10B981',
  accent: '#F59E0B',
};

export default function ShowDetailScreen({ route, navigation }) {
  const { show } = route.params;
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShowtimes(show.show_id)
      .then((res) => setShowtimes(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const formatTime = (timeStr) => timeStr.substring(0, 5);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Show Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🎭</Text>
          <Text style={styles.showTitle}>{show.title}</Text>
          <Text style={styles.showTheatre}>{show.theatre_name}</Text>
          <Text style={styles.showLocation}>
            <Ionicons name="location-outline" size={14} /> {show.theatre_location}
          </Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoRow}>
          {[
            { icon: 'time-outline', label: 'Διάρκεια', value: `${show.duration} λεπτά` },
            { icon: 'person-outline', label: 'Ηλικία', value: show.age_rating },
          ].map((info) => (
            <View key={info.label} style={styles.infoCard}>
              <Ionicons name={info.icon} size={22} color={COLORS.primary} />
              <Text style={styles.infoLabel}>{info.label}</Text>
              <Text style={styles.infoValue}>{info.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {show.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Περιγραφή</Text>
            <Text style={styles.description}>{show.description}</Text>
          </View>
        )}

        {/* Showtimes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Διαθέσιμες Ημερομηνίες</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : showtimes.length === 0 ? (
            <Text style={styles.noShowtimes}>Δεν υπάρχουν διαθέσιμες ημερομηνίες.</Text>
          ) : (
            showtimes.map((st) => (
              <View key={st.showtime_id} style={styles.showtimeCard}>
                <View style={styles.showtimeInfo}>
                  <Text style={styles.showtimeDate}>{formatDate(st.show_date)}</Text>
                  <Text style={styles.showtimeTime}>🕐 {formatTime(st.show_time)}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>Standard: {st.price_standard}€</Text>
                    <Text style={styles.priceText}>VIP: {st.price_vip}€</Text>
                  </View>
                  <Text style={[styles.seats, st.available_seats === 0 && styles.seatsEmpty]}>
                    {st.available_seats === 0 ? '❌ Εξαντλήθηκαν' : `✅ ${st.available_seats} διαθέσιμες θέσεις`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookBtn, st.available_seats === 0 && styles.bookBtnDisabled]}
                  disabled={st.available_seats === 0}
                  onPress={() => navigation.navigate('Booking', { showtime: st, show })}
                >
                  <Text style={styles.bookBtnText}>
                    {st.available_seats === 0 ? 'Πλήρες' : 'Κράτηση'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 10,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 8,
  },
  hero: { alignItems: 'center', paddingTop: 100, paddingBottom: 24, paddingHorizontal: 24 },
  heroEmoji: { fontSize: 70, marginBottom: 16 },
  showTitle: { color: COLORS.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  showTheatre: { color: COLORS.primary, fontSize: 16, fontWeight: '600', marginTop: 6 },
  showLocation: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  infoRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  infoCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  infoLabel: { color: COLORS.textSecondary, fontSize: 11, marginTop: 4 },
  infoValue: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  noShowtimes: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16 },
  showtimeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  showtimeInfo: { flex: 1 },
  showtimeDate: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  showtimeTime: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  priceRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  priceText: { color: COLORS.accent, fontSize: 12, fontWeight: '600' },
  seats: { color: COLORS.success, fontSize: 12, marginTop: 4 },
  seatsEmpty: { color: '#FF4757' },
  bookBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 10, marginLeft: 12,
  },
  bookBtnDisabled: { backgroundColor: '#333' },
  bookBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
