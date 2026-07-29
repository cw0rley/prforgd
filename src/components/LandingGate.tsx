import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors, spacing } from '../theme';

// Web-only marketing "front page". This is a HARD gate: logged-out visitors on
// prforgd.com always see it and cannot browse the app — the only routes reachable
// while signed out are the login screen (/profile) and the public info pages
// (/privacy, /help) linked from the landing itself. Signing in reveals the app.
//
// Never shown on native (users already installed from the App/Play store) or to
// anyone with an active session.

// True if a persisted Supabase auth token is present in web storage (i.e. the
// visitor is signed in). Cheap enough to call on every render.
function hasAuthToken(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      // Matches `sb-<ref>-auth-token` and chunked variants (`…-auth-token.0`),
      // but not the PKCE `…-auth-token-code-verifier` (present mid-OAuth, pre-login).
      if (k && k.startsWith('sb-') && /auth-token(\.\d+)?$/.test(k)) return true;
    }
  } catch {
    // storage blocked (private mode) — assume logged out.
  }
  return false;
}

// True during an OAuth (e.g. Google) redirect-back: the provider returns to the
// site with the tokens in the URL hash before the root layout has called
// setSession(), so the auth token isn't in storage yet. Treat this as logged-in
// so the gate never flashes the landing between the redirect and setSession.
function hasOAuthCallback(): boolean {
  if (Platform.OS !== 'web') return false;
  try {
    return typeof window !== 'undefined' && window.location.hash.includes('access_token');
  } catch {
    return false;
  }
}

// App store listings — official download badges link here.
const APP_STORE_URL = 'https://apps.apple.com/us/app/prforgd/id6774586516';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.prforgd.app';

// ---- Editable marketing content -------------------------------------------
// Everything below is placeholder copy — tweak freely.

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'barbell-outline', title: 'Every benchmark WOD', body: 'Hero WODs, Girl WODs and classic benchmarks — all in one place.' },
  { icon: 'trophy-outline', title: 'Automatic PRs', body: 'Log a workout and your personal records update themselves.' },
  { icon: 'cloud-offline-outline', title: 'Works offline', body: 'Log at the gym with no signal — it syncs across devices later.' },
  { icon: 'play-circle-outline', title: 'Movement demos', body: 'Video demos and scaling options for every movement in a WOD.' },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'search-outline', title: 'Pick a WOD', body: 'Browse hundreds of named workouts or create your own.' },
  { icon: 'stopwatch-outline', title: 'Log your score', body: 'Enter your time, reps or rounds in a couple of taps — Rx or scaled.' },
  { icon: 'trending-up-outline', title: 'Watch PRs climb', body: 'Your records and history update automatically, every session.' },
];

// NOTE: placeholder stats — replace with real numbers before you lean on them.
const STATS: { value: string; label: string }[] = [
  { value: '100+', label: 'Hero, Girl & benchmark WODs' },
  { value: '100%', label: 'Free to get started' },
  { value: '24/7', label: 'Works offline at the gym' },
];

const FAQS: { q: string; a: string }[] = [
  { q: 'Is it free?', a: 'Yes — browse every WOD and start logging for free. An optional upgrade unlocks unlimited history.' },
  { q: 'Does it work offline?', a: 'Absolutely. Log at the gym with no signal and it syncs across your devices once you’re back online.' },
  { q: 'Which workouts are included?', a: 'Hero WODs, Girl WODs and classic CrossFit benchmarks — plus any custom workouts you create.' },
  { q: 'Is my data synced?', a: 'Sign in and your workouts, PRs and favorites follow you across web, iOS and Android.' },
];

// Fake app rows for the phone mockup.
const MOCK_ROWS: { name: string; detail: string; pr?: boolean }[] = [
  { name: 'Murph', detail: '38:24', pr: true },
  { name: 'Fran', detail: '3:12' },
  { name: 'Cindy', detail: '18 rds' },
  { name: 'Grace', detail: '2:47' },
];
// ---------------------------------------------------------------------------

