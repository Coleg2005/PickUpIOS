import React, {useState, useEffect} from 'react';
import { View, Text, Button, Alert, TextInput, Image, TouchableOpacity } from 'react-native';


import Header from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import FriendsList from '@/components/FriendsList';
import { useThemeColor } from '@/hooks/useThemeColor';

import { logout } from '@/utils/auth';
import { getUser, updateProfile, uploadPfp, getPfp } from '@/utils/api';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { jwtDecode } from 'jwt-decode';


export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [friendsVisible, setFriendsVisible] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?._id) {
            const res = await getUser(decoded._id);
            setUser(res.user);
            // Fetch profile picture URL from backend
            const url = getPfp(decoded._id);
            setPfpUrl(url);
          }
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, [refresh]);


  const handleLogout = async () => {
    await logout();
    Alert.alert('Logged out');
    router.replace('/(auth)/login');
  };

  const handleEdit = () => setEditing(true);
  const handleSave = () => {
    updateProfile(description, user._id);
    setEditing(false);
    if (user) setUser({ ...user, profile: { ...user.profile, description } });
  };
  const handleCancel = () => {
    setEditing(false);
    setDescription(user?.profile?.description || '');
  };

  const addProfilePic = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: .7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // Optimistically update local state
      setUser((prev: any) => prev ? { ...prev, profile: { ...prev.profile, picture: uri } } : prev);
      // Upload and then fetch the new profile picture URL
      await uploadPfp(user._id, uri);
      setPfpUrl(getPfp(user._id) + '?t=' + Date.now());
    }
    setRefresh(!refresh);
  };

  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'cardBorder');
  const tint = useThemeColor({}, 'tint')

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      >
        <Header />
        <View style={{ padding: 16, alignItems: 'center' }}>

          {/* Profile Picture */}
          <View style={{ marginBottom: 16 }}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => {addProfilePic()}}>
              <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: cardBackgroundColor }}>
                    {pfpUrl ? (
                      <Image
                        source={{ uri: pfpUrl }}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={{ textAlign: 'center', lineHeight: 100, color: '#aaa', fontSize: 40 }}>
                        {user?.username?.[0]?.toUpperCase() || '?'}
                      </Text>
                    )}
                  </View>
            </TouchableOpacity>
          </View>

          {/* Username */}
          <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{user?.username || 'Username'}</Text>

          {/* Friends Button */}
          <View style={{ marginBottom: 12 }}>
            <TouchableOpacity onPress={() => {setFriendsVisible(true)}} activeOpacity={0.7}>
              <IconSymbol size={28} name="person" color={tint} />
            </TouchableOpacity>
          </View>
          

          {/* Description */}
          <View style={{ width: '100%', marginBottom: 16 }}>
            <Text style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Description:</Text>
            {editing ? (
              <>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  style={{ borderWidth: 1, borderColor: borderColor, borderRadius: 8, padding: 8, color: textColor, minHeight: 60, marginBottom: 8 }}
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
      {}
      {user && friendsVisible && (
        <FriendsList
          userid={user._id}
          onClose={(() => {setFriendsVisible(false)})}
        />
      )}
    </View>
  );
}
