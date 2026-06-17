import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Toast, useToast } from './Toast';
import { redeemCoupon, couponErrorMessage } from '../lib/subscription';
import { colors, spacing } from '../theme';

/**
 * Coupon-code redeem widget. Self-contained (manages its own input + toast) so
 * it can drop into both the paywall and the profile/Me screen. Calls back with
 * the granted workout count on success so the host can refresh its counters.
 */
export function CouponRedeem({
  onRedeemed,
  compact,
}: {
  onRedeemed?: (workouts: number, total: number) => void;
  compact?: boolean;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const { toast, show, hide } = useToast();

  async function handleRedeem() {
    const trimmed = code.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const res = await redeemCoupon(trimmed);
    setBusy(false);
    if (res.ok) {
      show(`Code applied! +${res.workouts} free workouts.`, 'success', 5000);
      setCode('');
      onRedeemed?.(res.workouts, res.total);
    } else {
      show(couponErrorMessage(res.error), 'error');
    }
  }

  return (
    <View style={styles.wrap}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={hide} />
      {!compact && <Text style={styles.label}>REDEEM A CODE</Text>}
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ENTER CODE"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={32}
          onSubmitEditing={handleRedeem}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.btn, (busy || !code.trim()) && styles.btnDisabled]}
          onPress={handleRedeem}
          disabled={busy || !code.trim()}
        >
          <Text style={styles.btnText}>{busy ? '…' : 'APPLY'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    outlineStyle: 'none',
  } as any,
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
