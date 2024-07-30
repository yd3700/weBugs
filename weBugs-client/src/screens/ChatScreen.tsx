// src/screens/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import { firestore, firebase } from '../../firebaseConfig'; // Firebase imports

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { chatId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = firestore.collection('chats').doc(chatId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          setMessages(data?.messages || []);
        }
      });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') {
      setError('메시지를 입력하세요.');
      return;
    }
    setError(null);
    try {
      const messageRef = firestore.collection('chats').doc(chatId);
      const newMessageData = {
        content: newMessage,
        timestamp: new Date().toISOString(), // ISO 문자열로 저장
      };
      await messageRef.update({
        messages: firebase.firestore.FieldValue.arrayUnion(newMessageData),
      });
      setNewMessage('');
    } catch (error: any) {
      setError(error.message);
      // 문서가 없는 경우 새로 생성
      if (error.code === 'not-found') {
        try {
          const messageRef = firestore.collection('chats').doc(chatId);
          const newMessageData = {
            content: newMessage,
            timestamp: new Date().toISOString(), // ISO 문자열로 저장
          };
          await messageRef.set({
            messages: [newMessageData],
          });
          setNewMessage('');
        } catch (setError: any) {
          setError(setError.message);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <Text>{item.content}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
            </Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <TextInput
        style={styles.input}
        placeholder="메시지를 입력하세요"
        value={newMessage}
        onChangeText={setNewMessage}
      />
      <Button title="전송" onPress={handleSendMessage} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
});

export default ChatScreen;
