import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, ServiceRequest } from '../types/navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, firestore } from '../../firebaseConfig';
import firebase from 'firebase/compat/app';
import commonStyles from '../styles/commonStyles'

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<ServiceRequest[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ServiceRequest[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts();
    }
  }, [isAuthenticated, statusFilter]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(lowercasedQuery) ||
        post.location.toLowerCase().includes(lowercasedQuery) ||
        (post.amount && post.amount.toString().includes(lowercasedQuery))
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      let query: firebase.firestore.Query<firebase.firestore.DocumentData> = firestore.collection('serviceRequests');
      if (statusFilter !== 'all') {
        query = query.where('status', '==', statusFilter);
      }
      const snapshot = await query.get();
      const fetchedPosts: ServiceRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as ServiceRequest[];
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  };

  const dismissSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    Keyboard.dismiss();
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
    <TouchableWithoutFeedback onPress={dismissSearch}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={toggleSearch}>
            <Icon name="search-outline" size={24} />
          </TouchableOpacity>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'all' && styles.activeFilterButton]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.activeFilterButtonText]}>전체</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'pending' && styles.activeFilterButton]}
              onPress={() => setStatusFilter('pending')}
            >
              <Text style={[styles.filterButtonText, statusFilter === 'pending' && styles.activeFilterButtonText]}>요청중</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'completed' && styles.activeFilterButton]}
              onPress={() => setStatusFilter('completed')}
            >
              <Text style={[styles.filterButtonText, statusFilter === 'completed' && styles.activeFilterButtonText]}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        )}
        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.postList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  ...commonStyles,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  filterButton: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DEF9C4',
  },
  activeFilterButton: {
    backgroundColor: '#DEF9C4',
  },
  filterButtonText: {
    color: 'black',
  },
  activeFilterButtonText: {
    color: '#2E8B57',
  },
  location: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#9CDBA6',
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
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
  filterButtons: {
    flexDirection: 'row',
  },
});

export default HomeScreen;