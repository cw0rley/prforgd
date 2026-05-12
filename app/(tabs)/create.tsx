import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getUserEquipment } from '../../src/storage/equipmentStorage';
import {
  generateWod,
  generateWarmup,
  GeneratedWod,
  WarmupRoutine,
  WarmupFocus,
} from '../../src/data/wodGenerator';
import { colors, spacing } from '../../src/theme';

export default function CreateScreen() {
  const router = useRouter();
  const [userEquipment, setUserEquipment] = useState<string[]>([]);
  const [wod, setWod] = useState<GeneratedWod | null>(null);
  const [warmup, setWarmup] = useState<WarmupRoutine | null>(null);
  const [warmupFocus, setWarmupFocus] = useState<WarmupFocus>('full');

  useFocusEffect(
    useCallback(() => {
      getUserEquipment().then(setUserEquipment);
    }, [])
  );

  function handleGenerateWod() {
    if (userEquipment.length === 0) {
      router.push('/(tabs)/equipment');
      return;
    }
    setWod(generateWod(userEquipment));
  }

  function handleGenerateWarmup() {
    setWarmup(generateWarmup(warmupFocus));
  }

  const focusOptions: { key: WarmupFocus; label: string }[] = [
    { key: 'full', label: 'Full Body' },
    { key: 'upper', label: 'Upper' },
    { key: 'lower', label: 'Lower' },
    { key: 'general', label: 'General' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>CREATE</Text>

      {/* WOD Generator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WOD GENERATOR</Text>
        <Text style={styles.sectionHint}>
          {userEquipment.length === 0
            ? 'Set your equipment in the Gear tab first'
            : `Using ${userEquipment.length} equipment types`}
        </Text>

        <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateWod}>
          <Text style={styles.generateBtnText}>
            {wod ? 'GENERATE ANOTHER' : 'GENERATE WOD'}
          </Text>
        </TouchableOpacity>

        {wod && (
          <View style={styles.resultBox}>
            <Text style={styles.resultType}>
              {wod.type.replace(/-/g, ' ').toUpperCase()}
              {wod.timeCap ? ` - ${wod.timeCap} MIN` : ''}
              {wod.totalRounds ? ` - ${wod.totalRounds} ROUNDS` : ''}
            </Text>
            <Text style={styles.resultText}>{wod.description}</Text>
          </View>
        )}
      </View>

      {/* Warmup Generator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>WARMUP GENERATOR</Text>

        <View style={styles.focusRow}>
          {focusOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.focusBtn, warmupFocus === opt.key && styles.focusBtnActive]}
              onPress={() => setWarmupFocus(opt.key)}
            >
              <Text style={[styles.focusText, warmupFocus === opt.key && styles.focusTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.generateBtnWarmup} onPress={handleGenerateWarmup}>
          <Text style={styles.generateBtnWarmupText}>
            {warmup ? 'NEW WARMUP' : 'GENERATE WARMUP'}
          </Text>
        </TouchableOpacity>

        {warmup && (
          <View style={styles.resultBox}>
            <Text style={styles.resultType}>
              {warmupFocus.toUpperCase()} WARMUP
            </Text>
            {warmup.movements.map((m, i) => (
              <Text key={i} style={styles.warmupItem}>
                {m.reps} {m.name}
              </Text>
            ))}
          </View>
        )}
      </View>
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
    paddingBottom: spacing.xl * 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  generateBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  generateBtnWarmup: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  generateBtnWarmupText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  resultBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultType: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  warmupItem: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 28,
  },
  focusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  focusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  focusBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  focusText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  focusTextActive: {
    color: colors.background,
  },
});
