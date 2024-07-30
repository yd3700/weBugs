// src/types/navigation.ts
export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Request: undefined;
  Chat: { chatId: string }; // Chat 경로와 파라미터 타입 정의
  Login: undefined;
  SignUp: undefined;
  HomeTabs: undefined;
};

// Post 타입 정의
export type Post = {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
};
