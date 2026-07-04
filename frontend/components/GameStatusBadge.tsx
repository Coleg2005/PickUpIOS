import React from 'react';
import { View, Text } from 'react-native';
import { FontSize, FontWeight, Spacing, Radius } from '@/constants/Theme';
import { useThemeColor } from '@/hooks/useThemeColor';

type Props = {
  memberCount: number;
  maxPlayers?: number | null;
  gameDate: Date | string;
};

const SOON_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

function getStatus(memberCount: number, maxPlayers: number | null | undefined, gameDate: Date | string) {
  const date = new Date(gameDate);
  const now = new Date();
  const msUntilGame = date.getTime() - now.getTime();
  const isSoon = msUntilGame > 0 && msUntilGame <= SOON_THRESHOLD_MS;
  const isFull = maxPlayers != null && memberCount >= maxPlayers;
  const needsPlayers = isSoon && !isFull && (maxPlayers == null || memberCount < maxPlayers * 0.5);

  return { isSoon, isFull, needsPlayers };
}

export default function GameStatusBadge({ memberCount, maxPlayers, gameDate }: Props) {
  const primary = useThemeColor({}, 'primary');
  const danger = useThemeColor({}, 'danger');
  const subtext = useThemeColor({}, 'subtext');
  const cardBorder = useThemeColor({}, 'cardBorder');

  const { isSoon, isFull, needsPlayers } = getStatus(memberCount, maxPlayers, gameDate);

  const badges = [];

  // Player count badge
  const countLabel = maxPlayers != null ? `${memberCount}/${maxPlayers}` : `${memberCount} player${memberCount !== 1 ? 's' : ''}`;
  badges.push({ label: countLabel, color: subtext, bg: cardBorder + '55' });

  if (isFull) {
    badges.push({ label: 'FULL', color: '#fff', bg: danger });
  } else if (needsPlayers) {
    badges.push({ label: 'NEEDS PLAYERS', color: '#fff', bg: '#F59E0B' });
  } else if (isSoon) {
    badges.push({ label: 'STARTING SOON', color: '#fff', bg: primary });
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs }}>
      {badges.map((badge) => (
        <View key={badge.label} style={{ backgroundColor: badge.bg, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 }}>
          <Text style={{ color: badge.color, fontSize: FontSize.xs, fontFamily: 'DMSans_600SemiBold', fontWeight: FontWeight.semibold }}>
            {badge.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
