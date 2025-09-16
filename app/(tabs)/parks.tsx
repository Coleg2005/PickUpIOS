import { StyleSheet, TouchableOpacity, Text, TextInput, View } from 'react-native';
import { FSQ_KEY } from "@/env";
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import Header from '@/components/Header';
import { Collapsible } from '@/components/Collapsible';
import Card from '@/components/Card';

import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { getGamesLoc } from '@/utils/api';
import { useSearchStore } from '@/utils/store'

import { useThemeColor } from '@/hooks/useThemeColor';

export async function getUserCoordinates() {
  // Request location permissions
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
  }

  // Get current position
  let location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

async function FetchPlaces(sport: string, radius: number) {

  const coords = await getUserCoordinates();

  radius = radius * 1609;

  try{
    const url =`https://places-api.foursquare.com/places/search?query=${sport}&ll=${coords.latitude}%2C${coords.longitude}&radius=${radius}&limit=50`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FSQ_KEY}`,
        'X-Places-Api-Version': '2025-06-17'
      }
    };

    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    
    let results = data.results;

    return results

  } catch(error) {
    console.error(error);
  }
}

const getSportLabel = (sportValue: string) => {
  const sportMap = {
    'basketball%20court': 'basketball',
    'soccer%20field': 'soccer', 
    'tennis%20court': 'tennis',
    'pickleball': 'pickleball',
    'volleyball%20court': 'volleyball'
  };
  return sportMap[sportValue as keyof typeof sportMap] || sportValue;
};

export default function TabTwoScreen() {
  const router = useRouter();
  const { setSelectedSport } = useSearchStore()

  const [places, setPlaces] = useState<[] | null>(null);
  const [sport, setSport] = useState<string>('soccer%20field');
  const [radius, setRadius] = useState<number>(15);
  const [placesWithGames, setPlacesWithGames] = useState<[] | null>(null);

  // Dropdown data for element-dropdown
  const items = [
    { label: 'Basketball', value: 'basketball%20court' },
    { label: 'Soccer', value: 'soccer%20field' },
    { label: 'Tennis', value: 'tennis%20court' },
    { label: 'Pickleball', value: 'pickleball' },
    { label: 'Volleyball', value: 'volleyball%20court' },
  ];
  
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const fetchedPlaces = await FetchPlaces(sport, radius);
          setPlaces(fetchedPlaces);

          if (!fetchedPlaces) {
            setPlacesWithGames(null);
            return;
          }
          const resultsWithGames = await Promise.all(
            fetchedPlaces.map(async (place: any) => {
              const games = await getGamesLoc(place.fsq_place_id);
              if (games && games.length > 0) {
                place.numGames = games.length;
                return place;
              }
              return null;
            })
          );
          const filteredResults = resultsWithGames.filter((place) => place !== null);
          setPlacesWithGames(filteredResults as any);
        } catch (error) {
          console.log('Failed to load user:', error);
        }
      };
      fetchData();
    }, [sport, radius])
  );

  
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'cardBorder');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
    >
      <Header />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[{ color: textColor }]} >Radius (miles):</Text>
          <TextInput
            value={radius.toString()}
            onChangeText={text => {
              let val = Number(text);
              val = Math.max(1, Math.min(val, 50));
              setRadius(val);
            }}
            keyboardType="numeric"
            style={{ borderWidth: 1, borderRadius: 8, padding: 8, borderColor: borderColor, color: textColor }}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[{ color: textColor }]}>Sport:</Text>
          <Dropdown
            data={items}
            labelField="label"
            valueField="value"
            value={sport}
            onChange={item => setSport(item.value)}
            placeholder="Select sport"
            style={{ borderWidth: 1, borderRadius: 8, padding: 8, borderColor: borderColor, backgroundColor: backgroundColor }}
            containerStyle={{ borderRadius: 8, backgroundColor: cardBackgroundColor, borderColor: borderColor, borderWidth: 1 }}
            itemTextStyle={{ fontSize: 16, color: textColor, backgroundColor: cardBackgroundColor }}
            selectedTextStyle={{ fontSize: 16, color: textColor, backgroundColor: backgroundColor }}
            activeColor={cardBackgroundColor}
            inputSearchStyle={{ color: textColor, backgroundColor: cardBackgroundColor, borderColor: borderColor }}
          />
        </View>
      </View>

      <Collapsible title="Parks">
        {places && places.length > 0 ? (
          places.map((place: any) => (
            <TouchableOpacity key={place.fsq_place_id} onPress={() => {
              setSelectedSport(getSportLabel(sport));
              router.push({ 
                pathname: '/(tabs)/pages/location/[locationID]', 
                params: { locationID: place.fsq_place_id },
              });
            }}
              >
              <Card title={place.name}>
                <Text style={[{ color: textColor }]}>{place.name || 'No description'}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[{ color: textColor }]}>No places found.</Text>
        )}
      </Collapsible>
      <Collapsible title="Parks with Games">
        {placesWithGames && placesWithGames.length > 0 ? (
          placesWithGames.map((place: any) => (
            <TouchableOpacity key={place.fsq_place_id} onPress={() => router.push({ pathname: '/(tabs)/pages/location/[locationID]', params: { locationID: place.fsq_place_id } })}>
              <Card title={place.name}>
                <Text style={[{ color: textColor }]}>{place.name || 'No description'}</Text>
                <Text style={[{ color: textColor }]}>Games: {place.numGames}</Text>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[{ color: textColor }]}>No places with games found.</Text>
        )}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
