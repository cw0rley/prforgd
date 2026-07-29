import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { getProfile, saveProfile } from '../storage/profileStorage';
import { colors, spacing } from '../theme';

type ToastType = 'success' | 'error' | 'info';

// Athlete profile card (signed-in only). Collects the public identity used by
// the leaderboard: username + sex + birth year (which drives the age division).
export function AthleteProfile({ onToast }: { onToast?: (msg: string, type: ToastType) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [username, setUsername] = useState('');
  const [sex, setSex] = useState<'M' | 'F' | null>(null);
  const [birthYear, setBirthYear] = useState('');

  useEffect(() => {
    let active = true;
    getProfile().then((p) => {
      if (!active) return;
      if (p) {
        setHasProfile(true);
        setUsername(p.username);
        setSex(p.sex);
        setBirthYear(p.birthYear ? String(p.birthYear) : '');
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function handleSave() {
    setSaving(true);
    const result = await saveProfile({
      username,
      sex,
      birthYear: birthYear ? parseInt(birthYear, 10) : null,
    });
    setSaving(false);
    if (result.ok) {
      setHasProfile(true);
      onToast?.('Profile saved.', 'success');
    } else {
      onToast?.(result.error, 'error');
    }
  }

  if (loading) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>ATHLETE PROFILE</Text>
      <Text style={styles.hint}>Your public identity for leaderboards.</Text>

      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
        placeholder="e.g. iron_athlete"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
      />

      <Text style={styles.label}>Division</Text>
      <View style={styles.sexRow}>
        {(['M', 'F'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sexBtn, sex === s && styles.sexBtnActive]}
            onPress={() => setSex(s)}
          >
            <Text style={[styles.sexText, sex === s && styles.sexTextActive]}>
              {s === 'M' ? 'Male' : 'Female'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Birth year</Text>
      <TextInput
        style={styles.input}
        value={birthYear}
        onChangeText={(t) => setBirthYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
        placeholder="e.g. 1990"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={styles.subHint}>Used only to place you in an age division.</Text>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'SAVING...' : hasProfile ? 'UPDATE PROFILE' : 'SAVE PROFILE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  subHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sexRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sexBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  sexBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sexText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  sexTextActive: {
    color: colors.background,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveBtnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
