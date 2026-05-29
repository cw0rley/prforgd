import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing } from '../theme';

export type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    if (timeout.current) clearTimeout(timeout.current);
    setToast({ message, type, visible: true });
    if (duration > 0) {
      timeout.current = setTimeout(() => setToast(t => ({ ...t, visible: false })), duration);
    }
  }, []);

  const hide = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    setToast(t => ({ ...t, visible: false }));
  }, []);

  return { toast, show, hide };
}

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onDismiss?: () => void;
}

export function Toast({ message, type, visible, onDismiss }: ToastProps) {
  if (!visible) return null;

  const bgColor = type === 'error' ? 'rgba(255,59,59,0.15)'
    : type === 'success' ? 'rgba(127,255,59,0.15)'
    : 'rgba(138,175,196,0.15)';
  const borderColor = type === 'error' ? 'rgba(255,59,59,0.4)'
    : type === 'success' ? 'rgba(127,255,59,0.4)'
    : 'rgba(138,175,196,0.4)';
  const textColor = type === 'error' ? '#ff6b6b'
    : type === 'success' ? colors.primary
    : colors.text;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: bgColor, borderColor }]}
      onPress={onDismiss}
      activeOpacity={0.8}
    >
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
