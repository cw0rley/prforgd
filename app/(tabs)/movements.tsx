import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { movements, Movement } from '../../src/data/movements';
import { colors, spacing } from '../../src/theme';

const categoryLabels: Record<string, string> = {
  barbell: 'Barbell',
  gymnastic: 'Gymnastic',
  kettlebell: 'KB / DB',
  bodyweight: 'Bodyweight',
  cardio: 'Cardio',
  other: 'Other',
};

export default function MovementsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = movements.filter((m) => {
    const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !activeCategory || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function openVideo(m: Movement) {
    if (m.videoUrl) {
      Linking.openURL(m.videoUrl);
    }
  }

  const categories = Object.keys(categoryLabels);

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>MOVEMENTS</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search movements..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryBtn, !activeCategory && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(null)}
          >
            <Text style={[styles.categoryText, !activeCategory && styles.categoryTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
              onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {categoryLabels[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.card}
            onPress={() => openVideo(m)}
            disabled={!m.videoUrl}
            activeOpacity={m.videoUrl ? 0.7 : 1}
          >
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.movementName}>{m.name}</Text>
                <Text style={styles.movementCategory}>{categoryLabels[m.category]}</Text>
              </View>
              {m.videoUrl ? (
                <Text style={styles.videoIcon}>&#9654;</Text>
              ) : (
                <Text style={styles.noVideo}>--</Text>
              )}
            </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryScroll: {
    marginBottom: spacing.md,
    flexGrow: 0,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: spacing.sm,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  categoryTextActive: {
    color: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movementName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  movementCategory: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  videoIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  noVideo: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
