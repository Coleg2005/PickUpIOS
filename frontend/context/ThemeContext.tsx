import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '@/constants/Colors';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'themePreference';

const ThemePreferenceContext = createContext<{
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colorScheme: 'light' | 'dark';
} | null>(null);

export const ThemePreferenceProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useSystemColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  // Dip-to-background fade: cover the screen in the target theme's background
  // color, swap the theme while hidden, then fade back out.
  const fade = useRef(new Animated.Value(0)).current;
  const [overlayColor, setOverlayColor] = useState(Colors.light.background);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {});
  }, []);

  const colorScheme = preference === 'system' ? systemScheme : preference;

  const setPreference = (p: ThemePreference) => {
    if (p === preference) return;
    SecureStore.setItemAsync(STORAGE_KEY, p).catch(() => {});

    const targetScheme = p === 'system' ? systemScheme : p;
    if (targetScheme === colorScheme) {
      // No visual change (e.g. system is already dark and user picks dark)
      setPreferenceState(p);
      return;
    }

    setOverlayColor(Colors[targetScheme].background);
    Animated.timing(fade, { toValue: 1, duration: 150, useNativeDriver: true }).start(() => {
      setPreferenceState(p);
      Animated.timing(fade, { toValue: 0, duration: 300, delay: 50, useNativeDriver: true }).start();
    });
  };

  const value = React.useMemo(
    () => ({ preference, setPreference, colorScheme }),
    [preference, colorScheme]
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: overlayColor, opacity: fade, zIndex: 9999, elevation: 9999 },
        ]}
      />
    </ThemePreferenceContext.Provider>
  );
};

export const useThemePreference = () => {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
};

// Drop-in replacement for react-native's useColorScheme that respects the
// user's saved preference. Falls back to the system scheme when rendered
// outside the provider.
export const useOverriddenColorScheme = () => {
  const ctx = useContext(ThemePreferenceContext);
  const system = useSystemColorScheme();
  return ctx ? ctx.colorScheme : system;
};
