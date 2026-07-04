import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Alert } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Ionicons } from '@expo/vector-icons';

import Header from '@/components/Header';
import Avatar from '@/components/Avatar';
import AppButton from '@/components/AppButton';
import GameChat from '@/components/GameChat';
import GameStatusBadge from '@/components/GameStatusBadge';
import ReportModal from '@/components/ReportModal';
import InviteFriendsModal from '@/components/InviteFriendsModal';

import { getGameId, addGameMember, deleteGame, removeGameMember, getPfp, formatRecurrence, GameRecurrence } from '@/utils/api';
import { User } from '@/utils/types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

export default function GameScreen() {
  const router = useRouter();

  const { gameid } = useLocalSearchParams();

  const bottomSpace = useBottomTabBarHeight();

  const [user, setUser] = useState<any>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [gameName, setGameName] = useState<string>('');
  const [leader, setLeader] = useState<User | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<string>('');
  const [sport, setSport] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState<GameRecurrence>('none');

  const [refreshFlag, setRefreshFlag] = useState(0);
  const [reportVisible, setReportVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          setUser(decoded);
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
            setDate(new Date(fetchedGame.date));
            setLocation(fetchedGame.location);
            setSport(fetchedGame.sport);
            setDescription(fetchedGame.description);
            setMaxPlayers(fetchedGame.maxPlayers ?? null);
            setRecurrence(fetchedGame.recurrence || 'none');
          }
        } catch (error) {
          console.log('Failed to load game:', error);
        }
      };
      fetchData();
    }, [refreshFlag, gameid])
  );

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  const isLeader = !!(user && leader && user._id === leader._id);
  const isMember = !!(user && members.some((member: any) => member._id === user._id));

  const handleMainAction = async () => {
    const gameId = Array.isArray(gameid) ? gameid[0] : gameid;
    if (!user?._id) return;

    if (isLeader) {
      Alert.alert('Delete Game', 'This will delete the game for all members.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGame(gameId);
            router.back();
          },
        },
      ]);
      return;
    }
    if (isMember) {
      await removeGameMember(gameId, user._id);
    } else {
      await addGameMember(gameId, user._id);
    }
    setRefreshFlag((prev) => (prev === 1 ? 0 : 1));
  };

  const detailRows = [
    { icon: 'person-outline' as const, label: 'Leader', value: leader?.username ?? 'Unknown' },
    { icon: 'calendar-outline' as const, label: 'When', value: date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
    { icon: 'location-outline' as const, label: 'Where', value: location },
    { icon: 'basketball-outline' as const, label: 'Sport', value: sport, capitalize: true },
    ...(formatRecurrence(recurrence, date)
      ? [{ icon: 'repeat' as const, label: 'Schedule', value: formatRecurrence(recurrence, date)! }]
      : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: bottomSpace + 120 }}>

        {/* Title + actions */}
        <View style={{ gap: Spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
            <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor, flex: 1 }}>
              {gameName}
            </Text>
            {isMember && (
              <TouchableOpacity onPress={() => setInviteVisible(true)} style={{ padding: Spacing.xs }} hitSlop={8}>
                <Ionicons name="person-add-outline" size={22} color={subtext} />
              </TouchableOpacity>
            )}
            {user && leader && user._id !== leader._id && (
              <TouchableOpacity onPress={() => setReportVisible(true)} style={{ padding: Spacing.xs }} hitSlop={8}>
                <Ionicons name="flag-outline" size={22} color={subtext} />
              </TouchableOpacity>
            )}
          </View>
          <GameStatusBadge memberCount={members.length} maxPlayers={maxPlayers} gameDate={date} />
        </View>

        {/* Details */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Details
          </Text>
          {detailRows.map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Ionicons name={row.icon} size={18} color={primary} />
              <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.sm, color: subtext, width: 72 }}>
                {row.label}
              </Text>
              <Text
                style={{
                  fontFamily: 'DMSans_500Medium',
                  fontSize: FontSize.md,
                  color: textColor,
                  flex: 1,
                  textTransform: row.capitalize ? 'capitalize' : 'none',
                }}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            About
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: description ? textColor : subtext }}>
            {description || 'No description yet.'}
          </Text>
        </View>

        {/* Join / Leave / Delete */}
        {user && (
          isLeader ? (
            <AppButton title="Delete Game" onPress={handleMainAction} variant="danger" />
          ) : isMember ? (
            <AppButton title="Leave Game" onPress={handleMainAction} variant="secondary" />
          ) : (
            <AppButton title="Join Game" onPress={handleMainAction} />
          )
        )}

        {/* Members */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Members ({members.length}{maxPlayers ? `/${maxPlayers}` : ''})
          </Text>
          {members && members.length > 0 ? (
            <View>
              {members.map((member: any) => (
                <TouchableOpacity
                  key={member._id}
                  onPress={() => {
                    if (user && member._id === user._id) {
                      router.push('/(tabs)/profile');
                    } else {
                      router.push({ pathname: '/(tabs)/pages/user/[userid]', params: { userid: member._id } });
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm }}
                >
                  <Avatar username={member.username} imageUri={member.profile?.picture ? getPfp(member._id) : null} size={40} />
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.md, color: textColor, flex: 1 }}>
                    {member.username}
                  </Text>
                  {leader && member._id === leader._id && (
                    <View style={{ backgroundColor: primary + '22', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.xs, color: primary }}>LEADER</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: subtext }}>No members yet.</Text>
          )}
        </View>

      </ScrollView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        contentType="game"
        contentId={Array.isArray(gameid) ? gameid[0] : (gameid as string)}
      />
      {user && (
        <InviteFriendsModal
          visible={inviteVisible}
          onClose={() => setInviteVisible(false)}
          gameId={Array.isArray(gameid) ? gameid[0] : (gameid as string)}
          userId={user._id}
          memberIds={members.map((m: any) => m._id)}
        />
      )}
      {user && isMember && (
        <GameChat
          gameId={Array.isArray(gameid) ? gameid[0] : gameid}
          userId={user._id}
          username={members.find((member: any) => member._id === user._id)!.username}
        />
      )}
    </View>
  );
}
