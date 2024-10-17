import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { signIn, updateLastActive, signOut } from '../../firebaseConfig';
import commonStyles from '../styles/commonStyles'

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
      if (error.code === 'auth/invalid-email') {
        setError('이메일 주소 형식이 올바르지 않습니다.');
      } else if (error.code === 'auth/user-not-found') {
        setError('등록되지 않은 이메일 주소입니다.');
      } else if (error.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않습니다.');
      } else if (error.message === '이 계정은 이미 다른 기기에서 로그인되어 있습니다.') {
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
        setError('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
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
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.disabledButton]} 
        onPress={handleLogin} 
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>
      {isLoading && <ActivityIndicator size="large" color="#468585" />}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  ...commonStyles,
  container: {
    ...commonStyles.container,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    ...commonStyles.input,
    height: 40,
    borderColor: '#50B498',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 10,
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default LoginScreen;