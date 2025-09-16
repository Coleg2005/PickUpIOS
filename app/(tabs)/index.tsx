import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import ParallaxScrollView from '@/components/ParallaxScrollView';

import { Collapsible } from '@/components/Collapsible';
import Card from '@/components/Card';
import Header from '@/components/Header';
import { useThemeColor } from '@/hooks/useThemeColor';

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import { getGamesLead, getGamesMember, getUser } from '../../utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const [leadGames, setLeadGames] = useState<[] | null>(null);
  const [memberGames, setMemberGames] = useState<[] | null>(null);
  const [user, setUser] = useState<any>(null);
  
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
      } catch (error) {
        console.log('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      const loadLeadGames = async () => {
        try {
          const data = await getGamesLead(user._id)
          !data ? setLeadGames(null) : setLeadGames(data);
        } catch (error) {
          console.log('Failed to load lead games:', error);
        }
      };
      loadLeadGames();
    }, [user])
  );

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      const loadMemberGames = async () => {
        try {
          const data = await getGamesMember(user._id);
          !data ? setMemberGames(null) : setMemberGames(data);
        } catch (error) {
          console.log('Failed to load member games:', error);
        }
      };
      loadMemberGames();
    }, [user])
  );

  const textColor = useThemeColor({}, 'text');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
    >
      <Header />
      <Collapsible title="Games You Made">
        {leadGames && leadGames.length > 0 ? (
          leadGames.map((game: any) => (
            <TouchableOpacity key={game._id} onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}>
              <Card title={game.name}>
                <Text>{game.description || 'No description'}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[{ color: textColor }]}>No games found.</Text>
        )}
      </Collapsible>
      <Collapsible title="Games You're In">
        {memberGames && memberGames.length > 0 ? (
          memberGames.map((game: any) => (
            <TouchableOpacity key={game._id} onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}>
              <Card title={game.name}>
                <Text>{game.description || 'No description'}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[{ color: textColor }]}>No games found.</Text>
        )}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  textInCard: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