export default function LandingGate() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const pathname = usePathname();

  // Hard gate: logged-out web visitors ALWAYS see the landing page and cannot
  // browse the app. The only routes reachable while logged out are the login
  // screen and the public info pages linked from the landing itself.
  const PUBLIC_ROUTES = ['/profile', '/privacy', '/help'];

  // "Logged in" is STICKY: seeded synchronously from the persisted auth token so
  // a signed-in visitor never sees the landing flash on load, and only ever
  // cleared by an explicit SIGNED_OUT event. This avoids the transient gate flash
  // during the login → app navigation, where the session object and the token
  // write can briefly lag the route change.
  const [authed, setAuthed] = useState<boolean>(() => hasAuthToken() || hasOAuthCallback());

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // getSession only ever confirms logged-IN — it must not flip us back to the
    // gate (a stale null from a pre-login read would cause exactly the flash).
    supabase.auth.getSession().then(({ data }) => { if (data.session) setAuthed(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') setAuthed(false);
      else if (s) setAuthed(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loggedIn = authed || hasAuthToken();

  function getStarted() {
    router.push('/profile'); // the gate auto-hides on the /profile route
  }

  const gated =
    Platform.OS === 'web' && !loggedIn && !PUBLIC_ROUTES.includes(pathname);
  if (!gated) return null;

  return (
    <View style={styles.overlay}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
        {/* ---- Top nav ---- */}
        <View style={[styles.nav, { maxWidth: CONTENT_MAX }]}>
          <Image
            source={require('../../assets/header-landing.svg')}
            style={[styles.navHeader, isDesktop && styles.navHeaderDesktop]}
            resizeMode="contain"
            accessibilityLabel="PR FORGD"
          />
          <Pressable onPress={getStarted} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.navSignIn}>Sign in</Text>
          </Pressable>
        </View>

        {/* ---- Hero ---- */}
        <View style={[styles.hero, isDesktop && styles.heroDesktop, { maxWidth: CONTENT_MAX }]}>
          <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
            <Text style={styles.eyebrow}>CROSSFIT WORKOUT TRACKER</Text>
            <Text style={[styles.headline, isDesktop && styles.headlineDesktop]}>
              Track every WOD.{'\n'}Crush every PR.
            </Text>
            <Text style={styles.subhead}>
              The benchmark tracker for Hero WODs, Girl WODs and more — log your
              times, watch your PRs climb, and never lose a score again.
            </Text>
            <View style={[styles.actions, isDesktop && styles.actionsDesktop]}>
              <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]} onPress={getStarted}>
                <Text style={styles.primaryText}>Get started — it's free</Text>
              </Pressable>
            </View>
            <StoreBadges center={!isDesktop} />
          </View>

          {/* Phone mockup */}
          <View style={styles.heroArt}>
            <View style={styles.glow} />
            <PhoneMockup />
          </View>
        </View>

        {/* ---- Stats strip ---- */}
        <View style={[styles.statsRow, isDesktop && styles.statsRowDesktop, { maxWidth: CONTENT_MAX }]}>
          {STATS.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ---- How it works ---- */}
        <Section title="How it works" subtitle="From cold open to logged PR in under a minute." isDesktop={isDesktop}>
          <View style={[styles.steps, isDesktop && styles.stepsDesktop]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.step, isDesktop && styles.stepDesktop]}>
                <View style={styles.stepNumWrap}>
                  <Ionicons name={s.icon} size={24} color={colors.primary} />
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepBody}>{s.body}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ---- Features ---- */}
        <Section title="Built for athletes who track" isDesktop={isDesktop}>
          <View style={[styles.features, isDesktop && styles.featuresDesktop]}>
            {FEATURES.map((f) => (
              <View key={f.title} style={[styles.feature, isDesktop && styles.featureDesktop]}>
                <Ionicons name={f.icon} size={26} color={colors.primary} style={styles.featureIcon} />
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* ---- FAQ ---- */}
        <Section title="Questions" isDesktop={isDesktop}>
          <View style={styles.faqWrap}>
            {FAQS.map((f) => (
              <View key={f.q} style={styles.faqItem}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Text style={styles.faqA}>{f.a}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* ---- Final CTA ---- */}
        <View style={[styles.cta, { maxWidth: CONTENT_MAX }]}>
          <Text style={styles.ctaTitle}>Ready to log your next WOD?</Text>
          <Text style={styles.ctaSub}>Start free — no credit card, no app store required.</Text>
          <Pressable style={({ pressed }) => [styles.primaryBtn, styles.ctaBtn, pressed && styles.pressed]} onPress={getStarted}>
            <Text style={styles.primaryText}>Get started — it's free</Text>
          </Pressable>
          <StoreBadges center />
        </View>

        {/* ---- Footer ---- */}
        <View style={[styles.footer, { maxWidth: CONTENT_MAX }]}>
          <View style={styles.footerLinks}>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/help')}>
              <Text style={styles.footerLink}>User manual</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('mailto:info@prforgd.com')}>
              <Text style={styles.footerLink}>Contact</Text>
            </Pressable>
          </View>
          <View style={styles.footerSocials}>
            <SocialIcon icon="logo-instagram" label="PRForgd on Instagram" url="https://instagram.com/prforgd" />
            <SocialIcon icon="logo-tiktok" label="PRForgd on TikTok" url="https://tiktok.com/@prforgd" />
            <SocialIcon icon="logo-twitter" label="PRForgd on X" url="https://x.com/prforgd" />
            <SocialIcon icon="logo-facebook" label="PRForgd on Facebook" url="https://www.facebook.com/profile.php?id=61592368778476" />
          </View>
          <Text style={styles.footerCopy}>© 2026 PRForgd · Built for the CrossFit community</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Official App Store / Google Play download badges.
function StoreBadges({ center }: { center?: boolean }) {
  return (
    <View style={[styles.storeBadges, center && styles.storeBadgesCenter]}>
      <Pressable
        onPress={() => Linking.openURL(APP_STORE_URL)}
        accessibilityRole="link"
        accessibilityLabel="Download PRForgd on the App Store"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={require('../../assets/badges/app-store.svg')} style={styles.badgeApple} resizeMode="contain" />
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL(PLAY_STORE_URL)}
        accessibilityRole="link"
        accessibilityLabel="Get PRForgd on Google Play"
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={require('../../assets/badges/google-play.png')} style={styles.badgeGoogle} resizeMode="contain" />
      </Pressable>
    </View>
  );
}

// Footer social link — an icon that brightens on hover (web) / press.
function SocialIcon({ icon, label, url }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; url: string }) {
  const [active, setActive] = useState(false);
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      onHoverIn={() => setActive(true)}
      onHoverOut={() => setActive(false)}
      onPressIn={() => setActive(true)}
      onPressOut={() => setActive(false)}
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={8}
    >
      <Ionicons name={icon} size={34} color={active ? colors.primary : colors.textSecondary} />
    </Pressable>
  );
}

