import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Header from '@/components/Header';

import { getGameId, addGameMember, deleteGame, removeGameMember } from '@/utils/api';
import { User } from '@/utils/types';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function GameScreen() {
  const router = useRouter();

  const { gameid } = useLocalSearchParams();

  const [userid, setUserid] = useState<string | null>(null);
  const [members, setMembers] = useState<[]>([]);
  const [gameName, setGameName] = useState<string>('');
  const [leader, setLeader] = useState<User| null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [refreshFlag, setRefreshFlag] = useState(0);


  useEffect(() => {
      const loadUser = async () => {
        try {
          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            setUserid(decoded._id);
          }
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      loadUser();
    }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const gameId = Array.isArray(gameid) ? gameid[0] : gameid;
          const fetchedGame = await getGameId(gameId);
          if (fetchedGame) {
            setMembers(fetchedGame.gameMembers);
            setGameName(fetchedGame.name);
            setLeader(fetchedGame.leader);
            setDate(fetchedGame.date);
            setLocation(fetchedGame.location);
            setSport(fetchedGame.sport);
            setDescription(fetchedGame.description);
          }
        } catch (error) {
          console.log('Failed to load game:', error);
        }
      };
      fetchData();
    }, [refreshFlag, gameid])
  );

  const textColor = useThemeColor({}, 'text')
  const cardBackgroundColor = useThemeColor({}, 'cardBackground')
  const cardBorderColor = useThemeColor({}, 'cardBorder')
  const tintColor = useThemeColor({}, 'tint')

  // Extract button text logic into a variable
  let buttonText = 'Join Game';
  if (leader && userid === leader._id) {
    buttonText = 'Delete Game';
  } else if (members.some((member: any) => member._id === userid)) {
    buttonText = 'Leave Game';
  }

  return (
    <View style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      >
        <Header />
        <View style={{ margin: 16, padding: 20, backgroundColor: cardBackgroundColor, borderRadius: 16, borderColor: cardBorderColor, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: textColor }}>{gameName}</Text>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: textColor }}>Leader: <Text style={{ fontWeight: '400' }}>{leader?.username ?? 'Unknown'}</Text></Text>
            <Text style={{ fontSize: 16, color: textColor }}>Date: <Text style={{ fontWeight: '400' }}>{date.toLocaleString()}</Text></Text>
            <Text style={{ fontSize: 16, color: textColor }}>Location: <Text style={{ fontWeight: '400' }}>{location}</Text></Text>
            <Text style={{ fontSize: 16, color: textColor }}>Sport: <Text style={{ fontWeight: '400' }}>{sport}</Text></Text>
          </View>
          <Text style={{ fontSize: 16, color: textColor, marginBottom: 8 }}>Description:</Text>
          <Text style={{ fontSize: 16, color: tintColor, marginBottom: 16 }}>{description || 'No description'}</Text>
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 8, padding: 20, borderRadius: 16, borderColor: cardBorderColor, borderWidth: 1, backgroundColor: cardBackgroundColor }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: textColor, }}>Members</Text>
          {members && members.length > 0 ? (
            <View style={{ gap: 12 }}>
              {members.map((member: any) => (
                <TouchableOpacity key={member._id} onPress={() => router.push({ pathname: '/(tabs)/pages/user/[userid]', params: { userid: member._id } })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, elevation: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{member.username}</Text>
                    {/* You can add more member info here if needed */}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ color: textColor }}>No members found.</Text>
          )}
        </View>
      </ParallaxScrollView>
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 100,
          right: 24,
          backgroundColor: '#007AFF',
          borderRadius: 32,
          paddingVertical: 16,
          paddingHorizontal: 24,
          elevation: 4,
          zIndex: 100,
        }}
        onPress={async () => {
          const gameId = Array.isArray(gameid) ? gameid[0] : gameid;
          if (!userid) {
            console.log('User is not loaded');
            return;
          }
          if (leader && userid === leader._id) {
            await deleteGame(gameId);
            router.back()
            return;
          }
          const isMember = members.some((member: any) => member._id === userid);
          if (isMember) {
            await removeGameMember(gameId, userid);
            setRefreshFlag((prev) => prev === 1 ? 0 : 1);
            return;
          }
          await addGameMember(gameId, userid);
          setRefreshFlag((prev) => prev === 1 ? 0 : 1);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,               // Make View take full screen height
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
    backgroundColor: '#000',  // White background so text shows clearly
  },
  text: {
    fontSize: 20,
    color: '#fff',          // Black text color
  },
});
