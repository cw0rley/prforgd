import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveGeneratedWod } from '../../src/storage/generatedWodStorage';
import {
  getResults,
  deleteResult,
  toggleFavorite,
  formatTime,
  formatWorkoutDate,
  workoutDateMs,
  WorkoutResult,
} from '../../src/storage/workoutStorage';
import { getFavorites } from '../../src/storage/favoritesStorage';
import { getWorkouts } from '../../src/data/workoutData';
import { onSynced, requestSync } from '../../src/lib/sync';
import { colors, spacing } from '../../src/theme';

export default function HistoryScreen() {
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [favWodIds, setFavWodIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'fav' | 'pr' | 'rx' | 'scaled'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadResults();
      requestSync(); // pull any changes made elsewhere when this tab is opened
    }, [])
  );

  // Re-read after a background sync (e.g. data pulled from another device).
  useEffect(() => onSynced(() => loadResults()), []);

  async function loadResults() {
    const [all, favIds] = await Promise.all([getResults(), getFavorites()]);
    setResults(all.sort((a, b) => workoutDateMs(b.date) - workoutDateMs(a.date)));
    setFavWodIds(new Set(favIds));
  }

  async function handleDelete(resultId: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this result?')
      : await new Promise<boolean>(resolve => {
          Alert.alert('Delete Result', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (confirmed) {
      await deleteResult(resultId);
      loadResults();
    }
  }

  async function doAgain(r: WorkoutResult, mode: 'timer' | 'log') {
    if (r.wodId.startsWith('custom-')) {
      await saveGeneratedWod({
        type: 'for-time',
        description: r.wodDescription || r.wodName || 'Custom WOD',
        movements: [],
        name: r.wodName,
      });
      router.push(`/log/custom?mode=${mode}`);
    } else {
      router.push(`/log/${r.wodId}?mode=${mode}`);
    }
  }

  function getWodName(r: WorkoutResult): string {
    if (r.wodName) return r.wodName;
    if (r.wodId.startsWith('custom-')) return 'Custom WOD';
    return getWorkouts().find((w) => w.id === r.wodId)?.name || r.wodId;
  }

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>WORKOUT LOG</Text>
        <View style={styles.logSubRow}>
          <Text style={styles.subtitle}>{results.length} workouts logged</Text>
          <TouchableOpacity onPress={() => router.push('/export')} style={styles.exportBtn}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.exportLink}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'fav' && styles.filterBtnActive]}
            onPress={() => setFilter(filter === 'fav' ? 'all' : 'fav')}
          >
            <Text style={[styles.filterText, filter === 'fav' && styles.filterTextActive]}>{filter === 'fav' ? '★' : '☆'} Favs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'pr' && styles.filterBtnActive]}
            onPress={() => setFilter(filter === 'pr' ? 'all' : 'pr')}
          >
            <Text style={[styles.filterText, filter === 'pr' && styles.filterTextActive]}>PRs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'rx' && styles.filterBtnActive]}
            onPress={() => setFilter(filter === 'rx' ? 'all' : 'rx')}
          >
            <Text style={[styles.filterText, filter === 'rx' && styles.filterTextActive]}>Rx</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'scaled' && styles.filterBtnActive]}
            onPress={() => setFilter(filter === 'scaled' ? 'all' : 'scaled')}
          >
            <Text style={[styles.filterText, filter === 'scaled' && styles.filterTextActive]}>Scaled</Text>
          </TouchableOpacity>
        </View>

        {results.length === 0 && (
          <Text style={styles.empty}>No workouts logged yet. Get after it!</Text>
        )}

        {results.filter((r) => {
          if (filter === 'fav') return favWodIds.has(r.wodId);
          if (filter === 'pr') return r.isPR;
          if (filter === 'rx') return r.rx;
          if (filter === 'scaled') return !r.rx;
          return true;
        }).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={styles.card}
            onPress={() => setExpandedId(expandedId === r.id ? null : r.id)}
            onLongPress={() => handleDelete(r.id)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation();
                    await toggleFavorite(r.id);
                    loadResults();
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={r.favorite ? styles.favStar : styles.favStarEmpty}>
                    {r.favorite ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.wodName}>{getWodName(r)}</Text>
              </View>
              <Text style={styles.date}>
                {formatWorkoutDate(r.date)}
              </Text>
            </View>

            <View style={styles.scoreRow}>
              {r.timeSeconds !== undefined && (
                <Text style={styles.score}>{formatTime(r.timeSeconds)}</Text>
              )}
              {r.rounds !== undefined && r.rounds > 0 && (
                <Text style={styles.score}>
                  {r.rounds} rounds{r.reps ? ` + ${r.reps} reps` : ''}
                </Text>
              )}
              <View style={styles.badges}>
                {r.rx && <Text style={styles.rxBadge}>Rx</Text>}
                {!r.rx && <Text style={styles.scaledBadge}>Scaled</Text>}
                {r.isPR && <Text style={styles.prBadge}>PR</Text>}
              </View>
            </View>

            {expandedId === r.id && (
              <View style={styles.expandedSection}>
                {/* Workout description */}
                {(() => {
                  const wod = getWorkouts().find((w) => w.id === r.wodId);
                  const workout = wod?.workout || r.wodDescription;
                  return workout ? (
                    <View style={styles.expandedWorkoutBox}>
                      <Text style={styles.expandedWorkoutText}>{workout}</Text>
                    </View>
                  ) : null;
                })()}

                {/* Round splits */}
                {r.roundTimes && r.roundTimes.length > 0 && (
                  <View style={styles.roundSplits}>
                    {r.roundTimes.map((rt) => (
                      <Text key={rt.round} style={styles.roundSplitText}>
                        R{rt.round}: {formatTime(rt.splitSeconds)}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Notes */}
                {r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}

                {/* Action buttons */}
                <View style={styles.doAgainRow}>
                  <TouchableOpacity style={styles.doAgainBtn} onPress={() => doAgain(r, 'timer')}>
                    <Text style={styles.doAgainText}>DO AGAIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doAgainBtnLog} onPress={() => doAgain(r, 'log')}>
                    <Text style={styles.doAgainTextLog}>LOG</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(r.id)}>
                    <Text style={styles.deleteText}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {expandedId !== r.id && r.roundTimes && r.roundTimes.length > 0 && (
              <View style={styles.roundSplits}>
                {r.roundTimes.map((rt) => (
                  <Text key={rt.round} style={styles.roundSplitText}>
                    R{rt.round}: {formatTime(rt.splitSeconds)}
                  </Text>
                ))}
              </View>
            )}

            {expandedId !== r.id && r.notes ? <Text style={styles.notes}>{r.notes}</Text> : null}
          </TouchableOpacity>
        ))}
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
    paddingBottom: spacing.xl * 2,
  },
  logSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
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
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  favStar: {
    fontSize: 20,
    color: colors.prGold,
  },
  favStarEmpty: {
    fontSize: 20,
    color: colors.textMuted,
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
    backgroundColor: '#002B12',
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.success,
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
  expandedSection: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.sm,
  },
  expandedWorkoutBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  expandedWorkoutText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  doAgainRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  doAgainBtn: {
    backgroundColor: colors.success,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  doAgainText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  doAgainBtnLog: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  doAgainTextLog: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  deleteBtn: {
    backgroundColor: colors.card,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
