import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '../../utils/api';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await login(username, password);
      if (!res.ok) {
        Alert.alert('Login Failed', res?.error || 'Invalid username or password');
        return;
      }
      console.log("Logged in Successfully", res);
      router.replace('/'); // Go to home
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'An unknown error occurred');
    }
  };

  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const textColor = useThemeColor({}, 'text')

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        justifyContent: 'center',
        paddingHorizontal: 24,
      }}
    >
      <View style={{
        backgroundColor: cardBackgroundColor,
        padding: 24,
        borderRadius: 16,
        borderColor: cardBorderColor,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      }}>
        <Text style={{
          fontSize: 28,
          fontWeight: '600',
          marginBottom: 24,
          textAlign: 'center',
          color: textColor,
        }}>Login</Text>

        <TextInput
          style={{
            height: 50,
            borderColor: cardBorderColor,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
            backgroundColor: cardBackgroundColor,
            color: textColor,
          }}
          placeholder="Username"
          placeholderTextColor="#aaa"
          onChangeText={setUsername}
          value={username}
          autoCapitalize="none"
          keyboardType="default"
        />

        <TextInput
          style={{
            height: 50,
            borderColor: cardBorderColor,
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 16,
            marginBottom: 16,
            backgroundColor: cardBackgroundColor,
            color: textColor,
          }}
          placeholder="Password"
          placeholderTextColor="#aaa"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <View style={{ marginTop: 8, marginBottom: 16 }}>
          <Button title="Login" onPress={handleLogin} color="#007AFF" />
        </View>

        <Text
          style={{ color: "#007AFF", marginTop: 16 }}
          onPress={() => router.replace('/(auth)/register')}
        >
          Don't have an account yet? Register
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
