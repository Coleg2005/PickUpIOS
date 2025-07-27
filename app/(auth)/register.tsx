import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '../../utils/api';

import { useThemeColor } from '@/hooks/useThemeColor';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      const res = await register(username, password)
      if (!res.ok) {
        Alert.alert('Register Failed', res?.error || 'Invalid username or password');
        return;
      }
      console.log("Registered Successfully", res);
      router.replace('/'); // Go to home
    } catch (err) {
      console.log('fetch err', err)
      Alert.alert('Register Failed', err instanceof Error ? err.message : 'An unknown error occurred');
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
        }}>Register</Text>

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
          <Button title="Register" onPress={handleRegister} color="#007AFF" />
        </View>

        <Text
          style={{ color: "#007AFF", marginTop: 16 }}
          onPress={() => router.replace('/(auth)/login')}
        >
          Already have an account? Login
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

