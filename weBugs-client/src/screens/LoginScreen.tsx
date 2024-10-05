// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import { auth, updateUserLoginStatus, checkUserLoginStatus } from '../../firebaseConfig'; // Firebase imports

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        const isAlreadyLoggedIn = await checkUserLoginStatus(user.uid);
        if (isAlreadyLoggedIn) {
          // 이미 로그인된 경우
          await auth.signOut(); // 현재 로그인 세션 종료
          setError('이 계정은 이미 다른 기기에서 로그인되어 있습니다.');
        } else {
          // 로그인 상태 업데이트
          await updateUserLoginStatus(user.uid, true);
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeTabs' }],
          });
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="로그인" onPress={handleLogin} disabled={isLoading} />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
      <Button title="회원가입" onPress={() => navigation.navigate('SignUp')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
});

export default LoginScreen;
