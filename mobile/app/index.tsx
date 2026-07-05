import { Redirect } from 'expo-router'
import { useAuth } from '@clerk/clerk-expo'
import { View, ActivityIndicator } from 'react-native'
import { COLORS } from '@/lib/constants'

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  return <Redirect href={isSignedIn ? '/(tabs)' : '/auth/sign-in'} />
}
