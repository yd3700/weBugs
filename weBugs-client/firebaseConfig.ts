import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from './src/types/navigation'; // 경로는 실제 파일 위치에 맞게 조정하세요

//기존 weBugs
// const firebaseConfig = {
//     apiKey: "AIzaSyBxmmIf4HpA6kPKPYYyxCLRkksPh4RWbA8",
//     authDomain: "webugs-201107.firebaseapp.com",
//     projectId: "webugs-201107",
//     storageBucket: "webugs-201107.appspot.com",
//     messagingSenderId: "492807142709",
//     appId: "1:492807142709:web:31f67f999ed8b55d2b607c",
//     measurementId: "G-YZPYFRSDZ8"
// };

const LAST_ACTIVE_KEY = 'lastActiveTimestamp';
const USER_ID_KEY = 'userId';
const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000; // 3일

// //testweBugs
const firebaseConfig = {
    apiKey: "AIzaSyDKJ1t6dEHbdTWYPYLgCIms4P-9_KR9C9Y",
    authDomain: "testwebugs.firebaseapp.com",
    projectId: "testwebugs",
    storageBucket: "testwebugs.appspot.com",
    messagingSenderId: "290021362682",
    appId: "1:290021362682:web:e92eda9ee1e4fbdecaf243",
    measurementId: "G-46G5BVJZNY"
  };

// Firebase 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

// 이미지 업로드 함수
const uploadImage = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = uri.substring(uri.lastIndexOf('/') + 1);
  const ref = storage.ref().child(`images/${filename}`);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await currentUser.getIdToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const downloadURL = await ref.getDownloadURL();
          resolve(downloadURL);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = reject;

      xhr.open('POST', `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o?name=${encodeURIComponent(`images/${filename}`)}`);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('Authorization', `Firebase ${token}`);
      xhr.send(blob);
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

const checkExistingChat = async (currentUserId: string, otherUserId: string, requestId: string) => {
  try {
    const chatSnapshot = await firestore.collection('chats')
      .where('participants', 'array-contains', currentUserId)
      .where('requestId', '==', requestId)
      .get();

    if (!chatSnapshot.empty) {
      // 이미 해당 요청에 대한 채팅방이 존재
      return chatSnapshot.docs[0].id;
    }

    // 해당 요청에 대한 채팅방이 없으면 null 반환
    return null;
  } catch (error) {
    console.error("Error checking existing chat:", error);
    throw error;
  }
};

// 채팅방 생성 로직
const createChatRoom = async (currentUserId: string, otherUserId: string, requestId: string) => {
  const chatId = firestore.collection('chats').doc().id;
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await chatRef.set({
      participants: [currentUserId, otherUserId],
      messages: [],
      createdAt: firebase.firestore.Timestamp.now(),
      updatedAt: firebase.firestore.Timestamp.now(),
      lastRead: {
        [currentUserId]: firebase.firestore.Timestamp.now(),
        [otherUserId]: firebase.firestore.Timestamp.now()
      },
      requestId: requestId // 요청 ID 추가
    });
    console.log("New chat room created:", chatId);
    return chatId;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

// 수정된 채팅 메시지 생성 함수
const createChatMessage = async (chatId: string, senderId: string, recipientId: string, content: string, media?: { type: 'photo' | 'video', url: string }) => {
  if (!chatId || !senderId || !recipientId) {
    console.error("Invalid message data", { chatId, senderId, recipientId, content, media });
    throw new Error("Invalid message data");
  }

  const newMessage = {
    messageId: firestore.collection('chats').doc().id,
    senderId,
    recipientId,
    content: content || "채집완료", // 빈 content일 경우 "채집완료"로 설정
    timestamp: firebase.firestore.Timestamp.now(),
    read: false,
    media: media || null
  };

  console.log("Attempting to add message:", newMessage); // 디버깅을 위한 로그 추가

  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await chatRef.update({
      messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
      updatedAt: firebase.firestore.Timestamp.now()
    });
    console.log("Message successfully added to chat room:", chatId);
    return newMessage;
  } catch (error: any) {
    console.error("Error updating chat:", error);
    throw error;
  }
};

const sendCollectionCompleteMessage = async (chatId: string, senderId: string, recipientId: string) => {
  try {
    const message = await createChatMessage(chatId, senderId, recipientId, "채집완료");
    
    // 채집완료 상태를 채팅방에 저장
    await firestore.collection('chats').doc(chatId).update({
      collectionCompleted: true,
      collectionCompletedBy: senderId
    });

    console.log("Collection complete message sent:", message);
    return message;
  } catch (error) {
    console.error("Error sending collection complete message:", error);
    throw error;
  }
};

// 채팅 목록 가져오기
const getChatList = async (userId: string) => {
  try {
    const chatList: any[] = [];
    const snapshot = await firestore.collection('chats')
      .where('participants', 'array-contains', userId)
      .orderBy('updatedAt', 'desc')
      .get();
    
    snapshot.forEach(doc => {
      chatList.push({ id: doc.id, ...doc.data() });
    });
    
    return chatList;
  } catch (error) {
    console.error("Error fetching chat list:", error);
    throw error;
  }
};

