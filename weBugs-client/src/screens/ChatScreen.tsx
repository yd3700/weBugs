import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Message, User } from '../types/navigation';
import { auth, firestore, createChatMessage } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const lastReadTimestampRef = useRef<firebase.firestore.Timestamp | null>(null);

  const { chatId, otherUserId } = route.params;

  useEffect(() => {
    if (!chatId || !otherUserId) {
      setError('채팅 정보가 올바르지 않습니다.');
      return;
    }

    const fetchOtherUserData = async () => {
      try {
        const userDoc = await firestore.collection('users').doc(otherUserId).get();
        if (userDoc.exists) {
          setOtherUser(userDoc.data() as User);
        } else {
          setError('상대방 정보를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error("Error fetching other user data:", error);
        setError('상대방 정보를 가져오는 중 오류가 발생했습니다.');
      }
    };

    fetchOtherUserData();

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('사용자 인증이 필요합니다.');
      return;
    }

    const lastReadTimestamp = firebase.firestore.Timestamp.now();
    lastReadTimestampRef.current = lastReadTimestamp;

    const unsubscribe = firestore.collection('chats').doc(chatId)
      .onSnapshot(async (snapshot) => {
        if (snapshot.exists) {
          const data = snapshot.data();
          if (data && data.messages) {
            console.log('Messages data:', data.messages); // 로그 추가
            setMessages(data.messages);
            
            // 읽음 상태 업데이트
            const updatedMessages = data.messages.map((msg: Message) => ({
              ...msg,
              read: msg.timestamp <= lastReadTimestamp || msg.senderId === currentUser.uid
            }));
            
            // Firestore 업데이트
            await firestore.collection('chats').doc(chatId).update({
              messages: updatedMessages,
              [`lastRead.${currentUser.uid}`]: lastReadTimestamp
            });
          }
        } else {
          setError('채팅을 불러올 수 없습니다.');
        }
      }, (error) => {
        console.error("Error fetching chat:", error);
        setError(`채팅을 불러오는 중 오류 발생: ${error.message}`);
      });

    return () => unsubscribe();
  }, [chatId, otherUserId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError('사용자 인증이 필요합니다.');
      return;
    }

    try {
      await createChatMessage(chatId, user.uid, otherUserId, newMessage.trim());
      setNewMessage('');
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(`메시지 전송 중 오류 발생: ${error.message}`);
    }
  };

  const formatTimestamp = (timestamp: firebase.firestore.Timestamp | Date | { seconds: number; nanoseconds: number } | string | null): string => {
    if (timestamp instanceof firebase.firestore.Timestamp) {
      return timestamp.toDate().toLocaleString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    } else if (typeof timestamp === 'object' && timestamp !== null && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return 'Invalid date';
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === auth.currentUser?.uid;
    const displayTimestamp = formatTimestamp(item.timestamp);

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUser : styles.otherUser]}>
        {!isCurrentUser && otherUser && (
          <Image source={{ uri: otherUser.profileImage }} style={styles.avatar} />
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
          <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
            {displayTimestamp}
          </Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="메시지 입력"
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>전송</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messageList: {
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 5,
    marginHorizontal: 10,
  },
  currentUser: {
    justifyContent: 'flex-end',
  },
  otherUser: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  messageContent: {
    maxWidth: '70%',
  },
  messageBubble: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  currentUserBubble: {
    backgroundColor: '#DCF8C6',
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  currentUserTimestamp: {
    alignSelf: 'flex-end',
  },
  otherUserTimestamp: {
    alignSelf: 'flex-start',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
  },
  input: {
    flex: 1,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0084FF',
    borderRadius: 20,
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChatScreen;