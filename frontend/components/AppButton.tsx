import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Radius, FontSize, FontWeight, Spacing } from '@/constants/Theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({ title, onPress, variant = 'primary', loading = false, disabled = false, style }: Props) {
  const primary = useThemeColor({}, 'primary');
  const danger = useThemeColor({}, 'danger');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const text = useThemeColor({}, 'text');
  const surface = useThemeColor({}, 'surface');

  const configs: Record<Variant, { bg: string; labelColor: string; borderColor?: string }> = {
    primary:   { bg: primary,   labelColor: '#fff' },
    secondary: { bg: surface,   labelColor: text,    borderColor: cardBorder },
    danger:    { bg: danger,    labelColor: '#fff' },
    ghost:     { bg: 'transparent', labelColor: primary, borderColor: 'transparent' },
  };

  const { bg, labelColor, borderColor } = configs[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[{
        backgroundColor: bg,
        borderRadius: Radius.lg,
        borderWidth: borderColor ? 1 : 0,
        borderColor: borderColor,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        flexDirection: 'row',
        gap: Spacing.sm,
      }, style]}
    >
      {loading && <ActivityIndicator size="small" color={labelColor} />}
      <Text style={{
        color: labelColor,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        fontFamily: 'DMSans_600SemiBold',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
