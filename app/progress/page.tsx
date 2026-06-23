'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { TrendingUp, Camera, ArrowRight } from 'lucide-react'

interface ScanAnalysis {
  skinType: string
  concerns: string[]
  hydrationLevel: string
  oilinessLevel: string
  overallScore: number
  summary: string
}

interface Scan {
  id: number
  createdAt: string
  analysis: ScanAnalysis
}

const SCORE_COLOR = (s: number) =>
  s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-rose-400'

const SCORE_BAR = (s: number) =>
  s >= 75 ? 'from-emerald-500 to-teal-400' : s >= 50 ? 'from-amber-500 to-yellow-400' : 'from-rose-500 to-pink-400'

function ScoreChange({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous
  if (diff === 0) return <span className="text-white/30 text-xs">—</span>
  return (
    <span className={`text-xs font-medium ${diff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
      {diff > 0 ? '+' : ''}{diff}
    </span>
  )
}

export default function ProgressPage() {
  const router = useRouter()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scan')
      .then((r) => r.json())
      .then((data: Scan[]) => setScans(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  const latest = scans[0]
  const avgScore = scans.length
    ? Math.round(scans.reduce((acc, s) => acc + s.analysis.overallScore, 0) / scans.length)
    : null

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-16">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
              <TrendingUp size={14} /> Skin Journey
            </div>
            <h1 className="text-3xl font-bold text-white">Track Progress</h1>
            <p className="text-white/50 text-sm mt-1">Your skin score history over time</p>
          </div>

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-900 border border-white/10 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-2 bg-white/10 rounded w-full" />
                </div>
              ))}
            </div>
          )}

          {!loading && scans.length === 0 && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-12 text-center">
              <Camera size={40} className="text-white/20 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No scans yet</h3>
              <p className="text-white/40 text-sm mb-6">
                Take your first AI skin scan to start tracking your progress.
              </p>
              <button
                onClick={() => router.push('/scan')}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                <Camera size={16} /> Take Your First Scan
              </button>
            </div>
          )}

          {!loading && scans.length > 0 && (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Total Scans</p>
                  <p className="text-white text-2xl font-bold">{scans.length}</p>
                </div>
                <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Latest Score</p>
                  <p className={`text-2xl font-bold ${SCORE_COLOR(latest.analysis.overallScore)}`}>
                    {latest.analysis.overallScore}
                  </p>
                </div>
                <div className="bg-gray-900 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-white/40 text-xs mb-1">Average</p>
                  <p className="text-white text-2xl font-bold">{avgScore}</p>
                </div>
              </div>

              {/* Score timeline chart */}
              {scans.length > 1 && (
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-4">
                  <h3 className="text-white/60 text-xs font-medium mb-4">Score Over Time</h3>
                  <div className="flex items-end gap-2 h-24">
                    {[...scans].reverse().map((scan, i) => {
                      const height = `${scan.analysis.overallScore}%`
                      return (
                        <div key={scan.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-white/30 text-xs">{scan.analysis.overallScore}</span>
                          <div className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-pink-500 transition-all" style={{ height }} />
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-white/20 text-xs mt-2">
                    <span>Oldest</span>
                    <span>Latest</span>
                  </div>
                </div>
              )}

              {/* Scan history list */}
              <div className="space-y-3">
                {scans.map((scan, i) => (
                  <div key={scan.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white/40 text-xs">
                          {new Date(scan.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </p>
                        <p className="text-white text-sm font-medium capitalize mt-0.5">
                          {scan.analysis.skinType} skin
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {i < scans.length - 1 && (
                          <ScoreChange
                            current={scan.analysis.overallScore}
                            previous={scans[i + 1].analysis.overallScore}
                          />
                        )}
                        <span className={`text-xl font-bold ${SCORE_COLOR(scan.analysis.overallScore)}`}>
                          {scan.analysis.overallScore}
                        </span>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${SCORE_BAR(scan.analysis.overallScore)}`}
                        style={{ width: `${scan.analysis.overallScore}%` }}
                      />
                    </div>

                    {/* Concerns */}
                    {scan.analysis.concerns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {scan.analysis.concerns.slice(0, 4).map((c) => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 capitalize">
                            {c}
                          </span>
                        ))}
                        {scan.analysis.concerns.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                            +{scan.analysis.concerns.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* New scan CTA */}
              <button
                onClick={() => router.push('/scan')}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 py-3 rounded-xl text-sm transition-colors"
              >
                <Camera size={15} /> Take a New Scan <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>
      </Container>
    </main>
  )
}
