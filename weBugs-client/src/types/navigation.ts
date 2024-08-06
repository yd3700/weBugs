// src/types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  SignUp: undefined;
  HomeTabs: undefined;
  Chat: { chatId: string };
  RequestDetails: { post: Post };
  Profile: undefined;
  Request: { post: Post };
  ChatList: { post: Post };
};

// Post 타입 정의
export type Post = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  image: string;
};
