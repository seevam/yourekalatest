'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'

interface Tip { title: string; body: string }
interface TipCategory { category: string; tips: Tip[] }

const CATEGORY_COLORS: Record<string, string> = {
  'Morning Routine': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Evening Routine': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Weekly Care': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'Ingredients to Look For': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Ingredients to Avoid': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  'Lifestyle Tips': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Your Specific Concerns': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

const DEFAULT_COLOR = 'text-slate-400 bg-slate-500/10 border-slate-500/20'

function CategoryCard({ category, tips }: TipCategory) {
  const [open, setOpen] = useState(true)
  const color = CATEGORY_COLORS[category] ?? DEFAULT_COLOR

  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>
          {category}
        </span>
        {open ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          {tips.map((tip) => (
            <div key={tip.title} className="flex gap-3">
              <div className="w-1 rounded-full bg-white/10 flex-shrink-0 mt-1" />
              <div>
                <p className="text-white text-sm font-medium mb-0.5">{tip.title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TipsPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<TipCategory[]>([])
  const [skinType, setSkinType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)

  useEffect(() => {
    fetch('/api/tips')
      .then((r) => r.json())
      .then((data) => {
        if (!data.profile) { setNoProfile(true); return }
        setSkinType(data.profile.skinType)
        setCategories(data.categories)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
              <Lightbulb size={14} /> Personalised Tips
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Beauty Tips</h1>
            {skinType && (
              <p className="text-white/50 text-sm capitalize">
                Tailored for <span className="text-white">{skinType} skin</span>
              </p>
            )}
          </div>

          {loading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-white/10 rounded-2xl p-5 animate-pulse">
                  <div className="h-6 bg-white/10 rounded-full w-32" />
                </div>
              ))}
            </div>
          )}

          {!loading && noProfile && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-10 text-center">
              <Lightbulb size={36} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-5">Complete your skin profile to get personalised tips.</p>
              <button
                onClick={() => router.push('/onboarding')}
                className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Set Up My Profile
              </button>
            </div>
          )}

          {!loading && !noProfile && (
            <div className="space-y-3">
              {categories.map((cat) => (
                <CategoryCard key={cat.category} {...cat} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}