// 메시지를 읽음 상태로 표시
const markMessageAsRead = async (chatId: string, messageId: string, userId: string) => {
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await firestore.runTransaction(async (transaction) => {
      const chatDoc = await transaction.get(chatRef);
      if (!chatDoc.exists) {
        throw "Chat does not exist!";
      }
      
      const chatData = chatDoc.data();
      const updatedMessages = chatData?.messages.map((msg: Message) => {
        if (msg.messageId === messageId && msg.recipientId === userId) {
          return { ...msg, read: true };
        }
        return msg;
      });

      transaction.update(chatRef, { 
        messages: updatedMessages,
        [`lastRead.${userId}`]: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw error;
  }
};

// 읽지 않은 메시지 수 가져오기
const getUnreadMessageCount = async (userId: string) => {
  try {
    const snapshot = await firestore.collection('chats')
      .where('participants', 'array-contains', userId)
      .get();

    let unreadCount = 0;
    snapshot.forEach(doc => {
      const chatData = doc.data();
      if (chatData.messages) {
        unreadCount += chatData.messages.filter((message: any) => 
          message.recipientId === userId && !message.read
        ).length;
      }
    });

    return unreadCount;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    throw error;
  }
};

// 실시간으로 읽지 않은 메시지 수 감시
const listenToUnreadMessageCount = (userId: string, callback: (count: number) => void) => {
  return firestore.collection('chats')
    .where('participants', 'array-contains', userId)
    .onSnapshot(snapshot => {
      let unreadCount = 0;
      snapshot.forEach(doc => {
        const chatData = doc.data();
        if (chatData.messages) {
          unreadCount += chatData.messages.filter((message: any) => 
            message.recipientId === userId && !message.read
          ).length;
        }
      });
      callback(unreadCount);
    }, error => {
      console.error("Error listening to unread message count:", error);
    });
};

// 새로 추가된 미디어 파일 업로드 함수
const uploadMedia = async (uri: string, mediaType: 'photo' | 'video'): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${mediaType}_${Date.now()}_${uri.substring(uri.lastIndexOf('/') + 1)}`;
  const ref = storage.ref().child(`chat_media/${filename}`);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const token = await currentUser.getIdToken();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = async () => {
        if (xhr.status === 200) {
          const downloadURL = await ref.getDownloadURL();
          resolve(downloadURL);
        } else {
          reject(new Error('Upload failed'));
        }
      };
      xhr.onerror = reject;

      xhr.open('POST', `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o?name=${encodeURIComponent(`chat_media/${filename}`)}`);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('Authorization', `Firebase ${token}`);
      xhr.send(blob);
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
};

const hideChatRoom = async (chatId: string) => {
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await chatRef.update({
      hidden: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Chat room hidden:", chatId);
  } catch (error) {
    console.error("Error hiding chat room:", error);
    throw error;
  }
};

const deleteChatRoom = async (chatId: string) => {
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    // 채팅방 정보 가져오기
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    if (chatData && chatData.collectionCompleted) {
      // 채집 완료된 경우에만 채팅방 삭제
      await chatRef.delete();
      console.log("Chat room deleted:", chatId);
    } else {
      console.log("Chat room not deleted: Collection not completed");
    }
  } catch (error) {
    console.error("Error deleting chat room:", error);
    throw error;
  }
};

const leaveChatRoom = async (chatId: string, userId: string) => {
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    if (chatData) {
      const updatedParticipants = chatData.participants.filter((id: string) => id !== userId);
      
      if (updatedParticipants.length === 0) {
        // 모든 참가자가 나갔을 때 채팅방 삭제 대신 숨김 처리
        await chatRef.update({
          hidden: true,
          hiddenAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // 참가자 목록 업데이트
        await chatRef.update({
          participants: updatedParticipants
        });
      }
    }

    console.log("User left the chat room:", userId);
  } catch (error) {
    console.error("Error leaving chat room:", error);
    throw error;
  }
};

const updateUserLoginStatus = async (userId: string, isLoggedIn: boolean) => {
  try {
    await firestore.collection('users').doc(userId).update({
      isLoggedIn: isLoggedIn,
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user login status:", error);
  }
};

const checkUserLoginStatus = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.isLoggedIn || false;
  } catch (error) {
    console.error("Error checking user login status:", error);
    return false;
  }
};

const initializeAuth = async () => {
  try {
    const lastActiveTimestamp = await AsyncStorage.getItem(LAST_ACTIVE_KEY);
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    
    if (lastActiveTimestamp && userId) {
      const lastActive = parseInt(lastActiveTimestamp, 10);
      if (Date.now() - lastActive > SESSION_DURATION) {
        await signOut();
      } else {
        await updateLastActive();
      }
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

const updateLastActive = async () => {
  try {
    await AsyncStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
  }
};

const signIn = async (email: string, password: string) => {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  const user = userCredential.user;
  if (user) {
    const isAlreadyLoggedIn = await checkUserLoginStatus(user.uid);
    if (isAlreadyLoggedIn) {
      throw new Error('이 계정은 이미 다른 기기에서 로그인되어 있습니다.');
    }
    await updateUserLoginStatus(user.uid, true);
    await AsyncStorage.setItem('userId', user.uid);
    await updateLastActive();
  }
};

const signOut = async () => {
  const user = auth.currentUser;
  if (user) {
    await updateUserLoginStatus(user.uid, false);
  }
  await auth.signOut();
  await AsyncStorage.removeItem('userId');
};

export { 
  auth, 
  firestore, 
  storage,
  uploadImage,
  uploadMedia,
  checkExistingChat,
  createChatRoom,
  createChatMessage,
  sendCollectionCompleteMessage,
  getChatList,
  markMessageAsRead,
  getUnreadMessageCount,
  listenToUnreadMessageCount,
  deleteChatRoom,
  hideChatRoom,
  leaveChatRoom,
  updateUserLoginStatus,
  checkUserLoginStatus,
  initializeAuth,
  updateLastActive,
  signIn,
  signOut,
  firebase 
};