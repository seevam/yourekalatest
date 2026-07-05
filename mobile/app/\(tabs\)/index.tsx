import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, APP_NAME } from '@/lib/constants'

const FEATURES = [
  {
    icon: 'camera-outline' as const,
    title: 'AI Skin Scan',
    description: 'Detect your skin type and concerns with AI',
    color: '#7c3aed',
    route: '/(tabs)/scan',
  },
  {
    icon: 'bag-outline' as const,
    title: 'Product Matches',
    description: 'Products matched to your exact skin profile',
    color: '#e11d48',
    route: '/(tabs)/matches',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Track Progress',
    description: 'Monitor your skin health over time',
    color: '#059669',
    route: '/(tabs)/progress',
  },
  {
    icon: 'bulb-outline' as const,
    title: 'Beauty Tips',
    description: 'Personalized skincare advice for you',
    color: '#d97706',
    route: '/(tabs)/tips',
  },
  {
    icon: 'person-outline' as const,
    title: 'My Profile',
    description: 'Update your skin type and preferences',
    color: '#0284c7',
    route: '/onboarding',
  },
  {
    icon: 'settings-outline' as const,
    title: 'Settings',
    description: 'Customize your experience',
    color: '#64748b',
    route: '/(tabs)/settings',
  },
]

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useUser()

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hey, {user?.firstName ?? 'there'} 👋
          </Text>
          <Text style={styles.subtitle}>Your skincare dashboard</Text>
        </View>
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>Y</Text>
        </View>
      </View>

      {/* Feature grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {FEATURES.map((f) => (
          <TouchableOpacity
            key={f.title}
            style={styles.card}
            onPress={() => router.push(f.route as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: f.color + '20' }]}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <Text style={styles.cardTitle}>{f.title}</Text>
            <Text style={styles.cardDesc}>{f.description}</Text>
            <View style={styles.cardArrow}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textFaint} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  logoBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  grid: { paddingHorizontal: 16, paddingBottom: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, padding: 18,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  cardDesc: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  cardArrow: { marginTop: 12 },
})
