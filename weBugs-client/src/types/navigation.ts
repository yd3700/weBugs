import { ImagePickerResponse } from 'react-native-image-picker';

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
};

export type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  transactionType: 'money' | 'volunteer';
  amount?: number;
  location: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  messageId: string;
  content: string;
  senderId: string;
  recipientId: string;
  timestamp: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
};

export type Chat = {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
};

export type ImagePickerResult = ImagePickerResponse;

export type ImagePickerAsset = {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
  fileSize?: number;
};