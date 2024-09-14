import * as ImagePicker from 'expo-image-picker';
import { firebase } from '../../firebaseConfig';
import { ResizeMode } from 'expo-av';

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

export type Request = ServiceRequest;

export type MediaContent = {
  type: 'photo' | 'video';
  url: string;
};

export type Message = {
  messageId: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: firebase.firestore.Timestamp;
  read: boolean;
  media?: MediaContent;
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

export type CollectionHistoryItem = {
  id: string;
  requesterId: string;
  collectorId: string;
  rating: number;
  completedAt: Date;
  requestTitle: string;
  requestImage: string;
};

export type Notification = {
  foreground: boolean;
  userInteraction: boolean;
  message: string | object;
  data: object;
  subText?: string;
  badge?: number;
  alert?: object;
  sound?: string;
  finish: (fetchResult: string) => void;
};

export type ImagePickerResult = ImagePicker.ImagePickerResult;
export type ImagePickerAsset = ImagePicker.ImagePickerAsset;

// 추가된 타입 정의
export type MediaPickerResult = {
  type: 'photo' | 'video';
  uri: string;
};

export { ResizeMode };