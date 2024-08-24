import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
    apiKey: "AIzaSyBxmmIf4HpA6kPKPYYyxCLRkksPh4RWbA8",
    authDomain: "webugs-201107.firebaseapp.com",
    projectId: "webugs-201107",
    storageBucket: "webugs-201107.appspot.com",
    messagingSenderId: "492807142709",
    appId: "1:492807142709:web:31f67f999ed8b55d2b607c",
    measurementId: "G-YZPYFRSDZ8"
};

// Firebase 초기화
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const firestore = firebase.firestore();
const storage = firebase.storage();

// 채팅방 생성 로직
const createChatRoom = async (currentUserId: string, otherUserId: string) => {
  const chatId = [currentUserId, otherUserId].sort().join('-');
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      await chatRef.set({
        participants: [currentUserId, otherUserId],
        messages: [],
        createdAt: firebase.firestore.Timestamp.now(),
        updatedAt: firebase.firestore.Timestamp.now(),
        lastRead: {
          [currentUserId]: firebase.firestore.Timestamp.now(),
          [otherUserId]: firebase.firestore.Timestamp.now()
        }
      });
      console.log("New chat room created:", chatId);
    } else {
      console.log("Chat room already exists:", chatId);
    }
    return chatId;
  } catch (error) {
    console.error("Error creating/checking chat room:", error);
    throw error;
  }
};

// 채팅 메시지 생성 예시
const createChatMessage = async (chatId: string, senderId: string, recipientId: string, content: string) => {
  if (!chatId || !senderId || !recipientId || !content) {
    console.error("Invalid message data", { chatId, senderId, recipientId, content });
    throw new Error("Invalid message data");
  }

  const newMessage = {
    messageId: firestore.collection('chats').doc().id,
    senderId,
    recipientId,
    content,
    timestamp: firebase.firestore.Timestamp.now(),
    read: false
  };

  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await chatRef.update({
      messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
      updatedAt: firebase.firestore.Timestamp.now()
    });
    console.log("Message added to chat room:", chatId);
    return newMessage;  // 생성된 메시지 반환
  } catch (error: any) {
    console.error("Error updating chat:", error);
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
const markMessageAsRead = async (chatId: string, userId: string) => {
  const chatRef = firestore.collection('chats').doc(chatId);
  
  try {
    await chatRef.update({
      [`lastRead.${userId}`]: firebase.firestore.Timestamp.now()
    });
    // console.log("Messages marked as read for user:", userId);
  } catch (error) {
    console.error("Error marking messages as read:", error);
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
      const lastRead = chatData.lastRead[userId] || new firebase.firestore.Timestamp(0, 0);
      if (chatData.messages) {
        unreadCount += chatData.messages.filter((message: any) => 
          message.timestamp > lastRead && message.senderId !== userId
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
        const lastRead = chatData.lastRead[userId] || new firebase.firestore.Timestamp(0, 0);
        if (chatData.messages) {
          unreadCount += chatData.messages.filter((message: any) => 
            message.timestamp > lastRead && message.senderId !== userId
          ).length;
        }
      });
      callback(unreadCount);
    }, error => {
      console.error("Error listening to unread message count:", error);
    });
};

export { 
  auth, 
  firestore, 
  storage,
  createChatRoom,
  createChatMessage, 
  getChatList,
  markMessageAsRead,
  getUnreadMessageCount,
  listenToUnreadMessageCount,
  firebase 
};