// Reusable section wrapper with a centered heading.
function Section({ title, subtitle, isDesktop, children }: { title: string; subtitle?: string; isDesktop: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { maxWidth: CONTENT_MAX }]}>
      <Text style={[styles.sectionTitle, isDesktop && styles.sectionTitleDesktop]}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

// Fake phone showing a mini WOD list — pure Views, no screenshot files.
function PhoneMockup() {
  return (
    <View style={styles.phone}>
      <View style={styles.phoneNotch} />
      <View style={styles.phoneScreen}>
        <Text style={styles.phoneHeader}>WODs</Text>
        {MOCK_ROWS.map((r) => (
          <View key={r.name} style={styles.mockRow}>
            <View style={styles.mockIcon}>
              <Ionicons name="barbell" size={16} color={colors.primary} />
            </View>
            <Text style={styles.mockName}>{r.name}</Text>
            <View style={[styles.mockPill, r.pr && styles.mockPillPr]}>
              {r.pr ? <Ionicons name="trophy" size={11} color={colors.background} style={{ marginRight: 3 }} /> : null}
              <Text style={[styles.mockPillText, r.pr && styles.mockPillTextPr]}>{r.detail}</Text>
            </View>
          </View>
        ))}
        <View style={styles.mockTabbar}>
          {(['barbell', 'add-circle', 'time', 'person'] as const).map((n, i) => (
            <Ionicons key={n} name={i === 0 ? 'barbell' : `${n}-outline` as keyof typeof Ionicons.glyphMap} size={18} color={i === 0 ? colors.primary : colors.textMuted} />
          ))}
        </View>
      </View>
    </View>
  );
}

