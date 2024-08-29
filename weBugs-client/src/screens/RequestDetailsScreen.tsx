import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceRequest } from '../types/navigation';
import { firestore, auth, createChatRoom } from '../../firebaseConfig';

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

  useEffect(() => {
    const fetchRequest = async () => {
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
    };

    fetchRequest();
  }, [requestId]);

  const handleChatPress = async () => {
    if (!request || !auth.currentUser) return;

    try {
      const currentUserId = auth.currentUser.uid;
      const otherUserId = request.userId;

      if (currentUserId === otherUserId) {
        setError('자신의 요청에는 채팅을 시작할 수 없습니다.');
        return;
      }

      const chatId = await createChatRoom(currentUserId, otherUserId);
      navigation.navigate('Chat', { chatId, otherUserId });
    } catch (error) {
      console.error('Error creating chat room:', error);
      setError('채팅방을 생성하는 중 오류가 발생했습니다.');
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
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {request.imageUrl && (
          <Image source={{ uri: request.imageUrl }} style={styles.image} />
        )}
        <Text style={styles.title}>{request.title}</Text>
        <Text style={styles.status}>상태: {request.status}</Text>
        
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
      </View>

      <TouchableOpacity 
        style={styles.chatButton} 
        onPress={handleChatPress}
      >
        <Text style={styles.chatButtonText}>채팅하기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#007AFF',
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
});

export default RequestDetailsScreen;