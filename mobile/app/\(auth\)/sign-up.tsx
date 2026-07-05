import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useSignUp } from '@clerk/clerk-expo'
import { COLORS, APP_NAME } from '@/lib/constants'

export default function SignUpScreen() {
  const router = useRouter()
  const { signUp, setActive, isLoaded } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [code, setCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password, firstName })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!isLoaded) return
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/onboarding')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>We sent a verification code to {email}</Text>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor={COLORS.textFaint}
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Verifying…' : 'Verify Email'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>Y</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
        </View>

        <Text style={styles.title}>Start your journey</Text>
        <Text style={styles.subtitle}>Create your free Youreka account</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor={COLORS.textFaint}
            autoCapitalize="words"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={COLORS.textFaint}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textFaint}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating account…' : 'Create Account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/auth/sign-in">
            <Text style={styles.footerLink}>Sign In</Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 },
  logoBox: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoLetter: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  appName: { color: COLORS.text, fontSize: 22, fontWeight: 'bold' },
  title: { color: COLORS.text, fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  subtitle: { color: COLORS.textMuted, fontSize: 15, marginBottom: 32 },
  form: { gap: 14 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: COLORS.text, fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primaryLight, fontSize: 14, fontWeight: '600' },
})
