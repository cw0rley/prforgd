import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { colors, spacing } from '../src/theme';
import { supabase } from '../src/lib/supabase';

const STRIPE_MONTHLY_URL = 'https://buy.stripe.com/3cI8wPdol7LL8q47Ua57W00';
const STRIPE_YEARLY_URL = 'https://buy.stripe.com/eVqaEXespfed35Keiy57W01';

export default function PaywallScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason: string }>();
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');

  const needsAccount = reason === 'account_required';

  async function handleSubscribe() {
    const baseUrl = selectedPlan === 'monthly' ? STRIPE_MONTHLY_URL : STRIPE_YEARLY_URL;
    // Pass user ID and email to Stripe so webhook can match payment to user
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    const email = data.session?.user?.email;
    let url = baseUrl;
    if (userId) {
      url += `?client_reference_id=${userId}`;
      if (email) url += `&prefilled_email=${encodeURIComponent(email)}`;
    }
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  }

  return (
    <>
      <Stack.Screen options={{
        title: '',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '300', paddingHorizontal: 12, paddingVertical: 4 }}>&#10094;</Text>
          </TouchableOpacity>
        ),
      }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>GO UNLIMITED</Text>
        <Text style={styles.subtitle}>
          {needsAccount
            ? "You've used your 10 free workouts. Create an account and subscribe to keep logging."
            : "You've used your 10 free workouts. Subscribe to log unlimited workouts and track your PRs."}
        </Text>

        {needsAccount && (
          <TouchableOpacity
            style={styles.accountBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.accountBtnText}>CREATE ACCOUNT FIRST</Text>
          </TouchableOpacity>
        )}

        {!needsAccount && (
          <>
            {/* Yearly plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'yearly' && <View style={styles.planRadioFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleRow}>
                    <Text style={styles.planName}>Yearly</Text>
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>SAVE 16%</Text>
                    </View>
                  </View>
                  <Text style={styles.planPrice}>$19.99 / year</Text>
                  <Text style={styles.planSub}>$1.67/mo — best value</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly plan */}
            <TouchableOpacity
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === 'monthly' && <View style={styles.planRadioFill} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planPrice}>$1.99 / month</Text>
                  <Text style={styles.planSub}>$23.88/yr — flexible</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Subscribe button */}
            <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
              <Text style={styles.subscribeBtnText}>SUBSCRIBE</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>
              Cancel anytime. Subscription renews automatically unless canceled at least 24 hours before the end of the current period.
            </Text>
          </>
        )}

        {/* What you get */}
        <View style={styles.featuresBox}>
          <Text style={styles.featuresTitle}>WHAT YOU GET</Text>
          <Feature text="Unlimited workout logging" />
          <Feature text="PR tracking across all workouts" />
          <Feature text="Cloud sync across all devices" />
          <Feature text="Custom WOD builder & generator" />
          <Feature text="Workout scanning (OCR)" />
          <Feature text="CSV & JSON data export" />
          <Feature text="130+ exercise video demos" />
        </View>

        {/* Free tier reminder */}
        <View style={styles.freeBox}>
          <Text style={styles.freeTitle}>FREE TIER</Text>
          <Text style={styles.freeText}>
            Browse all 200+ WODs, watch movement videos, use the WOD generator, and log up to 10 workouts — no account needed.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureCheck}>&#10003;</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  accountBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  accountBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planRadioFill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  saveBadge: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  planSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  subscribeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  subscribeBtnText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  terms: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
    marginBottom: spacing.lg,
  },
  featuresBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  featureCheck: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  freeBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  freeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  freeText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
