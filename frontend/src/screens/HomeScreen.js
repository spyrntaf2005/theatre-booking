import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { getShows, getTheatres } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C3AED',
  background: '#0F0F1A',
  card: '#1A1A2E',
  input: '#16213E',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  border: '#2A2A4A',
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [shows, setShows] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTheatre, setSelectedTheatre] = useState(null);

  const fetchData = async () => {
    try {
      const [showsRes, theatresRes] = await Promise.all([getShows(), getTheatres()]);
      setShows(showsRes.data);
      setTheatres(theatresRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredShows = shows.filter((show) => {
    const matchSearch =
      show.title.toLowerCase().includes(search.toLowerCase()) ||
      show.theatre_name.toLowerCase().includes(search.toLowerCase());
    const matchTheatre = selectedTheatre !== null ? show.theatre_id === selectedTheatre : true;
    return matchSearch && matchTheatre;
  });

  const renderShow = ({ item }) => (
    <TouchableOpacity
      style={styles.showCard}
      onPress={() => navigation.navigate('ShowDetail', { show: item })}
      activeOpacity={0.85}
    >
      <View style={styles.showEmoji}>
        <Text style={styles.showEmojiText}>🎭</Text>
      </View>
      <View style={styles.showInfo}>
        <Text style={styles.showTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.showTheatre} numberOfLines={1}>
          <Ionicons name="business-outline" size={12} color={COLORS.textSecondary} /> {item.theatre_name}
        </Text>
        <Text style={styles.showLocation} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} /> {item.theatre_location}
        </Text>
        <View style={styles.showMeta}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.age_rating}</Text>
          </View>
          <Text style={styles.showDuration}>⏱ {item.duration} λεπτά</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Καλωσόρισες 👋</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>🎭</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Αναζήτηση παράστασης ή θεάτρου..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Theatre filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ theatre_id: null, name: 'Όλα' }, ...theatres]}
        keyExtractor={(item, i) => String(item.theatre_id ?? `all-${i}`)}
        style={styles.filterList}
        contentContainerStyle={{ paddingRight: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedTheatre === item.theatre_id && styles.filterChipActive,
            ]}
            onPress={() => setSelectedTheatre(item.theatre_id)}
          >
            <Text style={[
              styles.filterChipText,
              selectedTheatre === item.theatre_id && styles.filterChipTextActive,
            ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Section title */}
      <Text style={styles.sectionTitle}>
        Διαθέσιμες Παραστάσεις ({filteredShows.length})
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <FlatList
        data={filteredShows}
        keyExtractor={(item) => String(item.show_id)}
        renderItem={renderShow}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Δεν βρέθηκαν παραστάσεις</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16,
  },
  greeting: { color: COLORS.textSecondary, fontSize: 14 },
  userName: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  headerIcon: {
    width: 46, height: 46, backgroundColor: COLORS.card,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
  },
  headerEmoji: { fontSize: 24 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, paddingHorizontal: 14, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, paddingVertical: 12 },
  filterList: { marginBottom: 16 },
  filterChip: {
    backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#FFF' },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 12 },
  showCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  showEmoji: {
    width: 54, height: 54, backgroundColor: '#2A1A4A',
    borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  showEmojiText: { fontSize: 26 },
  showInfo: { flex: 1 },
  showTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  showTheatre: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 2 },
  showLocation: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  showMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: '#2A1A4A', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  showDuration: { color: COLORS.textSecondary, fontSize: 12 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: COLORS.textSecondary, fontSize: 16 },
});
