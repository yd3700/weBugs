// src/screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import { auth, firestore, firebase } from '../../firebaseConfig'; // Firebase imports

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        fetchUserProfile(user.uid); // Fetch user profile when authenticated
      } else {
        navigation.navigate('Login');
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        setName(userData?.name || '');
        setEmail(userData?.email || '');
        setPhone(userData?.phone || '');
        setProfilePicture(userData?.profilePicture || '');
      }
    } catch (error) {
      console.error("Error fetching user profile: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    try {
      await firestore.collection('users').doc(userId).update({
        name,
        phone,
        profilePicture,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      alert('프로필이 업데이트되었습니다.');
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text>프로필</Text>
      <TextInput
        style={styles.input}
        placeholder="이름"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        editable={false} // 이메일은 수정 불가
      />
      <TextInput
        style={styles.input}
        placeholder="전화번호"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder="프로필 사진 URL"
        value={profilePicture}
        onChangeText={setProfilePicture}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="프로필 업데이트" onPress={handleUpdateProfile} />
      <Button title="로그아웃" onPress={() => auth.signOut().then(() => navigation.navigate('Login'))} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
