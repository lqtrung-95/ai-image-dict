import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FREE_LIMITS, PRO_FEATURES, PRO_PLAN } from '@/lib/monetization';

export default function UpgradeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#111827';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  const handleUpgrade = () => {
    // RevenueCat or native IAP should be connected here before App Store release.
    Alert.alert('Coming Soon', 'Subscriptions are ready to connect with RevenueCat or native in-app purchases.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={34} color="#ffffff" />
        </View>
        <Text style={[styles.title, { color: textColor }]}>Upgrade to {PRO_PLAN.name}</Text>
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          Keep learning from photos without hitting the free limits.
        </Text>
      </View>

      <View style={[styles.planCard, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.planHeader}>
          <View>
            <Text style={[styles.planName, { color: textColor }]}>{PRO_PLAN.name}</Text>
            <Text style={[styles.planDescription, { color: subtextColor }]}>For daily Chinese practice</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={[styles.price, { color: textColor }]}>{PRO_PLAN.monthlyPrice}</Text>
            <Text style={[styles.priceSubtext, { color: subtextColor }]}>/ month</Text>
          </View>
        </View>

        <View style={styles.annualRow}>
          <Text style={styles.annualText}>{PRO_PLAN.annualPrice} yearly</Text>
          <Text style={styles.savingsText}>{PRO_PLAN.annualSavings}</Text>
        </View>

        <View style={styles.featureList}>
          {PRO_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={[styles.featureText, { color: textColor }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
          <Ionicons name="card" size={20} color="#ffffff" />
          <Text style={styles.upgradeButtonText}>Start Pro</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.freeCard, { borderColor }]}>
        <Text style={[styles.freeTitle, { color: textColor }]}>Free plan today</Text>
        <Text style={[styles.freeText, { color: subtextColor }]}>
          Guest users get {FREE_LIMITS.guestAnalyses} trial analysis. Signed-in users get {FREE_LIMITS.dailyAnalyses} analyses per day.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 56,
  },
  header: {
    height: 44,
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  hero: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
  },
  priceSubtext: {
    fontSize: 12,
  },
  annualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  annualText: {
    color: '#a78bfa',
    fontWeight: '700',
  },
  savingsText: {
    color: '#22c55e',
    fontWeight: '700',
  },
  featureList: {
    gap: 14,
    marginTop: 22,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
  upgradeButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  freeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
  },
  freeTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  freeText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
