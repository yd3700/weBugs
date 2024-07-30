// src/screens/RequestScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import { auth, firestore, firebase } from '../../firebaseConfig'; // Firebase imports
import { matchService } from '../services/firebaseService'; // 매칭 서비스 함수 import

const RequestScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequest = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const requestRef = await firestore.collection('serviceRequests').add({
        userId: user.uid,
        description,
        location,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // 매칭 로직 호출
      await matchService(requestRef.id, 'providerId1'); // providerId1는 실제 제공자 ID로 대체해야 합니다.

      setSuccess('서비스 요청이 등록되었습니다.');
      setDescription('');
      setLocation('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>서비스 요청</Text>
      <TextInput
        style={styles.input}
        placeholder="요청 설명"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="위치"
        value={location}
        onChangeText={setLocation}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <Button title="요청 제출" onPress={handleRequest} disabled={isLoading} />
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
  success: {
    color: 'green',
    marginBottom: 20,
  },
});

export default RequestScreen;
