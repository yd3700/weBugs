import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { firestore, auth, storage, createChatRoom } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;

type Message = {
  id: string;
  content: string;
  senderId: string;
  timestamp: firebase.firestore.Timestamp;
};

type Chat = {
  id: string;
  participants: string[];
  lastMessage: Message | null;
  otherUserName: string;
  otherUserProfileImage: string;
  updatedAt: firebase.firestore.Timestamp;
};

const ChatListScreen = () => {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not logged in');
      navigation.navigate('Login');
      return;
    }

    console.log('Current user ID:', user.uid);

    const unsubscribe = firestore.collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(async (snapshot) => {
        console.log('Number of chats:', snapshot.docs.length);
        const fetchedChats: Chat[] = [];
        for (const doc of snapshot.docs) {
          const chatData = doc.data();
          console.log('Chat data:', chatData);
          const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            const otherUserDoc = await firestore.collection('users').doc(otherUserId).get();
            const otherUserData = otherUserDoc.data();
            const otherUserName = otherUserData?.name || 'Unknown User';
            const otherUserProfileImage = otherUserData?.profileImage || '';

            const messages: Message[] = chatData.messages || [];
            let lastMessage: Message | null = null;

            if (messages.length > 0) {
              const lastMessageData = messages[messages.length - 1];
              lastMessage = {
                id: lastMessageData.id,
                content: lastMessageData.content,
                senderId: lastMessageData.senderId,
                timestamp: getTimestamp(lastMessageData.timestamp),
              };
            }

            fetchedChats.push({
              id: doc.id,
              participants: chatData.participants,
              lastMessage,
              otherUserName,
              otherUserProfileImage,
              updatedAt: getTimestamp(chatData.updatedAt),
            });
          }
        }
        console.log('Fetched chats:', fetchedChats);
        setChats(fetchedChats.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()));
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching chats: ", error);
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, [navigation]);

  const getTimestamp = (timestamp: any): firebase.firestore.Timestamp => {
    if (timestamp instanceof firebase.firestore.Timestamp) {
      return timestamp;
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      const seconds = timestamp.seconds || 0;
      const nanoseconds = timestamp.nanoseconds || 0;
      return new firebase.firestore.Timestamp(seconds, nanoseconds);
    } else {
      console.warn('Invalid timestamp format:', timestamp);
      return firebase.firestore.Timestamp.now();
    }
  };

  const formatTimestamp = (timestamp: firebase.firestore.Timestamp): string => {
    return timestamp.toDate().toLocaleString();
  };

  const startChat = async (otherUserId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('User not authenticated');
      return;
    }

    try {
      const chatId = await createChatRoom(currentUser.uid, otherUserId);
      navigation.navigate('Chat', { chatId, otherUserId });
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  const renderItem = ({ item }: { item: Chat }) => {
    const otherUserId = item.participants.find(id => id !== auth.currentUser?.uid);
    
    // 'otherUserId'가 undefined일 경우 처리
    if (!otherUserId) {
      return null;
    }

    return (
      <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item.id, otherUserId })}>
        <View style={styles.chatItem}>
          <Image source={{ uri: item.otherUserProfileImage }} style={styles.profileImage} />
          <View style={styles.chatInfo}>
            <Text style={styles.userName}>{item.otherUserName}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage ? item.lastMessage.content : 'No messages'}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {item.lastMessage 
              ? formatTimestamp(item.lastMessage.timestamp) 
              : formatTimestamp(item.updatedAt)}
          </Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>채팅방이 없습니다.</Text>}
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
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
  },
});

export default ChatListScreen;
