import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getResults, formatTime, WorkoutResult } from '../src/storage/workoutStorage';
import { heroWods } from '../src/data/heroWods';
import { colors, spacing } from '../src/theme';
import * as Clipboard from 'expo-clipboard';

function resultToCSVRow(r: WorkoutResult): string {
  const wod = heroWods.find((w) => w.id === r.wodId);
  const score = r.timeSeconds !== undefined
    ? formatTime(r.timeSeconds)
    : `${r.rounds || 0} rds + ${r.reps || 0} reps`;
  const roundSplits = r.roundTimes
    ? r.roundTimes.map((rt) => `Rd${rt.round}:${formatTime(rt.splitSeconds)}`).join(' ')
    : '';
  return `"${wod?.name || r.wodId}","${new Date(r.date).toLocaleDateString()}","${score}","${r.rx ? 'Rx' : 'Scaled'}","${r.isPR ? 'Yes' : 'No'}","${roundSplits}","${r.notes.replace(/"/g, '""')}"`;
}

export default function ExportScreen() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const results = await getResults();

    if (results.length === 0) {
      Alert.alert('No Data', 'Log some workouts first!');
      setExporting(false);
      return;
    }

    const header = 'WOD,Date,Score,Type,PR,Round Splits,Notes';
    const rows = results.map(resultToCSVRow);
    const csv = [header, ...rows].join('\n');

    try {
      await Clipboard.setStringAsync(csv);
      Alert.alert(
        'Copied!',
        `${results.length} workout results copied to clipboard as CSV. Paste into a spreadsheet or text file.`
      );
    } catch {
      Alert.alert('Export', 'Could not copy to clipboard. Try again.');
    }
    setExporting(false);
  }

  async function handleExportJSON() {
    setExporting(true);
    const results = await getResults();

    if (results.length === 0) {
      Alert.alert('No Data', 'Log some workouts first!');
      setExporting(false);
      return;
    }

    const enriched = results.map((r) => ({
      ...r,
      wodName: heroWods.find((w) => w.id === r.wodId)?.name || r.wodId,
    }));

    try {
      await Clipboard.setStringAsync(JSON.stringify(enriched, null, 2));
      Alert.alert(
        'Copied!',
        `${results.length} workout results copied to clipboard as JSON.`
      );
    } catch {
      Alert.alert('Export', 'Could not copy to clipboard. Try again.');
    }
    setExporting(false);
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Export Data',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300', paddingHorizontal: 12, paddingVertical: 4 }}>&#10094;</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>EXPORT YOUR DATA</Text>
        <Text style={styles.subtitle}>
          Copy your workout history to clipboard, then paste into a spreadsheet, notes app, or anywhere you want.
        </Text>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>COPY AS CSV</Text>
          <Text style={styles.exportHint}>Best for spreadsheets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportButton, styles.jsonButton]}
          onPress={handleExportJSON}
          disabled={exporting}
        >
          <Text style={styles.exportButtonText}>COPY AS JSON</Text>
          <Text style={styles.exportHint}>Best for backups</Text>
        </TouchableOpacity>
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
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  jsonButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  exportHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
});
