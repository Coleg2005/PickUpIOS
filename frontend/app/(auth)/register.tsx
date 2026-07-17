import React, { useState } from 'react';
import { View, TextInput, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { register, API_BASE_URL } from '../../utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';
import AppButton from '@/components/AppButton';
import { Radius, Spacing, FontSize } from '@/constants/Theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const backgroundColor = useThemeColor({}, 'background');
  const surface = useThemeColor({}, 'surface');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text');
  const subtext = useThemeColor({}, 'subtext');
  const primary = useThemeColor({}, 'primary');

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

  const handleRegister = async () => {
    setLoading(true);
    try {
      const res = await register(username, email, password);
      if (!res.ok) {
        Alert.alert('Register Failed', res?.error || 'Something went wrong');
        return;
      }
      router.replace('/');
    } catch (err) {
      Alert.alert('Register Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl }}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 36, color: primary, textAlign: 'center', marginBottom: Spacing.xs }}>
        PickUp
      </Text>
      <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: FontSize.md, color: subtext, textAlign: 'center', marginBottom: Spacing.xl }}>
        Find your next game
      </Text>

      <View style={{ backgroundColor: surface, padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 1, borderColor: cardBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
        <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: FontSize.xxl, color: textColor, marginBottom: Spacing.lg }}>
          Create account
        </Text>

        <TextInput style={inputStyle} placeholder="Username" placeholderTextColor={subtext} onChangeText={setUsername} value={username} autoCapitalize="none" autoCorrect={false} textContentType="username" autoComplete="username-new" editable={!loading} />
        <TextInput style={inputStyle} placeholder="Email" placeholderTextColor={subtext} onChangeText={setEmail} value={email} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" editable={!loading} />
        <TextInput style={inputStyle} placeholder="Password" placeholderTextColor={subtext} onChangeText={setPassword} value={password} secureTextEntry textContentType="newPassword" autoComplete="password-new" editable={!loading} />

        <AppButton title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: Spacing.xs }} />

        {/* Agreement to the ToS at sign-up is required for UGC apps (App Store guideline 1.2) */}
        <Text style={{ fontFamily: 'DMSans_400Regular', color: subtext, textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.md }}>
          By creating an account you agree to our{' '}
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: primary }}
            onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/terms`)}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={{ fontFamily: 'DMSans_600SemiBold', color: primary }}
            onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/privacy`)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: Spacing.lg }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', color: subtext, textAlign: 'center', fontSize: FontSize.sm }}>
          Already have an account?{' '}
          <Text style={{ fontFamily: 'DMSans_600SemiBold', color: primary }}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
