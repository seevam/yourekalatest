'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Container } from '@/components/ui/Container'
import { Settings, User, Sparkles, Check, AlertCircle } from 'lucide-react'

interface Profile {
  skinType: string | null
  ageRange: string | null
  skinConcerns: string[] | null
  sensitivities: string[] | null
  allergies: string[] | null
  budget: string | null
  routinePreference: string | null
}

const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive']
const AGE_RANGES = ['Under 13', '13–17', '18–24', '25–34', '35+']
const BUDGETS = [
  { value: 'low', label: 'Budget-friendly (under $15)' },
  { value: 'medium', label: 'Mid-range ($15–$40)' },
  { value: 'high', label: 'Premium ($40+)' },
]
const ROUTINES = [
  { value: 'minimal', label: 'Minimal (2–3 steps)' },
  { value: 'moderate', label: 'Moderate (4–6 steps)' },
  { value: 'extensive', label: 'Extensive (7+ steps)' },
]
const CONCERNS = [
  'Acne & breakouts', 'Blackheads & pores', 'Oiliness', 'Dryness',
  'Redness', 'Dark spots', 'Uneven skin tone', 'Dullness', 'Fine lines', 'Under-eye circles',
]
const SENSITIVITIES = ['Fragrance', 'Alcohol', 'Essential oils', 'Dyes / colorants', 'Latex']

function SelectChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`py-1.5 px-3.5 rounded-full border text-sm transition-all ${
        selected
          ? 'bg-violet-600 border-violet-500 text-white'
          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
      }`}
    >
      {label}
    </button>
  )
}

function SelectCard({ value, label, selected, onClick }: { value: string; label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
        selected
          ? 'bg-violet-600 border-violet-500 text-white'
          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'
      }`}
    >
      <span className="capitalize">{label}</span>
      {selected && <Check size={14} />}
    </button>
  )
}

export default function SettingsPage() {
  const { user } = useUser()
  const [profile, setProfile] = useState<Profile>({
    skinType: null, ageRange: null, skinConcerns: [],
    sensitivities: [], allergies: [], budget: null, routinePreference: null,
  })
  const [allergiesText, setAllergiesText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile)
          setAllergiesText((data.profile.allergies ?? []).join(', '))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const toggle = (field: 'skinConcerns' | 'sensitivities', value: string) => {
    setProfile((prev) => {
      const arr = prev[field] ?? []
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          allergies: allergiesText ? allergiesText.split(',').map((s) => s.trim()).filter(Boolean) : [],
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
              <Settings size={14} /> Account Settings
            </div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>

          {/* Account info */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <User size={16} className="text-white/40" />
              <h2 className="text-white font-semibold text-sm">Account</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Name</span>
                <span className="text-white">{user?.fullName ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Email</span>
                <span className="text-white">{user?.primaryEmailAddress?.emailAddress ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Skin Profile */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-violet-400" />
              <h2 className="text-white font-semibold text-sm">Skin Profile</h2>
            </div>

            {loading ? (
              <div className="space-y-4 animate-pulse">
                {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-white/10 rounded-xl" />)}
              </div>
            ) : (
              <>
                {/* Age range */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Age Range</p>
                  <div className="flex flex-wrap gap-2">
                    {AGE_RANGES.map((age) => (
                      <SelectChip
                        key={age}
                        label={age}
                        selected={profile.ageRange === age}
                        onClick={() => setProfile((p) => ({ ...p, ageRange: age }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Skin type */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Skin Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SKIN_TYPES.map((type) => (
                      <SelectCard
                        key={type}
                        value={type}
                        label={type}
                        selected={profile.skinType === type}
                        onClick={() => setProfile((p) => ({ ...p, skinType: type }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Skin concerns */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Skin Concerns</p>
                  <div className="flex flex-wrap gap-2">
                    {CONCERNS.map((c) => (
                      <SelectChip
                        key={c}
                        label={c}
                        selected={(profile.skinConcerns ?? []).includes(c)}
                        onClick={() => toggle('skinConcerns', c)}
                      />
                    ))}
                  </div>
                </div>

                {/* Sensitivities */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Sensitivities</p>
                  <div className="flex flex-wrap gap-2">
                    {SENSITIVITIES.map((s) => (
                      <SelectChip
                        key={s}
                        label={s}
                        selected={(profile.sensitivities ?? []).includes(s)}
                        onClick={() => toggle('sensitivities', s)}
                      />
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Known Allergies (comma-separated)</p>
                  <input
                    type="text"
                    value={allergiesText}
                    onChange={(e) => setAllergiesText(e.target.value)}
                    placeholder="e.g. benzoyl peroxide, retinol…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Budget */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Budget</p>
                  <div className="space-y-2">
                    {BUDGETS.map((b) => (
                      <SelectCard
                        key={b.value}
                        value={b.value}
                        label={b.label}
                        selected={profile.budget === b.value}
                        onClick={() => setProfile((p) => ({ ...p, budget: b.value }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Routine preference */}
                <div>
                  <p className="text-white/50 text-xs mb-2 font-medium">Routine Preference</p>
                  <div className="space-y-2">
                    {ROUTINES.map((r) => (
                      <SelectCard
                        key={r.value}
                        value={r.value}
                        label={r.label}
                        selected={profile.routinePreference === r.value}
                        onClick={() => setProfile((p) => ({ ...p, routinePreference: r.value }))}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-sm mt-3">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Container>
    </main>
  )
}
