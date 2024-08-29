import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';
import { firestore, auth, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';

type RequestScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Request'>;

const RequestScreen = () => {
  const navigation = useNavigation<RequestScreenNavigationProp>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'money' | 'volunteer'>('money');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('카메라 접근 권한이 필요합니다.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf('/') + 1);
    const ref = storage.ref().child(`images/${filename}`);
    await ref.put(blob);
    return ref.getDownloadURL();
  };

  const handleRequest = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!title || !description || !location) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (transactionType === 'money' && !amount) {
      setError('금액을 입력해주세요.');
      return;
    }

    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      await firestore.collection('serviceRequests').add({
        userId: user.uid,
        title,
        description,
        transactionType,
        amount: transactionType === 'money' ? parseFloat(amount) : 0,
        location,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl,
      });
      setSuccess('요청이 성공적으로 생성되었습니다.');
      setTitle('');
      setDescription('');
      setTransactionType('money');
      setAmount('');
      setLocation('');
      setImage(null);
    } catch (error) {
      setError('요청 생성 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>서비스 요청</Text>
      <TextInput
        style={styles.input}
        placeholder="제목"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={styles.input}
        placeholder="설명"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, transactionType === 'money' && styles.activeButton]}
          onPress={() => setTransactionType('money')}
        >
          <Text style={[styles.buttonText, transactionType === 'money' && styles.activeButtonText]}>금전 거래</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, transactionType === 'volunteer' && styles.activeButton]}
          onPress={() => setTransactionType('volunteer')}
        >
          <Text style={[styles.buttonText, transactionType === 'volunteer' && styles.activeButtonText]}>봉사하기</Text>
        </TouchableOpacity>
      </View>
      {transactionType === 'money' && (
        <TextInput
          style={styles.input}
          placeholder="금액"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="출몰 위치"
        value={location}
        onChangeText={setLocation}
      />
      <View style={styles.imageContainer}>
        {image && <Image source={{ uri: image }} style={styles.image} />}
        <View style={styles.imageButtonContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
            <Text style={styles.imageButtonText}>갤러리에서 선택</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageButton} onPress={handleCamera}>
            <Text style={styles.imageButtonText}>사진 촬영</Text>
          </TouchableOpacity>
        </View>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>{success}</Text>}
      <Button title="요청 보내기" onPress={handleRequest} />
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
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    textAlign: 'center',
    color: '#333',
  },
  activeButtonText: {
    color: 'white',
  },
  error: {
    color: 'red',
    marginBottom: 20,
  },
  success: {
    color: 'green',
    marginBottom: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 10,
  },
  imageButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default RequestScreen;