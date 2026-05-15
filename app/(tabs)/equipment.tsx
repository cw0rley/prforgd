import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { allEquipment } from '../../src/data/equipment';
import { getUserEquipment, saveUserEquipment } from '../../src/storage/equipmentStorage';
import { colors, spacing } from '../../src/theme';

export default function EquipmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      getUserEquipment().then(setSelected);
    }, [])
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((e) => e !== id)
        : [...prev, id];
      saveUserEquipment(next);
      return next;
    });
  }

  function selectAll() {
    const all = allEquipment.map((e) => e.id);
    setSelected(all);
    saveUserEquipment(all);
  }

  function clearAll() {
    setSelected([]);
    saveUserEquipment([]);
  }

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>MY GEAR</Text>
        <Text style={styles.subtitle}>Select what you have access to. WODs will be filtered based on your equipment.</Text>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={selectAll}>
            <Text style={styles.quickBtnText}>SELECT ALL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={clearAll}>
            <Text style={styles.quickBtnText}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>

        {allEquipment.map((item) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.equipName, isSelected && styles.equipNameSelected]}>
                {item.name}
              </Text>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
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
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  quickBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  equipName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  equipNameSelected: {
    color: colors.text,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
  },
});
