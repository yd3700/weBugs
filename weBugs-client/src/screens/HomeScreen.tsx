// src/screens/HomeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceRequest } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, firestore } from '../../firebaseConfig'; // Firebase imports

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsAuthenticated(true);
        fetchPosts(); // Fetch posts when user is authenticated
      } else {
        setIsAuthenticated(false);
        navigation.navigate('Login');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [navigation]);

  const fetchPosts = async () => {
    try {
      const snapshot = await firestore.collection('serviceRequests').get();
      const fetchedPosts: ServiceRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(), // Firestore Timestamp를 Date로 변환
        updatedAt: doc.data().updatedAt.toDate(), // Firestore Timestamp를 Date로 변환
      })) as ServiceRequest[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(); // Refresh the posts
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity onPress={() => navigation.navigate('RequestDetails', { request: item })}>
      <View style={styles.postContainer}>
        {/* 기본 이미지가 없으므로, image 필드는 제거 */}
        <View style={styles.postDetails}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postLocation}>{item.location}</Text>
          <Text style={styles.postPrice}>{item.transactionType === 'money' ? `${item.amount?.toLocaleString()}원` : '봉사'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.location}>우제2동</Text>
        <View style={styles.headerIcons}>
          <Icon name="search-outline" size={24} />
          <Icon name="notifications-outline" size={24} style={styles.icon} />
        </View>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.postList}
        refreshing={refreshing} // 새로고침 상태
        onRefresh={handleRefresh} // 새로고침 로직 연결
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  icon: {
    marginLeft: 15,
  },
  postList: {
    paddingBottom: 60, // Adjust to prevent content from being hidden behind footer
  },
  postContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  postDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postLocation: {
    color: '#888',
    marginVertical: 5,
  },
  postPrice: {
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen;
