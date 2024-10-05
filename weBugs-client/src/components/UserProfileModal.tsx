import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { firestore } from '../../firebaseConfig';

type UserProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

type CollectionHistoryItem = {
  id: string;
  requestTitle: string;
  completedAt: Date;
  rating: number;
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, userId }) => {
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [totalCollections, setTotalCollections] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistoryItem[]>([]);

  useEffect(() => {
    if (visible && userId) {
      fetchUserData();
    }
  }, [visible, userId]);

  const fetchUserData = async () => {
    try {
      const userDoc = await firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData) {
        setProfilePicture(userData.profilePicture || null);
      }

      const historySnapshot = await firestore
        .collection('collectionHistory')
        .where('collectorId', '==', userId)
        .get();

      const history: CollectionHistoryItem[] = [];
      let totalRating = 0;

      historySnapshot.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          requestTitle: data.requestTitle,
          completedAt: data.completedAt.toDate(),
          rating: data.rating
        });
        totalRating += data.rating;
      });

      setCollectionHistory(history);
      setTotalCollections(history.length);
      setAverageRating(history.length > 0 ? totalRating / history.length : 0);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const renderHistoryItem = ({ item }: { item: CollectionHistoryItem }) => (
    <View style={styles.historyItem}>
      <Text>{item.requestTitle}</Text>
      <Text>{item.completedAt.toLocaleDateString()}</Text>
      <Text>평점: {item.rating}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text>X</Text>
          </TouchableOpacity>
          {profilePicture && (
            <Image source={{ uri: profilePicture }} style={styles.profilePicture} />
          )}
          <Text style={styles.infoText}>총 채집 횟수: {totalCollections}</Text>
          <Text style={styles.infoText}>평균 점수: {averageRating.toFixed(2)}</Text>
          <Text style={styles.historyTitle}>채집 내역:</Text>
          <FlatList
            data={collectionHistory}
            renderItem={renderHistoryItem}
            keyExtractor={item => item.id}
            style={styles.historyList}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 5,
  },
});

export default UserProfileModal;