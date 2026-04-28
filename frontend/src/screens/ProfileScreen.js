import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar, RefreshControl,
  Animated,
} from 'react-native';
import { getUserReservations, cancelReservation, deleteReservation } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

const COLORS = {
  primary: '#7C3AED',
  background: '#0F0F1A',
  card: '#1A1A2E',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  border: '#2A2A4A',
  success: '#10B981',
  accent: '#F59E0B',
  error: '#FF4757',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const swipeableRefs = useRef({});

  const fetchReservations = async () => {
    try {
      const res = await getUserReservations();
      setReservations(res.data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchReservations(); }, []));

  // Ακύρωση κράτησης (για επιβεβαιωμένες)
  const handleCancel = (reservationId) => {
    Alert.alert(
      'Ακύρωση Κράτησης',
      'Είστε σίγουροι ότι θέλετε να ακυρώσετε αυτή την κράτηση;',
      [
        { text: 'Όχι', style: 'cancel' },
        {
          text: 'Ναι, ακύρωση',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelReservation(reservationId);
              Alert.alert('✅', 'Η κράτηση ακυρώθηκε.');
              fetchReservations();
            } catch (err) {
              const msg = err.response?.data?.message || 'Αδυναμία ακύρωσης.';
              Alert.alert('Σφάλμα', msg);
            }
          },
        },
      ]
    );
  };

  // Οριστική διαγραφή ακυρωμένης κράτησης
  const handleDelete = (reservationId) => {
    // Κλείνουμε το swipeable πρώτα
    if (swipeableRefs.current[reservationId]) {
      swipeableRefs.current[reservationId].close();
    }
    Alert.alert(
      '🗑️ Διαγραφή Κράτησης',
      'Θέλετε να διαγράψετε οριστικά αυτή την κράτηση από το ιστορικό σας;',
      [
        { text: 'Άκυρο', style: 'cancel' },
        {
          text: 'Διαγραφή',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReservation(reservationId);
              // Αφαιρούμε από τη λίστα χωρίς νέο fetch
              setReservations(prev => prev.filter(r => r.reservation_id !== reservationId));
            } catch (err) {
              const msg = err.response?.data?.message || 'Αδυναμία διαγραφής.';
              Alert.alert('Σφάλμα', msg);
            }
          },
        },
      ]
    );
  };

  // Render κόκκινο κουμπί διαγραφής (δεξιά action)
  const renderRightActions = (reservationId, progress) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(reservationId)}
        >
          <Ionicons name="trash" size={22} color="#FFF" />
          <Text style={styles.deleteBtnText}>Διαγραφή</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('el-GR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const formatTime = (timeStr) => timeStr?.substring(0, 5);

  const getStatusColor = (status) => {
    if (status === 'confirmed') return COLORS.success;
    if (status === 'cancelled') return COLORS.error;
    return COLORS.accent;
  };

  const getStatusLabel = (status) => {
    if (status === 'confirmed') return '✅ Επιβεβαιωμένη';
    if (status === 'cancelled') return '❌ Ακυρωμένη';
    return '⏳ Εκκρεμής';
  };

  const getSeats = (seatsReserved) => {
    try {
      const seats = typeof seatsReserved === 'string' ? JSON.parse(seatsReserved) : seatsReserved;
      return Array.isArray(seats) ? seats.join(', ') : '-';
    } catch {
      return '-';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Το Προφίλ μου</Text>
        <TouchableOpacity onPress={() => Alert.alert('Αποσύνδεση', 'Θέλεις να αποσυνδεθείς;', [
          { text: 'Άκυρο', style: 'cancel' },
          { text: 'Αποσύνδεση', style: 'destructive', onPress: logout },
        ])}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchReservations(); }}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Reservations */}
        <Text style={styles.sectionTitle}>
          Οι Κρατήσεις μου ({reservations.length})
        </Text>

        {reservations.length > 0 && (
          <Text style={styles.swipeHint}>
            💡 Σύρε αριστερά σε ακυρωμένη κράτηση για να τη διαγράψεις
          </Text>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : reservations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎭</Text>
            <Text style={styles.emptyText}>Δεν έχεις κρατήσεις ακόμα.</Text>
          </View>
        ) : (
          reservations.map((res) => {
            const isCancelled = res.status === 'cancelled';
            const isFuture = new Date(res.show_date) > new Date();

            const card = (
              <View style={[styles.reservationCard, isCancelled && styles.reservationCardCancelled]}>
                <View style={styles.resHeader}>
                  <Text style={styles.resTitle} numberOfLines={1}>{res.show_title}</Text>
                  <Text style={[styles.resStatus, { color: getStatusColor(res.status) }]}>
                    {getStatusLabel(res.status)}
                  </Text>
                </View>
                <Text style={styles.resTheatre}>{res.theatre_name}</Text>
                <Text style={styles.resDatetime}>
                  📅 {formatDate(res.show_date)} • 🕐 {formatTime(res.show_time)}
                </Text>
                <Text style={styles.resSeats} numberOfLines={1}>
                  💺 {getSeats(res.seats_reserved)}
                </Text>
                <View style={styles.resFooter}>
                  <Text style={styles.resPrice}>💰 {Number(res.total_price).toFixed(2)}€</Text>
                  {res.status === 'confirmed' && isFuture && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(res.reservation_id)}
                    >
                      <Ionicons name="close-circle-outline" size={14} color={COLORS.error} style={{ marginRight: 4 }} />
                      <Text style={styles.cancelBtnText}>Ακύρωση</Text>
                    </TouchableOpacity>
                  )}
                  {isCancelled && (
                    <Text style={styles.swipeIndicator}>
                      ← σύρε για διαγραφή
                    </Text>
                  )}
                </View>
              </View>
            );

            // Μόνο οι ακυρωμένες έχουν swipe
            if (isCancelled) {
              return (
                <Swipeable
                  key={res.reservation_id}
                  ref={(ref) => { swipeableRefs.current[res.reservation_id] = ref; }}
                  renderRightActions={(progress) => renderRightActions(res.reservation_id, progress)}
                  rightThreshold={40}
                  overshootRight={false}
                >
                  {card}
                </Swipeable>
              );
            }

            return <View key={res.reservation_id}>{card}</View>;
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16,
  },
  headerTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  userEmail: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  swipeHint: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
  reservationCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  reservationCardCancelled: {
    borderColor: '#3A1A1A', opacity: 0.85,
  },
  resHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 4,
  },
  resTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  resStatus: { fontSize: 11, fontWeight: '700' },
  resTheatre: { color: COLORS.primary, fontSize: 12, marginBottom: 4 },
  resDatetime: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 },
  resSeats: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 },
  resFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resPrice: { color: COLORS.accent, fontSize: 15, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A1010',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: COLORS.error,
  },
  cancelBtnText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
  swipeIndicator: { color: '#444466', fontSize: 11, fontStyle: 'italic' },
  // Swipe delete action
  deleteAction: {
    justifyContent: 'center', alignItems: 'flex-end',
    marginBottom: 10,
  },
  deleteBtn: {
    backgroundColor: COLORS.error, width: 75, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    height: '100%', gap: 4,
  },
  deleteBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
