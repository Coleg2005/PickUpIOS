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
  Keyboard,
  Alert
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import SocketService from '@/utils/socket';
import ReportModal from '@/components/ReportModal';

import { getMessagesForGame, getBlockedUsers, blockUser } from '@/utils/api';

import { useThemeColor } from '@/hooks/useThemeColor';


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
  const primary = useThemeColor({}, 'primary');
  const surface = useThemeColor({}, 'surface');
  const subtext = useThemeColor({}, 'subtext');


  // all obvious
  const bottomSpace = useBottomTabBarHeight();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [reportedMessage, setReportedMessage] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);
  // Ref so the socket message handler always sees the current blocked list
  const blockedIdsRef = useRef<string[]>([]);

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
    const socket = SocketService.connect(gameId);

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Load initial messages and the blocked list (server already filters
    // history; the list is used to filter live messages client-side)
    loadMessages();
    getBlockedUsers().then((blocked: any[]) => {
      blockedIdsRef.current = (blocked || []).map((b: any) => b._id);
    });

    // Listen for new messages
    SocketService.onMessage((newMessage: Message) => {
      if (blockedIdsRef.current.includes(newMessage.userId)) return;
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
      // The server broadcasts the message back to the room (including us), which appends it
      SocketService.sendMessage(gameId, inputText.trim());
      setInputText('');
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Long-press on someone else's message: report it or block the sender
  const handleMessageActions = (message: Message) => {
    Alert.alert(message.username, message.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report Message', onPress: () => setReportedMessage(message) },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: async () => {
          const res = await blockUser(message.userId);
          if (res) {
            blockedIdsRef.current = [...blockedIdsRef.current, message.userId];
            setMessages(prev => prev.filter(m => m.userId !== message.userId));
          }
        },
      },
    ]);
  };

  // Preprocess messages to inject date system messages
  const getMessagesWithDateSeparators = (msgs: Message[]) => {
    if (!msgs.length) return [];
    const result: Message[] = [];
    let lastDate: string | null = null;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    msgs.forEach((msg) => {
      const msgDate = new Date(msg.timestamp).toDateString();
      let label = msgDate;
      if (msgDate === todayStr) {
        label = 'Today';
      } else if (msgDate === yesterdayStr) {
        label = 'Yesterday';
      }
      if (msgDate !== lastDate) {
        result.push({
          _id: `date-separator-${msgDate}`,
          gameId: msg.gameId,
          userId: 'system',
          username: 'System',
          message: label,
          timestamp: msg.timestamp,
          messageType: 'system',
        });
        lastDate = msgDate;
      }
      result.push(msg);
    });
    return result;
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

    // else is a message sent by a person

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isOwnMessage}
        onLongPress={() => handleMessageActions(item)}
        style={{
        marginVertical: 0,
        padding: 12,
        borderRadius: 8,
        maxWidth: '90%',
        backgroundColor: isOwnMessage ? primary : cardBackgroundColor,
        borderWidth: 1,
        borderColor: isOwnMessage ? primary : cardBorderColor,
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
      </TouchableOpacity>
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
          backgroundColor: surface,
          borderRadius: 16,
          paddingHorizontal: 16,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: cardBorderColor,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 4,
          bottom: bottomSpace
        }}>
          <Text style={{ fontSize: 20, color: subtext }}>▲</Text>
          <Text style={{ marginLeft: 8, color: textColor, fontFamily: 'DMSans_600SemiBold' }}>Show Chat</Text>
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
          activeOpacity={1}
        >
          <Text style={{ fontSize: 18, fontFamily: 'DMSans_700Bold', color: textColor }}>Game Chat</Text>
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
          data={getMessagesWithDateSeparators(messages)}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          style={{ flex: 1, backgroundColor: backgroundColor, minHeight: 120, borderColor: cardBorderColor, bottom: bottomSpace }}
          contentContainerStyle={{ padding: 8, flexGrow: 1, justifyContent: 'flex-end' }}
          onContentSizeChange={scrollToBottom}
        />

        <View style={{
          flexDirection: 'row',
          paddingBottom: 6,
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
              backgroundColor: primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
              opacity: inputText.trim() && isConnected ? 1 : 0.5
            }}
            onPress={sendMessage}
            disabled={!inputText.trim() || !isConnected}
          >
            <Text style={{ color: '#fff', fontFamily: 'DMSans_600SemiBold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ReportModal
        visible={!!reportedMessage}
        onClose={() => setReportedMessage(null)}
        contentType="message"
        contentId={reportedMessage?._id}
        targetName={reportedMessage?.username}
      />
    </KeyboardAvoidingView>
  );
};

export default GameChat;