import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '@/app/(tabs)/_layout';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import { getUser } from '@/utils/api';

const Header = () => {
  const colorScheme = useColorScheme();
  const { showSettings } = useSettings();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?._id) {
            const res = await getUser(decoded._id)
            setUsername(res.user.username);
          }
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

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

      <TouchableOpacity onPress={showSettings}>
        <Ionicons name="settings-outline" size={28} color={Colors[colorScheme ?? 'light'].text} />
      </TouchableOpacity>
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