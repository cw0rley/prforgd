import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { heroWods, HeroWod } from '../src/data/heroWods';
import { getPRForWod, formatTime, WorkoutResult } from '../src/storage/workoutStorage';
import { getUserEquipment } from '../src/storage/equipmentStorage';
import { canDoWod } from '../src/data/equipment';
import { colors, spacing } from '../src/theme';

const categoryLabels: Record<string, string> = {
  army: 'Army',
  navy: 'Navy',
  marines: 'Marines',
  'air-force': 'Air Force',
  firefighter: 'Fire',
  leo: 'LEO',
};

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [prs, setPrs] = useState<Record<string, WorkoutResult | null>>({});
  const [userEquipment, setUserEquipment] = useState<string[]>([]);
  const [filterByEquipment, setFilterByEquipment] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPRs();
      getUserEquipment().then(setUserEquipment);
    }, [])
  );

  async function loadPRs() {
    const prMap: Record<string, WorkoutResult | null> = {};
    for (const wod of heroWods) {
      prMap[wod.id] = await getPRForWod(wod.id);
    }
    setPrs(prMap);
  }

  const filtered = heroWods.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.movements.some((m) => m.toLowerCase().includes(search.toLowerCase()));
    const matchesEquipment =
      !filterByEquipment || canDoWod(w.movements, userEquipment);
    return matchesSearch && matchesEquipment;
  });

  function renderPR(wod: HeroWod) {
    const pr = prs[wod.id];
    if (!pr) return null;

    if (pr.timeSeconds !== undefined) {
      return (
        <Text style={styles.prText}>PR: {formatTime(pr.timeSeconds)}</Text>
      );
    }
    if (pr.rounds !== undefined) {
      return (
        <Text style={styles.prText}>
          PR: {pr.rounds} rds{pr.reps ? ` + ${pr.reps} reps` : ''}
        </Text>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, title: 'Home' }} />
      <View style={styles.header}>
        <Text style={styles.title}>PRFORGD</Text>
        <View style={styles.headerLinks}>
          <TouchableOpacity onPress={() => router.push('/movements')}>
            <Text style={styles.headerLink}>Moves</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.headerLink}>Log</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/export')}>
            <Text style={styles.headerLink}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or movement..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filterByEquipment && styles.filterBtnActive]}
          onPress={() => {
            if (userEquipment.length === 0) {
              router.push('/equipment');
            } else {
              setFilterByEquipment(!filterByEquipment);
            }
          }}
        >
          <Text style={[styles.filterText, filterByEquipment && styles.filterTextActive]}>
            {filterByEquipment ? `MY GEAR (${filtered.length})` : 'MY GEAR'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gearBtn}
          onPress={() => router.push('/equipment')}
        >
          <Text style={styles.gearBtnText}>⚙</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.list}>
        {filtered.map((item) => {
          const categoryColor = colors[item.category] || colors.primary;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/wod/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.wodName}>{item.name}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                  <Text style={styles.categoryText}>
                    {categoryLabels[item.category]}
                  </Text>
                </View>
              </View>
              <Text style={styles.wodType}>{item.type.replace(/-/g, ' ').toUpperCase()}</Text>
              <Text style={styles.movements} numberOfLines={1}>
                {item.movements.join(' | ')}
              </Text>
              {renderPR(item)}
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <Text style={styles.emptyText}>
            No WODs match your equipment. Tap ⚙ to update your gear.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
  },
  headerLinks: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  filterTextActive: {
    color: colors.background,
  },
  gearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  gearBtnText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.xl,
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
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  wodType: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  movements: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  prText: {
    fontSize: 14,
    color: colors.prGold,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 24,
  },
});
