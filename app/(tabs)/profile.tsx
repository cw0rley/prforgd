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
import { useFocusEffect, useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Session } from '@supabase/supabase-js';
import { signUp, signIn, signOut, getSession, onAuthChange } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { fullSync, SyncStats } from '../../src/lib/sync';
import { getResults } from '../../src/storage/workoutStorage';
import { getFavorites } from '../../src/storage/favoritesStorage';
import { colors, spacing } from '../../src/theme';
import { Toast, useToast } from '../../src/components/Toast';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStats | null>(null);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [stats, setStats] = useState({ workouts: 0, favorites: 0 });
  const { toast, show: showToast, hide: hideToast } = useToast();
  const router = useRouter();

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
      showToast('Enter email and password', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      showToast('Check your email for a confirmation link.', 'success', 6000);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  }

  async function handleSignIn() {
    if (!email || !password) {
      showToast('Enter email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const { session: s } = await signIn(email, password);
      setSession(s);
      if (s) {
        setSyncing(true);
        const result = await fullSync(s.user.id);
        setSyncResult(result);
        setSyncing(false);
        loadStats();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
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
      showToast(err.message, 'error');
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'facebook' | 'apple') {
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
      showToast(err.message, 'error');
    }
    setLoading(false);
  }

  // Native Sign in with Apple (iOS only). Uses the system sheet and exchanges
  // the identity token with Supabase — required for App Store approval.
  async function handleAppleSignIn() {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple.');
      }
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (err: any) {
      // User canceling the native sheet is not an error worth surfacing.
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        showToast(err.message, 'error');
      }
    }
    setLoading(false);
  }

  async function handleSync() {
    if (!session) return;
    setSyncing(true);
    setSyncResult(null);
    const result = await fullSync(session.user.id);
    setSyncResult(result);
    loadStats();
    setSyncing(false);
  }

  if (session) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>PROFILE</Text>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />

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
        {syncResult ? (
          <View style={[styles.syncResultCard, syncResult.error ? styles.syncResultError : styles.syncResultSuccess]}>
            {syncResult.error ? (
              <Text style={styles.syncResultText}>Sync error: {syncResult.error}</Text>
            ) : (
              <>
                <Text style={styles.syncResultText}>
                  {syncResult.uploaded > 0 || syncResult.downloaded > 0
                    ? `↑ ${syncResult.uploaded} uploaded · ↓ ${syncResult.downloaded} downloaded`
                    : 'Already up to date'}
                </Text>
                <Text style={styles.syncResultDetail}>
                  {syncResult.totalWorkouts} workouts · {syncResult.totalFavorites} favorites
                </Text>
              </>
            )}
          </View>
        ) : (
          <Text style={styles.syncHint}>
            Merges your data across devices. Workouts and favorites are combined — nothing gets overwritten.
          </Text>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpBtn} onPress={() => router.push('/help')}>
          <Text style={styles.helpBtnText}>USER MANUAL</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>PROFILE</Text>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
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

      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={8}
          style={styles.appleBtn}
          onPress={handleAppleSignIn}
        />
      ) : (
        <TouchableOpacity
          style={styles.appleBtn}
          onPress={() => handleSocialSignIn('apple')}
          disabled={loading}
        >
          <Text style={styles.appleBtnText}>CONTINUE WITH APPLE</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.helpBtn} onPress={() => router.push('/help')}>
        <Text style={styles.helpBtnText}>USER MANUAL</Text>
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
  appleBtn: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: '100%',
    height: 52,
  },
  appleBtnText: {
    color: '#fff',
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
  syncResultCard: {
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  syncResultSuccess: {
    backgroundColor: 'rgba(127,255,59,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(127,255,59,0.3)',
  },
  syncResultError: {
    backgroundColor: 'rgba(255,59,59,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,59,0.3)',
  },
  syncResultText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  syncResultDetail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
  helpBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  helpBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
