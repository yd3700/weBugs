import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { firestore, auth } from '../../firebaseConfig';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

type Chat = {
  id: string;
  participants: string[];
  lastMessage: string;
  lastTimestamp: any; // 'any'로 지정하여 다양한 타입을 허용합니다.
};

const ChatListScreen = () => {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const chatsRef = firestore.collection('chats');
        const snapshot = await chatsRef.where('participants', 'array-contains', user.uid).get();
        const fetchedChats: Chat[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        console.log("Fetched chats: ", fetchedChats); // 데이터 확인을 위한 로그
        setChats(fetchedChats);
      } catch (error) {
        console.error("Error fetching chat list: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, []);

  const renderItem = ({ item }: { item: Chat }) => {
    // lastTimestamp를 Date 객체로 변환합니다.
    const displayTimestamp = item.lastTimestamp instanceof Date
      ? item.lastTimestamp
      : item.lastTimestamp?.toDate ? item.lastTimestamp.toDate() : new Date(item.lastTimestamp);

    return (
      <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item.id })}>
        <View style={styles.chatItem}>
          <Text style={styles.chatText}>{item.lastMessage}</Text>
          {item.lastTimestamp && (
            <Text style={styles.timestamp}>{displayTimestamp.toLocaleString()}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No chats available</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  chatText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ChatListScreen;
