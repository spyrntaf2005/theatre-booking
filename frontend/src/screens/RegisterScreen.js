import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, StatusBar,
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
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Σφάλμα', 'Συμπληρώστε όλα τα πεδία.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Σφάλμα', 'Τα passwords δεν ταιριάζουν.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Σφάλμα', 'Το password πρέπει να έχει τουλάχιστον 6 χαρακτήρες.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || 'Σφάλμα εγγραφής. Δοκιμάστε ξανά.';
      Alert.alert('Σφάλμα', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emoji}>🎭</Text>
          <Text style={styles.title}>Δημιουργία Λογαριασμού</Text>
          <Text style={styles.subtitle}>Εγγραφή για κρατήσεις θεατρικών παραστάσεων</Text>
        </View>

        <View style={styles.form}>
          {[
            { label: 'Ονοματεπώνυμο', value: name, set: setName, icon: 'person-outline', placeholder: 'Γιώργης Παπαδόπουλος', type: 'default' },
            { label: 'Email', value: email, set: setEmail, icon: 'mail-outline', placeholder: 'your@email.com', type: 'email-address' },
          ].map((field) => (
            <View key={field.label}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={field.icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textSecondary}
                  value={field.value}
                  onChangeText={field.set}
                  keyboardType={field.type}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'words'}
                />
              </View>
            </View>
          ))}

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Επιβεβαίωση Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Επανάλαβε το password"
              placeholderTextColor={COLORS.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Εγγραφή</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Έχεις ήδη λογαριασμό; <Text style={styles.loginHighlight}>Σύνδεση</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  header: { alignItems: 'center', marginVertical: 32 },
  emoji: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center' },
  form: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 6, marginTop: 14, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.input, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 14 },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15,
    alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  loginLink: { marginTop: 20, alignItems: 'center' },
  loginText: { color: COLORS.textSecondary, fontSize: 14 },
  loginHighlight: { color: COLORS.primaryLight, fontWeight: '700' },
});
