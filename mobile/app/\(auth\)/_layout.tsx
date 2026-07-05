import { Stack } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { COLORS } from '@/lib/constants'

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  if (isSignedIn) return <Redirect href="/(tabs)/" />

  return <Stack screenOptions={{ headerShown: false }} />
}
