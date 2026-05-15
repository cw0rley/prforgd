import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
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

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([^&?/]+)/);
  return match ? match[1] : null;
}

export default function MovementsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ name: string; videoId: string } | null>(null);

  const filtered = movements
    .filter((m) => {
      const matchesSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || m.category === activeCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  function openVideo(m: Movement) {
    if (!m.videoUrl) return;
    const videoId = getYouTubeId(m.videoUrl);
    if (videoId) {
      setActiveVideo({ name: m.name, videoId });
    }
  }

  const categories = Object.keys(categoryLabels);

  return (
    <>
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

        <Text style={styles.countText}>{filtered.length} movements</Text>

        {filtered.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={styles.card}
            onPress={() => openVideo(m)}
            disabled={!m.videoUrl}
            activeOpacity={m.videoUrl ? 0.7 : 1}
          >
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
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

      {/* Video Modal */}
      <Modal
        visible={!!activeVideo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveVideo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{activeVideo?.name}</Text>
              <TouchableOpacity onPress={() => setActiveVideo(null)}>
                <Text style={styles.modalClose}>&#10005;</Text>
              </TouchableOpacity>
            </View>
            {activeVideo && Platform.OS === 'web' && (
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                style={{ width: '100%', height: 300, border: 'none', borderRadius: 8 } as any}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
            {activeVideo && Platform.OS !== 'web' && (
              <Text style={styles.mobileVideoHint}>
                Video playback opens in browser on mobile.
              </Text>
            )}
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setActiveVideo(null)}>
              <Text style={styles.modalDoneBtnText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.md,
    textAlign: 'center',
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
    marginBottom: spacing.sm,
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
  countText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
    fontSize: 16,
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textMuted,
    paddingLeft: spacing.md,
  },
  mobileVideoHint: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  modalDoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  modalDoneBtnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