const CONTENT_MAX = 1040;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  scroll: {
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },

  // Nav
  nav: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  navLogo: { width: 34, height: 34, marginRight: spacing.sm },
  brand: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  navHeader: { width: 345, height: 110 },
  navHeaderDesktop: { width: 530, height: 170 },
  navSignIn: { color: colors.primary, fontSize: 15, fontWeight: '800' },

  // Hero
  hero: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  heroDesktop: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  heroCopy: { width: '100%', alignItems: 'center' },
  heroCopyDesktop: { flex: 1, alignItems: 'flex-start', paddingRight: spacing.xl },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: spacing.sm },
  headline: { color: colors.text, fontSize: 36, lineHeight: 42, fontWeight: '900', textAlign: 'center' },
  headlineDesktop: { fontSize: 54, lineHeight: 60, textAlign: 'left' },
  subhead: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    maxWidth: 520,
  },
  actions: { width: '100%', maxWidth: 380, gap: spacing.sm },
  actionsDesktop: { flexDirection: 'row', maxWidth: 520 },
  primaryBtn: { backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: spacing.lg, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.8 },

  heroArt: { alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },

  // Glow behind phone
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },

  // Phone mockup
  phone: {
    width: 240,
    borderRadius: 34,
    backgroundColor: '#000814',
    borderWidth: 8,
    borderColor: '#0A1B33',
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  phoneNotch: { alignSelf: 'center', width: 90, height: 20, backgroundColor: '#0A1B33', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  phoneScreen: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  phoneHeader: { color: colors.text, fontSize: 18, fontWeight: '900', marginBottom: spacing.sm, marginLeft: 4 },
  mockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs + 2,
  },
  mockIcon: { width: 26, height: 26, borderRadius: 6, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  mockName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  mockPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 },
  mockPillPr: { backgroundColor: colors.primary },
  mockPillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  mockPillTextPr: { color: colors.background },
  mockTabbar: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.sm, marginTop: spacing.xs },

  // Stats
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.cardBorder,
  },
  statsRowDesktop: { justifyContent: 'space-around' },
  stat: { alignItems: 'center', minWidth: 130 },
  statValue: { color: colors.primary, fontSize: 30, fontWeight: '900' },
  statLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 2, textAlign: 'center' },

  // Sections
  section: { width: '100%', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  sectionTitleDesktop: { fontSize: 32 },
  sectionSub: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.sm, maxWidth: 520 },

  // Steps
  steps: { width: '100%', marginTop: spacing.md, gap: spacing.md },
  stepsDesktop: { flexDirection: 'row', justifyContent: 'space-between' },
  step: { backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 14, padding: spacing.lg },
  stepDesktop: { flex: 1, marginHorizontal: spacing.xs },
  stepNumWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  stepNum: { color: colors.textMuted, fontSize: 22, fontWeight: '900', marginLeft: spacing.sm },
  stepTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 4 },
  stepBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Features
  features: { width: '100%', marginTop: spacing.md, gap: spacing.md },
  featuresDesktop: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  feature: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1, borderRadius: 12, padding: spacing.md },
  featureDesktop: { width: '48.5%' },
  featureIcon: { marginRight: spacing.sm, marginTop: 2 },
  featureCopy: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  featureBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },

  // FAQ
  faqWrap: { width: '100%', marginTop: spacing.md, maxWidth: 720 },
  faqItem: { borderBottomWidth: 1, borderBottomColor: colors.cardBorder, paddingVertical: spacing.md },
  faqQ: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  faqA: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },

  // CTA
  cta: { width: '100%', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xl, marginTop: spacing.lg },
  ctaTitle: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  ctaSub: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  ctaBtn: { minWidth: 260 },

  // Footer
  footer: { width: '100%', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  footerLink: { color: colors.textSecondary, fontSize: 14, fontWeight: '700' },
  footerSocials: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.md },
  // Store badges
  storeBadges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  storeBadgesCenter: { justifyContent: 'center' },
  badgeApple: { width: 156, height: 52 },
  // Google's official badge PNG bakes in ~1/8 transparent padding top & bottom,
  // so its box is enlarged to make the visible button match the Apple badge.
  badgeGoogle: { width: 183, height: 71 },
  footerCopy: { color: colors.textMuted, fontSize: 12, textAlign: 'center' },
});
