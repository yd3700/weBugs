import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Message, User } from '../types/navigation';
import { auth, firestore, createChatMessage, storage, uploadMedia } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Video } from 'expo-av';
import { ResizeMode } from '../types/navigation';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type DateSeparator = {
  type: 'date';
  date: string;
};

type ChatItem = Message | DateSeparator;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const lastReadTimestampRef = useRef<firebase.firestore.Timestamp | null>(null);
  const [isCollector, setIsCollector] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionRating, setCompletionRating] = useState(5);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const { chatId, otherUserId } = route.params;

  useEffect(() => {
    if (!chatId || !otherUserId) {
      setError('채팅 정보가 올바르지 않습니다.');
      return;
    }

    const fetchUserData = async () => {
      try {
        const otherUserDoc = await firestore.collection('users').doc(otherUserId).get();
        if (otherUserDoc.exists) {
          setOtherUser(otherUserDoc.data() as User);
        } else {
          setError('상대방 정보를 찾을 수 없습니다.');
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          const currentUserDoc = await firestore.collection('users').doc(currentUser.uid).get();
          if (currentUserDoc.exists) {
            setCurrentUser(currentUserDoc.data() as User);
          }
        } else {
          setError('사용자 인증이 필요합니다.');
        }

        const requestSnapshot = await firestore.collection('serviceRequests')
          .where('userId', '==', otherUserId).get();
        setIsCollector(!requestSnapshot.empty);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
      }
    };

    fetchUserData();

    const lastReadTimestamp = firebase.firestore.Timestamp.now();
    lastReadTimestampRef.current = lastReadTimestamp;

    const unsubscribe = firestore.collection('chats').doc(chatId)
      .onSnapshot(async (snapshot) => {
        if (snapshot.exists) {
          const data = snapshot.data();
          if (data && data.messages) {
            console.log('Messages data:', data.messages);
            const messagesWithDates = addDateSeparators(data.messages);
            setMessages(messagesWithDates);
            
            const currentUser = auth.currentUser;
            if (currentUser) {
              const updatedMessages = data.messages.map((msg: Message) => ({
                ...msg,
                read: msg.timestamp <= lastReadTimestamp || msg.senderId === currentUser.uid
              }));
              
              await firestore.collection('chats').doc(chatId).update({
                messages: updatedMessages,
                [`lastRead.${currentUser.uid}`]: lastReadTimestamp
              });
            }
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

  const handleCompleteCollection = async () => {
    const completionMessage = "채집완료";
    setNewMessage(completionMessage);
    await handleSendMessage();
    setShowMediaOptions(false);
  };

  const handleCompletionResponse = async (accepted: boolean) => {
    const responseMessage = accepted ? "수락됨" : "거절됨";
    await createChatMessage(chatId, auth.currentUser!.uid, otherUserId, responseMessage);
    if (accepted) {
      const currentUserId = auth.currentUser!.uid;
      const requestSnapshot = await firestore.collection('serviceRequests')
        .where('userId', '==', currentUserId).get();
      
      if (!requestSnapshot.empty) {
        const requestDoc = requestSnapshot.docs[0];
        const requestData = requestDoc.data();
        
        await requestDoc.ref.update({ status: 'completed' });
        
        await firestore.collection('collectionHistory').add({
          requesterId: currentUserId,
          collectorId: otherUserId,
          rating: completionRating,
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          requestTitle: requestData.title || '제목 없음',
          requestImage: requestData.imageUrl || '',
          requestId: requestDoc.id
        });
      } else {
        console.error('관련된 서비스 요청을 찾을 수 없습니다.');
      }
    }
    setShowCompletionModal(false);
  };

  const handleMediaSelect = async () => {
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
  };

  const handleCameraCapture = async () => {
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
  };

  const handleMediaUpload = async (uri: string, type: 'photo' | 'video') => {
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
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if ('type' in item && item.type === 'date') {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{item.date}</Text>
        </View>
      );
    }

    if (!isMessage(item)) {
      return null;
    }

    const isCurrentUser = item.senderId === auth.currentUser?.uid;
    const displayTimestamp = formatTimestamp(item.timestamp);
    const userImage = isCurrentUser ? currentUser?.profilePicture : otherUser?.profilePicture;
    const userName = isCurrentUser ? currentUser?.name : otherUser?.name;

    if (item.content === "채집완료" && item.senderId !== auth.currentUser?.uid) {
      return (
        <TouchableOpacity onPress={() => setShowCompletionModal(true)}>
          <View style={[styles.messageBubble, styles.completionMessage]}>
            <Text style={styles.messageText}>{item.content}</Text>
            <Text style={styles.completionInstructions}>터치하여 응답</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.media) {
      return (
        <View style={[styles.messageContainer, isCurrentUser ? styles.currentUser : styles.otherUser]}>
          {item.media.type === 'photo' ? (
            <Image source={{ uri: item.media.url }} style={styles.mediaImage} />
          ) : (
            <Video
              source={{ uri: item.media.url }}
              style={styles.mediaVideo}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay={false}
            />
          )}
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isCurrentUser ? styles.currentUser : styles.otherUser]}>
        {!isCurrentUser && (
          <View style={styles.userInfo}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderImage]}>
                <Text>{userName?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.userName}>{userName}</Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
          <Text style={[styles.timestamp, isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp]}>
            {displayTimestamp}
          </Text>
        </View>
        {isCurrentUser && (
          <View style={styles.userInfo}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.placeholderImage]}>
                <Text>{userName?.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.userName}>{userName}</Text>
          </View>
        )}
      </View>
    );
  };

  const formatTimestamp = (timestamp: firebase.firestore.Timestamp): string => {
    return timestamp.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const isMessage = (item: ChatItem): item is Message => {
    return 'senderId' in item && 'timestamp' in item;
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
        renderItem={renderItem}
        keyExtractor={(item, index) => 'type' in item ? `date-${index}` : item.messageId}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
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

      <Modal
        visible={showMediaOptions}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.optionButton} onPress={handleCameraCapture}>
              <Text style={styles.optionText}>카메라</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionButton} onPress={handleMediaSelect}>
              <Text style={styles.optionText}>앨범 선택</Text>
            </TouchableOpacity>
            {isCollector && (
              <TouchableOpacity style={styles.optionButton} onPress={handleCompleteCollection}>
                <Text style={styles.optionText}>채집 완료</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowMediaOptions(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>채집이 완료되었습니다</Text>
            <Text style={styles.modalSubtitle}>서비스를 평가해주세요</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={completionRating}
              onValueChange={setCompletionRating}
            />
            <Text style={styles.ratingText}>{completionRating} / 10</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.responseButton, styles.acceptButton]}
                onPress={() => handleCompletionResponse(true)}
              >
                <Text style={styles.buttonText}>수락</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.responseButton, styles.rejectButton]}
                onPress={() => handleCompletionResponse(false)}
              >
                <Text style={styles.buttonText}>거절</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  userInfo: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10,
  },
  placeholderImage: {
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorText: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: '#000',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  mediaButton: {
    padding: 10,
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  mediaVideo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  optionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  ratingText: {
    fontSize: 18,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  responseButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completionMessage: {
    backgroundColor: '#FFD700',
  },
  completionInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 5,
  },
});

export default ChatScreen;