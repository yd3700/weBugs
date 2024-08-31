import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceRequest } from '../types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, firestore } from '../../firebaseConfig';

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
        fetchPosts();
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
      const snapshot = await firestore.collection('serviceRequests')
        .where('status', 'in', ['pending', 'completed'])
        .get();
      const fetchedPosts: ServiceRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as ServiceRequest[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity onPress={() => navigation.navigate('RequestDetails', { request: item })}>
      <View style={styles.postContainer}>
        <View style={styles.imageContainer}>
          {item.imageUrl && (
            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          )}
          {item.status === 'completed' && (
            <View style={styles.completedOverlay}>
              <Text style={styles.completedText}>완료</Text>
            </View>
          )}
        </View>
        <View style={styles.postDetails}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postLocation}>{item.location}</Text>
          <Text style={styles.postPrice}>
            {item.transactionType === 'money' ? `${item.amount?.toLocaleString()}원` : '봉사'}
          </Text>
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
        </View>
      </View>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.postList}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
  postList: {
    paddingBottom: 60,
  },
  postContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 15,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    transform: [{ rotate: '-45deg' }],
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