import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Message, User } from '../types/navigation';
import { auth, firestore, createChatMessage, uploadMedia, sendCollectionCompleteMessage, hideChatRoom } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MessageItem from '../components/MessageItem';
import MediaOptions from '../components/MediaOptions';
import CompletionModal from '../components/CompletionModal';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type DateSeparator = {
  type: 'date';
  date: string;
};

type ChatItem = Message | DateSeparator;

const addDateSeparators = (messages: Message[]): ChatItem[] => {
  const messagesWithDates: ChatItem[] = [];
  let currentDate = '';

  messages.forEach((message) => {
    const messageDate = formatDate(message.timestamp);
    if (messageDate !== currentDate) {
      messagesWithDates.push({ type: 'date', date: messageDate });
      currentDate = messageDate;
    }
    messagesWithDates.push(message);
  });

  return messagesWithDates;
};

const formatDate = (timestamp: firebase.firestore.Timestamp): string => {
  return timestamp.toDate().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCollector, setIsCollector] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionRating, setCompletionRating] = useState(5);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { chatId, otherUserId } = route.params;
  
  const flatListRef = useRef<FlatList>(null);
  const otherUserRef = useRef<User | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    if (!chatId || !otherUserId) {
      setError('채팅 정보가 올바르지 않습니다.');
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const [otherUserDoc, currentUserDoc, requestSnapshot] = await Promise.all([
          firestore.collection('users').doc(otherUserId).get(),
          auth.currentUser ? firestore.collection('users').doc(auth.currentUser.uid).get() : null,
          firestore.collection('serviceRequests').where('userId', '==', otherUserId).get()
        ]);

        if (otherUserDoc.exists) {
          otherUserRef.current = { id: otherUserId, ...otherUserDoc.data() } as User;
        } else {
          setError('상대방 정보를 찾을 수 없습니다.');
        }

        if (currentUserDoc && currentUserDoc.exists) {
          currentUserRef.current = { id: currentUserDoc.id, ...currentUserDoc.data() } as User;
        } else if (!currentUserDoc) {
          setError('사용자 인증이 필요합니다.');
        }

        setIsCollector(!requestSnapshot.empty);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
      }
    };

    fetchUserData();

    const unsubscribe = firestore.collection('chats').doc(chatId)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          const data = snapshot.data();
          if (data && data.messages) {
            const newMessages = addDateSeparators(data.messages);
            setMessages(newMessages);
          }
        } else {
          setError('채팅을 불러올 수 없습니다.');
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching chat:", error);
        setError(`채팅을 불러오는 중 오류 발생: ${error.message}`);
        setIsLoading(false);
      });

    return () => unsubscribe();
  }, [chatId, otherUserId]);

  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim() === '') return;

    const user = auth.currentUser;
    if (!user) {
      setError('사용자 인증이 필요합니다.');
      return;
    }

    try {
      await createChatMessage(chatId, user.uid, otherUserId, newMessage.trim());
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(`메시지 전송 중 오류 발생: ${error.message}`);
    }
  }, [chatId, otherUserId, newMessage]);

  const handleCompleteCollection = useCallback(async () => {
    try {
      await sendCollectionCompleteMessage(chatId, auth.currentUser!.uid, otherUserId);
      console.log("Collection complete message sent successfully");
      setShowMediaOptions(false);
    } catch (error) {
      console.error("Error sending collection complete message:", error);
      Alert.alert("오류", "채집완료 메시지 전송 중 오류가 발생했습니다.");
    }
  }, [chatId, otherUserId]);

  const handleCompletionResponse = useCallback(async (accepted: boolean) => {
    const responseMessage = accepted ? "수락됨" : "거절됨";
    await createChatMessage(chatId, auth.currentUser!.uid, otherUserId, responseMessage);
    if (accepted) {
      const currentUserId = auth.currentUser!.uid;
      const requestSnapshot = await firestore.collection('serviceRequests')
        .where('userId', '==', currentUserId).get();
      
      if (!requestSnapshot.empty) {
        const requestDoc = requestSnapshot.docs[0];
        const requestData = requestDoc.data();
        
        await requestDoc.ref.update({ 
          status: 'completed',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await firestore.collection('collectionHistory').add({
          requesterId: currentUserId,
          collectorId: otherUserId,
          rating: completionRating,
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          requestTitle: requestData.title || '제목 없음',
          requestImage: requestData.imageUrl || '',
          requestId: requestDoc.id
        });

        await hideChatRoom(chatId);
        navigation.goBack();
      } else {
        console.error('관련된 서비스 요청을 찾을 수 없습니다.');
      }
    }
    setShowCompletionModal(false);
  }, [chatId, otherUserId, completionRating, navigation]);

  const handleMediaUpload = useCallback(async (uri: string, type: 'photo' | 'video') => {
    try {
      const downloadURL = await uploadMedia(uri, type);
      await createChatMessage(chatId, auth.currentUser!.uid, otherUserId, '', {
        type: type,
        url: downloadURL,
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('업로드 실패', '미디어 업로드 중 오류가 발생했습니다.');
    }
  }, [chatId, otherUserId]);

  const handleMediaSelect = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'photo';
      await handleMediaUpload(asset.uri, type);
    }
    setShowMediaOptions(false);
  }, [handleMediaUpload]);

  const handleCameraCapture = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 사용 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'photo';
      await handleMediaUpload(asset.uri, type);
    }
    setShowMediaOptions(false);
  }, [handleMediaUpload]);

  const renderItem = useCallback(({ item }: { item: ChatItem }) => (
    <MessageItem
      item={item}
      currentUser={currentUserRef.current}
      otherUser={otherUserRef.current}
      onCompletionPress={() => setShowCompletionModal(true)}
    />
  ), []);

  const memoizedFlatList = useMemo(() => (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item, index) => 'type' in item ? `date-${index}` : item.messageId}
      contentContainerStyle={styles.messageList}
      onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  ), [messages, renderItem]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>메시지를 불러오는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messages.length > 0 ? memoizedFlatList : <Text>메시지가 없습니다.</Text>}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputContainer}
      >
        <TouchableOpacity onPress={() => setShowMediaOptions(true)} style={styles.mediaButton}>
          <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
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

      <MediaOptions
        visible={showMediaOptions}
        onClose={() => setShowMediaOptions(false)}
        onCameraCapture={handleCameraCapture}
        onMediaSelect={handleMediaSelect}
        onCompleteCollection={handleCompleteCollection}
        isCollector={isCollector}
      />

      <CompletionModal
        visible={showCompletionModal}
        rating={completionRating}
        onRatingChange={setCompletionRating}
        onAccept={() => handleCompletionResponse(true)}
        onReject={() => handleCompletionResponse(false)}
      />
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mediaButton: {
    padding: 10,
  },
});

export default React.memo(ChatScreen);