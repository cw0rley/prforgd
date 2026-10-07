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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWorkouts, findMovement } from '../../src/data/workoutData';
import {
  getResultsForWod,
  getPRForWod,
  formatTime,
  formatWorkoutDate,
  WorkoutResult,
  deleteResult,
  setResultPublic,
} from '../../src/storage/workoutStorage';
import { isFavorite, toggleFavorite } from '../../src/storage/favoritesStorage';
import { getProfile } from '../../src/storage/profileStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../src/theme';

export default function WodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Only Android edge-to-edge paints the system bar over app content without
  // reserving room. iOS handles the home indicator itself.
  const androidNavInset = Platform.OS === 'android' ? insets.bottom : 0;
  const wod = getWorkouts().find((w) => w.id === id);
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [pr, setPr] = useState<WorkoutResult | null>(null);
  const [fav, setFav] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ name: string; videoId: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (id) loadData();
    }, [id])
  );

  async function loadData() {
    const [r, p, f] = await Promise.all([
      getResultsForWod(id!),
      getPRForWod(id!),
      isFavorite(id!),
    ]);
    setResults(r);
    setPr(p);
    setFav(f);
  }

  async function handleToggleFav() {
    setFav(await toggleFavorite(id!));
  }

  // Mirrors the BOARD toggle on the Log tab (app/(tabs)/history.tsx). This is
  // the screen people actually look at when they want to post a result — it is
  // the WOD whose leaderboard they'd be joining, with VIEW LEADERBOARD right
  // there — so the toggle belongs here too.
  async function handleToggleLeaderboard(r: WorkoutResult) {
    // Removing is always allowed.
    if (r.isPublic) {
      await setResultPublic(r.id, false);
      loadData();
      return;
    }
    // Submitting requires a public athlete profile (username) for the entry.
    const profile = await getProfile();
    if (!profile) {
      const msg = 'Set up your athlete profile (username) on the Me tab before submitting to the leaderboard.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Profile needed', msg);
      return;
    }
    await setResultPublic(r.id, true);
    loadData();
    const done = 'Submitted to the leaderboard!';
    if (Platform.OS === 'web') window.alert(done);
    else Alert.alert('Done', done);
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
      loadData();
    }
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
        headerTitleAlign: 'center',
        headerTitleStyle: { color: colors.text, fontWeight: 'bold', fontSize: 24 },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="chevron-back" size={32} color={colors.primary} style={{ lineHeight: 32, transform: [{ translateX: 1 }, { translateY: -9 }] }} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={handleToggleFav}
            style={{ paddingHorizontal: 12, paddingVertical: 10 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Ionicons name={fav ? 'star' : 'star-outline'} size={28} color={fav ? colors.prGold : colors.textMuted} style={{ transform: [{ translateY: -8 }] }} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {wod.hero ? <Text style={styles.heroName}>{wod.hero}</Text> : null}
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

        <TouchableOpacity style={styles.leaderboardBtn} onPress={() => router.push(`/leaderboard/${wod.id}`)}>
          <Ionicons name="trophy-outline" size={18} color={colors.prGold} />
          <Text style={styles.leaderboardBtnText}>VIEW LEADERBOARD</Text>
        </TouchableOpacity>

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
              {formatWorkoutDate(pr.date)}
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
                      {formatWorkoutDate(r.date)}
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
                {/* Rx only — the leaderboard view itself filters on rx = true. */}
                {r.rx && (
                  <TouchableOpacity
                    style={[styles.boardToggle, r.isPublic && styles.boardToggleOn]}
                    onPress={() => handleToggleLeaderboard(r)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={r.isPublic ? 'trophy' : 'trophy-outline'}
                      size={14}
                      color={r.isPublic ? colors.background : colors.prGold}
                    />
                    <Text
                      style={r.isPublic ? styles.boardToggleTextOn : styles.boardToggleText}
                      numberOfLines={1}
                    >
                      {r.isPublic ? 'ON LEADERBOARD' : 'ADD TO LEADERBOARD'}
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      {/* Android only — see app/(tabs)/_layout.tsx for why iOS is excluded.
          Pinned to the true screen bottom (no tab bar here), so under Android
          edge-to-edge the system nav bar paints over it. iOS and gesture-nav
          devices keep the tuned spacing.lg. */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(spacing.lg, androidNavInset + spacing.sm) }]}>
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
            {activeVideo && Platform.OS !== 'web' && (
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginVertical: spacing.md }}
                onPress={() => {
                  const videoId = activeVideo.videoId;
                  setActiveVideo(null);
                  Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`);
                }}
              >
                <Text style={{ color: colors.background, fontSize: 14, fontWeight: '800', letterSpacing: 2 }}>WATCH ON YOUTUBE</Text>
              </TouchableOpacity>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
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
  leaderboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.prGold,
  },
  leaderboardBtnText: {
    color: colors.prGold,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
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
  // Full-width rather than squeezed in beside the Rx/PR badges, so the label
  // can stay explicit ("ADD TO LEADERBOARD", not "BOARD") without wrapping on
  // a narrow phone. Discoverability is the whole point of putting it here.
  boardToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 9,
    paddingHorizontal: spacing.sm,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: colors.card,
    borderColor: colors.prGold,
  },
  boardToggleOn: {
    backgroundColor: colors.prGold,
    borderColor: colors.prGold,
  },
  boardToggleText: {
    color: colors.prGold,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  boardToggleTextOn: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
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
