// app/_layout.js
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
 

export default function RootLayout() {

  useEffect(() => {
  const checkLogin = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) router.replace('/(auth)/login' as any);
    };
    checkLogin();
  }, []);

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
