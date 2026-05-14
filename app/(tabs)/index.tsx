import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { heroWods, HeroWod } from '../../src/data/heroWods';
import { getPRForWod, formatTime, WorkoutResult } from '../../src/storage/workoutStorage';
import { getUserEquipment } from '../../src/storage/equipmentStorage';
import { getFavorites, toggleFavorite } from '../../src/storage/favoritesStorage';
import { canDoWod } from '../../src/data/equipment';
import { colors, spacing } from '../../src/theme';

const categoryLabels: Record<string, string> = {
  army: 'Army',
  navy: 'Navy',
  benchmark: 'Benchmark',
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
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState<'all' | 'hero' | 'girl' | 'benchmark'>('all');
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPRs();
      getUserEquipment().then(setUserEquipment);
      getFavorites().then(setFavorites);
    }, [])
  );

  async function loadPRs() {
    const prMap: Record<string, WorkoutResult | null> = {};
    for (const wod of heroWods) {
      prMap[wod.id] = await getPRForWod(wod.id);
    }
    setPrs(prMap);
  }

  async function handleToggleFavorite(wodId: string) {
    const isFav = await toggleFavorite(wodId);
    setFavorites((prev) =>
      isFav ? [...prev, wodId] : prev.filter((id) => id !== wodId)
    );
  }

  const filtered = heroWods
    .filter((w) => {
      const matchesSearch =
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.movements.some((m) => m.toLowerCase().includes(search.toLowerCase()));
      const matchesEquipment =
        !filterByEquipment || canDoWod(w.movements, userEquipment);
      const matchesFavorites =
        !filterFavorites || favorites.includes(w.id);
      const matchesGroup =
        groupFilter === 'all' || (w.group || 'hero') === groupFilter;
      const matchesBranch =
        !branchFilter || w.category === branchFilter;
      const matchesType =
        !typeFilter || w.type === typeFilter;
      return matchesSearch && matchesEquipment && matchesFavorites && matchesGroup && matchesBranch && matchesType;
    })
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
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
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titlePR}>PR</Text>
          <Text style={styles.titleFORGD}>FORGD</Text>
        </Text>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoIcon}
        />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by name or movement..."
        placeholderTextColor={colors.textMuted}
        value={search}
        onChangeText={setSearch}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity
          style={[styles.chip, filterFavorites && styles.chipActive]}
          onPress={() => setFilterFavorites(!filterFavorites)}
        >
          <Text style={[styles.chipText, filterFavorites && styles.chipTextActive]}>Favs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, filterByEquipment && styles.chipActive]}
          onPress={() => {
            if (userEquipment.length === 0) {
              router.push('/(tabs)/equipment');
            } else {
              setFilterByEquipment(!filterByEquipment);
            }
          }}
        >
          <Text style={[styles.chipText, filterByEquipment && styles.chipTextActive]}>My Gear</Text>
        </TouchableOpacity>
        <View style={styles.chipDivider} />
        {(['all', 'hero', 'girl', 'benchmark'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, groupFilter === g && styles.chipActive]}
            onPress={() => setGroupFilter(g)}
          >
            <Text style={[styles.chipText, groupFilter === g && styles.chipTextActive]}>
              {g === 'all' ? 'All' : g === 'hero' ? 'Hero' : g === 'girl' ? 'Girl' : 'WOD'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.chipDivider} />
        {([
          { key: null, label: 'All' },
          { key: 'army', label: 'Army' },
          { key: 'navy', label: 'Navy' },
          { key: 'marines', label: 'Marines' },
          { key: 'air-force', label: 'USAF' },
          { key: 'firefighter', label: 'Fire' },
          { key: 'leo', label: 'LEO' },
        ] as const).map((b) => (
          <TouchableOpacity
            key={b.label}
            style={[styles.chip, branchFilter === b.key && styles.chipActive]}
            onPress={() => setBranchFilter(branchFilter === b.key ? null : b.key)}
          >
            <Text style={[styles.chipText, branchFilter === b.key && styles.chipTextActive]}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.chipDivider} />
        {([
          { key: null, label: 'All' },
          { key: 'for-time', label: 'For Time' },
          { key: 'rounds-for-time', label: 'Rounds' },
          { key: 'amrap', label: 'AMRAP' },
        ] as const).map((t) => (
          <TouchableOpacity
            key={t.label}
            style={[styles.chip, typeFilter === t.key && styles.chipActive]}
            onPress={() => setTypeFilter(typeFilter === t.key ? null : t.key)}
          >
            <Text style={[styles.chipText, typeFilter === t.key && styles.chipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.countText}>{filtered.length} WODs</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.list}>
        {filtered.map((item) => {
          const categoryColor = colors[item.category] || colors.primary;
          const isFav = favorites.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/wod/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.wodName}>{item.name}</Text>
                <View style={styles.cardRight}>
                  <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                    <Text style={[styles.favStar, isFav && styles.favStarActive]}>
                      {isFav ? '\u2605' : '\u2606'}
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.categoryText}>
                      {categoryLabels[item.category]}
                    </Text>
                  </View>
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
            No WODs match your filters.
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
    letterSpacing: 4,
  },
  titlePR: {
    color: colors.primary,
  },
  titleFORGD: {
    color: colors.text,
  },
  logoIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
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
  chipScroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 5,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.background,
  },
  chipDivider: {
    width: 1,
    backgroundColor: colors.textSecondary,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  favStar: {
    fontSize: 22,
    color: colors.textMuted,
  },
  favStarActive: {
    color: colors.primary,
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
