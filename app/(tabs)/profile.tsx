import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { signUp, signIn, signOut, getSession, onAuthChange } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { fullSync } from '../../src/lib/sync';
import { getResults } from '../../src/storage/workoutStorage';
import { getFavorites } from '../../src/storage/favoritesStorage';
import { colors, spacing } from '../../src/theme';

function showAlert(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
}

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [stats, setStats] = useState({ workouts: 0, favorites: 0 });

  useFocusEffect(
    useCallback(() => {
      getSession().then(setSession);
      loadStats();
      const { data: listener } = onAuthChange(setSession);
      return () => listener.subscription.unsubscribe();
    }, [])
  );

  async function loadStats() {
    const results = await getResults();
    const favs = await getFavorites();
    setStats({ workouts: results.length, favorites: favs.length });
  }

  async function handleSignUp() {
    if (!email || !password) {
      showAlert('Error', 'Enter email and password');
      return;
    }
    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      showAlert('Check your email', 'We sent you a confirmation link. Click it to activate your account.');
    } catch (err: any) {
      showAlert('Error', err.message);
    }
    setLoading(false);
  }

  async function handleSignIn() {
    if (!email || !password) {
      showAlert('Error', 'Enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { session: s } = await signIn(email, password);
      setSession(s);
      if (s) {
        setSyncing(true);
        await fullSync(s.user.id);
        setSyncing(false);
        loadStats();
        showAlert('Signed in', 'Your data has been synced!');
      }
    } catch (err: any) {
      showAlert('Error', err.message);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    try {
      await signOut();
      setSession(null);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      showAlert('Error', err.message);
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'facebook') {
    setLoading(true);
    try {
      const redirectTo = Platform.OS === 'web'
        ? window.location.origin + '/(tabs)/profile'
        : 'prforgd://auth/callback';
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err: any) {
      showAlert('Error', err.message);
    }
    setLoading(false);
  }

  async function handleSync() {
    if (!session) return;
    setSyncing(true);
    try {
      await fullSync(session.user.id);
      loadStats();
      showAlert('Synced', 'Your data is up to date!');
    } catch (err: any) {
      showAlert('Sync Error', err.message);
    }
    setSyncing(false);
  }

  if (session) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>PROFILE</Text>

        <View style={styles.profileCard}>
          <Text style={styles.emailText}>{session.user.email}</Text>
          <Text style={styles.memberSince}>
            Member since {new Date(session.user.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.workouts}</Text>
            <Text style={styles.statLabel}>WORKOUTS</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.favorites}</Text>
            <Text style={styles.statLabel}>FAVORITES</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, syncing && { opacity: 0.5 }]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Text style={styles.syncBtnText}>
            {syncing ? 'SYNCING...' : 'SYNC DATA'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.syncHint}>
          Merges your data across devices. Workouts and favorites are combined — nothing gets overwritten. Equipment uses your latest local settings.
        </Text>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>PROFILE</Text>
      <Text style={styles.subtitle}>
        Sign in to sync your workouts, PRs, and favorites across devices.
      </Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
          onPress={() => setTab('login')}
        >
          <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
            SIGN IN
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'signup' && styles.tabBtnActive]}
          onPress={() => setTab('signup')}
        >
          <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
            SIGN UP
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.authBtn, loading && { opacity: 0.5 }]}
        onPress={tab === 'login' ? handleSignIn : handleSignUp}
        disabled={loading}
      >
        <Text style={styles.authBtnText}>
          {loading ? 'LOADING...' : tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={() => handleSocialSignIn('google')}
        disabled={loading}
      >
        <Text style={styles.googleBtnText}>CONTINUE WITH GOOGLE</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingTop: Platform.OS === 'web' ? spacing.md : spacing.xl * 2,
    paddingBottom: spacing.xl * 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.background,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
  },
  googleBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  googleBtnText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  facebookBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  authBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  authBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  emailText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  memberSince: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  syncBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  syncBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  syncHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  signOutBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  signOutBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
