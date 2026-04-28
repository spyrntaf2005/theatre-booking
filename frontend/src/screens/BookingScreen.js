import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { getSeats, createReservation } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C3AED',
  background: '#0F0F1A',
  card: '#1A1A2E',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  border: '#2A2A4A',
  available: '#1A3A2A',
  availableBorder: '#10B981',
  selected: '#7C3AED',
  selectedBorder: '#9D5FF0',
  booked: '#2A1A1A',
  bookedBorder: '#FF4757',
  vipAvailable: '#1A2A3A',
  vipAvailableBorder: '#F59E0B',
  accent: '#F59E0B',
  success: '#10B981',
  error: '#FF4757',
};

// Ομαδοποίηση θέσεων ανά σειρά
function groupByRow(seats) {
  const rows = {};
  for (const seat of seats) {
    const row = seat.seat_number[0]; // e.g. "A" from "A1"
    if (!rows[row]) rows[row] = [];
    rows[row].push(seat);
  }
  // Ταξινόμηση κάθε σειράς αριθμητικά (A1, A2...A10 όχι A1, A10, A2)
  for (const row in rows) {
    rows[row].sort((a, b) => {
      const numA = parseInt(a.seat_number.slice(1));
      const numB = parseInt(b.seat_number.slice(1));
      return numA - numB;
    });
  }
  return rows;
}

