import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface PRModalProps {
  visible: boolean;
  wodName: string;
  onClose: () => void;
}

export function PRModal({ visible, wodName, onClose }: PRModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.prLabel}>NEW PR!</Text>
          <Text style={styles.wodName}>{wodName}</Text>
          <Text style={styles.sub}>You set a new personal record</Text>
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>HELL YEAH</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.prGold,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  trophy: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  prLabel: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.prGold,
    letterSpacing: 4,
    marginBottom: spacing.xs,
  },
  wodName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  sub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
