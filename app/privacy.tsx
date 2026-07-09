import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../src/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: string }) {
  return <Text style={styles.body}>{children}</Text>;
}

function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{
        title: 'Privacy Policy',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>PRIVACY POLICY</Text>
        <Text style={styles.updated}>Last updated: May 28, 2026</Text>

        <Section title="Overview">
          <P>PRForgd ("we", "our", "the app") is a CrossFit workout tracking application. We respect your privacy and are committed to protecting your personal data. This policy explains what data we collect, how we use it, and your rights.</P>
        </Section>

        <Section title="Data We Collect">
          <P>When you create an account, we collect:</P>
          <Bullet>Email address (for authentication)</Bullet>
          <Bullet>Display name (if provided via Google or Apple sign-in)</Bullet>
          <P>When you use the app, we store:</P>
          <Bullet>Workout results (times, rounds, reps, notes, dates)</Bullet>
          <Bullet>Favorite WODs</Bullet>
          <Bullet>Equipment selections</Bullet>
          <P>All workout data is stored locally on your device. If you create an account, your data is also synced to our cloud database (Supabase) so you can access it across devices.</P>
        </Section>

        <Section title="Camera Access">
          <P>The app may request camera access for the workout scan feature, which uses OCR to read workout text from photos. Photos are processed locally and are not uploaded to any server.</P>
        </Section>

        <Section title="How We Use Your Data">
          <Bullet>To provide and maintain the app</Bullet>
          <Bullet>To sync your workout data across devices</Bullet>
          <Bullet>To send transactional emails (account confirmation, password reset)</Bullet>
          <P>We do not sell, share, or rent your personal data to third parties. We do not use your data for advertising or marketing purposes.</P>
        </Section>

        <Section title="Third-Party Services">
          <P>We use the following services to operate the app:</P>
          <Bullet>Supabase — authentication and cloud database</Bullet>
          <Bullet>Amazon SES — transactional email delivery</Bullet>
          <Bullet>Vercel — web hosting</Bullet>
          <P>These services process data only as needed to provide their functionality. Each has its own privacy policy.</P>
        </Section>

        <Section title="Data Retention">
          <P>Your data is retained as long as your account is active. You can permanently delete your account and all associated data at any time from the Me tab using the Delete Account option. You can also contact us at support@prforgd.com.</P>
        </Section>

        <Section title="Your Rights">
          <P>You have the right to:</P>
          <Bullet>Access your personal data</Bullet>
          <Bullet>Request correction of your data</Bullet>
          <Bullet>Request deletion of your account and data</Bullet>
          <Bullet>Export your workout data (available in-app via the Log tab)</Bullet>
        </Section>

        <Section title="Children's Privacy">
          <P>The app is not intended for children under 13. We do not knowingly collect data from children under 13.</P>
        </Section>

        <Section title="Changes to This Policy">
          <P>We may update this policy from time to time. Changes will be posted on this page with an updated date.</P>
        </Section>

        <Section title="Contact">
          <P>If you have questions about this privacy policy, contact us at support@prforgd.com.</P>
        </Section>
      </ScrollView>
    </>
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
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  updated: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  bulletDot: {
    fontSize: 14,
    color: colors.primary,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  bulletText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
});
