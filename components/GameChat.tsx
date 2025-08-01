// components/GameChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import SocketService from '@/utils/socket';

import { getMessagesForGame } from '@/utils/api';

interface Message {
  _id: string;
  gameId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  messageType: 'text' | 'system';
}

interface GameChatProps {
  gameId: string;
  userId: string;
  username: string;
}


const GameChat: React.FC<GameChatProps> = ({ gameId, userId, username }) => {

  const insets = useSafeAreaInsets();
  const bottomSpace = useBottomTabBarHeight();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Connect to socket and join game room
    const socket = SocketService.connect(gameId, userId);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Load initial messages
    loadMessages();

    // Listen for new messages
    SocketService.onMessage((newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    });

    // Listen for user events
    SocketService.onUserJoined((user) => {
      const systemMessage: Message = {
        _id: `system-${Date.now()}`,
        gameId,
        userId: 'system',
        username: 'System',
        message: `${user.username} joined the game`,
        timestamp: new Date(),
        messageType: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    SocketService.onUserLeft((user) => {
      const systemMessage: Message = {
        _id: `system-${Date.now()}`,
        gameId,
        userId: 'system',
        username: 'System',
        message: `${user.username} left the game`,
        timestamp: new Date(),
        messageType: 'system'
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    return () => {
      SocketService.removeAllListeners();
      SocketService.disconnect();
    };
  }, [gameId, userId]);

  const loadMessages = async () => {
    try {
      const data = await getMessagesForGame(gameId);
      // If data is an array, use it directly; otherwise, try data.messages
      let msgs = Array.isArray(data) ? data : data.messages || [];
      // Ensure timestamps are Date objects
      msgs = msgs.map((msg: any) => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }));
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    if (inputText.trim() && isConnected) {
      // Optimistically add the message to the UI
      const newMsg: Message = {
        _id: `local-${Date.now()}`,
        gameId,
        userId,
        username,
        message: inputText.trim(),
        timestamp: new Date(),
        messageType: 'text',
      };
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
      SocketService.sendMessage(gameId, userId, username, inputText.trim());
      setInputText('');
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.userId === userId;
    const isSystemMessage = item.messageType === 'system';

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.message}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  if (!isVisible) {
    // Only show a floating chevron button when hidden
    return (
      <TouchableOpacity
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          zIndex: 1000,
          padding: 8,
        }}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <View style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: '#ccc',
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          bottom: bottomSpace
        }}>
          <Text style={{ fontSize: 20, color: '#222' }}>▲</Text>
          <Text style={{ marginLeft: 8, color: '#222', fontWeight: 'bold' }}>Show Chat</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#fff' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' }}>
        <TouchableOpacity
          style={[styles.header, { bottom: bottomSpace, backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
          onPress={() => setIsVisible(false)}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerText, { color: '#222' }]}>Game Chat</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[
              styles.connectionStatus,
              { backgroundColor: isConnected ? '#4CAF50' : '#F44336', marginRight: 8 }
            ]} />
            <Text style={{ fontSize: 20, color: '#222' }}>▼</Text>
          </View>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          style={{ flex: 1, backgroundColor: '#fff', minHeight: 120, borderBottomWidth: 1, borderColor: '#ccc', bottom: bottomSpace }}
          contentContainerStyle={{ padding: 8, flexGrow: 1, justifyContent: 'flex-end', paddingBottom: bottomSpace }}
          onContentSizeChange={scrollToBottom}
        />

        <View style={[
          styles.inputContainer,
          {
            backgroundColor: '#f5f5f5',
            borderTopWidth: 1,
            borderTopColor: '#ccc',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: insets.bottom + 48,
          },
        ]}>
          <TextInput
            style={[styles.textInput, { backgroundColor: '#fff', color: '#222', borderColor: '#bbb' }]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim() && isConnected ? 1 : 0.5 }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  messagesList: {
    flex: 1,
    padding: 0,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
    maxWidth: '90%',
    backgroundColor: '#e9e9e9',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
  systemMessage: {
    alignSelf: 'center',
    marginVertical: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    backgroundColor: '#fff',
    color: '#222',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default GameChat;