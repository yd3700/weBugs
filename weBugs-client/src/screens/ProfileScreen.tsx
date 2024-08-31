import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { auth, firestore, firebase, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';

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
        fetchUserProfile(user.uid);
      } else {
        navigation.navigate('Login');
      }
    });
    return () => unsubscribe();
  }, [navigation]);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('갤러리 접근 권한이 필요합니다.');
        }
      }
    })();
  }, []);

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

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setIsLoading(true);
      try {
        const uploadUrl = await uploadImage(result.assets[0].uri);
        setProfilePicture(uploadUrl);
      } catch (e) {
        console.error("Error uploading image: ", e);
        setError('이미지 업로드 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = 'profile_' + userId + '_' + new Date().getTime();
    const ref = storage.ref().child(`profileImages/${filename}`);
    await ref.put(blob);
    return ref.getDownloadURL();
  };

  const handleUpdateProfile = async () => {
    if (!userId) return;
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>프로필</Text>
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={handleImagePick} style={styles.imageContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text>프로필 이미지 추가</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.nickname}>{name}</Text>
      </View>
      
      <TouchableOpacity style={styles.sectionButton} onPress={() => navigation.navigate('ProfileView')}>
        <Text style={styles.sectionButtonText}>프로필 보기</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sectionButton} onPress={() => navigation.navigate('RequestHistory')}>
        <Text style={styles.sectionButtonText}>요청 내역</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sectionButton} onPress={() => navigation.navigate('CollectionHistory')}>
        <Text style={styles.sectionButtonText}>채집내역</Text>
      </TouchableOpacity>

      <Button title="로그아웃" onPress={() => auth.signOut().then(() => navigation.navigate('Login'))} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 10,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nickname: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
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
  sectionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionButtonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default ProfileScreen;