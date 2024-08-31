import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore, auth } from '../../firebaseConfig';
import RequestEditCard from '../components/RequestEditCard';
import { ServiceRequest } from '../types/navigation';

type CategoryType = 'pending' | 'completed' | 'hidden';

const RequestHistoryScreen = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('pending');
  const [statusChangeModalVisible, setStatusChangeModalVisible] = useState(false);
  const [requestToChangeStatus, setRequestToChangeStatus] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const unsubscribe = firestore
        .collection('serviceRequests')
        .where('userId', '==', userId)
        .onSnapshot((snapshot) => {
          const fetchedRequests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ServiceRequest));
          setRequests(fetchedRequests);
        });
      return () => unsubscribe();
    }
  }, []);

  const handleRequestPress = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  const handleStatusChange = async (requestId: string, newStatus: CategoryType) => {
    try {
      await firestore.collection('serviceRequests').doc(requestId).update({ status: newStatus });
      setStatusChangeModalVisible(false);
      setRequestToChangeStatus(null);
    } catch (error) {
      console.error("Error updating request status:", error);
      Alert.alert("오류", "상태 변경 중 오류가 발생했습니다.");
    }
  };

  const filteredRequests = requests.filter(request => request.status === selectedCategory);

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity onPress={() => handleRequestPress(item)}>
      <View style={styles.requestItem}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        )}
        <View style={styles.requestInfo}>
          <Text style={styles.requestTitle}>{item.title}</Text>
          <Text style={styles.requestStatus}>{item.status}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            setRequestToChangeStatus(item);
            setStatusChangeModalVisible(true);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = (category: CategoryType, label: string) => (
    <TouchableOpacity
      style={[styles.categoryButton, selectedCategory === category && styles.selectedCategory]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStatusChangeModal = () => (
    <Modal
      visible={statusChangeModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setStatusChangeModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>상태 변경</Text>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleStatusChange(requestToChangeStatus?.id || '', 'pending')}
          >
            <Text style={styles.statusButtonText}>요청중</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleStatusChange(requestToChangeStatus?.id || '', 'completed')}
          >
            <Text style={styles.statusButtonText}>완료</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleStatusChange(requestToChangeStatus?.id || '', 'hidden')}
          >
            <Text style={styles.statusButtonText}>숨김</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, styles.cancelButton]}
            onPress={() => setStatusChangeModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.categoryContainer}>
        {renderCategory('pending', '요청중')}
        {renderCategory('completed', '완료')}
        {renderCategory('hidden', '숨김')}
      </View>
      <FlatList
        data={filteredRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {selectedRequest && (
          <RequestEditCard
            request={selectedRequest}
            onClose={() => setIsModalVisible(false)}
            onUpdate={(updatedRequest) => {
              setIsModalVisible(false);
            }}
          />
        )}
      </Modal>
      {renderStatusChangeModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestStatus: {
    fontSize: 14,
    color: 'gray',
  },
  moreButton: {
    padding: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  statusButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
  },
});

export default RequestHistoryScreen;