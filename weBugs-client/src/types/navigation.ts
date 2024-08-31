import * as ImagePicker from 'expo-image-picker';
import { firebase } from '../../firebaseConfig';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  HomeTabs: undefined;
  Request: undefined;
  RequestDetails: {
    request: ServiceRequest;
  };
  Chat: { chatId: string; otherUserId: string };
  ChatList: undefined;
  Profile: undefined;
  ProfileView: undefined;
  RequestHistory: undefined;
  CollectionHistory: undefined;
};

export type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  transactionType: 'money' | 'volunteer';
  amount?: number;
  location: string;
  status: 'pending' | 'completed' | 'hidden';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
};

// Request 타입을 ServiceRequest와 동일하게 설정
export type Request = ServiceRequest;

export type Message = {
  messageId: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: firebase.firestore.Timestamp;
  read: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture?: string;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
};

export type ImagePickerResult = ImagePicker.ImagePickerResult;
export type ImagePickerAsset = ImagePicker.ImagePickerAsset;