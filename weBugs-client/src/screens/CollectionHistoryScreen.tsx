import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { firestore, auth } from '../../firebaseConfig';
import { RootStackParamList, CollectionHistoryItem } from '../types/navigation';
import commonStyles from '../styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

const CollectionHistoryScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistoryItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCollections, setTotalCollections] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCollectionHistory = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('사용자가 로그인되어 있지 않습니다.');
        setIsLoading(false);
        return;
      }
    
      try {
        const historySnapshot = await firestore
          .collection('collectionHistory')
          .where('collectorId', '==', currentUser.uid)
          .get();
    
        const historyData: CollectionHistoryItem[] = historySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            requesterId: data.requesterId,
            collectorId: data.collectorId,
            rating: data.rating,
            completedAt: data.completedAt.toDate(),
            requestTitle: data.requestTitle || '제목 없음',
            requestImage: data.requestImage || '',
          };
        });
    
        setCollectionHistory(historyData);
        setTotalCollections(historyData.length);
        const totalRating = historyData.reduce((sum, item) => sum + item.rating, 0);
        setAverageRating(historyData.length > 0 ? totalRating / historyData.length : 0);
      } catch (error) {
        console.error('채집 내역을 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionHistory();
  }, []);

  const renderItem = ({ item }: { item: CollectionHistoryItem }) => (
    <View style={styles.item}>
      {item.requestImage ? (
        <Image source={{ uri: item.requestImage }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text>No Image</Text>
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.title}>{item.requestTitle}</Text>
        <Text>평점: {item.rating}</Text>
        <Text>완료일: {item.completedAt.toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
        {/* <Text style={styles.headerTitle}>채집 내역</Text> */}
      </View>
      <View style={styles.container}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>평균 점수: {averageRating.toFixed(2)}</Text>
          <Text style={styles.summaryText}>총 채집 횟수: {totalCollections}</Text>
        </View>
        <FlatList
          data={collectionHistory}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>채집 내역이 없습니다.</Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(222, 249, 196, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(222, 249, 196, 0.3)',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    color: 'gray',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  container: {
    flex: 1,
    padding: 10,
  },
  summary: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 5,
    elevation: 3,
    flexDirection: 'row',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CollectionHistoryScreen;