import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/app/(tabs)/_layout';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { getUser, getNotifications } from '@/utils/api';
import { useRouter } from 'expo-router';

const Header = () => {
  const colorScheme = useColorScheme();
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
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      loadUser();
      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
      ]}
    >
      <Text style={{ color: Colors[colorScheme ?? 'light'].text, fontWeight: 'bold', fontSize: 20 }}>
        PickUp
      </Text>

      <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
        <Text style={{ color: Colors[colorScheme ?? 'light'].text, fontWeight: 'bold', fontSize: 20 }}>
          {username ? `${username}` : ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/pages/inbox')}>
          <Ionicons name="file-tray-outline" size={28} color={Colors[colorScheme ?? 'light'].text} />
          {hasNotif && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: 'red',
                borderWidth: 2,
                borderColor: Colors[colorScheme ?? 'light'].background,
                zIndex: 1,
              }}
            />
          )}
        </TouchableOpacity>
        <View style={{ width: 16 }} />
        <TouchableOpacity onPress={showSettings}>
          <Ionicons name="settings-outline" size={28} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
      </View>
    </View>    
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default Header;