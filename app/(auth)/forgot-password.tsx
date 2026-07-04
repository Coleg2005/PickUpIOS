import React, { useState } from 'react';
import { View, TextInput, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { forgotPassword } from '../../utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import AppButton from '@/components/AppButton';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');

  const handleForgotPassword = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email address'); return; }
    setLoading(true);
    try {
      const res = await forgotPassword(email.toLowerCase());
      if (!res.ok) { Alert.alert('Error', res?.error || 'Failed to process request'); return; }
      Alert.alert('Check your email', 'If an account exists with this email, you will receive a reset link.');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor, justifyContent: 'center', paddingHorizontal: Spacing.xl }}
    >
      <View style={{ backgroundColor: surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor, marginBottom: Spacing.xs }}>
          Reset password
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.lg }}>
          Enter your email and we&apos;ll send you a reset link.
        </Text>

        <TextInput
          style={{ height: 50, borderColor: cardBorder, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, backgroundColor: surface, color: textColor, fontSize: FontSize.md, fontFamily: 'DMSans_400Regular' }}
          placeholder="Email address"
          placeholderTextColor={subtext}
          onChangeText={setEmail}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />

        <AppButton title="Send Reset Link" onPress={handleForgotPassword} loading={loading} />

        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', color: primary, textAlign: 'center', fontSize: FontSize.sm }}>
            Back to login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
