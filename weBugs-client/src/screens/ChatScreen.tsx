import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { auth, firebase, firestore } from '../../firebaseConfig';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Message = {
  content: string;
  senderId: string;
  timestamp: any;
};

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { chatId } = route.params;
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const chatRef = firestore.collection('chats').doc(chatId);
        const snapshot = await chatRef.get();
        if (snapshot.exists) {
          const data = snapshot.data();
          setMessages(data?.messages || []);
        }
      } catch (error) {
        console.error("Error fetching messages: ", error);
      }
    };

    fetchMessages();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') {
      setError('메시지를 입력하세요.');
      return;
    }
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const messageRef = firestore.collection('chats').doc(chatId);
      const newMessageData = {
        content: newMessage,
        senderId: user.uid,
        timestamp: new Date().toISOString(),
      };

      await messageRef.update({
        messages: firebase.firestore.FieldValue.arrayUnion(newMessageData),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setNewMessage('');
      setMessages([...messages, newMessageData]);
    } catch (error: any) {
      const user = auth.currentUser;
      if (!user) return;

      const newMessageData = {
        content: newMessage,
        senderId: user.uid,
        timestamp: new Date().toISOString(),
      };

      if (error.code === 'not-found') {
        const chatRef = firestore.collection('chats').doc(chatId);
        await chatRef.set({
          messages: [newMessageData],
          participants: [user.uid],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        setMessages([newMessageData]);
      } else {
        setError(error.message);
      }
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === auth.currentUser?.uid;
    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.theirMessage]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        style={styles.messageList}
      />
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
    padding: 10,
  },
  messageList: {
    flex: 1,
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
    padding: 5,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ChatScreen;
