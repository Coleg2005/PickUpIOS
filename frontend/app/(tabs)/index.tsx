import { Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Collapsible } from '@/components/Collapsible';
import Card from '@/components/Card';
import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import GameStatusBadge from '@/components/GameStatusBadge';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize, FontWeight } from '@/constants/Theme';

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import { getGamesLead, getGamesMember, getUser, searchUsers, getPfp } from '../../utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const [leadGames, setLeadGames] = useState<[] | null>(null);
  const [memberGames, setMemberGames] = useState<[] | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      const loadLeadGames = async () => {
        try {
          const data = await getGamesLead(user._id);
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

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(text.trim());
      setSearchResults(results.filter((u: any) => u._id !== user?._id));
    }, 300);
  };

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

        {/* Search bar */}
        <View>
          <TextInput
            style={{
              height: 46,
              borderRadius: Radius.full,
              borderWidth: 1,
              borderColor: cardBorderColor,
              backgroundColor: surface,
              paddingHorizontal: Spacing.md,
              color: textColor,
              fontSize: FontSize.md,
              fontFamily: 'DMSans_400Regular',
            }}
            placeholder="Search players..."
            placeholderTextColor={subtext}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchResults.length > 0 && (
            <View style={{
              backgroundColor: surface,
              borderWidth: 1,
              borderColor: cardBorderColor,
              borderRadius: Radius.lg,
              marginTop: Spacing.xs,
              maxHeight: 260,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    onPress={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      router.push({ pathname: '/(tabs)/pages/user/[userid]', params: { userid: item._id } });
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: Spacing.sm + 2,
                      paddingHorizontal: Spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: cardBorderColor,
                    }}
                  >
                    <Avatar username={item.username} imageUri={item.profile?.picture ? getPfp(item._id) : null} size={36} />
                    <Text style={{ color: textColor, fontSize: FontSize.md, fontFamily: 'DMSans_500Medium', marginLeft: Spacing.sm }}>
                      {item.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <Collapsible title="Games You Made">
          {leadGames && leadGames.length > 0 ? (
            leadGames.map((game: any) => (
              <TouchableOpacity key={game._id} onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}>
                <Card title={game.name}>
                  <Text style={{ color: subtext, fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm }}>{game.description || 'No description'}</Text>
                  <GameStatusBadge memberCount={game.gameMembers?.length ?? 0} maxPlayers={game.maxPlayers} gameDate={game.date} />
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="basketball-outline" size={40} color={subtext} />
              <Text style={{ color: subtext, fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, marginTop: Spacing.sm }}>No games created yet</Text>
            </View>
          )}
        </Collapsible>

        <Collapsible title="Games You're In">
          {memberGames && memberGames.length > 0 ? (
            memberGames.map((game: any) => (
              <TouchableOpacity key={game._id} onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}>
                <Card title={game.name}>
                  <Text style={{ color: subtext, fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm }}>{game.description || 'No description'}</Text>
                  <GameStatusBadge memberCount={game.gameMembers?.length ?? 0} maxPlayers={game.maxPlayers} gameDate={game.date} />
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="people-outline" size={40} color={subtext} />
              <Text style={{ color: subtext, fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, marginTop: Spacing.sm }}>You haven&apos;t joined any games</Text>
            </View>
          )}
        </Collapsible>

      </ScrollView>
    </View>
    </TouchableWithoutFeedback>
  );
}
