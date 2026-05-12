import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect, Stack, useRouter } from 'expo-router';
import {
  getResults,
  deleteResult,
  formatTime,
  WorkoutResult,
} from '../src/storage/workoutStorage';
import { heroWods } from '../src/data/heroWods';
import { colors, spacing } from '../src/theme';

export default function HistoryScreen() {
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'pr'>('all');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [])
  );

  async function loadResults() {
    const all = await getResults();
    setResults(all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  function handleDelete(resultId: string) {
    Alert.alert('Delete Result', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteResult(resultId);
          loadResults();
        },
      },
    ]);
  }

  function getWodName(wodId: string): string {
    return heroWods.find((w) => w.id === wodId)?.name || wodId;
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Workout Log',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300', paddingHorizontal: 12, paddingVertical: 4 }}>&#10094;</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>WORKOUT LOG</Text>
        <Text style={styles.subtitle}>{results.length} workouts logged</Text>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'pr' && styles.filterBtnActive]}
            onPress={() => setFilter('pr')}
          >
            <Text style={[styles.filterText, filter === 'pr' && styles.filterTextActive]}>PRs</Text>
          </TouchableOpacity>
        </View>

        {results.length === 0 && (
          <Text style={styles.empty}>No workouts logged yet. Get after it!</Text>
        )}

        {results.filter((r) => filter === 'all' || r.isPR).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => router.push(`/wod/${r.wodId}`)}
            onLongPress={() => handleDelete(r.id)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.wodName}>{getWodName(r.wodId)}</Text>
              <Text style={styles.date}>
                {new Date(r.date).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.scoreRow}>
              {r.timeSeconds !== undefined && (
                <Text style={styles.score}>{formatTime(r.timeSeconds)}</Text>
              )}
              {r.rounds !== undefined && (
                <Text style={styles.score}>
                  {r.rounds} rds{r.reps ? ` + ${r.reps}` : ''}
                </Text>
              )}
              <View style={styles.badges}>
                {r.rx && <Text style={styles.rxBadge}>Rx</Text>}
                {!r.rx && <Text style={styles.scaledBadge}>Scaled</Text>}
                {r.isPR && <Text style={styles.prBadge}>PR</Text>}
              </View>
            </View>

            {r.roundTimes && r.roundTimes.length > 0 && (
              <View style={styles.roundSplits}>
                {r.roundTimes.map((rt) => (
                  <Text key={rt.round} style={styles.roundSplitText}>
                    Rd {rt.round}: {formatTime(rt.splitSeconds)}
                  </Text>
                ))}
              </View>
            )}

            {r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}
          </TouchableOpacity>
        ))}
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
    paddingBottom: spacing.xl * 2,
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
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.background,
  },
  empty: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  wodName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: 13,
    color: colors.textMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  rxBadge: {
    backgroundColor: colors.success,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scaledBadge: {
    backgroundColor: colors.cardBorder,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  prBadge: {
    backgroundColor: colors.prGold,
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  roundSplits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  roundSplitText: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  notes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});
