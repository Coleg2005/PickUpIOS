import { Stack, useRouter, useSegments } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { registerForPushNotificationsAsync } from '@/utils/notifications';
import { registerPushToken } from '@/utils/api';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  useEffect(() => {
    const checkLogin = async () => {
      const token = await SecureStore.getItemAsync('token');
      const isAuthRoute = segments[0] === '(auth)';
      if (!token && !isAuthRoute) router.replace('/(auth)/login' as any);
    };
    checkLogin();
  }, [segments, router]);

  useEffect(() => {
    const setupPushNotifications = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      const decoded: any = jwtDecode(token);
      if (!decoded?._id) return;

      const pushToken = await registerForPushNotificationsAsync();
      if (!pushToken) return;

      const storedPushToken = await SecureStore.getItemAsync('pushToken');
      if (storedPushToken === pushToken) return;

      await registerPushToken(pushToken);
      await SecureStore.setItemAsync('pushToken', pushToken);
    };
    setupPushNotifications();
  }, [segments]);

  const colorScheme = useColorScheme();

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
