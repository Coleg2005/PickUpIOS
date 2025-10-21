import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import Header from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { getUser, getNotifications, deleteNotification, acceptFriend } from '@/utils/api';

const Inbox = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const tabBarHeight = useBottomTabBarHeight();

  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadUser = async () => {
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
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      loadUser();
      return () => {
        isActive = false;
      };
    }, [refresh])
  );

  const rejection = async (notifid: string) => {
    await deleteNotification(notifid);
    setRefresh(!refresh);
  }

  const accept = async (userid: string, friendid: string, notifid: string) => {
    await acceptFriend(userid, friendid);
    await deleteNotification(notifid);
    setRefresh(!refresh);
  }
    
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      >
        <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: backgroundColor }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ flex: 1, backgroundColor: backgroundColor, borderColor: cardBorderColor, paddingBottom: tabBarHeight, paddingTop: 0 }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: textColor, textAlign: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: cardBorderColor }}>
              Inbox
            </Text>
            {(!notifications || notifications.length === 0) ? (
              <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No notifications yet.</Text>
            ) : (
              notifications.map((item, idx) => {
                let notificationContent;
                if (item.type === 'friend-request') {
                  const friend = item.object;
                  notificationContent = (
                    <View>
                      <Text style={{ fontSize: 17, color: textColor }}>
                        Friend request from: <Text style={{ fontWeight: 'bold', color: textColor }}>{friend.username}</Text>
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ backgroundColor: '#27ae60', color: 'white', textAlign: 'center', paddingVertical: 8, borderRadius: 6, fontWeight: 'bold', }}
                            onPress={() => {accept(item.recipient, friend._id, item._id)}}
                          >
                            Accept
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={{ backgroundColor: '#e74c3c', color: 'white', textAlign: 'center', paddingVertical: 8, borderRadius: 6, fontWeight: 'bold', }}
                            onPress={() => {rejection(item._id)}}
                          >
                            Reject
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                } else if (item.type === 'upcoming-game') {
                  notificationContent = (
                    <View>
                      <Text style={{ fontSize: 17, color: textColor }}>Upcoming game: {item.object.name} at {item.object.location} at {item.object.date ? new Date(item.object.date).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Unknown'}</Text>
                      <View style={{ flexDirection: 'row', marginTop: 10 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ backgroundColor: '#27ae60', color: 'white', textAlign: 'center', paddingVertical: 8, borderRadius: 6, fontWeight: 'bold', }}
                            onPress={() => {rejection(item._id)}}
                          >
                            Seen
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                } else {
                  notificationContent = (
                    <Text style={{ fontSize: 17, color: textColor }}>
                      {item.message || item.name}
                    </Text>
                  );
                }

                return (
                  <React.Fragment key={item._id}>
                    <View style={{ paddingVertical: 16, paddingHorizontal: 18, backgroundColor: backgroundColor }}>
                      {notificationContent}
                    </View>
                    {idx < notifications.length - 1 && (
                      <View style={{ height: 1, backgroundColor: cardBorderColor, marginHorizontal: 12 }} />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </View>
        </KeyboardAvoidingView>
      </ParallaxScrollView>
    </View>
  );
};

export default Inbox;
