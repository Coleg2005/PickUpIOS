import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { getBlockedUsers, unblockUser, getPfp } from '@/utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import Avatar from '@/components/Avatar';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

type Props = {
  onClose: () => void;
};

const BlockedUsersList = ({ onClose }: Props) => {
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');

  const [blocked, setBlocked] = useState<any[]>([]);
  const tabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    const fetchBlocked = async () => {
      const res = await getBlockedUsers();
      setBlocked(res || []);
    };
    fetchBlocked();
  }, []);

  const handleUnblock = async (userid: string) => {
    const res = await unblockUser(userid);
    if (res) setBlocked(prev => prev.filter(u => u._id !== userid));
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
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xl, color: textColor }}>Blocked Users</Text>
        <Ionicons name="chevron-down" size={24} color={subtext} />
      </TouchableOpacity>

      <FlatList
        data={blocked}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: tabBarHeight + Spacing.md, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="ban-outline" size={48} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: subtext, marginTop: Spacing.md }}>No blocked users</Text>
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
            <TouchableOpacity onPress={() => handleUnblock(item._id)}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: primary }}>Unblock</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default BlockedUsersList;
