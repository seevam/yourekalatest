'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

// ─── Step data ────────────────────────────────────────────────────────────────

const AGE_RANGES = ['Under 13', '13–17', '18–24', '25–34', '35+']

const SKIN_TYPES = [
  { value: 'oily', label: 'Oily', description: 'Shiny, prone to breakouts' },
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, needs moisture' },
  { value: 'combination', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
  { value: 'sensitive', label: 'Sensitive', description: 'Easily irritated or red' },
]

const SKIN_CONCERNS = [
  'Acne & breakouts',
  'Blackheads & pores',
  'Oiliness',
  'Dryness',
  'Redness',
  'Dark spots',
  'Uneven skin tone',
  'Dullness',
  'Fine lines',
  'Under-eye circles',
]

const SENSITIVITIES = [
  'Fragrance',
  'Alcohol',
  'Essential oils',
  'Dyes / colorants',
  'Latex',
  'None',
]

const BUDGETS = [
  { value: 'low', label: 'Budget-friendly', description: 'Under $15 per product' },
  { value: 'medium', label: 'Mid-range', description: '$15 – $40 per product' },
  { value: 'high', label: 'Premium', description: '$40+ per product' },
]

const ROUTINES = [
  { value: 'minimal', label: 'Minimal', description: '2–3 steps, keep it simple' },
  { value: 'moderate', label: 'Moderate', description: '4–6 steps, balanced' },
  { value: 'extensive', label: 'Extensive', description: '7+ steps, full routine' },
]

const STEPS = [
  'Age Range',
  'Skin Type',
  'Skin Concerns',
  'Sensitivities & Allergies',
  'Budget & Routine',
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    ageRange: '',
    skinType: '',
    skinConcerns: [] as string[],
    sensitivities: [] as string[],
    allergies: '',
    budget: '',
    routinePreference: '',
  })

  const toggle = (field: 'skinConcerns' | 'sensitivities', value: string) => {
    setForm((prev) => {
      const arr = prev[field]
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
  }

  const canAdvance = () => {
    if (step === 0) return !!form.ageRange
    if (step === 1) return !!form.skinType
    if (step === 2) return form.skinConcerns.length > 0
    if (step === 3) return true // optional
    if (step === 4) return !!form.budget && !!form.routinePreference
    return true
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageRange: form.ageRange,
          skinType: form.skinType,
          skinConcerns: form.skinConcerns,
          sensitivities: form.sensitivities,
          allergies: form.allergies ? [form.allergies] : [],
          budget: form.budget,
          routinePreference: form.routinePreference,
        }),
      })

      if (!res.ok) throw new Error('Failed to save profile')

      // Generate initial matches
      await fetch('/api/matches/generate', { method: 'POST' })

      router.push('/matches')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8">

          {/* Step 0 — Age Range */}
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">How old are you?</h2>
              <p className="text-white/50 mb-6 text-sm">Helps us tailor recommendations for your skin stage.</p>
              <div className="grid grid-cols-2 gap-3">
                {AGE_RANGES.map((age) => (
                  <button
                    key={age}
                    onClick={() => setForm((f) => ({ ...f, ageRange: age }))}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      form.ageRange === age
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Skin Type */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What's your skin type?</h2>
              <p className="text-white/50 mb-6 text-sm">Pick the one that best describes your skin.</p>
              <div className="space-y-3">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setForm((f) => ({ ...f, skinType: type.value }))}
                    className={`w-full flex items-center gap-4 py-4 px-5 rounded-xl border text-left transition-all ${
                      form.skinType === type.value
                        ? 'bg-violet-600 border-violet-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">{type.label}</p>
                      <p className={`text-xs mt-0.5 ${form.skinType === type.value ? 'text-violet-200' : 'text-white/40'}`}>
                        {type.description}
                      </p>
                    </div>
                    {form.skinType === type.value && <Check size={16} className="text-white flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 — Skin Concerns */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">What are your skin concerns?</h2>
              <p className="text-white/50 mb-6 text-sm">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {SKIN_CONCERNS.map((concern) => (
                  <button
                    key={concern}
                    onClick={() => toggle('skinConcerns', concern)}
                    className={`py-2 px-4 rounded-full border text-sm transition-all ${
                      form.skinConcerns.includes(concern)
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {concern}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Sensitivities & Allergies */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Any sensitivities or allergies?</h2>
              <p className="text-white/50 mb-6 text-sm">We'll avoid recommending products with these ingredients.</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {SENSITIVITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggle('sensitivities', s)}
                    className={`py-2 px-4 rounded-full border text-sm transition-all ${
                      form.sensitivities.includes(s)
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="block text-sm text-white/50 mb-2">
                Any other allergies? (optional)
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                placeholder="e.g. benzoyl peroxide, retinol…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          )}

          {/* Step 4 — Budget & Routine */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Budget & routine style</h2>
              <p className="text-white/50 mb-6 text-sm">Help us find products that fit your lifestyle.</p>

              <p className="text-sm text-white/60 mb-3 font-medium">Budget per product</p>
              <div className="space-y-2 mb-6">
                {BUDGETS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setForm((f) => ({ ...f, budget: b.value }))}
                    className={`w-full flex items-center gap-4 py-3 px-5 rounded-xl border text-left transition-all ${
                      form.budget === b.value
                        ? 'bg-violet-600 border-violet-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{b.label}</p>
                      <p className={`text-xs ${form.budget === b.value ? 'text-violet-200' : 'text-white/40'}`}>
                        {b.description}
                      </p>
                    </div>
                    {form.budget === b.value && <Check size={16} className="text-white flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <p className="text-sm text-white/60 mb-3 font-medium">Routine preference</p>
              <div className="space-y-2">
                {ROUTINES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setForm((f) => ({ ...f, routinePreference: r.value }))}
                    className={`w-full flex items-center gap-4 py-3 px-5 rounded-xl border text-left transition-all ${
                      form.routinePreference === r.value
                        ? 'bg-violet-600 border-violet-500'
                        : 'bg-white/5 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{r.label}</p>
                      <p className={`text-xs ${form.routinePreference === r.value ? 'text-violet-200' : 'text-white/40'}`}>
                        {r.description}
                      </p>
                    </div>
                    {form.routinePreference === r.value && <Check size={16} className="text-white flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canAdvance()}
              >
                Continue <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance() || saving}
              >
                {saving ? 'Saving…' : 'See my matches'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
