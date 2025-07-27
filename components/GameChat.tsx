import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';

import io from 'socket.io-client';

import { getMessagesForGame, sendGameMessage, API_BASE_URL } from '../utils/api'; // adjust path as needed

const socket = io(`http://${API_BASE_URL}:3000`); // match API_BASE_URL

export default function GameChat({ gameId: string, userId: string }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();

  useEffect(() => {
    socket.emit('join-room', gameId);

    // Fetch initial messages
    (async () => {
      const data = await getMessagesForGame(gameId);
      setMessages(data);
    })();

    // Listen for real-time messages
    socket.on('new-message', (msg) => {
      if (msg.gameId === gameId) {
        setMessages(prev => [...prev, msg]);
      }
    });

    // Clean up on unmount
    return () => {
      socket.off('new-message');
    };
  }, [gameId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendGameMessage(gameId, userId, input, 'text');
    setInput('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        ref={flatListRef}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <Text style={styles.message}>{item.message}</Text>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { padding: 10 },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: { flex: 1, borderWidth: 1, padding: 10, marginRight: 10 },
});
