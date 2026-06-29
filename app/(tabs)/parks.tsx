import React, { useState, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text, TextInput, View, ScrollView, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Dropdown } from 'react-native-element-dropdown';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import Header from '@/components/Header';
import { Collapsible } from '@/components/Collapsible';
import Card from '@/components/Card';
import GameStatusBadge from '@/components/GameStatusBadge';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { getGamesByLocations, getActiveLocations, searchPlaces, getPlace } from '@/utils/api';
import { useSearchStore } from '@/utils/store';

const SOON_MS = 2 * 60 * 60 * 1000;

export async function getUserCoordinates() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission to access location was denied');
  const location = await Location.getCurrentPositionAsync({});
  return { latitude: location.coords.latitude, longitude: location.coords.longitude };
}

const SPORT_ITEMS = [
  { label: 'Basketball', value: 'basketball%20court' },
  { label: 'Baseball',   value: 'baseball%20field' },
  { label: 'Soccer',     value: 'soccer%20field' },
  { label: 'Tennis',     value: 'tennis%20court' },
  { label: 'Pickleball', value: 'pickleball' },
  { label: 'Volleyball', value: 'volleyball%20court' },
];

const SPORT_LABEL_MAP: Record<string, string> = {
  'basketball%20court': 'basketball',
  'baseball%20field': 'baseball',
  'soccer%20field': 'soccer',
  'tennis%20court': 'tennis',
  'pickleball': 'pickleball',
  'volleyball%20court': 'volleyball',
};

function getMarkerColor(games: any[]): string {
  if (!games || games.length === 0) return '#9CA3AF';
  const now = Date.now();
  for (const game of games) {
    const ms = new Date(game.date).getTime() - now;
    const isSoon = ms > 0 && ms <= SOON_MS;
    const count = game.gameMembers?.length ?? 0;
    const max = game.maxPlayers;
    if (max != null && count >= max) continue;
    if (isSoon && (max == null || count < max * 0.5)) return '#F97316';
  }
  return '#F59E0B';
}

