import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList, Message } from '../types/navigation';
import { auth, firebase, firestore } from '../../firebaseConfig';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { chatId } = route.params;
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = firestore.collection('chats').doc(chatId)
      .onSnapshot(snapshot => {
        if (snapshot.exists) {
          const data = snapshot.data();
          setMessages(data?.messages || []);
        }
      });

    return () => unsubscribe();
  }, [chatId]);

  useLayoutEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') {
      setError('메시지를 입력하세요.');
      return;
    }

    setError(null);
    const user = auth.currentUser;
    if (!user) return;

    const newMessageData: Message = {
      content: newMessage,
      senderId: user.uid,
      timestamp: new Date().toISOString(),
    };

    const chatRef = firestore.collection('chats').doc(chatId);
    try {
      await chatRef.update({
        messages: firebase.firestore.FieldValue.arrayUnion(newMessageData),
      });
      setNewMessage('');
      scrollToBottom();
    } catch (error: any) {
      if (error.code === 'not-found') {
        try {
          await chatRef.set({
            messages: [newMessageData],
            participants: [user.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
          setNewMessage('');
          scrollToBottom();
        } catch (setError: any) {
          setError(setError.message);
        }
      } else {
        setError(error.message);
      }
    }
  };

  const renderMessages = () => {
    return messages.map((item, index) => {
      const isCurrentUser = item.senderId === auth.currentUser?.uid;
      return (
        <View key={index} style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.theirMessage]}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContent}
        onContentSizeChange={scrollToBottom}
      >
        {renderMessages()}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="메시지 입력"
        />
        <Button title="전송" onPress={handleSendMessage} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    maxWidth: '70%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 10,
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
});

export default ChatScreen;