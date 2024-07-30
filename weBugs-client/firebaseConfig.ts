// firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

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

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = firebase.auth();
const firestore = firebase.firestore();

// 사용자 생성 예시
const createUser = async (userId: string, name: string, email: string, phone: string, profilePicture: string) => {
    await firestore.collection('users').doc(userId).set({
      name,
      email,
      phone,
      profilePicture,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };
  
  // 서비스 요청 생성 예시
  const createServiceRequest = async (requestId: string, userId: string, description: string, location: string) => {
    await firestore.collection('serviceRequests').doc(requestId).set({
      userId,
      description,
      location,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };
  
  // 서비스 제공자 프로필 생성 예시
  const createProviderProfile = async (providerId: string, userId: string, services: string[]) => {
    await firestore.collection('providers').doc(providerId).set({
      userId,
      services,
      ratings: 0,
      reviews: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };
  
  // 매칭 생성 예시
  const createMatch = async (requestId: string, providerId: string) => {
    await firestore.collection('matches').add({
      requestId,
      providerId,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  };

  // 채팅 메시지 생성 예시
  const createChatMessage = async (chatId: string, senderId: string, content: string) => {
    const newMessage = {
      messageId: firestore.collection('chats').doc().id,
      senderId,
      content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('chats').doc(chatId).update({
      messages: firebase.firestore.FieldValue.arrayUnion(newMessage),
    });
  };

export { app, auth, firestore,  createUser, createServiceRequest, createProviderProfile, createMatch, createChatMessage, analytics, firebase };
