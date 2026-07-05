import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Image,
} from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { useAuth } from '@clerk/clerk-expo'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '@/lib/constants'
import { API_BASE_URL } from '@/lib/api'

interface ScanAnalysis {
  skinType: string
  concerns: string[]
  hydrationLevel: string
  oilinessLevel: string
  overallScore: number
  summary: string
  recommendations: string[]
}

export default function ScanScreen() {
  const router = useRouter()
  const { getToken } = useAuth()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)

  const [mode, setMode] = useState<'camera' | 'preview' | 'analyzing' | 'result'>('camera')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ScanAnalysis | null>(null)
  const [facing, setFacing] = useState<CameraType>('front')

  const takePhoto = async () => {
    if (!cameraRef.current) return
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false })
    if (photo) {
      setImageUri(photo.uri)
      setMode('preview')
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      setMode('preview')
    }
  }

  const analyzeImage = async () => {
    if (!imageUri) return
    setMode('analyzing')
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const token = await getToken()
      const res = await fetch(`${API_BASE_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64, mediaType: 'image/jpeg' }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAnalysis(data.analysis)
      setMode('result')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed'
      Alert.alert('Error', msg)
      setMode('preview')
    }
  }

  const reset = () => {
    setImageUri(null)
    setAnalysis(null)
    setMode('camera')
  }

  if (!permission) return <View style={styles.container} />

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="camera-outline" size={48} color={COLORS.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionDesc}>We need camera access for AI skin scans.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (mode === 'result' && analysis) {
    const scoreColor = analysis.overallScore >= 75 ? COLORS.success : analysis.overallScore >= 50 ? COLORS.warning : COLORS.danger
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.resultHeader}>
          <Text style={styles.pageTitle}>Scan Results</Text>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.resultImage} />
        )}

        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{analysis.overallScore}</Text>
          <View style={styles.scoreBarBg}>
            <View style={[styles.scoreBarFill, { width: `${analysis.overallScore}%` as `${number}%`, backgroundColor: scoreColor }]} />
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            { label: 'Skin Type', value: analysis.skinType },
            { label: 'Hydration', value: analysis.hydrationLevel },
            { label: 'Oiliness', value: analysis.oilinessLevel },
          ].map((item) => (
            <View key={item.label} style={styles.infoCard}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </View>

        {analysis.concerns.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Concerns</Text>
            <View style={styles.chipRow}>
              {analysis.concerns.map((c) => (
                <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
              ))}
            </View>
          </View>
        )}

        {analysis.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analysis.recommendations.map((r, i) => (
              <View key={i} style={styles.recRow}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
            <Text style={styles.btnSecondaryText}>Scan Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/matches')}>
            <Text style={styles.btnText}>View Matches</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  if (mode === 'analyzing') {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.permissionTitle, { marginTop: 20 }]}>Analyzing your skin…</Text>
        <Text style={styles.permissionDesc}>Our AI is examining your photo</Text>
      </View>
    )
  }

  if (mode === 'preview' && imageUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
            <Text style={styles.btnSecondaryText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={analyzeImage}>
            <Text style={styles.btnText}>Analyze Skin</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <Text style={styles.pageTitle}>Skin Scan</Text>
            <TouchableOpacity
              onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
              style={styles.flipBtn}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.faceFrame} />

          <Text style={styles.cameraHint}>Position your face in the frame</Text>

          <View style={styles.cameraActions}>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
            <View style={{ width: 52 }} />
          </View>
        </View>
      </CameraView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 24 },
  cameraHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40 },
  pageTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  flipBtn: { padding: 8 },
  faceFrame: {
    width: 200, height: 240, borderRadius: 100,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    alignSelf: 'center',
  },
  cameraHint: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 14 },
  cameraActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 20 },
  galleryBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', padding: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', borderWidth: 2, borderColor: '#ccc' },
  preview: { flex: 1 },
  previewActions: { flexDirection: 'row', gap: 12, padding: 20, backgroundColor: COLORS.bg },
  permissionTitle: { color: COLORS.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 16 },
  permissionDesc: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  btn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnSecondary: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  resultHeader: { paddingHorizontal: 0 },
  resultImage: { width: '100%', height: 200, borderRadius: 0 },
  scoreCard: { margin: 16, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  scoreLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  scoreValue: { fontSize: 48, fontWeight: 'bold', marginBottom: 12 },
  scoreBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  infoGrid: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 4 },
  infoCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  infoLabel: { color: COLORS.textFaint, fontSize: 11, marginBottom: 4 },
  infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  section: { marginHorizontal: 16, marginTop: 16, backgroundColor: COLORS.card, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  summaryText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 21 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { color: COLORS.textMuted, fontSize: 12, textTransform: 'capitalize' },
  recRow: { flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'flex-start' },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 6 },
  recText: { flex: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  resultActions: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 20 },
})
