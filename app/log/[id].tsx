import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { Toast, useToast } from '../../src/components/Toast';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { randomUUID } from 'expo-crypto';
import { useWakeLock } from '../../src/hooks/useWakeLock';
import { getWorkouts } from '../../src/data/workoutData';
import { getGeneratedWod } from '../../src/storage/generatedWodStorage';
import {
  saveResult,
  getPRForWod,
  formatTime,
  WorkoutResult,
  RoundTime,
} from '../../src/storage/workoutStorage';
import { colors, spacing } from '../../src/theme';
import { canSaveWorkout } from '../../src/lib/subscription';
import { getSession } from '../../src/lib/auth';

export default function LogWorkoutScreen() {
  useKeepAwake();
  useWakeLock();
  const { id, mode } = useLocalSearchParams<{ id: string; mode: string }>();
  const router = useRouter();
  const isCustom = id === 'custom';

  const heroWod = !isCustom ? getWorkouts().find((w) => w.id === id) : null;

  const [customWod, setCustomWod] = useState<{
    name: string;
    workout: string;
    type: string;
    totalRounds?: number;
    timeCap?: number;
  } | null>(null);

  useEffect(() => {
    if (isCustom) {
      getGeneratedWod().then((gw) => {
        if (gw) {
          setCustomWod({
            name: gw.name || 'Custom WOD',
            workout: gw.description,
            type: gw.type,
            totalRounds: gw.totalRounds,
            timeCap: gw.timeCap,
          });
        }
      });
    }
  }, [isCustom]);

  const wod = heroWod || customWod;

  const isTimerMode = mode === 'timer';
  const isAmrap = wod?.type === 'amrap';
  const hasRounds = wod?.type === 'rounds-for-time';
  const isForTime = wod?.type === 'for-time';
  const totalRounds = (heroWod?.totalRounds || customWod?.totalRounds) || 0;

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Round tracking (timer mode)
  const [roundTimes, setRoundTimes] = useState<RoundTime[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  // Lap button feedback + debounce (prevents double-logging on rapid taps)
  const [lapFlash, setLapFlash] = useState(false);
  const lapLockRef = useRef(false);
  const lapFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual entry fields
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  // AMRAP fields
  const [rounds, setRounds] = useState('');
  const [reps, setReps] = useState('');

  // Post-workout fields
  const [notes, setNotes] = useState('');
  const [rx, setRx] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    import('../../src/lib/subscription').then(({ getFreeRemaining }) =>
      getFreeRemaining().then(setFreeRemaining)
    );
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // --- Timer functions ---
  function startTimer() {
    const now = Date.now();
    if (!timerStarted) {
      startTimeRef.current = now;
      setTimerStarted(true);
    } else {
      startTimeRef.current = now - elapsedSeconds * 1000;
    }
    setTimerRunning(true);
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 100);
  }

  function pauseTimer() {
    setTimerRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function stopTimer() {
    pauseTimer();
  }

  // Brief visual confirmation that a lap/split registered, and a short lock
  // so a rapid double-tap doesn't log two near-zero splits.
  function triggerLapFeedback() {
    setLapFlash(true);
    lapLockRef.current = true;
    if (lapFlashTimerRef.current) clearTimeout(lapFlashTimerRef.current);
    lapFlashTimerRef.current = setTimeout(() => {
      setLapFlash(false);
      lapLockRef.current = false;
    }, 600);
  }

  function lapRound() {
    if (lapLockRef.current) return;
    const lastCumulative = roundTimes.length > 0
      ? roundTimes[roundTimes.length - 1].cumulativeSeconds
      : 0;
    const splitSeconds = elapsedSeconds - lastCumulative;

    const newRound: RoundTime = {
      round: currentRound,
      splitSeconds,
      cumulativeSeconds: elapsedSeconds,
    };

    setRoundTimes((prev) => [...prev, newRound]);
    triggerLapFeedback();

    if (hasRounds && currentRound >= totalRounds) {
      pauseTimer();
    } else {
      setCurrentRound((prev) => prev + 1);
    }
  }

  function lapSplit() {
    if (lapLockRef.current) return;
    const lastCumulative = roundTimes.length > 0
      ? roundTimes[roundTimes.length - 1].cumulativeSeconds
      : 0;
    const splitSeconds = elapsedSeconds - lastCumulative;

    const newSplit: RoundTime = {
      round: roundTimes.length + 1,
      splitSeconds,
      cumulativeSeconds: elapsedSeconds,
    };

    setRoundTimes((prev) => [...prev, newSplit]);
    triggerLapFeedback();
  }

  function resetTimer() {
    pauseTimer();
    setElapsedSeconds(0);
    setTimerStarted(false);
    setCurrentRound(1);
    setRoundTimes([]);
    startTimeRef.current = 0;
  }

  // --- Save ---
  async function handleSave() {
    let timeSeconds: number | undefined;
    let roundsNum: number | undefined;
    let repsNum: number | undefined;

    if (isAmrap) {
      if (!rounds) {
        showToast('Please enter rounds completed.', 'error');
        return;
      }
      roundsNum = parseInt(rounds || '0');
      repsNum = parseInt(reps || '0');
    }

    if (isTimerMode && !isAmrap) {
      if (!timerStarted || elapsedSeconds === 0) {
        showToast('Start the timer first.', 'error');
        return;
      }
      if (timerRunning) pauseTimer();
      timeSeconds = elapsedSeconds;
    } else if (!isAmrap) {
      // Log mode — manual time
      if (!minutes && !seconds) {
        showToast('Please enter your completion time.', 'error');
        return;
      }
      timeSeconds = (parseInt(minutes || '0') * 60) + parseInt(seconds || '0');
    }

    // Check subscription / free limit
    const session = await getSession();
    const { allowed, reason } = await canSaveWorkout(session?.user.id || null);
    if (!allowed) {
      router.push(`/paywall?reason=${reason}`);
      return;
    }

    setSaving(true);

    const currentPR = isCustom ? null : await getPRForWod(heroWod!.id);
    let isPR = false;

    if (rx && !isCustom) {
      if (!currentPR) {
        isPR = false;
      } else if (timeSeconds !== undefined && currentPR.timeSeconds !== undefined) {
        isPR = timeSeconds < currentPR.timeSeconds;
      } else if (roundsNum !== undefined && currentPR.rounds !== undefined) {
        const newScore = roundsNum * 1000 + (repsNum || 0);
        const oldScore = (currentPR.rounds) * 1000 + (currentPR.reps || 0);
        isPR = newScore > oldScore;
      }
    }

    const workoutDate = isTimerMode ? new Date().toISOString() : new Date(dateStr + 'T12:00:00').toISOString();

    const result: WorkoutResult = {
      id: randomUUID(),
      wodId: isCustom ? 'custom-' + Date.now() : (heroWod?.id || 'custom'),
      wodName: isCustom ? (customWod?.name || 'Custom WOD') : undefined,
      wodDescription: isCustom ? customWod?.workout : undefined,
      date: workoutDate,
      timeSeconds,
      rounds: roundsNum,
      reps: repsNum,
      roundTimes: roundTimes.length > 0 ? roundTimes : undefined,
      notes,
      completed: true,
      rx,
      isPR,
    };

    try {
      await saveResult(result);
    } catch (err: any) {
      setSaving(false);
      showToast(err?.message || 'Could not save workout. Please try again.', 'error');
      return;
    }
    setSaving(false);

    if (isPR) {
      showToast('NEW PR! You set a new personal record!', 'success', 5000);
      await new Promise(r => setTimeout(r, 2000));
    }
    if (isCustom) {
      router.replace('/(tabs)/history');
    } else {
      router.replace(`/wod/${heroWod!.id}`);
    }
  }

  function formatTimeFull(totalSec: number): string {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (!wod) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.danger }}>WOD not found</Text>
      </View>
    );
  }

  const isFinished = hasRounds && roundTimes.length >= totalRounds;
  const showPostWorkout = isTimerMode
    ? (isAmrap || (timerStarted && !timerRunning))
    : true;

  return (
    <>
      <Stack.Screen options={{
        title: isTimerMode ? wod.name : `Log ${wod.name}`,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300', paddingHorizontal: 12, paddingVertical: 4 }}>&#10094;</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hideToast} />
        <Text style={styles.wodName}>{wod.name}</Text>

        <View style={styles.badgeRow}>
          {rx ? <Text style={styles.rxBadge}>Rx</Text> : <Text style={styles.scaledBadge}>Scaled</Text>}
        </View>

        <View style={styles.workoutBox}>
          <Text style={styles.workoutText}>{wod.workout}</Text>
        </View>

        {/* ===== TIMER MODE ===== */}
        {isTimerMode && !isAmrap && (
          <View style={styles.section}>
            <Text style={styles.timerDisplay}>{formatTimeFull(elapsedSeconds)}</Text>

            {hasRounds && timerStarted && (
              <Text style={styles.roundIndicator}>
                Round {Math.min(currentRound, totalRounds)} of {totalRounds}
              </Text>
            )}

            {/* Timer buttons moved to bottom bar */}

            {roundTimes.length > 0 && (
              <View style={styles.roundsList}>
                <Text style={styles.label}>{isForTime ? 'SPLITS' : 'ROUND SPLITS'}</Text>
                {[...roundTimes].reverse().map((rt) => (
                  <View key={rt.round} style={styles.roundRow}>
                    <Text style={styles.roundLabel}>{isForTime ? `Split ${rt.round}` : `Round ${rt.round}`}</Text>
                    <View style={styles.roundTimesCol}>
                      <Text style={styles.roundSplit}>{formatTimeFull(rt.splitSeconds)}</Text>
                      <Text style={styles.roundCumulative}>
                        Total: {formatTimeFull(rt.cumulativeSeconds)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ===== LOG MODE ===== */}
        {!isTimerMode && (
          <>
            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.label}>DATE</Text>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={dateStr}
                onChangeText={setDateStr}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Time entry (non-AMRAP) */}
            {!isAmrap && (
              <View style={styles.section}>
                <Text style={styles.label}>COMPLETION TIME</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.input}
                      value={minutes}
                      onChangeText={setMinutes}
                      placeholder="00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.timeLabel}>min</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.input}
                      value={seconds}
                      onChangeText={setSeconds}
                      placeholder="00"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>sec</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* AMRAP entry (both modes) */}
        {isAmrap && (
          <View style={styles.section}>
            <Text style={styles.label}>ROUNDS + REPS</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.input}
                  value={rounds}
                  onChangeText={setRounds}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.timeLabel}>rounds</Text>
              </View>
              <Text style={styles.timeSeparator}>+</Text>
              <View style={styles.timeInput}>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.timeLabel}>reps</Text>
              </View>
            </View>
          </View>
        )}

        {/* Post-workout: status, Rx, notes, save */}
        {showPostWorkout && (
          <>
            <View style={styles.section}>
              <View style={styles.rxRow}>
                <View>
                  <Text style={styles.label}>Rx (AS PRESCRIBED)</Text>
                  <Text style={styles.rxHint}>Weight, reps, and movements as written</Text>
                </View>
                <Switch
                  value={rx}
                  onValueChange={setRx}
                  trackColor={{ false: colors.cardBorder, true: colors.primaryDark }}
                  thumbColor={rx ? colors.primary : colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>NOTES</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did it feel? Scaling used?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

          </>
        )}
      </ScrollView>

      {/* Fixed bottom bar with all action buttons */}
      <View style={styles.bottomBar}>
        {showPostWorkout && freeRemaining !== null && freeRemaining > 0 && freeRemaining <= 10 && (
          <Text style={styles.freeCounter}>{freeRemaining} free workout{freeRemaining === 1 ? '' : 's'} remaining</Text>
        )}
        <View style={styles.bottomBarButtons}>
          {isTimerMode && !isAmrap && (
            <>
              {!timerStarted && !isFinished && (
                <TouchableOpacity style={styles.bottomBtnOutlineGreen} onPress={startTimer}>
                  <Text style={styles.bottomBtnOutlineGreenText}>START</Text>
                </TouchableOpacity>
              )}

              {timerStarted && !timerRunning && !isFinished && (
                <TouchableOpacity style={styles.bottomBtnSmallOutlineBlue} onPress={startTimer}>
                  <Text style={styles.bottomBtnOutlineBlueText}>RESUME</Text>
                </TouchableOpacity>
              )}

              {timerRunning && (
                <TouchableOpacity style={styles.bottomBtnOutlineYellow} onPress={pauseTimer}>
                  <Text style={styles.bottomBtnOutlineYellowText}>PAUSE</Text>
                </TouchableOpacity>
              )}

              {timerRunning && hasRounds && !isFinished && (
                <TouchableOpacity
                  style={[styles.bottomBtnOutlineGreen, lapFlash && styles.bottomBtnGreenFilled]}
                  onPress={lapRound}
                  disabled={lapFlash}
                >
                  <Text style={[styles.bottomBtnOutlineGreenText, lapFlash && styles.bottomBtnFilledText]}>
                    {lapFlash ? '✓ LOGGED' : currentRound >= totalRounds ? 'FINISH' : `R${currentRound} DONE`}
                  </Text>
                </TouchableOpacity>
              )}

              {timerRunning && isForTime && (
                <TouchableOpacity
                  style={[styles.bottomBtnOutlineBlue, lapFlash && styles.bottomBtnBlueFilled]}
                  onPress={lapSplit}
                  disabled={lapFlash}
                >
                  <Text style={[styles.bottomBtnOutlineBlueText, lapFlash && styles.bottomBtnFilledText]}>
                    {lapFlash ? '✓' : 'SPLIT'}
                  </Text>
                </TouchableOpacity>
              )}

              {timerRunning && (
                <TouchableOpacity style={styles.bottomBtnOutlineRed} onPress={stopTimer}>
                  <Text style={styles.bottomBtnOutlineRedText}>STOP</Text>
                </TouchableOpacity>
              )}

              {timerStarted && !timerRunning && (
                <TouchableOpacity style={styles.bottomBtnSmallOutlineOrange} onPress={resetTimer}>
                  <Text style={styles.bottomBtnOutlineOrangeText}>RESET</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {showPostWorkout && (
            <TouchableOpacity
              style={[styles.bottomBtnPrimary, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.bottomBtnPrimaryText}>
                {saving ? '✓' : 'SAVE'}
              </Text>
            </TouchableOpacity>
          )}

          {!isTimerMode && !showPostWorkout && (
            <View />
          )}
        </View>
      </View>
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
    paddingBottom: 140,
  },
  wodName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  workoutBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  workoutText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  section: {
    marginTop: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  // Timer display
  timerDisplay: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  roundIndicator: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  bottomBarButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bottomBtnGreen: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomBtnGreenText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomBtnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bottomBtnPrimaryText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomBtnOutlineGreen: {
    flex: 1,
    backgroundColor: '#002B12',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
  bottomBtnOutlineGreenText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bottomBtnOutlineBlue: {
    flex: 1,
    backgroundColor: '#001A2B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4DA6FF',
  },
  bottomBtnSmallOutlineBlue: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4DA6FF',
    backgroundColor: '#001A2B',
  },
  bottomBtnOutlineBlueText: {
    color: '#4DA6FF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  // Pressed/confirmation state for lap & split buttons
  bottomBtnBlueFilled: {
    backgroundColor: '#4DA6FF',
    borderColor: '#4DA6FF',
  },
  bottomBtnGreenFilled: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  bottomBtnFilledText: {
    color: '#001228',
  },
  bottomBtnOutlineOrange: {
    flex: 1,
    backgroundColor: '#2B1500',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  bottomBtnSmallOutlineOrange: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00',
    backgroundColor: '#2B1500',
  },
  bottomBtnOutlineOrangeText: {
    color: '#FF8C00',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomBtnOutlineYellow: {
    flex: 1,
    backgroundColor: '#2B2200',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  bottomBtnOutlineYellowText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomBtnOutlineRed: {
    flex: 1,
    backgroundColor: '#2B0012',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  bottomBtnOutlineRedText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomBtnMuted: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bottomBtnMutedText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },

  // Round splits
  roundsList: {
    marginTop: spacing.lg,
  },
  roundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  roundLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  roundTimesCol: {
    alignItems: 'flex-end',
  },
  roundSplit: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  roundCumulative: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Manual time & date entry
  dateInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  timeInput: {
    alignItems: 'center',
  },
  timeSeparator: {
    fontSize: 32,
    color: colors.textMuted,
    fontWeight: '700',
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 100,
  },
  notesInput: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    minHeight: 80,
  },

  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rxBadge: {
    backgroundColor: '#002B12',
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.success,
    overflow: 'hidden',
  },
  scaledBadge: {
    backgroundColor: colors.cardBorder,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  freeCounter: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  rxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rxHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});
