import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

interface Match {
  id: number
  matchScore: number
  matchReason: string
  product: {
    id: number
    name: string
    brand: string
    category: string
    price: number
    skinTypeMatch: string[]
    concernsTargeted: string[]
    isFragranceFree: boolean
    isVegan: boolean
    buyLink: string | null
  }
}

const CATEGORY_COLOR: Record<string, string> = {
  cleanser: '#7c3aed',
  moisturizer: '#0284c7',
  sunscreen: '#d97706',
  serum: '#e11d48',
  toner: '#059669',
  'spot treatment': '#dc2626',
}

export default function MatchesScreen() {
  const { getToken } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadMatches = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/api/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMatches(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/api/matches/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadMatches()
    } catch {
      setRefreshing(false)
    }
  }

  useEffect(() => { loadMatches() }, [])

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Matches</Text>
        <TouchableOpacity onPress={refresh} disabled={refreshing} style={styles.refreshBtn}>
          {refreshing
            ? <ActivityIndicator size="small" color={COLORS.primaryLight} />
            : <Ionicons name="refresh-outline" size={20} color={COLORS.primaryLight} />}
        </TouchableOpacity>
      </View>

      {matches.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color={COLORS.textFaint} />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyDesc}>Complete your skin profile to get personalized product recommendations.</Text>
          <TouchableOpacity style={styles.btn} onPress={refresh}>
            <Text style={styles.btnText}>Generate Matches</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {matches.map((match) => {
            const catColor = CATEGORY_COLOR[match.product.category] ?? COLORS.primary
            const scoreColor = match.matchScore >= 75 ? COLORS.success : match.matchScore >= 50 ? COLORS.warning : COLORS.danger
            return (
              <View key={match.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.categoryBadge, { backgroundColor: catColor + '20' }]}>
                    <Text style={[styles.categoryText, { color: catColor }]}>{match.product.category}</Text>
                  </View>
                  <Text style={[styles.score, { color: scoreColor }]}>{match.matchScore}%</Text>
                </View>

                <Text style={styles.productName}>{match.product.name}</Text>
                <Text style={styles.brand}>{match.product.brand}</Text>

                <View style={styles.scoreBarBg}>
                  <View style={[styles.scoreBarFill, { width: `${match.matchScore}%` as `${number}%`, backgroundColor: scoreColor }]} />
                </View>

                <Text style={styles.reason}>{match.matchReason}</Text>

                <View style={styles.badges}>
                  {match.product.isFragranceFree && (
                    <View style={styles.badge}><Text style={styles.badgeText}>Fragrance-free</Text></View>
                  )}
                  {match.product.isVegan && (
                    <View style={styles.badge}><Text style={styles.badgeText}>Vegan</Text></View>
                  )}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>${match.product.price}</Text>
                  </View>
                </View>

                {match.product.buyLink && (
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => Linking.openURL(match.product.buyLink!)}
                  >
                    <Text style={styles.buyText}>View Product</Text>
                    <Ionicons name="open-outline" size={14} color={COLORS.primaryLight} />
                  </TouchableOpacity>
                )}
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  refreshBtn: { padding: 8 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  emptyDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  card: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.card, borderRadius: 20,
    padding: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  categoryText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  score: { fontSize: 20, fontWeight: 'bold' },
  productName: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  brand: { color: COLORS.textMuted, fontSize: 13, marginBottom: 10 },
  scoreBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 2 },
  reason: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: COLORS.textMuted, fontSize: 12 },
  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.primary + '60',
    borderRadius: 12, paddingVertical: 10,
  },
  buyText: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '500' },
})
