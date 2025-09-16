import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Button, Alert, Image } from 'react-native';

import Header from '@/components/Header';
import ParallaxScrollView from '@/components/ParallaxScrollView';

import { useThemeColor } from '@/hooks/useThemeColor';

import { useLocalSearchParams } from 'expo-router';

import { getUser, requestFriend, removeFriend, getPfp, getNotifications } from '@/utils/api';
import { useFocusEffect } from '@react-navigation/native';

import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

export default function Profile() {

  const { userid } = useLocalSearchParams();

  const [visitedUser, setVisitedUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isPending, setIsPending] = useState<boolean>(false);

  useEffect(() => {
    if (user && visitedUser) {
      const friendIds = user.friends?.map((f: any) => f._id || f) || [];
      setIsFriend(friendIds.includes(visitedUser._id));
      const fetchNotifications = async () => {
        const notifs = await getNotifications(user._id);
        const hasFriendRequest = notifs.some(
          (notif: any) =>
            notif.type === 'friend-request' &&
            notif.object &&
            notif.object._id === visitedUser._id
        );
        setIsPending(hasFriendRequest);
      };
      fetchNotifications();
    }
  }, [user, visitedUser]);

  useFocusEffect(
    useCallback(() => {
      const loadVisitedUser = async () => {
        try {
          const res = await getUser(Array.isArray(userid) ? userid[0] : userid);
          setVisitedUser(res.user);
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      loadVisitedUser();
    }, [userid])
  );

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          if (decoded?._id) {
            const res = await getUser(decoded._id)
            setUser(res.user);

          }
        }
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const handleRequestFriend = async () => {
    await requestFriend(user._id, Array.isArray(userid) ? userid[0] : userid);
    setIsPending(true);
    Alert.alert('Friend Request Sent!');
  };

  const handleRemoveFriend = async () => {
    await removeFriend(user._id, Array.isArray(userid) ? userid[0] : userid);
    setIsFriend(false)
    Alert.alert('Friend Removed!');
  };

  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
    >
      <Header />
      <View style={{ padding: 16, alignItems: 'center' }}>
        {/* Profile Picture */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', overflow: 'hidden', marginBottom: 8, borderWidth: 2, borderColor: cardBackgroundColor }}>
            {visitedUser?.profile?.picture ? (
              <Image
                source={{ uri: getPfp(visitedUser._id) }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
                resizeMode="cover"
              />
            ) : (
              <Text style={{ textAlign: 'center', lineHeight: 100, color: '#aaa', fontSize: 40 }}>
                {visitedUser?.username?.[0]?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
        </View>
        {/* Username */}
        <Text style={{ color: textColor, fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>{visitedUser?.username || 'Username'}</Text>
        
        {/* Add Friend Button */}
        <View style={{ 
            alignItems: 'center', 
            marginBottom: 16, 
            backgroundColor: cardBackgroundColor, 
            borderWidth: 1, 
            borderColor: borderColor,
            borderRadius: 10
          }}>
          <View style={{ width: '60%' }}>
            {(() => {
              if (isFriend) {
                return (
                  <Button
                    title="Remove Friend"
                    color={textColor}
                    onPress={() => {handleRemoveFriend()}}
                  />
                );
              } else if (isPending) {
                return (
                  <Button
                    title="Pending"
                    color={textColor}
                    onPress={() => {}}
                  />
                );
              } else {
                return (
                  <Button
                    title="Send Friend Request"
                    color={textColor}
                    onPress={() => {handleRequestFriend()}}
                  />
                );
              }
            })()}
          </View>
        </View>

        {/* Description */}
        <View style={{ width: '100%', marginBottom: 16 }}>
          <Text style={{ color: textColor, fontSize: 18, marginBottom: 4 }}>Description:</Text>
          <Text style={{ color: textColor, fontSize: 16, minHeight: 60, marginBottom: 8 }}>{visitedUser?.profile?.description || 'No description set.'}</Text>
        </View>

      </View>
    </ParallaxScrollView>
  );
}
