import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { heroWods } from '../../src/data/heroWods';
import { findMovement } from '../../src/data/movements';
import {
  getResultsForWod,
  getPRForWod,
  formatTime,
  WorkoutResult,
  deleteResult,
} from '../../src/storage/workoutStorage';
import { colors, spacing } from '../../src/theme';

export default function WodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const wod = heroWods.find((w) => w.id === id);
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [pr, setPr] = useState<WorkoutResult | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ name: string; videoId: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) loadData();
    }, [id])
  );

  async function loadData() {
    const [r, p] = await Promise.all([
      getResultsForWod(id!),
      getPRForWod(id!),
    ]);
    setResults(r);
    setPr(p);
  }

  function handleDelete(resultId: string) {
    Alert.alert('Delete Result', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteResult(resultId);
          loadData();
        },
      },
    ]);
  }

  if (!wod) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>WOD not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: wod.name,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300', paddingHorizontal: 12, paddingVertical: 4 }}>&#10094;</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.wodName}>{wod.name}</Text>
        <Text style={styles.heroName}>{wod.hero}</Text>
        <Text style={styles.description}>{wod.description}</Text>

        <View style={styles.workoutBox}>
          <Text style={styles.workoutText}>{wod.workout}</Text>
        </View>

        <View style={styles.movementsRow}>
          {wod.movements.map((name, i) => {
            const mov = findMovement(name);
            const videoId = mov?.videoUrl?.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&?/]+)/)?.[1];
            return mov?.videoUrl && videoId ? (
              <TouchableOpacity
                key={i}
                style={styles.movementChip}
                onPress={() => setActiveVideo({ name, videoId })}
              >
                <Text style={styles.movementChipText}>{name}</Text>
                <Text style={styles.movementPlay}>&#9654;</Text>
              </TouchableOpacity>
            ) : (
              <View key={i} style={styles.movementChipDisabled}>
                <Text style={styles.movementChipTextDisabled}>{name}</Text>
              </View>
            );
          })}
        </View>

        {pr && (
          <View style={styles.prBox}>
            <Text style={styles.prLabel}>PERSONAL RECORD</Text>
            {pr.timeSeconds !== undefined && (
              <Text style={styles.prValue}>{formatTime(pr.timeSeconds)}</Text>
            )}
            {pr.rounds !== undefined && (
              <Text style={styles.prValue}>
                {pr.rounds} rounds{pr.reps ? ` + ${pr.reps} reps` : ''}
              </Text>
            )}
            <Text style={styles.prDate}>
              {new Date(pr.date).toLocaleDateString()}
            </Text>
          </View>
        )}

        {results.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>HISTORY</Text>
            {results.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.historyCard}
                onLongPress={() => handleDelete(r.id)}
              >
                <View style={styles.historyRow}>
                  <View>
                    {r.timeSeconds !== undefined && (
                      <Text style={styles.historyTime}>
                        {formatTime(r.timeSeconds)}
                      </Text>
                    )}
                    {r.rounds !== undefined && (
                      <Text style={styles.historyTime}>
                        {r.rounds} rds{r.reps ? ` + ${r.reps}` : ''}
                      </Text>
                    )}
                    <Text style={styles.historyDate}>
                      {new Date(r.date).toLocaleDateString()}
                    </Text>
                  </View>
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
                {r.notes ? (
                  <Text style={styles.historyNotes}>{r.notes}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => router.push(`/log/${wod.id}?mode=timer`)}
        >
          <Text style={styles.startButtonText}>START</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push(`/log/${wod.id}?mode=log`)}
        >
          <Text style={styles.logButtonText}>LOG</Text>
        </TouchableOpacity>
      </View>

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
    paddingBottom: 120,
  },
  wodName: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  heroName: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  workoutBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  workoutText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  movementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  movementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  movementChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  movementPlay: {
    color: colors.primary,
    fontSize: 10,
  },
  movementChipDisabled: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  movementChipTextDisabled: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  prBox: {
    backgroundColor: '#002B12',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.prGold,
    alignItems: 'center',
  },
  prLabel: {
    fontSize: 12,
    color: colors.prGold,
    fontWeight: '700',
    letterSpacing: 2,
  },
  prValue: {
    fontSize: 32,
    color: colors.prGold,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  prDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  startButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  logButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.background,
    letterSpacing: 2,
  },
  historySection: {
    marginTop: spacing.xl,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    gap: spacing.sm,
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
  historyNotes: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.danger,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
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
