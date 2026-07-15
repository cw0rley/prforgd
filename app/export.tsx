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
import { Ionicons } from '@expo/vector-icons';
import { getResults, formatTime, formatWorkoutDate, WorkoutResult } from '../src/storage/workoutStorage';
import { getWorkouts } from '../src/data/workoutData';
import { colors, spacing } from '../src/theme';
import * as Clipboard from 'expo-clipboard';
import { Toast, useToast } from '../src/components/Toast';

function resultToCSVRow(r: WorkoutResult): string {
  const wod = getWorkouts().find((w) => w.id === r.wodId);
  const score = r.timeSeconds !== undefined
    ? formatTime(r.timeSeconds)
    : `${r.rounds || 0} rds + ${r.reps || 0} reps`;
  const roundSplits = r.roundTimes
    ? r.roundTimes.map((rt) => `Rd${rt.round}:${formatTime(rt.splitSeconds)}`).join(' ')
    : '';
  return `"${wod?.name || r.wodId}","${formatWorkoutDate(r.date)}","${score}","${r.rx ? 'Rx' : 'Scaled'}","${r.isPR ? 'Yes' : 'No'}","${roundSplits}","${r.notes.replace(/"/g, '""')}"`;
}

export default function ExportScreen() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();

  async function handleExport() {
    setExporting(true);
    const results = await getResults();

    if (results.length === 0) {
      showToast('Log some workouts first!', 'info');
      setExporting(false);
      return;
    }

    const header = 'WOD,Date,Score,Type,PR,Round Splits,Notes';
    const rows = results.map(resultToCSVRow);
    const csv = [header, ...rows].join('\n');

    try {
      await Clipboard.setStringAsync(csv);
      showToast(`${results.length} results copied as CSV!`, 'success');
    } catch {
      showToast('Could not copy to clipboard. Try again.', 'error');
    }
    setExporting(false);
  }

  async function handleExportJSON() {
    setExporting(true);
    const results = await getResults();

    if (results.length === 0) {
      showToast('Log some workouts first!', 'info');
      setExporting(false);
      return;
    }

    const enriched = results.map((r) => ({
      ...r,
      wodName: getWorkouts().find((w) => w.id === r.wodId)?.name || r.wodId,
    }));

    try {
      await Clipboard.setStringAsync(JSON.stringify(enriched, null, 2));
      showToast(`${results.length} results copied as JSON!`, 'success');
    } catch {
      showToast('Could not copy to clipboard. Try again.', 'error');
    }
    setExporting(false);
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Export Data',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace('/')} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} style={{ transform: [{ translateX: -4 }] }} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>EXPORT YOUR DATA</Text>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
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