export default function ParksScreen() {
  const router = useRouter();
  const { setSelectedSport } = useSearchStore();
  const mapRef = useRef<MapView>(null);
  const venueSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [places, setPlaces] = useState<any[]>([]);
  const [gamesByLocation, setGamesByLocation] = useState<Record<string, any[]>>({});
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sport, setSport] = useState('soccer%20field');
  const [radius, setRadius] = useState(15);
  const [filterQuery, setFilterQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Venue free-text search
  const [venueQuery, setVenueQuery] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [venueSearching, setVenueSearching] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchData = async () => {
        setLoading(true);
        try {
          const coords = await getUserCoordinates();
          if (!isActive) return;
          setUserCoords(coords);

          const results = await searchPlaces({
            query: sport,
            ll: `${coords.latitude},${coords.longitude}`,
            radius: radius * 1609,
            limit: 50,
          });
          if (!isActive) return;

          const sportPlaces = results || [];
          const sportIds = new Set(sportPlaces.map((p: any) => p.fsq_place_id));

          // Fetch games for sport-specific places
          const grouped: Record<string, any[]> = sportIds.size > 0
            ? await getGamesByLocations([...sportIds])
            : {};

          // Find any venues with games not in the sport results (e.g. custom venues)
          const allGameIds = await getActiveLocations();
          const missingIds = allGameIds.filter((id: string) => !sportIds.has(id));

          let allPlaces = [...sportPlaces];
          if (missingIds.length > 0) {
            const extraGames = await getGamesByLocations(missingIds);
            Object.assign(grouped, extraGames);
            // Fetch place details for each missing venue in parallel
            const extraPlaces = await Promise.all(
              missingIds.map((id: string) => getPlace(id).catch(() => null))
            );
            allPlaces = [...sportPlaces, ...extraPlaces.filter(Boolean)];
          }

          if (isActive) {
            setPlaces(allPlaces);
            setGamesByLocation(grouped);
          }
        } catch (error) {
          console.log('Failed to fetch parks:', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchData();
      return () => { isActive = false; };
    }, [sport, radius])
  );

  const handleVenueSearch = (text: string) => {
    setVenueQuery(text);
    if (venueSearchTimeout.current) clearTimeout(venueSearchTimeout.current);
    if (!text.trim()) { setVenueResults([]); return; }
    venueSearchTimeout.current = setTimeout(async () => {
      if (!userCoords) return;
      setVenueSearching(true);
      try {
        const results = await searchPlaces({
          query: text.trim(),
          ll: `${userCoords.latitude},${userCoords.longitude}`,
          radius: radius * 1609,
          limit: 10,
        });
        setVenueResults(results || []);
      } finally {
        setVenueSearching(false);
      }
    }, 350);
  };

  const clearVenueSearch = () => {
    setVenueQuery('');
    setVenueResults([]);
  };

  const getAddress = (place: any) => {
    if (!place?.location) return '';
    const { address, locality, region } = place.location;
    return [address, locality, region].filter(Boolean).join(', ');
  };

  const filteredPlaces = useMemo(() => {
    if (!filterQuery) return places;
    const q = filterQuery.toLowerCase();
    return places.filter((p: any) => (p?.name || '').toLowerCase().includes(q));
  }, [places, filterQuery]);

  const placesWithGames = useMemo(() =>
    filteredPlaces.filter((p: any) => (gamesByLocation[p.fsq_place_id]?.length ?? 0) > 0),
    [filteredPlaces, gamesByLocation]
  );

  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const borderColor = useThemeColor({}, 'cardBorder');
  const cardBg = useThemeColor({}, 'cardBackground');
  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');

  const VenueSearchBar = (
    <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
      <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.xs, color: subtext, marginBottom: 4 }}>
        Find any venue
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.full, borderColor, backgroundColor: surface, paddingHorizontal: Spacing.md }}>
        <Ionicons name="search" size={16} color={subtext} />
        <TextInput
          value={venueQuery}
          onChangeText={handleVenueSearch}
          placeholder="YMCA, gym, community center..."
          placeholderTextColor={subtext}
          style={{ flex: 1, padding: Spacing.sm, color: textColor, fontFamily: 'DMSans_400Regular', fontSize: FontSize.md }}
          autoCapitalize="none"
        />
        {venueSearching ? (
          <ActivityIndicator size="small" color={subtext} />
        ) : venueQuery.length > 0 ? (
          <TouchableOpacity onPress={clearVenueSearch}>
            <Ionicons name="close-circle" size={18} color={subtext} />
          </TouchableOpacity>
        ) : null}
      </View>
      {venueResults.length > 0 && (
        <View style={{
          backgroundColor: surface,
          borderWidth: 1,
          borderColor,
          borderRadius: Radius.lg,
          marginTop: Spacing.xs,
          maxHeight: 240,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          zIndex: 100,
        }}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {venueResults.map((place: any) => (
              <TouchableOpacity
                key={place.fsq_place_id}
                onPress={() => {
                  clearVenueSearch();
                  router.push({ pathname: '/(tabs)/pages/location/[locationID]', params: { locationID: place.fsq_place_id } });
                }}
                style={{ paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: borderColor }}
              >
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.md, color: textColor }}>{place.name}</Text>
                {!!getAddress(place) && (
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.xs, color: subtext, marginTop: 2 }}>{getAddress(place)}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const Controls = (
    <View style={{ gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: borderColor, backgroundColor: surface, paddingBottom: Spacing.md }}>
      {/* Toggle */}
      <View style={{ paddingTop: Spacing.md, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', backgroundColor: borderColor + '55', borderRadius: Radius.full, padding: 3 }}>
          {(['list', 'map'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={{
                paddingVertical: Spacing.xs,
                paddingHorizontal: Spacing.lg,
                borderRadius: Radius.full,
                backgroundColor: viewMode === mode ? surface : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.xs,
              }}
            >
              <Ionicons name={mode === 'list' ? 'list' : 'map-outline'} size={16} color={viewMode === mode ? primary : subtext} />
              <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.sm, color: viewMode === mode ? primary : subtext, textTransform: 'capitalize' }}>
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Venue free-text search */}
      {VenueSearchBar}

      {/* Sport + Radius filters */}
      <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.xs, color: subtext, marginBottom: 4 }}>Radius (mi)</Text>
          <TextInput
            value={radius.toString()}
            onChangeText={text => { const v = Math.max(1, Math.min(Number(text) || 1, 50)); setRadius(v); }}
            keyboardType="numeric"
            style={{ borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, borderColor, color: textColor, fontFamily: 'DMSans_400Regular', backgroundColor: surface }}
          />
        </View>
        <View style={{ flex: 2 }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: FontSize.xs, color: subtext, marginBottom: 4 }}>Sport</Text>
          <Dropdown
            data={SPORT_ITEMS}
            labelField="label"
            valueField="value"
            value={sport}
            onChange={item => setSport(item.value)}
            placeholder="Select sport"
            style={{ borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm, borderColor, backgroundColor: surface }}
            containerStyle={{ borderRadius: Radius.md, backgroundColor: cardBg, borderColor, borderWidth: 1 }}
            itemTextStyle={{ fontSize: FontSize.md, color: textColor }}
            selectedTextStyle={{ fontSize: FontSize.md, color: textColor }}
            activeColor={cardBg}
          />
        </View>
      </View>

      {/* Filter loaded results */}
      <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.full, borderColor, backgroundColor: surface, paddingHorizontal: Spacing.md, marginHorizontal: Spacing.md }}>
        <Ionicons name="filter" size={16} color={subtext} />
        <TextInput
          value={filterQuery}
          onChangeText={setFilterQuery}
          placeholder="Filter results..."
          placeholderTextColor={subtext}
          style={{ flex: 1, padding: Spacing.sm, color: textColor, fontFamily: 'DMSans_400Regular', fontSize: FontSize.md }}
        />
        {filterQuery.length > 0 && (
          <TouchableOpacity onPress={() => setFilterQuery('')}>
            <Ionicons name="close-circle" size={18} color={subtext} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor }}>
        <Header />
        {Controls}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.sm }}>
            Finding parks nearby...
          </Text>
        </View>
      </View>
      </TouchableWithoutFeedback>
    );
  }

  if (viewMode === 'map') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor }}>
        <Header />
        {Controls}
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={userCoords ? {
            latitude: userCoords.latitude,
            longitude: userCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          } : undefined}
          showsUserLocation
        >
          {filteredPlaces.map((place: any) => {
            if (!place.latitude || !place.longitude) return null;
            const games = gamesByLocation[place.fsq_place_id] || [];
            const color = getMarkerColor(games);
            return (
              <Marker
                key={place.fsq_place_id}
                coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              >
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, borderWidth: 2, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 }} />
                <Callout
                  tooltip
                  onPress={() => {
                    setSelectedSport(SPORT_LABEL_MAP[sport] || sport);
                    router.push({ pathname: '/(tabs)/pages/location/[locationID]', params: { locationID: place.fsq_place_id } });
                  }}
                >
                  <View style={{ backgroundColor: surface, borderRadius: Radius.md, padding: Spacing.md, width: 200, borderWidth: 1, borderColor }}>
                    <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.md, color: textColor, marginBottom: 2 }}>{place.name}</Text>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.xs, color: subtext, marginBottom: Spacing.xs }}>{getAddress(place)}</Text>
                    {games.length > 0 ? (
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: FontSize.xs, color: primary }}>
                        {games.length} game{games.length !== 1 ? 's' : ''} · Tap to view
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.xs, color: subtext }}>No games · Tap to create one</Text>
                    )}
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>

        {/* Legend */}
        <View style={{ position: 'absolute', bottom: 100, left: Spacing.md, backgroundColor: surface, borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1, borderColor, gap: 4 }}>
          {[
            { color: '#F97316', label: 'Needs players' },
            { color: '#F59E0B', label: 'Has games' },
            { color: '#9CA3AF', label: 'No games' },
          ].map(({ color, label }) => (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.xs, color: subtext }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
      </TouchableWithoutFeedback>
    );
  }

  // List view
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <View style={{ flex: 1, backgroundColor }}>
      <Header />
      {Controls}
      <ScrollView contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.md }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Collapsible title="Parks with Games">
          {placesWithGames.length > 0 ? (
            placesWithGames.map((place: any) => {
              const games = gamesByLocation[place.fsq_place_id] || [];
              return (
                <TouchableOpacity key={place.fsq_place_id} onPress={() => {
                  setSelectedSport(SPORT_LABEL_MAP[sport] || sport);
                  router.push({ pathname: '/(tabs)/pages/location/[locationID]', params: { locationID: place.fsq_place_id } });
                }}>
                  <Card title={place.name}>
                    <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginBottom: 4 }}>{getAddress(place)}</Text>
                    {games.map((game: any) => (
                      <GameStatusBadge
                        key={game._id}
                        memberCount={game.gameMembers?.length ?? 0}
                        maxPlayers={game.maxPlayers}
                        gameDate={game.date}
                      />
                    ))}
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="basketball-outline" size={40} color={subtext} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.sm }}>No games nearby</Text>
            </View>
          )}
        </Collapsible>

        <Collapsible title="All Parks">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place: any) => (
              <TouchableOpacity key={place.fsq_place_id} onPress={() => {
                setSelectedSport(SPORT_LABEL_MAP[sport] || sport);
                router.push({ pathname: '/(tabs)/pages/location/[locationID]', params: { locationID: place.fsq_place_id } });
              }}>
                <Card title={place.name}>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext }}>{getAddress(place) || 'No address'}</Text>
                </Card>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
              <Ionicons name="location-outline" size={40} color={subtext} />
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginTop: Spacing.sm }}>No parks found</Text>
            </View>
          )}
        </Collapsible>
      </ScrollView>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({});
