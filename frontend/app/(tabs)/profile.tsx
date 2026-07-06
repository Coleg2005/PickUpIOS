import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import AppButton from '@/components/AppButton';
import FriendsList from '@/components/FriendsList';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize, FontWeight } from '@/constants/Theme';

import { logout } from '@/utils/auth';
import { getUser, updateProfile, uploadPfp, getPfp, getFriends, getFriendInviteUrl } from '@/utils/api';

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
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?._id) {
            const res = await getUser(decoded._id);
            setUser(res.user);
            setPfpUrl(getPfp(decoded._id));
          }
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [refresh]);

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      let isActive = true;
      const fetchFriends = async () => {
        try {
          const res = await getFriends(user._id);
          if (isActive) setFriends(res || []);
        } catch {}
      };
      fetchFriends();
      return () => { isActive = false; };
    }, [user, refresh])
  );

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSave = () => {
    updateProfile(description);
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
      quality: 0.7,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await uploadPfp(uri);
      setPfpUrl(getPfp(user._id) + '?t=' + Date.now());
    }
    setRefresh(!refresh);
  };

  // Opens the share sheet (Messages, etc.) with a link to this user's profile
  const handleInviteFriend = async () => {
    if (!user?._id) return;
    try {
      await Share.share({
        message: `Add me on PickUp so we can play together! ${getFriendInviteUrl(user._id)}`,
      });
    } catch {}
  };

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg }}>

        {/* Avatar + username */}
        <View style={{ alignItems: 'center', gap: Spacing.sm }}>
          <TouchableOpacity onPress={addProfilePic} activeOpacity={0.8}>
            <Avatar username={user?.username} imageUri={pfpUrl} size={96} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: primary, borderRadius: Radius.full, padding: 6, borderWidth: 2, borderColor: backgroundColor }}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor }}>
            {user?.username || 'Username'}
          </Text>

          <TouchableOpacity onPress={() => setFriendsVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Ionicons name="people-outline" size={18} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.sm, color: subtext }}>
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            About
          </Text>
          {editing ? (
            <>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={{ borderWidth: 1, borderColor: cardBorder, borderRadius: Radius.md, padding: Spacing.sm, color: textColor, minHeight: 80, marginBottom: Spacing.sm, fontFamily: 'DMSans_400Regular', fontSize: FontSize.md }}
                multiline
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <AppButton title="Save" onPress={handleSave} style={{ flex: 1 }} />
                <AppButton title="Cancel" onPress={handleCancel} variant="secondary" style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <TouchableOpacity onPress={() => { setDescription(user?.profile?.description || ''); setEditing(true); }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: user?.profile?.description ? textColor : subtext, minHeight: 40 }}>
                {user?.profile?.description || 'Tap to add a description...'}
              </Text>
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.sm, color: primary, marginTop: Spacing.sm }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: Spacing.sm }}>
          {(user?.role === 'moderator' || user?.role === 'admin') && (
            <AppButton title="Moderation" onPress={() => router.push('/(tabs)/pages/moderation' as any)} />
          )}
          <AppButton title="Invite a Friend" onPress={handleInviteFriend} />
          <AppButton title="Log Out" onPress={handleLogout} variant="secondary" />
        </View>

      </ScrollView>

      {user && friendsVisible && (
        <FriendsList userid={user._id} onClose={() => setFriendsVisible(false)} />
      )}

    </View>
  );
}
