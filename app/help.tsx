import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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

function SubHead({ children }: { children: string }) {
  return <Text style={styles.subHead}>{children}</Text>;
}

export default function HelpScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{
        title: 'User Manual',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} style={{ transform: [{ translateX: -4 }] }} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>USER MANUAL</Text>
        <Text style={styles.version}>PRForgd — www.prforgd.com</Text>

        {/* GETTING STARTED */}
        <Section title="Getting Started">
          <SubHead>Install as an App</SubHead>
          <P>iPhone/iPad: Open prforgd.com in Safari, tap the Share button, then "Add to Home Screen".</P>
          <P>Android: Open prforgd.com in Chrome, tap the three-dot menu, then "Add to Home Screen" or "Install App".</P>
          <P>Desktop: Bookmark prforgd.com or click the install icon in Chrome's address bar.</P>
        </Section>

        {/* WODS */}
        <Section title="WODs — Browse Workouts">
          <P>Your home screen with 160+ workouts: Hero WODs, Girl WODs, and Benchmarks.</P>
          <Bullet>Search by WOD name or movement name</Bullet>
          <Bullet>Tap the shuffle icon for a random WOD</Bullet>
          <Bullet>Tap the star to favorite a WOD</Bullet>
          <SubHead>Filters</SubHead>
          <Bullet>Favs — Your starred WODs</Bullet>
          <Bullet>My Gear — WODs you have equipment for</Bullet>
          <Bullet>Group — All / Hero / Girl / Benchmark</Bullet>
          <Bullet>Branch — Army / Navy / Marines / Air Force / Fire / LEO</Bullet>
          <Bullet>Type — For Time / Rounds / AMRAP</Bullet>
          <P>Each WOD card shows the name, type, movements, branch badge, and your PR if you have one.</P>
        </Section>

        {/* CREATE */}
        <Section title="Create — Generate or Build">
          <SubHead>Generate</SubHead>
          <P>Creates a random workout using only movements you have equipment for. Set your gear in the Gear tab first.</P>
          <Bullet>Tap GENERATE WOD to create one</Bullet>
          <Bullet>Optionally name it</Bullet>
          <Bullet>Tap EDIT to modify the workout text</Bullet>
          <Bullet>Tap GENERATE ANOTHER for a different one</Bullet>

          <SubHead>Build</SubHead>
          <P>Create a fully custom workout from scratch.</P>
          <Bullet>Pick the type: For Time, AMRAP, Rounds, or EMOM</Bullet>
          <Bullet>Set time cap or round count</Bullet>
          <Bullet>Type the workout or tap SCAN</Bullet>

          <SubHead>Scan Feature</SubHead>
          <P>Tap SCAN to photograph a whiteboard or printed workout. The app reads the text and puts it in the editor for you to review and edit before starting.</P>
          <Bullet>Good lighting and a straight-on angle work best</Bullet>
          <Bullet>Printed text is more accurate than handwriting</Bullet>
        </Section>

        {/* TIMER */}
        <Section title="Doing a Workout">
          <SubHead>With the Timer</SubHead>
          <P>Find a WOD and tap START. The timer screen keeps your screen on so you never lose your timer.</P>
          <Bullet>START — Begin the timer</Bullet>
          <Bullet>PAUSE / RESUME — Pause mid-workout</Bullet>
          <Bullet>RD X DONE — Record a round split</Bullet>
          <Bullet>STOP — End the workout</Bullet>
          <Bullet>RESET — Start over</Bullet>
          <P>After stopping, toggle Rx/Scaled, add notes, and tap SAVE.</P>

          <SubHead>Manual Log</SubHead>
          <P>Tap LOG instead of START to manually enter a past result with date, time or rounds, notes, and Rx status.</P>
        </Section>

        {/* HISTORY */}
        <Section title="Log — Workout History">
          <P>Shows every workout you've logged, newest first.</P>
          <Bullet>Filter by ALL, PRs, Rx, or Scaled</Bullet>
          <Bullet>Tap a workout to do it again with the timer</Bullet>
          <Bullet>Long-press a workout to delete it</Bullet>
          <Bullet>Tap the download icon to export as CSV or JSON</Bullet>
        </Section>

        {/* GEAR */}
        <Section title="Gear — My Equipment">
          <P>Select the equipment you have access to. This powers the "My Gear" filter on the WODs tab and the WOD Generator on the Create tab.</P>
          <Bullet>Tap equipment to toggle on/off</Bullet>
          <Bullet>Use Select All or Clear All for bulk changes</Bullet>
          <Bullet>Saves automatically</Bullet>
        </Section>

        {/* MOVES */}
        <Section title="Moves — Exercise Library">
          <P>Browse 130+ CrossFit movements with YouTube video demos.</P>
          <Bullet>Search by name</Bullet>
          <Bullet>Filter by category: Barbell, Gymnastic, KB/DB, Bodyweight, Cardio</Bullet>
          <Bullet>Tap any movement with a play icon to watch the demo</Bullet>
          <P>Movement videos also appear on WOD detail pages.</P>
        </Section>

        {/* PRs */}
        <Section title="Personal Records">
          <P>PRForgd automatically tracks your PRs.</P>
          <Bullet>Only counted when you beat a previous result (not your first time)</Bullet>
          <Bullet>Only Rx results are eligible</Bullet>
          <Bullet>Faster time = PR for timed workouts</Bullet>
          <Bullet>More rounds + reps = PR for AMRAPs</Bullet>
          <Bullet>PR badges appear in history and WOD detail pages</Bullet>
        </Section>

        {/* SYNC */}
        <Section title="Sync & Accounts">
          <P>The app works fully offline. Create an account on the Me tab to sync across devices.</P>
          <Bullet>Sign in with email, Google, or Apple</Bullet>
          <Bullet>Tap Sync Data on the Me tab to merge</Bullet>
          <Bullet>Workouts and favorites are combined — nothing gets overwritten</Bullet>
          <Bullet>Works on phone, tablet, and computer</Bullet>
        </Section>

        {/* TIPS */}
        <Section title="Tips">
          <Bullet>Long-press to delete history entries and past results</Bullet>
          <Bullet>Set your gear first for better filtering and generation</Bullet>
          <Bullet>Use SCAN to capture your box's daily WOD from the whiteboard</Bullet>
          <Bullet>Export regularly from the Log tab to back up your data</Bullet>
          <Bullet>The app works offline once loaded — sync when you're back online</Bullet>
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
  version: {
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
  subHead: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
