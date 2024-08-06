// src/screens/RequestDetailsScreen.tsx
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type RequestDetailsScreenRouteProp = RouteProp<RootStackParamList, 'RequestDetails'>;
type Props = {
  route: RequestDetailsScreenRouteProp;
};

const RequestDetailsScreen = ({ route }: Props) => {
  const { post } = route.params;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>요청 상세 정보</Text>
      <Text style={styles.label}>설명:</Text>
      <Text style={styles.text}>{post.description}</Text>
      <Text style={styles.label}>위치:</Text>
      <Text style={styles.text}>{post.location}</Text>
      <Button title="채팅" onPress={() => navigation.navigate('Chat', { chatId: post.id })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
});

export default RequestDetailsScreen;
