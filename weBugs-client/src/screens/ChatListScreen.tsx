import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { firestore, auth } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';

type ChatListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatList'>;

type Message = {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: firebase.firestore.Timestamp;
  read: boolean;
  media?: {
    type: 'photo' | 'video';
    url: string;
  };
};

type ChatListItem = {
  id: string;
  participants: string[];
  lastMessage: Message | null;
  otherUserName: string;
  otherUserProfilePicture: string;
  updatedAt: firebase.firestore.Timestamp;
  unreadCount: number;
  hidden?: boolean;
  collectionRejected?: boolean;
};

type ChatListScreenProps = {
  setTotalUnreadCount: (count: number) => void;
};

const ChatListScreen: React.FC<ChatListScreenProps> = ({ setTotalUnreadCount }) => {
  const navigation = useNavigation<ChatListScreenNavigationProp>();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not logged in');
      navigation.navigate('Login');
      return;
    }

    const unsubscribe = firestore.collection('chats')
      .where('participants', 'array-contains', user.uid)
      .onSnapshot(async (snapshot) => {
        const fetchedChats: ChatListItem[] = [];
        let totalUnread = 0;

        for (const doc of snapshot.docs) {
          const chatData = doc.data();
          if (chatData.deleted) continue;
          if (chatData.collectionCompleted && !chatData.collectionRejected) continue;

          const otherUserId = chatData.participants.find((id: string) => id !== user.uid);
          
          if (otherUserId) {
            const otherUserDoc = await firestore.collection('users').doc(otherUserId).get();
            const otherUserData = otherUserDoc.data();
            const messages: Message[] = chatData.messages || [];
            
            const unreadCount = messages.filter(msg => 
              msg.recipientId === user.uid && !msg.read
            ).length;

            totalUnread += unreadCount;

            fetchedChats.push({
              id: doc.id,
              participants: chatData.participants,
              lastMessage: messages.length > 0 ? messages[messages.length - 1] : null,
              otherUserName: otherUserData?.name || 'Unknown User',
              otherUserProfilePicture: otherUserData?.profilePicture || '',
              updatedAt: chatData.updatedAt,
              unreadCount,
              hidden: chatData.hidden || false,
              collectionRejected: chatData.collectionRejected || false,
            });
          }
        }

        setChats(fetchedChats.sort((a, b) => b.updatedAt.toMillis() - a.updatedAt.toMillis()));
        setTotalUnreadCount(totalUnread);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching chats: ", error);
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, [navigation, setTotalUnreadCount]);

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

  const renderItem = ({ item }: { item: ChatListItem }) => {
    const otherUserId = item.participants.find(id => id !== auth.currentUser?.uid);
    
    if (!otherUserId) return null;

    const renderAvatar = () => {
      if (item.otherUserProfilePicture) {
        return <Image source={{ uri: item.otherUserProfilePicture }} style={styles.profileImage} />;
      } else {
        return (
          <View style={[styles.profileImage, styles.defaultAvatar]}>
            <Text style={styles.defaultAvatarText}>{item.otherUserName.charAt(0).toUpperCase()}</Text>
          </View>
        );
      }
    };

    const getLastMessageContent = (message: Message | null) => {
      if (!message) return 'No messages';
      if (message.media) {
        return message.media.type === 'photo' ? '사진을 보냈습니다' : '동영상을 보냈습니다';
      }
      return message.content;
    };

    return (
      <TouchableOpacity onPress={() => navigation.navigate('Chat', { chatId: item.id, otherUserId })}>
        <View style={styles.chatItem}>
          {renderAvatar()}
          <View style={styles.chatInfo}>
            <Text style={styles.userName}>{item.otherUserName}</Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {getLastMessageContent(item.lastMessage)}
            </Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={styles.timestamp}>
              {item.lastMessage 
                ? formatTimestamp(item.lastMessage.timestamp)
                : formatTimestamp(item.updatedAt)}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
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
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#ffffff',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  defaultAvatar: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 22,
    color: '#fff',
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
  rightContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
});

export default ChatListScreen;