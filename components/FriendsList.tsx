import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getFriends, removeFriend, getPfp } from '@/utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import Avatar from '@/components/Avatar';
import AppButton from '@/components/AppButton';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

type FriendsListProps = {
  userid: string;
  onClose: () => void;
};

const FriendsList = ({ userid, onClose }: FriendsListProps) => {
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');

  const [friends, setFriends] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriends(userid);
        setFriends(res || []);
      } catch {}
    };
    fetchFriends();
  }, [userid, refresh]);

  const handleRemove = (friendId: string, username: string) => {
    Alert.alert('Remove Friend', `Remove ${username}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await removeFriend(userid, friendId);
          setRefresh(!refresh);
        },
      },
    ]);
  };

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor }}>
      {/* Header */}
      <TouchableOpacity
        onPress={onClose}
        activeOpacity={1}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: cardBorder,
          backgroundColor: surface,
        }}
      >
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xl, color: textColor }}>Friends</Text>
        <Ionicons name="chevron-down" size={24} color={subtext} />
      </TouchableOpacity>

      <FlatList
        data={friends}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: tabBarHeight + Spacing.md, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="people-outline" size={48} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: subtext, marginTop: Spacing.md }}>No friends yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.xs }}>Search for players on the home screen</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.sm,
            borderRadius: Radius.lg,
            marginBottom: Spacing.xs,
          }}>
            <Avatar username={item.username} imageUri={item.profile?.picture ? getPfp(item._id) : null} size={48} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.md, color: textColor, flex: 1, marginLeft: Spacing.sm }}>
              {item.username}
            </Text>
            <TouchableOpacity onPress={() => handleRemove(item._id, item.username)}>
              <Ionicons name="person-remove-outline" size={20} color={subtext} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default FriendsList;
