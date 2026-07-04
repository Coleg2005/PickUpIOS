import React, { useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, Modal, TextInput, Alert, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, Button } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import Header from '@/components/Header';
import AppButton from '@/components/AppButton';
import GameStatusBadge from '@/components/GameStatusBadge';

import { getGamesLoc, createGame, getUser, getPlace, formatRecurrence, GameRecurrence } from '@/utils/api';
import { useSearchStore } from '@/utils/store';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

const SPORT_ITEMS = [
  { label: 'Basketball', value: 'basketball' },
  { label: 'Baseball',   value: 'baseball' },
  { label: 'Soccer',     value: 'soccer' },
  { label: 'Tennis',     value: 'tennis' },
  { label: 'Pickleball', value: 'pickleball' },
  { label: 'Volleyball', value: 'volleyball' },
];

async function FetchPlace(fsq_place_id: string) {
  try {
    return await getPlace(fsq_place_id);
  } catch (error) {
    console.error(error);
  }
}

export default function PlaceScreen() {
  const router = useRouter();
  const { selectedSport } = useSearchStore();
  const tabBarHeight = useBottomTabBarHeight();

  const [modalVisible, setModalVisible] = useState(false);
  const [gameName, setGameName] = useState<string>('');
  const [gameDate, setGameDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gameDescription, setGameDescription] = useState<string>('');
  const [gameSport, setGameSport] = useState<string>(selectedSport || '');

  const [gameLeader, setGameLeader] = useState<string>('');
  const [gameMaxPlayers, setGameMaxPlayers] = useState<string>('');
  const [gameRecurrence, setGameRecurrence] = useState<GameRecurrence>('none');

  const { locationID } = useLocalSearchParams();

  const [placeName, setPlaceName] = useState<string>('');
  const [placeData, setPlaceData] = useState<any>(null);

  const [games, setGames] = useState<[] | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const placeObj = await FetchPlace(Array.isArray(locationID) ? locationID[0] : locationID);
          const locationName = placeObj?.name || 'Unknown Place';
          setPlaceName(locationName);
          setPlaceData(placeObj);
          const games = await getGamesLoc(Array.isArray(locationID) ? locationID[0] : locationID); // Fetch games for the specific location
          setGames(games);

          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const decoded: any = jwtDecode(token);
            if (decoded?._id) {
              const res = await getUser(decoded._id);
              if (res?.user?.username) {
                setGameLeader(res.user.username);
              } else {
                setGameLeader('');
              }
            }
          }
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      fetchData();
    }, [modalVisible, locationID])
  );

  const getAddress = () => {
    if (!placeData?.location) return '';
    const { address, locality, region } = placeData.location;
    return [address, locality, region].filter(Boolean).join(', ');
  };

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  const inputStyle = {
    borderWidth: 1,
    borderColor: cardBorder,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    color: textColor,
    fontFamily: 'DMSans_400Regular',
    fontSize: FontSize.md,
  } as const;

  const dropdownProps = {
    labelField: 'label' as const,
    valueField: 'value' as const,
    style: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm, borderColor: cardBorder, backgroundColor: surface },
    containerStyle: { borderRadius: Radius.md, backgroundColor: surface, borderColor: cardBorder, borderWidth: 1 },
    itemTextStyle: { fontSize: FontSize.md, color: textColor, fontFamily: 'DMSans_400Regular' },
    selectedTextStyle: { fontSize: FontSize.md, color: textColor, fontFamily: 'DMSans_400Regular' },
    placeholderStyle: { fontSize: FontSize.md, color: subtext, fontFamily: 'DMSans_400Regular' },
    activeColor: surface,
  };

  const handleCreate = async () => {
    if (!gameName || !gameSport) {
      Alert.alert('Missing fields', 'Game name and sport are required.');
      return;
    }
    const maxPlayers = gameMaxPlayers ? parseInt(gameMaxPlayers) : null;
    await createGame(
      gameName,
      gameDate,
      placeName,
      Array.isArray(locationID) ? locationID[0] : locationID,
      gameSport,
      gameLeader,
      gameDescription,
      maxPlayers,
      gameRecurrence,
    );
    setModalVisible(false);
    setGameName('');
    setGameDescription('');
    setGameMaxPlayers('');
    setGameDate(new Date());
    setGameRecurrence('none');
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>

      {/* Create game modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.xl }}
          >
            <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xl, color: textColor }}>Create Game</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={8}>
                  <Ionicons name="close" size={24} color={subtext} />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Game name"
                placeholderTextColor={subtext}
                value={gameName}
                onChangeText={setGameName}
                style={inputStyle}
              />

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderColor: cardBorder, borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm }}
              >
                <Ionicons name="calendar-outline" size={18} color={primary} />
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: textColor }}>
                  {gameDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              <Dropdown
                {...dropdownProps}
                data={SPORT_ITEMS}
                value={gameSport || null}
                onChange={item => setGameSport(item.value)}
                placeholder="Select sport *"
              />

              <Dropdown
                {...dropdownProps}
                data={[
                  { label: 'Does not repeat', value: 'none' },
                  { label: 'Every day', value: 'daily' },
                  { label: 'Every other day', value: 'every-other-day' },
                  { label: `Every ${gameDate.toLocaleDateString('en-US', { weekday: 'long' })}`, value: 'weekly' },
                ]}
                value={gameRecurrence}
                onChange={item => setGameRecurrence(item.value as GameRecurrence)}
                placeholder="Repeats"
              />

              <TextInput
                placeholder="Max players (optional)"
                placeholderTextColor={subtext}
                value={gameMaxPlayers}
                onChangeText={setGameMaxPlayers}
                keyboardType="numeric"
                style={inputStyle}
              />

              <TextInput
                placeholder="Description (optional)"
                placeholderTextColor={subtext}
                value={gameDescription}
                onChangeText={setGameDescription}
                multiline
                numberOfLines={3}
                style={[inputStyle, { minHeight: 60 }]}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
                <AppButton title="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
                <AppButton title="Create" onPress={handleCreate} style={{ flex: 1 }} />
              </View>

              {showDatePicker && Platform.OS === 'ios' && (
                <View style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: surface,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: cardBorder,
                  padding: Spacing.md,
                  zIndex: 1000,
                }}>
                  <Button title="Done" color={primary} onPress={() => setShowDatePicker(false)} />
                  <DateTimePicker
                    value={gameDate}
                    mode="datetime"
                    display="spinner"
                    onChange={(_, selectedDate) => {
                      if (selectedDate) setGameDate(selectedDate);
                    }}
                    style={{ backgroundColor: surface }}
                  />
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <Header />
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg, paddingBottom: tabBarHeight + 100 }}>

        {/* Place info */}
        <View style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.xs }}>
          <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor }}>
            {placeName}
          </Text>
          {!!getAddress() && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Ionicons name="location-outline" size={14} color={subtext} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, flex: 1 }}>
                {getAddress()}
              </Text>
            </View>
          )}
          {selectedSport && (
            <View style={{ backgroundColor: primary + '22', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start', marginTop: Spacing.xs }}>
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.xs, color: primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {selectedSport}
              </Text>
            </View>
          )}
        </View>

        {/* Games */}
        <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: subtext, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Games
        </Text>

        {games && games.length > 0 ? (
          games.map((game: any) => (
            <TouchableOpacity
              key={game._id}
              activeOpacity={0.75}
              onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}
              style={{ backgroundColor: surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, padding: Spacing.md, gap: Spacing.xs }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm }}>
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.lg, color: textColor, flex: 1 }}>
                  {game.name}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={subtext} />
              </View>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>
                {new Date(game.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {formatRecurrence(game.recurrence, game.date) ? ` · ${formatRecurrence(game.recurrence, game.date)}` : ''}
              </Text>
              <GameStatusBadge
                memberCount={game.gameMembers?.length ?? 0}
                maxPlayers={game.maxPlayers}
                gameDate={game.date}
              />
            </TouchableOpacity>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Ionicons name="calendar-outline" size={48} color={subtext} />
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: subtext, marginTop: Spacing.md }}>No games yet</Text>
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.xs }}>Be the first to create one here</Text>
          </View>
        )}

      </ScrollView>

      {/* Floating create button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={{
          position: 'absolute',
          bottom: tabBarHeight + Spacing.lg,
          right: Spacing.xl,
          backgroundColor: primary,
          borderRadius: Radius.full,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.xs,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 4,
        }}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={{ color: '#fff', fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md }}>Create Game</Text>
      </TouchableOpacity>
    </View>
  );
}
