import { Stack } from 'expo-router';

export default function HomeTabStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Or false if you want no headers
      }}
    />
  );
}