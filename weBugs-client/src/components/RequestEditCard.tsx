import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, storage } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import commonStyles from '../styles/commonStyles';

import { ServiceRequest } from '../types/navigation';

type RequestEditCardProps = {
  request: ServiceRequest;
  onClose: () => void;
  onUpdate: (updatedRequest: ServiceRequest) => void;
};

const RequestEditCard: React.FC<RequestEditCardProps> = ({ request, onClose, onUpdate }) => {
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [transactionType, setTransactionType] = useState(request.transactionType);
  const [amount, setAmount] = useState(request.amount?.toString() || '');
  const [imageUrl, setImageUrl] = useState(request.imageUrl || '');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      const uploadedUrl = await uploadImage(result.assets[0].uri);
      setImageUrl(uploadedUrl);
    }
  };

  const uploadImage = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ref = storage.ref().child(`images/${new Date().toISOString()}`);
    await ref.put(blob);
    return await ref.getDownloadURL();
  };

  const handleUpdate = async () => {
    try {
      const updatedRequest = {
        ...request,
        title,
        description,
        transactionType,
        amount: transactionType === 'money' ? parseFloat(amount) : undefined,
        imageUrl,
      };

      await firestore.collection('serviceRequests').doc(request.id).update(updatedRequest);
      onUpdate(updatedRequest);
    } catch (error) {
      console.error("Error updating request:", error);
      // 여기에 에러 처리 로직 추가 (예: 사용자에게 알림)
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>요청 수정</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text>No Image</Text>
          </View>
        )}
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerButtonText}>
            {imageUrl ? '이미지 변경' : '이미지 추가'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>설명</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="상세 설명을 입력하세요"
          multiline
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>거래 유형</Text>
        <View style={styles.transactionTypeContainer}>
          <TouchableOpacity
            style={[
              styles.transactionTypeButton,
              transactionType === 'money' && styles.activeTransactionType
            ]}
            onPress={() => setTransactionType('money')}
          >
            <Text style={transactionType === 'money' ? styles.activeText : styles.inactiveText}>
              금전 거래
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.transactionTypeButton,
              transactionType === 'volunteer' && styles.activeTransactionType
            ]}
            onPress={() => setTransactionType('volunteer')}
          >
            <Text style={transactionType === 'volunteer' ? styles.activeText : styles.inactiveText}>
              봉사하기
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {transactionType === 'money' && (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>금액</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="금액을 입력하세요"
            keyboardType="numeric"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>위치</Text>
        <Text style={styles.locationText}>{request.location}</Text>
      </View>

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
        <Text style={styles.updateButtonText}>수정 완료</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  ...commonStyles,
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,  
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  placeholderImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerButton: {
    ...commonStyles.button,
    backgroundColor: '#BEDC74',
    flex: 1,
    marginHorizontal: 5,
  },
  imagePickerButtonText: {
    color: 'black',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
  activeTransactionType: {
    backgroundColor: '#BEDC74',
  },
  activeText: {
    color: 'black',
  },
  inactiveText: {
    color: 'black',
  },
  locationText: {
    fontSize: 16,
    color: '#666',
  },
  updateButton: {
    backgroundColor: '#BEDC74',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20, // 버튼 아래 여백 추가
  },
});

export default RequestEditCard;