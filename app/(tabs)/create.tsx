import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getUserEquipment } from '../../src/storage/equipmentStorage';
import { saveGeneratedWod } from '../../src/storage/generatedWodStorage';
import { generateWod, GeneratedWod, GeneratedWodType } from '../../src/data/wodGenerator';
import { colors, spacing } from '../../src/theme';

const wodTypeOptions: { key: GeneratedWodType; label: string }[] = [
  { key: 'for-time', label: 'For Time' },
  { key: 'amrap', label: 'AMRAP' },
  { key: 'rounds-for-time', label: 'Rounds' },
  { key: 'emom', label: 'EMOM' },
];

export default function CreateScreen() {
  const router = useRouter();
  const [userEquipment, setUserEquipment] = useState<string[]>([]);
  const [tab, setTab] = useState<'generate' | 'custom'>('generate');

  // Generator state
  const [wod, setWod] = useState<GeneratedWod | null>(null);
  const [wodName, setWodName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  // Custom builder state
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<GeneratedWodType>('for-time');
  const [customRounds, setCustomRounds] = useState('');
  const [customTimeCap, setCustomTimeCap] = useState('');
  const [customWorkout, setCustomWorkout] = useState('');

  useFocusEffect(
    useCallback(() => {
      getUserEquipment().then(setUserEquipment);
    }, [])
  );

  // --- Generator ---
  function handleGenerateWod() {
    if (userEquipment.length === 0) {
      router.push('/(tabs)/equipment');
      return;
    }
    const newWod = generateWod(userEquipment);
    setWod(newWod);
    setWodName('');
    setEditing(false);
    setEditText(newWod.description);
  }

  function handleEdit() {
    if (editing && wod) {
      setWod({ ...wod, description: editText });
    }
    setEditing(!editing);
  }

  async function handleStart(mode: 'timer' | 'log') {
    if (tab === 'generate') {
      if (!wod) return;
      await saveGeneratedWod({ ...wod, name: wodName || 'Custom WOD' });
    } else {
      if (!customWorkout.trim()) return;
      const built: GeneratedWod = {
        type: customType,
        timeCap: customTimeCap ? parseInt(customTimeCap) : undefined,
        totalRounds: customRounds ? parseInt(customRounds) : undefined,
        movements: [],
        description: customWorkout,
        name: customName || 'Custom WOD',
      };
      await saveGeneratedWod(built);
    }
    router.push(`/log/custom?mode=${mode}`);
  }

  const hasWod = tab === 'generate' ? !!wod : !!customWorkout.trim();

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>CREATE</Text>

        {/* Tab toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'generate' && styles.tabBtnActive]}
            onPress={() => setTab('generate')}
          >
            <Text style={[styles.tabText, tab === 'generate' && styles.tabTextActive]}>
              GENERATE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'custom' && styles.tabBtnActive]}
            onPress={() => setTab('custom')}
          >
            <Text style={[styles.tabText, tab === 'custom' && styles.tabTextActive]}>
              BUILD
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== GENERATE TAB ===== */}
        {tab === 'generate' && (
          <>
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
              <>
                <TextInput
                  style={styles.nameInput}
                  value={wodName}
                  onChangeText={setWodName}
                  placeholder="Name this WOD (optional)"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.resultBox}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultType}>
                      {wod.type.replace(/-/g, ' ').toUpperCase()}
                      {wod.timeCap ? ` - ${wod.timeCap} MIN` : ''}
                      {wod.totalRounds ? ` - ${wod.totalRounds} RDS` : ''}
                    </Text>
                    <TouchableOpacity onPress={handleEdit}>
                      <Text style={styles.editBtn}>{editing ? 'DONE' : 'EDIT'}</Text>
                    </TouchableOpacity>
                  </View>

                  {editing ? (
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      textAlignVertical="top"
                    />
                  ) : (
                    <Text style={styles.resultText}>{wod.description}</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}

        {/* ===== BUILD TAB ===== */}
        {tab === 'custom' && (
          <>
            <TextInput
              style={styles.nameInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="WOD Name (optional)"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>TYPE</Text>
            <View style={styles.typeRow}>
              {wodTypeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.typeBtn, customType === opt.key && styles.typeBtnActive]}
                  onPress={() => setCustomType(opt.key)}
                >
                  <Text style={[styles.typeText, customType === opt.key && styles.typeTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {(customType === 'amrap' || customType === 'emom') && (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>TIME CAP (MIN)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={customTimeCap}
                  onChangeText={setCustomTimeCap}
                  placeholder="12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            )}

            {customType === 'rounds-for-time' && (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>ROUNDS</Text>
                <TextInput
                  style={styles.smallInput}
                  value={customRounds}
                  onChangeText={setCustomRounds}
                  placeholder="5"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            )}

            <Text style={styles.label}>WORKOUT</Text>
            <TextInput
              style={styles.workoutInput}
              value={customWorkout}
              onChangeText={setCustomWorkout}
              placeholder={"21 Thrusters (95 lb)\n15 Pull-Ups\n9 Deadlifts (225 lb)\n400m Run"}
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </>
        )}
      </ScrollView>

      {hasWod && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.startBtn} onPress={() => handleStart('timer')}>
            <Text style={styles.startBtnText}>START</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logBtn} onPress={() => handleStart('log')}>
            <Text style={styles.logBtnText}>LOG</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingTop: Platform.OS === 'web' ? spacing.md : spacing.xl * 2,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.background,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.text,
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
  nameInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultType: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
  },
  editBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 26,
  },
  editInput: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 26,
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  typeTextActive: {
    color: colors.background,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  smallInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    width: 80,
  },
  workoutInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 26,
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 40,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  startBtn: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
