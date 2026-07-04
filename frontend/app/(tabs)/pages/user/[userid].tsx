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
import { getUser, requestFriend, removeFriend, getPfp, getNotifications, blockUser, unblockUser } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

export default function UserProfile() {
  const { userid } = useLocalSearchParams();
  const [visitedUser, setVisitedUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isPending, setIsPending] = useState(false);
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
          const res = await getUser(Array.isArray(userid) ? userid[0] : userid);
          setVisitedUser(res.user);
        } catch {}
        finally { setLoading(false); }
      };
      load();
    }, [userid])
  );

  useEffect(() => {
    if (!user || !visitedUser) return;
    const friendIds = user.friends?.map((f: any) => f._id || f) || [];
    setIsFriend(friendIds.includes(visitedUser._id));
    const blockedIds = user.blockedUsers?.map((b: any) => b._id || b) || [];
    setIsBlocked(blockedIds.includes(visitedUser._id));
    const checkPending = async () => {
      const notifs = await getNotifications(user._id);
      setIsPending(notifs.some((n: any) => n.type === 'friend-request' && n.object?._id === visitedUser._id));
    };
    checkPending();
  }, [user, visitedUser]);

  const handleRequest = async () => {
    await requestFriend(Array.isArray(userid) ? userid[0] : userid);
    setIsPending(true);
  };

  const handleRemove = async () => {
    await removeFriend(Array.isArray(userid) ? userid[0] : userid);
    setIsFriend(false);
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
              setIsFriend(false);
              setIsPending(false);
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
        ) : isFriend ? (
          <AppButton title="Remove Friend" onPress={handleRemove} variant="secondary" />
        ) : isPending ? (
          <AppButton title="Request Sent" onPress={() => {}} variant="secondary" disabled />
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
