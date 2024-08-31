import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestScreen from '../screens/RequestScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileViewScreen from '../screens/ProfileViewScreen';
import RequestHistoryScreen from '../screens/RequestHistoryScreen';
import CollectionHistoryScreen from '../screens/CollectionHistoryScreen';

import { RootStackParamList } from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

export const UnreadContext = React.createContext({
  totalUnreadCount: 0,
  setTotalUnreadCount: (count: number) => {},
});

const HomeTabs = () => {
  const { totalUnreadCount, setTotalUnreadCount } = React.useContext(UnreadContext);

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Request"
        component={RequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="add-circle-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="chatbubble-outline" color={color} size={size} />
              {totalUnreadCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: 'red',
                  borderRadius: 9,
                  width: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      >
        {(props) => <ChatListScreen {...props} setTotalUnreadCount={setTotalUnreadCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  return (
    <UnreadContext.Provider value={{ totalUnreadCount, setTotalUnreadCount }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
          <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
          <Stack.Screen name="RequestHistory" component={RequestHistoryScreen} />
          <Stack.Screen name="CollectionHistory" component={CollectionHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UnreadContext.Provider>
  );
};

export default AppNavigator;