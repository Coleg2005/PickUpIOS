import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { Radius, Spacing, FontSize, FontWeight } from '@/constants/Theme';

type CardProps = {
  readonly title?: string;
  readonly children?: React.ReactNode;
};

export default function Card({ title, children }: CardProps) {
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const textColor = useThemeColor({}, 'cardText');
  const borderColor = useThemeColor({}, 'cardBorder');

  return (
    <View style={[styles.card, { backgroundColor, borderColor }]}>
      {title && <Text style={[styles.title, { color: textColor, fontFamily: 'DMSans_600SemiBold' }]}>{title}</Text>}
      <View style={styles.body}>
        {React.isValidElement(children) && children.type === Text ? (
          <Text style={{ color: textColor, fontFamily: 'DMSans_400Regular', fontSize: FontSize.md }}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  body: {
    marginTop: 2,
  },
});
