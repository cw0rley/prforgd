import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWorkouts } from '../../src/data/workoutData';
import { formatTime } from '../../src/storage/workoutStorage';
import {
  getLeaderboard,
  LeaderboardEntry,
  AGE_DIVISIONS,
  AgeDivision,
} from '../../src/storage/leaderboardStorage';
import { colors, spacing } from '../../src/theme';

type SexFilter = 'all' | 'M' | 'F';

export default function LeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const wod = getWorkouts().find((w) => w.id === id);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sex, setSex] = useState<SexFilter>('all');
  const [division, setDivision] = useState<AgeDivision | 'all'>('all');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const data = await getLeaderboard(id, {
      sex: sex === 'all' ? undefined : sex,
      ageDivision: division === 'all' ? undefined : division,
    });
    setEntries(data);
    setLoading(false);
  }, [id, sex, division]);

  useEffect(() => { load(); }, [load]);

  function scoreText(e: LeaderboardEntry): string {
    if (e.timeSeconds != null) return formatTime(e.timeSeconds);
    if (e.rounds != null) return `${e.rounds} rds${e.reps ? ` + ${e.reps}` : ''}`;
    return '—';
  }

  return (
    <>
      <Stack.Screen options={{
        title: 'Leaderboard',
        headerTitleAlign: 'center',
        headerTitleStyle: { color: colors.text, fontWeight: 'bold', fontSize: 20 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} style={{ lineHeight: 32, transform: [{ translateX: 1 }, { translateY: -9 }] }} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.wodName}>{wod?.name || 'WOD'}</Text>
        <Text style={styles.subtitle}>Rx · best result per athlete</Text>

        {/* Sex filter */}
        <View style={styles.filterRow}>
          {(['all', 'M', 'F'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sex === s && styles.chipActive]}
              onPress={() => setSex(s)}
            >
              <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                {s === 'all' ? 'All' : s === 'M' ? 'Male' : 'Female'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age division filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.divScroll}>
          <TouchableOpacity
            style={[styles.chip, division === 'all' && styles.chipActive]}
            onPress={() => setDivision('all')}
          >
            <Text style={[styles.chipText, division === 'all' && styles.chipTextActive]}>All ages</Text>
          </TouchableOpacity>
          {AGE_DIVISIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, division === d && styles.chipActive]}
              onPress={() => setDivision(d)}
            >
              <Text style={[styles.chipText, division === d && styles.chipTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.empty}>
            No entries yet. Be the first — submit an Rx result from your Log.
          </Text>
        ) : (
          entries.map((e) => (
            <View key={e.id} style={styles.row}>
              <Text style={[styles.rank, e.rank <= 3 && styles.rankTop]}>{e.rank}</Text>
              <View style={styles.rowMid}>
                <Text style={styles.username} numberOfLines={1}>{e.username}</Text>
                <Text style={styles.division}>
                  {e.sex === 'M' ? 'M' : e.sex === 'F' ? 'F' : '—'}{e.ageDivision ? ` · ${e.ageDivision}` : ''}
                </Text>
              </View>
              <Text style={styles.score}>{scoreText(e)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  wodName: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  divScroll: { flexDirection: 'row', marginBottom: spacing.md },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  chipTextActive: { color: colors.background },
  empty: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rank: { fontSize: 20, fontWeight: '900', color: colors.textSecondary, width: 36 },
  rankTop: { color: colors.prGold },
  rowMid: { flex: 1, paddingHorizontal: spacing.sm },
  username: { fontSize: 17, fontWeight: '800', color: colors.text },
  division: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  score: { fontSize: 20, fontWeight: '800', color: colors.primary },
});
