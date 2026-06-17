import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Session } from '@supabase/supabase-js';
import { signUp, signIn, signOut, deleteAccount, getSession, onAuthChange, verifyEmailOtp, resendSignupOtp } from '../../src/lib/auth';
import { supabase } from '../../src/lib/supabase';
import { syncNow, mergeAnonIntoUser, SyncStats } from '../../src/lib/sync';
import { getResults } from '../../src/storage/workoutStorage';
import { getFavorites } from '../../src/storage/favoritesStorage';
import { refreshCouponBonus } from '../../src/lib/subscription';
import { colors, spacing } from '../../src/theme';
import { Toast, useToast } from '../../src/components/Toast';
import { CouponRedeem } from '../../src/components/CouponRedeem';

// Completes any pending auth session if the app was reopened via the
// OAuth redirect (no-op otherwise). Must run at module scope.
WebBrowser.maybeCompleteAuthSession();

// Web-only button with hover feedback (react-native-web exposes `hovered`
// in the Pressable style callback; native ignores it).
function HoverButton({
  style,
  hoverStyle,
  onPress,
  disabled,
  children,
}: {
  style: any;
  hoverStyle?: any;
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={(state: any) => [
        style,
        state.hovered && hoverStyle,
        state.pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {children}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncStats | null>(null);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  // When set, we're awaiting the 6-digit email confirmation code for this email.
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [stats, setStats] = useState({ workouts: 0, favorites: 0 });
  const { toast, show: showToast, hide: hideToast } = useToast();
  const router = useRouter();

  // Tracks the last user we ran the post-login merge+sync for, so auth events
  // that fire repeatedly (token refresh, focus) don't re-trigger it.
  const lastUserRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSession().then(handleSession);
      loadStats();
      const { data: listener } = onAuthChange(handleSession);
      return () => listener.subscription.unsubscribe();
    }, [])
  );

  function handleSession(s: Session | null) {
    setSession(s);
    const uid = s?.user?.id ?? null;
    if (uid && uid !== lastUserRef.current) {
      lastUserRef.current = uid;
      void afterLogin(uid);
    } else if (!uid) {
      lastUserRef.current = null;
    }
  }

  // Runs once per login: fold any logged-out (anonymous) data into the user's
  // bucket, then reconcile with the cloud.
  async function afterLogin(userId: string) {
    setSyncing(true);
    await mergeAnonIntoUser(userId);
    const result = await syncNow();
    setSyncResult(result);
    setSyncing(false);
    // Pull any redeemed-coupon bonus into the local cache for the free-limit checks.
    refreshCouponBonus().catch(() => {});
    loadStats();
  }

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
      // Confirmation is a 6-digit code (not a link) — move to the verify step.
      setOtpCode('');
      setOtpEmail(email.trim());
      showToast('We sent a 6-digit code to your email.', 'success', 6000);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (!otpEmail) return;
    if (otpCode.trim().length < 6) {
      showToast('Enter the 6-digit code from your email.', 'error');
      return;
    }
    setLoading(true);
    try {
      const { session: s } = await verifyEmailOtp(otpEmail, otpCode);
      setOtpEmail(null);
      setOtpCode('');
      setPassword('');
      handleSession(s); // signs in + triggers the post-login merge/sync
    } catch (err: any) {
      showToast(err.message || 'That code is incorrect or expired.', 'error');
    }
    setLoading(false);
  }

  async function handleResendOtp() {
    if (!otpEmail) return;
    try {
      await resendSignupOtp(otpEmail);
      showToast('New code sent.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleSignIn() {
    if (!email || !password) {
      showToast('Enter email and password', 'error');
      return;
    }
    setLoading(true);
    try {
      const { session: s } = await signIn(email, password);
      handleSession(s); // triggers the post-login merge + sync
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setLoading(false);
  }

  async function handleSignOut() {
    // Flush any pending local changes while we still hold the session.
    try {
      await syncNow();
    } catch {
      // best-effort; tombstones/dirty flag persist for the next login
    }
    try {
      await signOut();
      lastUserRef.current = null;
      setSession(null);
      setSyncResult(null);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleSocialSignIn(provider: 'google' | 'facebook' | 'apple') {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        // On web the browser redirects to the provider and back automatically.
        // redirectTo uses the current origin so it returns to localhost in dev
        // and prforgd.com in prod. The (tabs) group is not part of the URL, so
        // the profile tab is served at /profile. _layout picks up the tokens
        // from the callback hash regardless of which route we land on.
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: window.location.origin + '/profile' },
        });
        if (error) throw error;
      } else {
        // On native, signInWithOAuth only returns the provider URL — we have
        // to open it ourselves and pull the tokens out of the callback URL.
        const redirectTo = 'prforgd://auth/callback';
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo, skipBrowserRedirect: true },
        });
        if (error) throw error;
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          const fragment = result.url.split('#')[1] ?? '';
          const params = new URLSearchParams(fragment);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (!access_token || !refresh_token) {
            throw new Error('Sign-in failed. Please try again.');
          }
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionErr) throw sessionErr;
        }
        // result.type === 'cancel'/'dismiss' means the user backed out — not an error.
      }
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

  // Account deletion (App Store Guideline 5.1.1(v)): confirmation step, then
  // the server endpoint cancels any subscription, wipes synced data, and
  // deletes the auth user. Workouts saved on this device are not affected.
  function confirmDeleteAccount() {
    const message =
      'This permanently deletes your account and all synced data (workouts, favorites, and any subscription). This cannot be undone.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete your account?\n\n${message}`)) {
        handleDeleteAccount();
      }
    } else {
      Alert.alert('Delete Account?', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeleteAccount },
      ]);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      setSession(null);
      setEmail('');
      setPassword('');
      showToast('Your account has been deleted.', 'success', 6000);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
    setDeleting(false);
  }

  async function handleSync() {
    if (!session) return;
    setSyncing(true);
    setSyncResult(null);
    const result = await syncNow();
    setSyncResult(result);
    loadStats();
    setSyncing(false);
  }

  // Email-confirmation step: user types the 6-digit code we emailed. Shown for
  // both web and native (the code flow is identical on each).
  if (otpEmail && !session) {
    const isWeb = Platform.OS === 'web';
    return (
      <ScrollView style={styles.container} contentContainerStyle={isWeb ? web.page : styles.content}>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
        <View style={isWeb ? web.card : undefined}>
          <Text style={styles.title}>VERIFY EMAIL</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code we sent to {otpEmail}.
          </Text>
          <TextInput
            style={[isWeb ? web.input : styles.input, styles.otpInput]}
            value={otpCode}
            onChangeText={(t) => setOtpCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            onSubmitEditing={handleVerifyOtp}
          />
          <TouchableOpacity
            style={[styles.authBtn, loading && { opacity: 0.5 }]}
            onPress={handleVerifyOtp}
            disabled={loading}
          >
            <Text style={styles.authBtnText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn} onPress={handleResendOtp}>
            <Text style={styles.helpBtnText}>RESEND CODE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textLink}
            onPress={() => { setOtpEmail(null); setOtpCode(''); }}
          >
            <Text style={styles.textLinkText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (session) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, Platform.OS === 'web' && web.signedInPage]}
      >
        <View style={Platform.OS === 'web' ? web.signedInColumn : undefined}>
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

        <CouponRedeem onRedeemed={() => loadStats()} />

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

        <TouchableOpacity
          style={[styles.deleteAccountBtn, deleting && { opacity: 0.5 }]}
          onPress={confirmDeleteAccount}
          disabled={deleting}
        >
          <Text style={styles.deleteAccountBtnText}>
            {deleting ? 'DELETING ACCOUNT...' : 'DELETE ACCOUNT'}
          </Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Web-only login: centered max-width card on the navy background with
  // hover/focus states and Enter-to-submit. Native keeps the layout below.
  if (Platform.OS === 'web') {
    const submit = tab === 'login' ? handleSignIn : handleSignUp;
    return (
      <ScrollView style={styles.container} contentContainerStyle={web.page}>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />

        <View style={web.card}>
          <View style={web.titleRow}>
            <Image source={require('../../brand-kit/png/icon-256.png')} style={web.logo} />
            <View style={web.titleCol}>
              <Text style={web.cardTitle}>
                {tab === 'login' ? 'Welcome back' : 'Create your account'}
              </Text>
              <Text style={web.cardSubtitle}>
                Sync your workouts, PRs, and favorites across devices.
              </Text>
            </View>
          </View>

          <View style={web.tabRow}>
            {(['login', 'signup'] as const).map((t) => (
              <Pressable key={t} onPress={() => setTab(t)} style={[web.tab, tab === t && web.tabActive]}>
                <Text style={[web.tabText, tab === t && web.tabTextActive]}>
                  {t === 'login' ? 'SIGN IN' : 'SIGN UP'}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[web.input, focusedInput === 'email' && web.inputFocused]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
            onSubmitEditing={submit}
          />
          <View style={web.passwordWrap}>
            <TextInput
              style={[web.input, web.inputWithIcon, focusedInput === 'password' && web.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              onSubmitEditing={submit}
            />
            <Pressable style={web.eyeBtn} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <HoverButton
            style={web.primaryBtn}
            hoverStyle={web.primaryBtnHover}
            onPress={submit}
            disabled={loading}
          >
            <Text style={web.primaryBtnText}>
              {loading ? 'LOADING...' : tab === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </Text>
          </HoverButton>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={web.socialRow}>
            <HoverButton
              style={web.googleBtn}
              hoverStyle={web.googleBtnHover}
              onPress={() => handleSocialSignIn('google')}
              disabled={loading}
            >
              <Ionicons name="logo-google" size={16} color="#333" />
              <Text style={web.googleBtnText}>GOOGLE</Text>
            </HoverButton>
            <HoverButton
              style={web.appleBtn}
              hoverStyle={web.appleBtnHover}
              onPress={() => handleSocialSignIn('apple')}
              disabled={loading}
            >
              <Ionicons name="logo-apple" size={16} color="#fff" />
              <Text style={web.appleBtnText}>APPLE</Text>
            </HoverButton>
          </View>
        </View>

        <HoverButton
          style={web.helpLink}
          hoverStyle={web.helpLinkHover}
          onPress={() => router.push('/help')}
        >
          <Text style={web.helpLinkText}>USER MANUAL</Text>
        </HoverButton>
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
      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, styles.inputWithIcon]}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
        />
        <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textMuted}
          />
        </Pressable>
      </View>

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
  passwordWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  inputWithIcon: {
    marginBottom: 0,
    paddingRight: 46,
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  otpInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  textLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  textLinkText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  deleteAccountBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  deleteAccountBtnText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

// Web-only login styles (centered card layout).
const web = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  // Signed-in profile on web: center the content in a max-width column so it
  // doesn't stretch phone-narrow/full-width across a desktop screen.
  signedInPage: {
    alignItems: 'center',
  },
  signedInColumn: {
    width: '100%',
    maxWidth: 480,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  titleCol: {
    flex: 1,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.xl,
    // Subtle lift off the navy background.
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
  } as any,
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.primary,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    outlineStyle: 'none',
  } as any,
  inputFocused: {
    borderColor: colors.primary,
  },
  passwordWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  inputWithIcon: {
    marginBottom: 0,
    paddingRight: 46,
  },
  eyeBtn: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  primaryBtnHover: {
    backgroundColor: colors.primaryDark,
  },
  primaryBtnText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  googleBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnHover: {
    backgroundColor: '#e8e8e8',
  },
  googleBtnText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appleBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#000',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtnHover: {
    backgroundColor: '#222',
  },
  appleBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  helpLink: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  helpLinkHover: {
    opacity: 0.7,
  },
  helpLinkText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
