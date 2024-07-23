// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ListRenderItem } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Post } from '../types/navigation'; // 경로는 실제 위치에 맞게 조정하세요
import Icon from 'react-native-vector-icons/Ionicons';

const posts: Post[] = [
  { id: '1', title: '다이노코어 식탁매트(새상품)', location: '동래구 명장제1동', price: '1,000원', image: 'https://via.placeholder.com/100' },
  { id: '2', title: '오늘자 롯데 야구 티켓 팝니다', location: '우제2동', price: '25,000원', image: 'https://via.placeholder.com/100' },
  { id: '3', title: '하회탈', location: '연제구 거제제2동', price: '5,000원', image: 'https://via.placeholder.com/100' },
  { id: '4', title: '피씨방 책상 1인책상 컴퓨터 책상', location: '우동', price: '나눔', image: 'https://via.placeholder.com/100' },
];

const HomeScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const renderItem: ListRenderItem<Post> = ({ item }) => (
    <View style={styles.postContainer}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
      <View style={styles.postDetails}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postLocation}>{item.location}</Text>
        <Text style={styles.postPrice}>{item.price}</Text>
      </View>
    </View>
  );

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
      />
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Icon name="home-outline" size={30} />
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Request')}>
          <Icon name="add-circle-outline" size={30} />
          <Text>Request</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-outline" size={30} />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
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
  postImage: {
    width: 80,
    height: 80,
    marginRight: 15,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});

export default HomeScreen;
