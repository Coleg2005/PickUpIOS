import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import AppButton from '@/components/AppButton';
import ReportModal from '@/components/ReportModal';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

import { useLocalSearchParams } from 'expo-router';
import { getUser, requestFriend, acceptFriend, removeFriend, getPfp, getFriendStatus, blockUser, unblockUser, type FriendStatus } from '@/utils/api';
import { useFocusEffect } from "expo-router/react-navigation";
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

export default function UserProfile() {
  const { userid } = useLocalSearchParams();
  const [visitedUser, setVisitedUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none');
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  useEffect(() => {
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
      } catch {}
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        try {
          const id = Array.isArray(userid) ? userid[0] : userid;
          const [res, friendship] = await Promise.all([getUser(id), getFriendStatus(id)]);
          setVisitedUser(res.user);
          setFriendStatus(friendship?.status ?? 'none');
        } catch {}
        finally { setLoading(false); }
      };
      load();
    }, [userid])
  );

  useEffect(() => {
    if (!user || !visitedUser) return;
    const blockedIds = user.blockedUsers?.map((b: any) => b._id || b) || [];
    setIsBlocked(blockedIds.includes(visitedUser._id));
  }, [user, visitedUser]);

  const handleRequest = async () => {
    const res = await requestFriend(Array.isArray(userid) ? userid[0] : userid);
    if (res) setFriendStatus('outgoing');
  };

  const handleAccept = async () => {
    const res = await acceptFriend(Array.isArray(userid) ? userid[0] : userid);
    if (res) setFriendStatus('friends');
  };

  const handleRemove = async () => {
    const res = await removeFriend(Array.isArray(userid) ? userid[0] : userid);
    if (res) setFriendStatus('none');
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Block ${visitedUser?.username}? They will be removed from your friends and you won't see their messages.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            const res = await blockUser(Array.isArray(userid) ? userid[0] : (userid as string));
            if (res) {
              setIsBlocked(true);
              setFriendStatus('none');
            }
          },
        },
      ]
    );
  };

  const handleUnblock = async () => {
    const res = await unblockUser(Array.isArray(userid) ? userid[0] : (userid as string));
    if (res) setIsBlocked(false);
  };

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
          <Avatar username={visitedUser?.username} imageUri={visitedUser?.profile?.picture ? getPfp(visitedUser._id) : null} size={96} />
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor }}>
            {visitedUser?.username || 'User'}
          </Text>
        </View>

        {/* Friend button (hidden while blocked) */}
        {isBlocked ? (
          <AppButton title="Unblock" onPress={handleUnblock} variant="secondary" />
        ) : friendStatus === 'friends' ? (
          <AppButton title="Remove Friend" onPress={handleRemove} variant="secondary" />
        ) : friendStatus === 'outgoing' ? (
          <AppButton title="Request Sent" onPress={() => {}} variant="secondary" disabled />
        ) : friendStatus === 'incoming' ? (
          <AppButton title="Accept Request" onPress={handleAccept} />
        ) : (
          <AppButton title="Add Friend" onPress={handleRequest} />
        )}

        {/* Report / Block actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl }}>
          <TouchableOpacity onPress={() => setReportVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            <Ionicons name="flag-outline" size={16} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.sm, color: subtext }}>Report</Text>
          </TouchableOpacity>
          {!isBlocked && (
            <TouchableOpacity onPress={handleBlock} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Ionicons name="ban-outline" size={16} color={subtext} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.sm, color: subtext }}>Block</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Description */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            About
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: visitedUser?.profile?.description ? textColor : subtext }}>
            {visitedUser?.profile?.description || 'No description yet.'}
          </Text>
        </View>

      </ScrollView>

      {visitedUser && (
        <ReportModal
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          contentType="user"
          reportedUser={visitedUser._id}
          targetName={visitedUser.username}
        />
      )}
    </View>
  );
}
