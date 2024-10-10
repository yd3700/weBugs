import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { auth, signIn, updateLastActive, checkUserLoginStatus, signOut } from '../../firebaseConfig';

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeTabs' }],
      });
    } catch (error: any) {
      if (error.message === '이 계정은 이미 다른 기기에서 로그인되어 있습니다.') {
        Alert.alert(
          "중복 로그인",
          "이 계정은 이미 다른 기기에서 로그인되어 있습니다. 기존 세션을 로그아웃하고 이 기기에서 로그인하시겠습니까?",
          [
            {
              text: "취소",
              onPress: () => setError('로그인이 취소되었습니다.'),
              style: "cancel"
            },
            {
              text: "확인",
              onPress: async () => {
                await signOut();
                await signIn(email, password);
                await updateLastActive();
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'HomeTabs' }],
                });
              }
            }
          ]
        );
      } else {
        setError(error.message);
      }
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
        keyboardType="email-address"
        autoCapitalize="none"
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