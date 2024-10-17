import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import { RouteProp, useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceRequest } from '../types/navigation';
import { firestore, auth, checkExistingChat, createChatRoom } from '../../firebaseConfig';
import commonStyles from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

type RequestDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RequestDetails'>;
type RequestDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type Props = {
  route: RequestDetailsScreenRouteProp;
};

const RequestDetailsScreen = ({ route }: Props) => {
  const navigation = useNavigation<RequestDetailsScreenNavigationProp>();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = route.params?.request?.id;

  const fetchRequest = useCallback(async () => {
    if (requestId) {
      try {
        const doc = await firestore.collection('serviceRequests').doc(requestId).get();
        if (doc.exists) {
          const requestData = doc.data();
          if (requestData) {
            setRequest({
              ...requestData,
              id: doc.id,
              createdAt: requestData.createdAt.toDate(),
              updatedAt: requestData.updatedAt.toDate(),
            } as ServiceRequest);
          } else {
            setError('요청 데이터를 불러올 수 없습니다.');
          }
        } else {
          setError('요청 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('요청 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('요청 ID가 유효하지 않습니다.');
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  useFocusEffect(
    useCallback(() => {
      fetchRequest();
    }, [fetchRequest])
  );

  const handleChatPress = async () => {
    if (!request || !auth.currentUser) return;
  
    try {
      const currentUserId = auth.currentUser.uid;
      const otherUserId = request.userId;
  
      if (currentUserId === otherUserId) {
        setError('자신의 요청에는 채팅을 시작할 수 없습니다.');
        return;
      }
  
      // 기존 채팅방 확인
      const existingChatId = await checkExistingChat(currentUserId, otherUserId, request.id);
      
      if (existingChatId) {
        // 기존 채팅방이 있으면 해당 채팅방으로 이동
        Alert.alert(
          "기존 채팅방 존재",
          "이미 이 요청에 대한 채팅방이 존재합니다. 해당 채팅방으로 이동하시겠습니까?",
          [
            {
              text: "취소",
              style: "cancel"
            },
            {
              text: "이동",
              onPress: () => navigation.navigate('Chat', { chatId: existingChatId, otherUserId })
            }
          ]
        );
      } else {
        // 새 채팅방 생성
        const chatId = await createChatRoom(currentUserId, otherUserId, request.id);
        navigation.navigate('Chat', { chatId, otherUserId });
      }
    } catch (error) {
      console.error('Error handling chat:', error);
      setError('채팅방을 생성하거나 확인하는 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error || !request) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error || '요청 정보를 불러올 수 없습니다.'}</Text>
      </View>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'<'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.card}>
          {request.imageUrl && (
            <Image source={{ uri: request.imageUrl }} style={styles.image} />
          )}
          <Text style={styles.title}>{request.title}</Text>
          <Text style={[styles.status, request.status === 'completed' && styles.completedStatus]}>
            상태: {request.status === 'completed' ? '완료됨' : request.status}
          </Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>설명</Text>
            <Text style={styles.description}>{request.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래 정보</Text>
            <Text style={styles.info}>거래 방법: {request.transactionType === 'money' ? '금전 거래' : '봉사하기'}</Text>
            {request.transactionType === 'money' && request.amount && (
              <Text style={styles.info}>금액: {request.amount.toLocaleString()}원</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>위치</Text>
            <Text style={styles.info}>{request.location}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>생성 시간</Text>
            <Text style={styles.info}>{formatDate(request.createdAt)}</Text>
          </View>

          {request.status === 'completed' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>완료 시간</Text>
              <Text style={styles.info}>{formatDate(request.updatedAt)}</Text>
            </View>
          )}
        </View>

        {request.status !== 'completed' && auth.currentUser?.uid !== request.userId && (
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={handleChatPress}
          >
            <Text style={styles.chatButtonText}>채팅하기</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...commonStyles,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(222, 249, 196, 0.3)',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  backButton: {
    padding: 1,
  },
  backButtonText: {
    color: 'gray',
    fontSize: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
  chatButton: {
    backgroundColor: '#50B498',
    padding: 15,
    borderRadius: 10,
    margin: 10,
    alignItems: 'center',
  },
  chatButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  completedStatus: {
    color: 'green',
    fontWeight: 'bold',
  },
});

export default RequestDetailsScreen;