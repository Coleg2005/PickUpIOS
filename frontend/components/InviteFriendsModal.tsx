import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/Avatar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';
import { getFriends, inviteToGame, getPfp } from '@/utils/api';

type Props = {
  visible: boolean;
  onClose: () => void;
  gameId: string;
  userId: string;
  // Users already in the game, so they aren't shown as invitable
  memberIds: string[];
};

export default function InviteFriendsModal({ visible, onClose, gameId, userId, memberIds }: Props) {
  const [friends, setFriends] = useState<any[]>([]);
  const [invited, setInvited] = useState<string[]>([]);

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  useEffect(() => {
    if (!visible) return;
    const fetchFriends = async () => {
      const res = await getFriends(userId);
      setFriends((res || []).filter((f: any) => !memberIds.includes(f._id)));
    };
    fetchFriends();
  }, [visible, userId, memberIds]);

  const handleInvite = async (friendid: string) => {
    const res = await inviteToGame(gameId, friendid);
    if (res) setInvited(prev => [...prev, friendid]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl }}>
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.lg, maxHeight: '70%', gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xl, color: textColor }}>Invite Friends</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={subtext} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={friends}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="people-outline" size={40} color={subtext} />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: subtext, marginTop: Spacing.md }}>
                  No friends to invite
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isInvited = invited.includes(item._id);
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, gap: Spacing.sm }}>
                  <Avatar username={item.username} imageUri={item.profile?.picture ? getPfp(item._id) : null} size={40} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.md, color: textColor, flex: 1 }}>
                    {item.username}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleInvite(item._id)}
                    disabled={isInvited}
                    style={{
                      borderWidth: 1,
                      borderColor: isInvited ? cardBorder : primary,
                      borderRadius: Radius.full,
                      paddingVertical: Spacing.xs,
                      paddingHorizontal: Spacing.md,
                    }}
                  >
                    <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: isInvited ? subtext : primary }}>
                      {isInvited ? 'Invited' : 'Invite'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
