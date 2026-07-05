import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

interface Scan {
  id: number
  createdAt: string
  analysis: {
    skinType: string
    concerns: string[]
    overallScore: number
  }
}

function scoreColor(s: number) {
  return s >= 75 ? COLORS.success : s >= 50 ? COLORS.warning : COLORS.danger
}

export default function ProgressScreen() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_BASE_URL}/api/scan`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setScans(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const latest = scans[0]
  const avgScore = scans.length
    ? Math.round(scans.reduce((a, s) => a + s.analysis.overallScore, 0) / scans.length)
    : null

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
        <Text style={styles.title}>Track Progress</Text>
        <Text style={styles.subtitle}>Your skin score history</Text>
      </View>

      {scans.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="trending-up-outline" size={48} color={COLORS.textFaint} />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyDesc}>Take your first AI skin scan to start tracking progress.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/scan')}>
            <Text style={styles.btnText}>Take First Scan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Scans</Text>
              <Text style={styles.statValue}>{scans.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Latest</Text>
              <Text style={[styles.statValue, { color: scoreColor(latest.analysis.overallScore) }]}>
                {latest.analysis.overallScore}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Average</Text>
              <Text style={styles.statValue}>{avgScore}</Text>
            </View>
          </View>

          {/* Bar chart */}
          {scans.length > 1 && (
            <View style={styles.chartCard}>
              <Text style={styles.chartLabel}>Score Over Time</Text>
              <View style={styles.bars}>
                {[...scans].reverse().map((scan) => (
                  <View key={scan.id} style={styles.barCol}>
                    <Text style={styles.barNum}>{scan.analysis.overallScore}</Text>
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${scan.analysis.overallScore}%` as `${number}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <Text style={styles.legendText}>Oldest</Text>
                <Text style={styles.legendText}>Latest</Text>
              </View>
            </View>
          )}

          {/* Scan list */}
          {scans.map((scan, i) => {
            const diff = i < scans.length - 1 ? scan.analysis.overallScore - scans[i + 1].analysis.overallScore : null
            return (
              <View key={scan.id} style={styles.scanCard}>
                <View style={styles.scanTop}>
                  <View>
                    <Text style={styles.scanDate}>
                      {new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                    <Text style={styles.skinType}>{scan.analysis.skinType} skin</Text>
                  </View>
                  <View style={styles.scanRight}>
                    {diff !== null && diff !== 0 && (
                      <Text style={[styles.diff, { color: diff > 0 ? COLORS.success : COLORS.danger }]}>
                        {diff > 0 ? '+' : ''}{diff}
                      </Text>
                    )}
                    <Text style={[styles.scanScore, { color: scoreColor(scan.analysis.overallScore) }]}>
                      {scan.analysis.overallScore}
                    </Text>
                  </View>
                </View>
                <View style={styles.scanBarBg}>
                  <View
                    style={[
                      styles.scanBarFill,
                      { width: `${scan.analysis.overallScore}%` as `${number}%`, backgroundColor: scoreColor(scan.analysis.overallScore) },
                    ]}
                  />
                </View>
                {scan.analysis.concerns.length > 0 && (
                  <View style={styles.chipRow}>
                    {scan.analysis.concerns.slice(0, 4).map((c) => (
                      <View key={c} style={styles.chip}>
                        <Text style={styles.chipText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )
          })}

          <TouchableOpacity style={styles.newScanBtn} onPress={() => router.push('/(tabs)/scan')}>
            <Ionicons name="camera-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.newScanText}>Take a New Scan</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  emptyDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  statLabel: { color: COLORS.textFaint, fontSize: 11, marginBottom: 4 },
  statValue: { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  chartCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  chartLabel: { color: COLORS.textFaint, fontSize: 12, fontWeight: '500', marginBottom: 12 },
  bars: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barNum: { color: COLORS.textFaint, fontSize: 10 },
  barBg: { width: '100%', flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendText: { color: COLORS.textFaint, fontSize: 11 },
  scanCard: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: COLORS.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  scanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  scanDate: { color: COLORS.textFaint, fontSize: 12 },
  skinType: { color: COLORS.text, fontSize: 14, fontWeight: '500', textTransform: 'capitalize', marginTop: 2 },
  scanRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diff: { fontSize: 13, fontWeight: '500' },
  scanScore: { fontSize: 22, fontWeight: 'bold' },
  scanBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  scanBarFill: { height: '100%', borderRadius: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { color: COLORS.textFaint, fontSize: 11, textTransform: 'capitalize' },
  newScanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 13,
  },
  newScanText: { color: COLORS.textMuted, fontSize: 14 },
})
