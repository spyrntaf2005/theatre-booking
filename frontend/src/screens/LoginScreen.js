import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#7C3AED',
  primaryLight: '#9D5FF0',
  background: '#0F0F1A',
  card: '#1A1A2E',
  input: '#16213E',
  text: '#FFFFFF',
  textSecondary: '#A0A0C0',
  border: '#2A2A4A',
  error: '#FF4757',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε email και password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Σφάλμα σύνδεσης. Δοκιμάστε ξανά.';
      Alert.alert('Σφάλμα', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <Text style={styles.emoji}>🎭</Text>
        <Text style={styles.title}>TheatreBook</Text>
        <Text style={styles.subtitle}>Κάνε κράτηση για την αγαπημένη σου παράσταση</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Σύνδεση</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>
            Δεν έχεις λογαριασμό; <Text style={styles.registerHighlight}>Εγγραφή</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: '800', color: COLORS.text, letterSpacing: 1 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  form: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, elevation: 10 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 12, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  eyeIcon: { padding: 4 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  registerLink: { marginTop: 20, alignItems: 'center' },
  registerText: { color: COLORS.textSecondary, fontSize: 14 },
  registerHighlight: { color: COLORS.primaryLight, fontWeight: '700' },
});
