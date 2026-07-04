import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import Avatar from '@/components/Avatar';
import { Radius, Spacing, FontSize } from '@/constants/Theme';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'expo-router';
import { getUser, getNotifications, deleteNotification, acceptFriend, addGameMember } from '@/utils/api';

const Inbox = () => {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');
  const success = useThemeColor({}, 'success');
  const danger = useThemeColor({}, 'danger');

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const load = async () => {
        setLoading(true);
        try {
          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            if (decoded?._id) {
              const res = await getUser(decoded._id);
              if (isActive) setUser(res.user);
              const notifs = await getNotifications(decoded._id);
              if (isActive) setNotifications(notifs || []);
            }
          }
        } catch {}
        finally { if (isActive) setLoading(false); }
      };
      load();
      return () => { isActive = false; };
    }, [refresh])
  );

  const reject = async (notifid: string) => {
    await deleteNotification(notifid);
    setRefresh(!refresh);
  };

  const accept = async (friendid: string, notifid: string, friendUsername: string) => {
    await acceptFriend(friendid);
    await deleteNotification(notifid);
    setRefresh(!refresh);
    Alert.alert('Friend Added', `You and ${friendUsername} are now friends!`);
  };

  const acceptGameInvite = async (gameid: string, notifid: string) => {
    const res = await addGameMember(gameid, user._id);
    if (!res) return; // join failed (e.g. game full) — keep the invite
    await deleteNotification(notifid);
    setRefresh(!refresh);
    router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid } });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <Header />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md, flexGrow: 1 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor, marginBottom: Spacing.xs }}>
          Inbox
        </Text>

        {(!notifications || notifications.length === 0) ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Ionicons name="mail-outline" size={52} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.lg, color: subtext, marginTop: Spacing.md }}>All caught up</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.xs }}>No notifications yet</Text>
          </View>
        ) : (
          notifications.map((item) => {
            if (item.type === 'friend-request') {
              const friend = item.object;
              return (
                <View key={item._id} style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <Avatar username={friend.username} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: textColor }}>{friend.username}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>Sent you a friend request</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <AppButton title="Accept" onPress={() => accept(friend._id, item._id, friend.username)} style={{ flex: 1 }} />
                    <AppButton title="Decline" onPress={() => reject(item._id)} variant="secondary" style={{ flex: 1 }} />
                  </View>
                </View>
              );
            }

            if (item.type === 'upcoming-game') {
              const game = item.object;
              return (
                <View key={item._id} style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <View style={{ width: 44, height: 44, borderRadius: Radius.md, backgroundColor: primary + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="basketball-outline" size={22} color={primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: textColor }}>{game.name}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
                        {game.date ? new Date(game.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Upcoming'}
                      </Text>
                    </View>
                  </View>
                  <AppButton title="Dismiss" onPress={() => reject(item._id)} variant="secondary" />
                </View>
              );
            }

            if (item.type === 'game-invite') {
              const game = item.object;
              // The game may have expired (TTL) after the invite was sent
              if (!game) {
                return (
                  <View key={item._id} style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.md }}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
                      This game invite is no longer available.
                    </Text>
                    <AppButton title="Dismiss" onPress={() => reject(item._id)} variant="secondary" />
                  </View>
                );
              }
              return (
                <View key={item._id} style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <View style={{ width: 44, height: 44, borderRadius: Radius.md, backgroundColor: primary + '22', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="mail-open-outline" size={22} color={primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: textColor }}>{game.name}</Text>
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
                        {item.sender?.username ? `${item.sender.username} invited you` : 'You were invited'}
                        {game.date ? ` · ${new Date(game.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                    <AppButton title="Join Game" onPress={() => acceptGameInvite(game._id, item._id)} style={{ flex: 1 }} />
                    <AppButton title="Decline" onPress={() => reject(item._id)} variant="secondary" style={{ flex: 1 }} />
                  </View>
                </View>
              );
            }

            return null;
          })
        )}
      </ScrollView>
    </View>
  );
};

export default Inbox;
