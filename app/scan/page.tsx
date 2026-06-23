'use client'

import { useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Camera, Upload, RotateCcw, Sparkles, ArrowRight, AlertCircle } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScanAnalysis {
  skinType: 'oily' | 'dry' | 'combination' | 'sensitive'
  concerns: string[]
  hydrationLevel: 'low' | 'medium' | 'high'
  oilinessLevel: 'low' | 'medium' | 'high'
  overallScore: number
  summary: string
  recommendations: string[]
}

type Stage = 'capture' | 'preview' | 'analyzing' | 'results'

const SCORE_COLOR = (score: number) =>
  score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400'

const LEVEL_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScanPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<Stage>('capture')
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Camera ──────────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraActive(true)
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions or upload a photo instead.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    setCameraActive(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(dataUrl)
    stopCamera()
    setStage('preview')
  }, [stopCamera])

  // ── File upload ─────────────────────────────────────────────────────────────

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCapturedImage(reader.result as string)
      setStage('preview')
    }
    reader.readAsDataURL(file)
  }, [])

  // ── Analysis ────────────────────────────────────────────────────────────────

  const analyzePhoto = useCallback(async () => {
    if (!capturedImage) return
    setStage('analyzing')
    setError(null)

    try {
      // Extract base64 and media type from data URL
      const [header, base64] = capturedImage.split(',')
      const mediaType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error ?? 'Analysis failed')
      }

      setAnalysis(data.analysis)
      setStage('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStage('preview')
    }
  }, [capturedImage])

  const reset = useCallback(() => {
    setCapturedImage(null)
    setAnalysis(null)
    setError(null)
    setStage('capture')
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-950 pt-24 pb-16">
      <Container>
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 text-violet-400 text-sm font-medium mb-2">
              <Sparkles size={14} /> AI Skin Analysis
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Scan Your Skin</h1>
            <p className="text-white/50 text-sm">
              Take a clear, well-lit selfie and our AI will analyse your skin in seconds.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-rose-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Stage: Capture ── */}
          {stage === 'capture' && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
              {/* Camera preview */}
              <div className="relative bg-black aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  playsInline
                  muted
                />
                {!cameraActive && (
                  <div className="text-white/20 flex flex-col items-center gap-3">
                    <Camera size={48} strokeWidth={1} />
                    <span className="text-sm">Camera preview</span>
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col sm:flex-row gap-3">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 rounded-xl transition-colors"
                  >
                    <Camera size={18} /> Open Camera
                  </button>
                ) : (
                  <button
                    onClick={capturePhoto}
                    className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 rounded-xl transition-colors"
                  >
                    <Camera size={18} /> Capture Photo
                  </button>
                )}

                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-medium py-3 px-5 rounded-xl transition-colors"
                >
                  <Upload size={18} /> Upload Photo
                </button>
              </div>

              <p className="text-center text-xs text-white/30 pb-5">
                Your photo is analysed instantly and never stored
              </p>
            </div>
          )}

          {/* ── Stage: Preview ── */}
          {stage === 'preview' && capturedImage && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full aspect-video object-cover"
              />
              <div className="p-6 flex gap-3">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-3 px-5 rounded-xl transition-colors"
                >
                  <RotateCcw size={16} /> Retake
                </button>
                <button
                  onClick={analyzePhoto}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 rounded-xl transition-colors"
                >
                  <Sparkles size={18} /> Analyse My Skin
                </button>
              </div>
            </div>
          )}

          {/* ── Stage: Analyzing ── */}
          {stage === 'analyzing' && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 mb-6">
                <Sparkles size={28} className="text-violet-400 animate-pulse" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Analysing your skin…</h3>
              <p className="text-white/40 text-sm">This takes about 5–10 seconds</p>
              <div className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* ── Stage: Results ── */}
          {stage === 'results' && analysis && (
            <div className="space-y-4">
              {/* Score card */}
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-lg">Your Skin Report</h2>
                  <span className={`text-3xl font-bold ${SCORE_COLOR(analysis.overallScore)}`}>
                    {analysis.overallScore}
                    <span className="text-lg text-white/30">/100</span>
                  </span>
                </div>

                {/* Score bar */}
                <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${analysis.overallScore}%` }}
                  />
                </div>

                {/* Skin type + levels */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Skin Type', value: analysis.skinType },
                    { label: 'Hydration', value: LEVEL_LABEL[analysis.hydrationLevel] },
                    { label: 'Oiliness', value: LEVEL_LABEL[analysis.oilinessLevel] },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-white/40 text-xs mb-1">{label}</p>
                      <p className="text-white font-medium text-sm capitalize">{value}</p>
                    </div>
                  ))}
                </div>

                <p className="text-white/60 text-sm leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Concerns */}
              {analysis.concerns.length > 0 && (
                <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-3">Detected Concerns</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.concerns.map((c) => (
                      <span
                        key={c}
                        className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-400 text-xs font-medium capitalize"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-3">Recommendations</h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                      <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 py-3 px-5 rounded-xl transition-colors text-sm"
                >
                  <RotateCcw size={15} /> Scan Again
                </button>
                <button
                  onClick={() => router.push('/matches')}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 px-5 rounded-xl transition-colors text-sm"
                >
                  View My Product Matches <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Hidden elements */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </Container>
    </main>
  )
}
