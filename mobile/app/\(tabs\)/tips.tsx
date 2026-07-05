import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

interface TipItem {
  title: string
  description: string
}

interface TipCategory {
  category: string
  icon: string
  color: string
  tips: TipItem[]
}

export default function TipsScreen() {
  const { getToken } = useAuth()
  const [categories, setCategories] = useState<TipCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_BASE_URL}/api/tips`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
        if (data.length > 0) setExpanded(data[0].category)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  if (categories.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="bulb-outline" size={48} color={COLORS.textFaint} />
        <Text style={styles.emptyTitle}>No tips yet</Text>
        <Text style={styles.emptyDesc}>Complete your skin profile to get personalized tips.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Beauty Tips</Text>
        <Text style={styles.subtitle}>Personalized for your skin</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {categories.map((cat) => (
          <View key={cat.category} style={styles.card}>
            <TouchableOpacity
              style={styles.catHeader}
              onPress={() => setExpanded(expanded === cat.category ? null : cat.category)}
              activeOpacity={0.7}
            >
              <View style={styles.catLeft}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={styles.catName}>{cat.category}</Text>
              </View>
              <Ionicons
                name={expanded === cat.category ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>

            {expanded === cat.category && (
              <View style={styles.tipList}>
                {cat.tips.map((tip, i) => (
                  <View key={i} style={styles.tipItem}>
                    <View style={[styles.tipDot, { backgroundColor: cat.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tipTitle}>{tip.title}</Text>
                      <Text style={styles.tipDesc}>{tip.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: COLORS.textMuted, fontSize: 14, marginTop: 2 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  emptyDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { fontSize: 20 },
  catName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  tipList: { paddingHorizontal: 18, paddingBottom: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  tipItem: { flexDirection: 'row', gap: 12, marginTop: 14, alignItems: 'flex-start' },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  tipTitle: { color: COLORS.text, fontSize: 14, fontWeight: '500', marginBottom: 3 },
  tipDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
})