export default function BookingScreen({ route, navigation }) {
  const { showtime, show } = route.params;
  const [seats, setSeats] = useState([]);
  const [showtimeInfo, setShowtimeInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, []);

  const fetchSeats = async () => {
    try {
      const res = await getSeats(showtime.showtime_id);
      setSeats(res.data.seats);
      setShowtimeInfo(res.data.showtime);
    } catch (err) {
      Alert.alert('Σφάλμα', 'Αδυναμία φόρτωσης θέσεων.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat) => {
    if (!seat.is_available) return; // Κλεισμένη — δεν επιλέγεται
    const alreadySelected = selectedSeats.find(s => s.seat_number === seat.seat_number);
    if (alreadySelected) {
      setSelectedSeats(selectedSeats.filter(s => s.seat_number !== seat.seat_number));
    } else {
      if (selectedSeats.length >= 6) {
        Alert.alert('Μέγιστο', 'Μπορείτε να επιλέξετε έως 6 θέσεις ανά κράτηση.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const isSelected = (seatNumber) => selectedSeats.some(s => s.seat_number === seatNumber);

  const getTotalPrice = () => {
    return selectedSeats.reduce((sum, seat) => {
      const price = seat.seat_category === 'vip'
        ? Number(showtimeInfo?.price_vip || 0)
        : Number(showtimeInfo?.price_standard || 0);
      return sum + price;
    }, 0);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('el-GR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
  const formatTime = (timeStr) => timeStr?.substring(0, 5);

  const handleBooking = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Σφάλμα', 'Επιλέξτε τουλάχιστον μία θέση.');
      return;
    }

    const seatNumbers = selectedSeats.map(s => s.seat_number);
    const totalPrice = getTotalPrice();

    Alert.alert(
      '🎭 Επιβεβαίωση Κράτησης',
      `Παράσταση: ${show.title}\n📅 ${formatDate(showtime.show_date)} ${formatTime(showtime.show_time)}\n💺 Θέσεις: ${seatNumbers.join(', ')}\n💰 Σύνολο: ${totalPrice.toFixed(2)}€`,
      [
        { text: 'Ακύρωση', style: 'cancel' },
        {
          text: 'Επιβεβαίωση',
          onPress: async () => {
            setSubmitting(true);
            try {
              await createReservation({
                showtime_id: showtime.showtime_id,
                seats_reserved: seatNumbers,
              });
              Alert.alert('✅ Επιτυχία!', 'Η κράτησή σας ολοκληρώθηκε!', [
                { text: 'OK', onPress: () => navigation.navigate('Main') },
              ]);
            } catch (err) {
              const msg = err.response?.data?.message || 'Σφάλμα κατά την κράτηση.';
              Alert.alert('Σφάλμα', msg);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const rowsData = groupByRow(seats);
  const rowKeys = Object.keys(rowsData).sort();

  const getSeatStyle = (seat) => {
    if (isSelected(seat.seat_number)) {
      return { bg: COLORS.selected, border: COLORS.selectedBorder, textColor: '#FFF' };
    }
    if (!seat.is_available) {
      return { bg: COLORS.booked, border: COLORS.bookedBorder, textColor: '#FF4757' };
    }
    if (seat.seat_category === 'vip') {
      return { bg: COLORS.vipAvailable, border: COLORS.vipAvailableBorder, textColor: COLORS.accent };
    }
    return { bg: COLORS.available, border: COLORS.availableBorder, textColor: COLORS.success };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{show.title}</Text>
          <Text style={styles.headerSub}>
            📅 {formatDate(showtime.show_date)} • 🕐 {formatTime(showtime.show_time)}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Stage */}
        <View style={styles.stageWrapper}>
          <View style={styles.stage}>
            <Text style={styles.stageText}>🎭  ΣΚΗΝΗ</Text>
          </View>
          <View style={styles.stageShadow} />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: COLORS.availableBorder, label: 'Standard' },
            { color: COLORS.vipAvailableBorder, label: 'VIP' },
            { color: COLORS.selectedBorder, label: 'Επιλεγμένη' },
            { color: COLORS.bookedBorder, label: 'Κλεισμένη' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Seat Map */}
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.seatMap}>
            {rowKeys.map((row) => (
              <View key={row} style={styles.rowContainer}>
                <Text style={styles.rowLabel}>{row}</Text>
                <View style={styles.rowSeats}>
                  {rowsData[row].map((seat) => {
                    const style = getSeatStyle(seat);
                    return (
                      <TouchableOpacity
                        key={seat.seat_id}
                        style={[
                          styles.seat,
                          { backgroundColor: style.bg, borderColor: style.border },
                        ]}
                        onPress={() => toggleSeat(seat)}
                        disabled={!seat.is_available}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.seatText, { color: style.textColor }]}>
                          {seat.seat_number.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.rowLabel}>{row}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Prices Info */}
        {showtimeInfo && (
          <View style={styles.priceInfo}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>🪑 Standard</Text>
              <Text style={styles.priceValue}>{Number(showtimeInfo.price_standard).toFixed(2)}€</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>⭐ VIP</Text>
              <Text style={[styles.priceValue, { color: COLORS.accent }]}>{Number(showtimeInfo.price_vip).toFixed(2)}€</Text>
            </View>
          </View>
        )}

        {/* Selected Seats Summary */}
        {selectedSeats.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Επιλεγμένες Θέσεις</Text>
            <View style={styles.selectedChips}>
              {selectedSeats.map((seat) => (
                <TouchableOpacity
                  key={seat.seat_number}
                  style={styles.chip}
                  onPress={() => toggleSeat(seat)}
                >
                  <Text style={styles.chipText}>{seat.seat_number}</Text>
                  <Text style={styles.chipCategory}>{seat.seat_category === 'vip' ? '⭐' : '🪑'}</Text>
                  <Ionicons name="close-circle" size={14} color="#FFF" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Σύνολο ({selectedSeats.length} θέσεις)</Text>
              <Text style={styles.totalValue}>{getTotalPrice().toFixed(2)}€</Text>
            </View>
          </View>
        )}

        {/* Book Button */}
        <TouchableOpacity
          style={[styles.bookBtn, selectedSeats.length === 0 && styles.bookBtnDisabled]}
          onPress={handleBooking}
          disabled={submitting || selectedSeats.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.bookBtnText}>
                {selectedSeats.length === 0 ? 'Επιλέξτε θέσεις' : `Κράτηση ${selectedSeats.length} θέσ. — ${getTotalPrice().toFixed(2)}€`}
              </Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
  },
  backBtn: { backgroundColor: COLORS.card, borderRadius: 12, padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  headerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  stageWrapper: { alignItems: 'center', marginVertical: 16, paddingHorizontal: 32 },
  stage: {
    backgroundColor: '#2A1A4A', borderRadius: 12, paddingVertical: 10,
    width: '80%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary,
  },
  stageText: { color: COLORS.primary, fontSize: 14, fontWeight: '700', letterSpacing: 3 },
  stageShadow: {
    width: '70%', height: 8, backgroundColor: '#1A0A3A',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  legend: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 12, marginBottom: 16, paddingHorizontal: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { color: COLORS.textSecondary, fontSize: 11 },
  seatMap: { paddingHorizontal: 8, marginBottom: 16 },
  rowContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700', width: 18, textAlign: 'center' },
  rowSeats: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 },
  seat: {
    width: 28, height: 28, borderRadius: 6, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  seatText: { fontSize: 9, fontWeight: '700' },
  priceInfo: {
    flexDirection: 'row', backgroundColor: COLORS.card, marginHorizontal: 16,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 12, alignItems: 'center',
  },
  priceItem: { flex: 1, alignItems: 'center' },
  priceLabel: { color: COLORS.textSecondary, fontSize: 13 },
  priceValue: { color: COLORS.success, fontSize: 18, fontWeight: '800', marginTop: 2 },
  priceDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
  summaryCard: {
    backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: COLORS.primary, marginBottom: 12,
  },
  summaryTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 4,
  },
  chipText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  chipCategory: { fontSize: 11 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: COLORS.textSecondary, fontSize: 14 },
  totalValue: { color: COLORS.accent, fontSize: 22, fontWeight: '800' },
  bookBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary, marginHorizontal: 16,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    justifyContent: 'center', marginBottom: 32,
  },
  bookBtnDisabled: { backgroundColor: '#333' },
  bookBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
