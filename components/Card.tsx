import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

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
      {title && <Text style={[styles.title, { color: textColor }]}>{title}</Text>}
      <View style={styles.body}>
        {React.isValidElement(children) && children.type === Text ? (
          <Text style={{ color: textColor }}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    marginRight: 20,
    borderWidth: 1,
    // optional: shadow (looks better in light mode)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4, // Android
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    marginTop: 4,
  },
});
