import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { resetPassword } from '../../utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import AppButton from '@/components/AppButton';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token, email } = useLocalSearchParams<{ token: string; email: string }>();

  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');

  useEffect(() => {
    if (!token || !email) { Alert.alert('Error', 'Invalid reset link'); router.back(); }
  }, [token, email]);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) { Alert.alert('Error', 'Please fill in all fields'); return; }
    if (newPassword !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
    if (newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await resetPassword(email || '', token || '', newPassword);
      if (!res.ok) { Alert.alert('Error', res?.error || 'Failed to reset password'); return; }
      Alert.alert('Success', 'Your password has been reset.');
      router.replace('/(auth)/login');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    height: 50,
    borderColor: cardBorder,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: surface,
    color: textColor,
    fontSize: FontSize.md,
    fontFamily: 'DMSans_400Regular',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor, justifyContent: 'center', paddingHorizontal: Spacing.xl }}
    >
      <View style={{ backgroundColor: surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor, marginBottom: Spacing.xs }}>
          New password
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.sm, color: subtext, marginBottom: Spacing.lg }}>
          Choose a strong password for your account.
        </Text>

        <TextInput style={inputStyle} placeholder="New password" placeholderTextColor={subtext} onChangeText={setNewPassword} value={newPassword} secureTextEntry editable={!loading} />
        <TextInput style={inputStyle} placeholder="Confirm password" placeholderTextColor={subtext} onChangeText={setConfirmPassword} value={confirmPassword} secureTextEntry editable={!loading} />

        <AppButton title="Reset Password" onPress={handleReset} loading={loading} />

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: Spacing.md }}>
          <Text style={{ fontFamily: 'DMSans_500Medium', color: primary, textAlign: 'center', fontSize: FontSize.sm }}>
            Back to login
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
