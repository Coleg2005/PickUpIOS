import { Tabs } from 'expo-router';
import React, { useState, createContext, useContext } from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Settings from '@/components/Settings';

// Create a context for settings visibility
const SettingsContext = createContext<{
  showSettings: () => void;
  hideSettings: () => void;
} | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within the TabLayout');
  }
  return context;
};

function HomeTabBarIcon({ color }: { readonly color: string }) {
  return <IconSymbol size={28} name="house.fill" color={color} />;
}

function ParksTabBarIcon({ color }: { readonly color: string }) {
  return <IconSymbol size={28} name="soccerball" color={color} />;
}

function AboutTabBarIcon({ color }: { readonly color: string }) {
  return <IconSymbol size={28} name="info.circle" color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const showSettings = () => setSettingsVisible(true);
  const hideSettings = () => setSettingsVisible(false);

  return (
    <SettingsContext.Provider value={{ showSettings, hideSettings }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarBackground: TabBarBackground,
            tabBarStyle: Platform.select({
              ios: {
                // Use a transparent background on iOS to show the blur effect
                position: 'absolute',
              },
              default: {},
            }),
          }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: HomeTabBarIcon,
            }}
          />
          <Tabs.Screen
            name="parks"
            options={{
              title: 'Parks',
              tabBarIcon: ParksTabBarIcon,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: AboutTabBarIcon,
            }}
          />
          <Tabs.Screen
            name="pages/game/[gameid]"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="pages/location/[locationID]"
            options={{
              href: null,
            }}
          />
          <Tabs.Screen
            name="pages/user/[userid]"
            options={{
              href: null,
            }}
          />
        </Tabs>
        
        {/* Settings component rendered at layout level */}
        <Settings 
          visible={settingsVisible} 
          onClose={hideSettings} 
        />
      </View>
    </SettingsContext.Provider>
  );
}