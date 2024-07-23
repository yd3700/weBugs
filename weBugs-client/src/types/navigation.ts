// src/types/navigation.ts
export type RootStackParamList = {
    Home: undefined;
    Profile: undefined;
    SignUp: undefined;
    Login: undefined;
    Request: undefined;
    // 다른 스크린들도 여기에 추가
  };

export type Post = {
  id: string;
  title: string;
  location: string;
  price: string;
  image: string;
};

  