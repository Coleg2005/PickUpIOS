import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function BlurTabBarBackground() {
  // Follow the app's resolved theme (which may override the system
  // appearance) rather than systemChromeMaterial, which only tracks
  // the phone's setting.
  const colorScheme = useColorScheme();
  return (
    <BlurView
      tint={colorScheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  return useBottomTabBarHeight();
}
