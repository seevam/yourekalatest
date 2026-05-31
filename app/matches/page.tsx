'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { ExternalLink, Sparkles, RefreshCw } from 'lucide-react'

interface Match {
  matchId: number
  matchScore: number
  matchReason: string
  createdAt: string
  product: {
    id: number
    name: string
    brand: string
    category: string
    price: string | null
    imageUrl: string | null
    buyLink: string | null
    skinTypeMatch: string[] | null
    concernsTargeted: string[] | null
    isFragranceFree: boolean | null
    isVegan: boolean | null
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  serum: 'bg-violet-500/20 text-violet-300',
  moisturizer: 'bg-sky-500/20 text-sky-300',
  cleanser: 'bg-emerald-500/20 text-emerald-300',
  toner: 'bg-amber-500/20 text-amber-300',
  spf: 'bg-rose-500/20 text-rose-300',
  treatment: 'bg-pink-500/20 text-pink-300',
}

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [empty, setEmpty] = useState(false)

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/matches')
      if (res.status === 404) { router.push('/onboarding'); return }
      const data: Match[] = await res.json()
      setMatches(data)
      setEmpty(data.length === 0)
    } finally {
      setLoading(false)
    }
  }

  const regenerate = async () => {
    setRegenerating(true)
    await fetch('/api/matches/generate', { method: 'POST' })
    await fetchMatches()
    setRegenerating(false)
  }

  useEffect(() => { fetchMatches() }, [])

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-16">
      <Container>
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-400 text-sm font-medium mb-2">
              <Sparkles size={14} /> Your Personalized Matches
            </div>
            <h1 className="text-3xl font-bold text-white">Product Matches</h1>
            <p className="text-white/50 text-sm mt-1">Ranked by compatibility with your skin profile</p>
          </div>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-900 border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                <div className="h-6 bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-4 bg-white/10 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && empty && (
          <div className="text-center py-20">
            <p className="text-white/40 mb-4">No matches yet.</p>
            <button
              onClick={regenerate}
              className="text-violet-400 hover:text-violet-300 text-sm underline"
            >
              Generate matches now
            </button>
          </div>
        )}

        {/* Matches grid */}
        {!loading && !empty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div
                key={m.matchId}
                className="group relative bg-gray-900 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
              >
                {/* Score badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full"
                      style={{ width: `${m.matchScore}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{m.matchScore}%</span>
                </div>

                {/* Category chip */}
                <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 ${CATEGORY_COLORS[m.product.category] ?? 'bg-white/10 text-white/50'}`}>
                  {m.product.category}
                </span>

                <h3 className="text-white font-semibold text-base leading-snug">
                  {m.product.name}
                </h3>
                <p className="text-white/40 text-sm mb-3">{m.product.brand}</p>

                <p className="text-white/60 text-xs leading-relaxed mb-4">{m.matchReason}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {m.product.price && (
                      <span className="text-white font-medium text-sm">
                        ${parseFloat(m.product.price).toFixed(2)}
                      </span>
                    )}
                    {m.product.isFragranceFree && (
                      <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                        Fragrance-free
                      </span>
                    )}
                    {m.product.isVegan && (
                      <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">
                        Vegan
                      </span>
                    )}
                  </div>
                  {m.product.buyLink && (
                    <a
                      href={m.product.buyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Buy <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
