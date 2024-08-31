import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { auth, firestore, firebase } from '../../firebaseConfig';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

const SignUpScreen = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNameAvailable, setIsNameAvailable] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (name) {
        checkNameAvailability();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [name]);

  const checkNameAvailability = async () => {
    if (name.length < 2) {
      setIsNameAvailable(false);
      return;
    }

    // 닉네임 형식 검사
    if (!/^[a-z0-9]+$/.test(name)) {
      setError('닉네임은 소문자와 숫자만 사용할 수 있습니다.');
      setIsNameAvailable(false);
      return;
    }

    setIsCheckingName(true);
    try {
      const snapshot = await firestore.collection('users').where('name', '==', name).get();
      setIsNameAvailable(snapshot.empty);
      setError(null);
    } catch (error) {
      console.error("Error checking name availability:", error);
      setIsNameAvailable(false);
    } finally {
      setIsCheckingName(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !phone || !password) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (!isNameAvailable) {
      setError('사용할 수 없는 닉네임입니다. 다른 닉네임을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 최종 닉네임 중복 확인
      const finalCheck = await firestore.collection('users').where('name', '==', name).get();
      if (!finalCheck.empty) {
        throw new Error('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
      }

      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      if (user) {
        await firestore.collection('users').doc(user.uid).set({
          name,
          email,
          phone,
          profilePicture: '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        Alert.alert('회원가입 성공', '회원가입이 완료되었습니다.', [
          { text: 'OK', onPress: () => navigation.navigate('HomeTabs') }
        ]);
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
        placeholder="닉네임 (소문자와 숫자만 사용 가능)"
        value={name}
        onChangeText={(text) => setName(text.toLowerCase())}
        autoCapitalize="none"
      />
      {isCheckingName ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : (
        name.length > 1 && (
          <Text style={isNameAvailable ? styles.available : styles.unavailable}>
            {isNameAvailable ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'}
          </Text>
        )
      )}
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
        placeholder="전화번호"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="회원가입" onPress={handleSignUp} disabled={isLoading || !isNameAvailable} />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
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
  available: {
    color: 'green',
    marginBottom: 10,
  },
  unavailable: {
    color: 'red',
    marginBottom: 10,
  },
});

export default SignUpScreen;