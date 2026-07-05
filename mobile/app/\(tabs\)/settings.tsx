import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { useUser, useAuth, useClerk } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import {
  COLORS, SKIN_TYPES, AGE_RANGES, CONCERNS,
  SENSITIVITIES, BUDGETS, ROUTINES,
} from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

interface Profile {
  skinType: string | null
  ageRange: string | null
  skinConcerns: string[] | null
  sensitivities: string[] | null
  allergies: string[] | null
  budget: string | null
  routinePreference: string | null
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { user } = useUser()
  const { getToken } = useAuth()
  const { signOut } = useClerk()

  const [profile, setProfile] = useState<Profile>({
    skinType: null, ageRange: null, skinConcerns: [],
    sensitivities: [], allergies: [], budget: null, routinePreference: null,
  })
  const [allergiesText, setAllergiesText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
          setAllergiesText((data.profile.allergies ?? []).join(', '))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const toggle = (field: 'skinConcerns' | 'sensitivities', value: string) => {
    setProfile((prev) => {
      const arr = prev[field] ?? []
      return { ...prev, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...profile,
          allergies: allergiesText ? allergiesText.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      Alert.alert('Saved', 'Your profile has been updated.')
    } catch {
      Alert.alert('Error', 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Name</Text>
            <Text style={styles.accountValue}>{user?.fullName ?? '—'}</Text>
          </View>
          <View style={[styles.accountRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{user?.primaryEmailAddress?.emailAddress ?? '—'}</Text>
          </View>
        </View>

        {/* Skin Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skin Profile</Text>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} />
          ) : (
            <>
              <Text style={styles.fieldLabel}>Age Range</Text>
              <View style={styles.chipRow}>
                {AGE_RANGES.map((a) => (
                  <Chip key={a} label={a} selected={profile.ageRange === a} onPress={() => setProfile((p) => ({ ...p, ageRange: a }))} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Skin Type</Text>
              <View style={styles.chipRow}>
                {SKIN_TYPES.map((t) => (
                  <Chip key={t} label={t} selected={profile.skinType === t} onPress={() => setProfile((p) => ({ ...p, skinType: t }))} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Skin Concerns</Text>
              <View style={styles.chipRow}>
                {CONCERNS.map((c) => (
                  <Chip key={c} label={c} selected={(profile.skinConcerns ?? []).includes(c)} onPress={() => toggle('skinConcerns', c)} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Sensitivities</Text>
              <View style={styles.chipRow}>
                {SENSITIVITIES.map((s) => (
                  <Chip key={s} label={s} selected={(profile.sensitivities ?? []).includes(s)} onPress={() => toggle('sensitivities', s)} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Known Allergies (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. benzoyl peroxide, retinol…"
                placeholderTextColor={COLORS.textFaint}
                value={allergiesText}
                onChangeText={setAllergiesText}
              />

              <Text style={styles.fieldLabel}>Budget</Text>
              <View style={styles.chipRow}>
                {BUDGETS.map((b) => (
                  <Chip key={b.value} label={b.label} selected={profile.budget === b.value} onPress={() => setProfile((p) => ({ ...p, budget: b.value }))} />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Routine Preference</Text>
              <View style={styles.chipRow}>
                {ROUTINES.map((r) => (
                  <Chip key={r.value} label={r.label} selected={profile.routinePreference === r.value} onPress={() => setProfile((p) => ({ ...p, routinePreference: r.value }))} />
                ))}
              </View>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving || loading}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold' },
  section: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.card, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '600', marginBottom: 14 },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  accountLabel: { color: COLORS.textMuted, fontSize: 14 },
  accountValue: { color: COLORS.text, fontSize: 14 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  chipText: { color: COLORS.textMuted, fontSize: 13 },
  chipTextSelected: { color: '#fff' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14,
  },
  saveBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 14, paddingVertical: 14,
  },
  signOutText: { color: COLORS.danger, fontSize: 15, fontWeight: '500' },
})
