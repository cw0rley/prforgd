import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { colors, spacing } from '../theme';

interface PRModalProps {
  visible: boolean;
  wodName: string;
  onClose: () => void;
}

export function PRModal({ visible, wodName, onClose }: PRModalProps) {
  const { height } = useWindowDimensions();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { maxHeight: height - spacing.xl * 2 }]}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.prLabel}>NEW PR!</Text>
            <Text style={styles.wodName}>{wodName}</Text>
            <Text style={styles.sub}>You set a new personal record</Text>
          </ScrollView>
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
  // flexShrink defaults to 0 in React Native, so without it the body keeps its
  // full height and maxHeight on the card has no effect. The card centres its
  // children, so the body has to stretch itself back to full width.
  body: {
    flexShrink: 1,
    alignSelf: 'stretch',
  },
  bodyContent: {
    alignItems: 'center',
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
