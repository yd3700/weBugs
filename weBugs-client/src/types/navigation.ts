export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  HomeTabs: undefined;
  RequestDetails: { post: Post };
  Chat: { chatId: string };
  ChatList: undefined;
};

export type Post = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  image: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Message = {
  content: string;
  senderId: string;
  timestamp: string;
};
