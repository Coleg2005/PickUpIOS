import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/app/(tabs)/_layout';
import { Colors } from '@/constants/Colors';
import { FontSize, FontWeight, Spacing } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { getUser, getNotifications } from '@/utils/api';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { showSettings } = useSettings();
  const [username, setUsername] = useState<string | null>(null);
  const [hasNotif, setHasNotif] = useState<boolean>(false);
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadUser = async () => {
        try {
          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            if (decoded?._id) {
              const res = await getUser(decoded._id);
              if (isActive) setUsername(res.user.username);
              const notifs = await getNotifications(res.user._id);
              if (isActive) setHasNotif(notifs.length > 0);
            }
          }
        } catch {}
      };
      loadUser();
      return () => { isActive = false; };
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.cardBorder }]}>
      <Text style={[styles.logo, { color: colors.primary, fontFamily: 'DMSans_700Bold' }]}>
        PickUp
      </Text>

      <Text numberOfLines={1} style={[styles.username, { color: colors.text, fontFamily: 'DMSans_600SemiBold' }]}>
        {username ?? ''}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/pages/inbox')} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.icon} />
          {hasNotif && (
            <View style={[styles.badge, { borderColor: colors.surface, backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={showSettings} style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    width: 80,
  },
  username: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    width: 80,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});

export default Header;
