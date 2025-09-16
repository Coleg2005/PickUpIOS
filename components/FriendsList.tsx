// imports 
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import { getFriends, removeFriend, getPfp } from '@/utils/api';

import { useThemeColor } from '@/hooks/useThemeColor';

// component
type FriendsListProps = {
  userid: string;
  onClose: () => void;
};

const FriendsList = ({ userid, onClose }: FriendsListProps) => {

  const backgroundColor = useThemeColor({}, 'background');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');

  const [friends, setFriends] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriends(userid);
        setFriends(res || []);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      }
    };
    fetchFriends();
  }, [userid, refresh]);


  // all obvious
  const bottomSpace = useBottomTabBarHeight();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: backgroundColor, borderColor: cardBorderColor }}>
        <TouchableOpacity
          style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            bottom: bottomSpace, 
            backgroundColor: backgroundColor, 
            borderTopWidth: 1, 
            borderBottomWidth: 1, 
            borderTopColor: cardBorderColor,
            borderBottomColor: cardBorderColor
          }}
          onPress={onClose}
          activeOpacity={1}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>Friends List</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 20, color: textColor }}>▼</Text>
          </View>
        </TouchableOpacity>

        <FlatList
          data={friends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const pfpUrl = getPfp(item._id);
            return (
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: cardBorderColor }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                  {item.profile?.picture ? (
                    <Image
                      source={{ uri: pfpUrl }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ textAlign: 'center', lineHeight: 48, color: '#aaa', fontSize: 20 }}>
                      {item.username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  )}
                </View>
                <Text style={{ fontSize: 18, flex: 1, color: textColor }}>{item.username}</Text>
                <TouchableOpacity onPress={() => {removeFriend(userid, item._id); setRefresh(!refresh)}}>
                  <View style={{ backgroundColor: '#d9534f', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Remove</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          style={{ flex: 1, backgroundColor: backgroundColor, minHeight: 120, borderBottomWidth: 1, borderColor: cardBorderColor, bottom: bottomSpace }}
          contentContainerStyle={{ padding: 8, flexGrow: 1 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No friends yet.</Text>}
        />

      </View>
    </KeyboardAvoidingView>
  );
};

export default FriendsList;