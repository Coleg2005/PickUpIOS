import React from 'react';
import { View, Text, Image } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { FontWeight } from '@/constants/Theme';

type Props = {
  username?: string;
  imageUri?: string | null;
  size?: number;
};

export default function Avatar({ username, imageUri, size = 48 }: Props) {
  const cardBorder = useThemeColor({}, 'cardBorder');
  const primary = useThemeColor({}, 'primary');

  const initials = username?.[0]?.toUpperCase() || '?';
  const fontSize = size * 0.4;

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: primary + '22',
      borderWidth: 1.5,
      borderColor: cardBorder,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={{
          fontSize,
          fontWeight: FontWeight.bold,
          fontFamily: 'DMSans_700Bold',
          color: primary,
        }}>
          {initials}
        </Text>
      )}
    </View>
  );
}
