// imports 
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import SocketService from '@/utils/socket';

import { getMessagesForGame } from '@/utils/api';

import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@react-navigation/native';


// types
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

// component
const GameChat: React.FC<GameChatProps> = ({ gameId, userId, username }) => {

  const tintTextColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackgroundColor = useThemeColor({}, 'cardBackground');
  const cardBorderColor = useThemeColor({}, 'cardBorder');
  const cardTextColor = useThemeColor({}, 'cardText');
  const textColor = useThemeColor({}, 'text');


  // all obvious
  const insets = useSafeAreaInsets();
  const bottomSpace = useBottomTabBarHeight();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(show, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hide, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // socket
  useEffect(() => {
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

  // Scroll to bottom when chat becomes visible and messages are loaded
  useEffect(() => {
    if (isVisible && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isVisible]);

  const loadMessages = async () => {
    try {
      const data = await getMessagesForGame(gameId);
      let msgs = data;
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
        <View style={{
          alignSelf: 'center',
          marginVertical: 8,
          padding: 8,
          backgroundColor: backgroundColor,
          borderRadius: 16,
        }}>
          <Text style={{
            fontSize: 12,
            color: tintTextColor,
            fontStyle: 'italic',
          }}>{item.message}</Text>
        </View>
      );
    }

    // else is amessage sent by a person
    return (
      <View style={{
        marginVertical: 4,
        padding: 12,
        borderRadius: 8,
        maxWidth: '90%',
        backgroundColor: isOwnMessage ? '#007AFF' : cardBackgroundColor,
        borderWidth: 1,
        borderColor: isOwnMessage ? '#007AFF' : cardBorderColor,
        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
      }}>
        <Text style={{
          fontSize: 12,
          fontWeight: 'bold',
          marginBottom: 4,
          color: isOwnMessage ? '#fff' : cardTextColor,
        }}>{item.username}</Text>
        <Text style={{
          fontSize: 16,
          color: isOwnMessage ? '#fff' : cardTextColor,
        }}>{item.message}</Text>
        <Text style={{
          fontSize: 10,
          color: isOwnMessage ? '#fff' : cardTextColor,
          marginTop: 4,
          textAlign: 'right',
        }}>
          {new Date(item.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  if (!isVisible) {
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
      style={{ flex: 1, backgroundColor: backgroundColor }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, backgroundColor: backgroundColor, borderColor: cardBorderColor }}>
        <TouchableOpacity
          style={{ 
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            bottom: bottomSpace, 
            backgroundColor: backgroundColor, 
            borderTopWidth: 1, 
            borderBottomWidth: 1, 
            borderTopColor: cardBorderColor,
            borderBottomColor: cardBorderColor
          }}
          onPress={() => setIsVisible(false)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: textColor }}>Game Chat</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: isConnected ? '#4CAF50' : '#F44336',
              marginRight: 8
            }} />
            <Text style={{ fontSize: 20, color: textColor }}>▼</Text>
          </View>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          style={{ flex: 1, backgroundColor: backgroundColor, minHeight: 120, borderBottomWidth: 1, borderColor: cardBorderColor, bottom: bottomSpace }}
          contentContainerStyle={{ padding: 8, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={scrollToBottom}
        />

        <View style={{
          flexDirection: 'row',
          padding: 12,
          borderTopWidth: 1,
          borderTopColor: cardBorderColor,
          alignItems: 'flex-end',
          minHeight: 48,
          backgroundColor: cardBackgroundColor,
          left: 0,
          right: 0,
          ...(keyboardOpen
            ? { position: 'absolute', bottom: 0 }
            : { bottom: bottomSpace })
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: cardBorderColor,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginRight: 8,
              maxHeight: 100,
              backgroundColor: cardBackgroundColor,
              color: cardTextColor,
            }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              opacity: inputText.trim() && isConnected ? 1 : 0.5
            }}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Text style={{ color: textColor, fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default GameChat;