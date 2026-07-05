import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import {
  COLORS, SKIN_TYPES, AGE_RANGES, CONCERNS,
  SENSITIVITIES, BUDGETS, ROUTINES,
} from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

const TOTAL_STEPS = 5

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

function SelectCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.selectCard, selected && styles.selectCardSelected]}>
      <Text style={[styles.selectCardText, selected && styles.selectCardTextSelected]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
    </TouchableOpacity>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [ageRange, setAgeRange] = useState<string | null>(null)
  const [skinType, setSkinType] = useState<string | null>(null)
  const [skinConcerns, setSkinConcerns] = useState<string[]>([])
  const [sensitivities, setSensitivities] = useState<string[]>([])
  const [allergiesText, setAllergiesText] = useState('')
  const [budget, setBudget] = useState<string | null>(null)
  const [routinePreference, setRoutinePreference] = useState<string | null>(null)

  const toggleConcern = (v: string) =>
    setSkinConcerns((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  const toggleSensitivity = (v: string) =>
    setSensitivities((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else handleSubmit()
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ageRange, skinType, skinConcerns, sensitivities,
          allergies: allergiesText ? allergiesText.split(',').map((s) => s.trim()).filter(Boolean) : [],
          budget, routinePreference,
        }),
      })
      await fetch(`${API_BASE_URL}/api/matches/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      router.replace('/(tabs)/matches' as never)
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const stepTitles = [
    'How old are you?',
    "What's your skin type?",
    'Any skin concerns?',
    'Sensitivities & allergies',
    'Budget & routine',
  ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 ? (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.stepCount}>{step}/{TOTAL_STEPS}</Text>
      </View>

      <Text style={styles.stepTitle}>{stepTitles[step - 1]}</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {step === 1 && (
          <View style={styles.chipRow}>
            {AGE_RANGES.map((a) => (
              <Chip key={a} label={a} selected={ageRange === a} onPress={() => setAgeRange(a)} />
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.cardList}>
            {SKIN_TYPES.map((t) => (
              <SelectCard key={t} label={t} selected={skinType === t} onPress={() => setSkinType(t)} />
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.chipRow}>
            {CONCERNS.map((c) => (
              <Chip key={c} label={c} selected={skinConcerns.includes(c)} onPress={() => toggleConcern(c)} />
            ))}
          </View>
        )}

        {step === 4 && (
          <>
            <Text style={styles.sublabel}>Sensitivities</Text>
            <View style={styles.chipRow}>
              {SENSITIVITIES.map((s) => (
                <Chip key={s} label={s} selected={sensitivities.includes(s)} onPress={() => toggleSensitivity(s)} />
              ))}
            </View>
            <Text style={[styles.sublabel, { marginTop: 20 }]}>Known Allergies (comma-separated)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. benzoyl peroxide, retinol…"
              placeholderTextColor={COLORS.textFaint}
              value={allergiesText}
              onChangeText={setAllergiesText}
            />
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.sublabel}>Budget</Text>
            <View style={styles.cardList}>
              {BUDGETS.map((b) => (
                <SelectCard key={b.value} label={b.label} selected={budget === b.value} onPress={() => setBudget(b.value)} />
              ))}
            </View>
            <Text style={[styles.sublabel, { marginTop: 20 }]}>Routine Preference</Text>
            <View style={styles.cardList}>
              {ROUTINES.map((r) => (
                <SelectCard key={r.value} label={r.label} selected={routinePreference === r.value} onPress={() => setRoutinePreference(r.value)} />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, saving && { opacity: 0.5 }]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.nextBtnText}>{step === TOTAL_STEPS ? 'Find My Products' : 'Next'}</Text>}
        </TouchableOpacity>
        {step < TOTAL_STEPS && (
          <TouchableOpacity onPress={handleNext} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: COLORS.primary },
  stepCount: { color: COLORS.textFaint, fontSize: 13 },
  stepTitle: { color: COLORS.text, fontSize: 26, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 8 },
  body: { paddingHorizontal: 20, paddingBottom: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  chipText: { color: COLORS.textMuted, fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  cardList: { gap: 10 },
  selectCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  selectCardSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  selectCardText: { color: COLORS.textMuted, fontSize: 14, textTransform: 'capitalize' },
  selectCardTextSelected: { color: '#fff' },
  sublabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    color: COLORS.text, fontSize: 14,
  },
  footer: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12 },
  nextBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: COLORS.textFaint, fontSize: 14 },
})
