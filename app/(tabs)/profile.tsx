import React from 'react';
import { View, Text, Button, Alert, TextInput, Image } from 'react-native';

import Header from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useThemeColor } from '@/hooks/useThemeColor';

import { logout } from '@/utils/auth';

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import { getUser, updateProfile } from '@/utils/api';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [editing, setEditing] = React.useState(false);
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    // Replace with your user loading logic (e.g., SecureStore, API, or context)
    // Example: fetch user from SecureStore or API
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?._id) {
            const res = await getUser(decoded._id);
            setUser(res.user);
          }
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await logout();
    Alert.alert('Logged out');
    router.replace('/(auth)/login');
  };

  const handleEdit = () => setEditing(true);
  const handleSave = () => {
    updateProfile(description, 1, user._id);
    setEditing(false);
    if (user) setUser({ ...user, profile: { ...user.profile, description } });
  };
  const handleCancel = () => {
    setEditing(false);
    setDescription(user?.profile?.description || '');
  };

  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
    >
      <Header />
      <View style={{ padding: 16, alignItems: 'center' }}>
        {/* Profile Picture */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: cardBackgroundColor }}>
            {user?.profile?.picture ? (
              <Image
                source={{ uri: user.profile.picture }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ textAlign: 'center', lineHeight: 100, color: '#aaa', fontSize: 40 }}>
                {user?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
        </View>
        {/* Username */}
        <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{user?.username || 'Username'}</Text>
        {/* Description */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Text style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Description:</Text>
          {editing ? (
            <>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, borderRadius: 8, padding: 8, color: textColor, backgroundColor: cardBackgroundColor, minHeight: 60, marginBottom: 8 }}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button title="Save" onPress={handleSave} />
                <Button title="Cancel" color="#888" onPress={handleCancel} />
              </View>
            </>
          ) : (
            <>
              <Text style={{ color: textColor, fontSize: 16, minHeight: 60, marginBottom: 8 }}>{user?.profile?.description || 'No description set.'}</Text>
              <Button title="Edit" onPress={handleEdit} />
            </>
          )}
        </View>
        <Button title="Logout" onPress={handleLogout} color="#d9534f" />
      </View>
    </ParallaxScrollView>
  );
}
