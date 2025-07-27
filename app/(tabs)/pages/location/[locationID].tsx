import React, { useState } from 'react';
import { Dropdown } from 'react-native-element-dropdown';
import { Text, StyleSheet, TouchableOpacity, View, Modal, TextInput, Button, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Header from '@/components/Header';
import Card from '@/components/Card';


import { getGamesLoc, createGame, getUser } from '@/utils/api';
import { useSearchStore } from '@/utils/store';
import { useThemeColor } from '@/hooks/useThemeColor';

async function FetchPlace(fsq_id: string) {

  try{
    const url =`https://api.foursquare.com/v3/places/${fsq_id}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: 'fsq3ynGnxZsO0ZMa+Hm0PS3JQD/TVM+nm7bXs9uGrgkjAaU='
      }
    };

    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;

  } catch(error) {
    console.error(error);
  }
}

export default function PlaceScreen() {
  const router = useRouter();
  const { selectedSport } = useSearchStore()

  const [modalVisible, setModalVisible] = useState(false);
  const [gameName, setGameName] = useState<string>('');
  const [gameDate, setGameDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gameDescription, setGameDescription] = useState<string>('');
  const [gameSport, setGameSport] = useState<string>(selectedSport || '');

  const [gameLeader, setGameLeader] = useState<string>('')

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
  const cardBorderColor = useThemeColor({}, 'cardBorder')
  const cardBackgroundColor = useThemeColor({}, 'cardBackground')
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={{ flex: 1, backgroundColor: backgroundColor }}>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: cardBackgroundColor, borderRadius: 16, padding: 24, width: '85%', borderColor: cardBorderColor, borderWidth: 2 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: textColor }}>Create Game</Text>
              <TextInput
                placeholder="Game Name"
                value={gameName}
                onChangeText={setGameName}
                style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 12, color: textColor, borderColor: cardBorderColor }}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                style={{ marginBottom: 12 }}
              >
                <View pointerEvents="none">
                  <TextInput
                    placeholder="Date (YYYY-MM-DD HH:mm)"
                    value={gameDate ? gameDate.toLocaleString(undefined, {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    }) : ''}
                    editable={false}
                    style={{ borderWidth: 1, borderRadius: 8, padding: 8, color: textColor, borderColor: cardBorderColor }}
                  />
                </View>
              </TouchableOpacity>
              {showDatePicker && Platform.OS === 'ios' && (
                <View style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: cardBackgroundColor,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  borderColor: cardBackgroundColor,
                  padding: 16,
                  zIndex: 1000,
                }}>
                  <Button title="Done" onPress={() => setShowDatePicker(false)} />
                  <DateTimePicker
                    value={gameDate}
                    mode="datetime"
                    display="spinner"
                    onChange={(_, selectedDate) => {
                      if (selectedDate) setGameDate(selectedDate);
                    }}
                    style={{ backgroundColor: cardBackgroundColor }}
                  />
                </View>
              )}
              <TextInput
                placeholder="Description (optional)"
                value={gameDescription}
                onChangeText={setGameDescription}
                multiline
                numberOfLines={3}
                style={{ borderWidth: 1, borderRadius: 8, padding: 8, marginBottom: 12, color: textColor, borderColor: cardBorderColor }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Button title="Cancel" color="#888" onPress={() => setModalVisible(false)} />
                <Button title="Create" onPress={async () => {
                  await createGame(
                    gameName,
                    gameDate,
                    placeName,
                    Array.isArray(locationID) ? locationID[0] : locationID,
                    gameSport,
                    gameLeader,
                    gameDescription
                  );
                  setModalVisible(false);
                  setModalVisible(false);
                  setGameName('');
                  setGameDescription('');
                  setGameDate(new Date());
                }} />
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      >
        <Header />
        <View style={[{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 20,
          marginHorizontal: 16,
          marginTop: 8,
          marginBottom: 20,
          borderRadius: 16,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3, 
          backgroundColor: cardBackgroundColor, 
          borderColor: cardBorderColor,
        }]}>
          <View style={[{
            flex: 1,
            paddingRight: 12,
          }]}>
            <Text style={[{ 
              color: textColor,
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 6,
              lineHeight: 30,
            }]}>
              {placeName}
            </Text>
            {!!getAddress() && (
              <Text style={[{ 
                color: textColor + 'CC',
                fontSize: 14,
                lineHeight: 20,
              }]}>
                {getAddress()}
              </Text>
            )}

            {selectedSport && (
              <View style={{
                backgroundColor: '#007AFF',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                alignSelf: 'flex-start',
              }}>
                <Text style={{
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}>
                  {selectedSport}
                </Text>
              </View>
            )}
          </View>
        </View>

        {games && games.length > 0 ? (
          games.map((game: any) => (
            <TouchableOpacity key={game._id} onPress={() => router.push({ pathname: '/(tabs)/pages/game/[gameid]', params: { gameid: game._id } })}>
              <Card title={game.name}>
                <Text style={[{ color: textColor }]}>{game.name || 'No Game Name'}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[{ color: textColor }]}>No games found.</Text>
        )}

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
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>+ Create Game</Text>
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
