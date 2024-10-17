import React, { useState, ReactNode  } from 'react';
import { View, Text, SafeAreaView, StatusBar, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

// Import your screens here
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

interface SafeAreaWrapperProps {
  children: ReactNode;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({ children }) => (
  <SafeAreaView style={styles.safeArea}>
    {children}
  </SafeAreaView>
);

const HomeTabs = () => {
  const { totalUnreadCount, setTotalUnreadCount } = React.useContext(UnreadContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'help-outline';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Request') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'ChatList') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9CDBA6',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Request" component={RequestScreen} />
      <Tab.Screen
        name="ChatList"
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="chatbubble-outline" color={color} size={size} />
              {totalUnreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
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
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  return (
    <UnreadContext.Provider value={{ totalUnreadCount, setTotalUnreadCount }}>
      <NavigationContainer>
        <SafeAreaWrapper>
          <StatusBar backgroundColor="white" barStyle="dark-content" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ProfileView" component={ProfileViewScreen} />
            <Stack.Screen name="RequestHistory" component={RequestHistoryScreen} />
            <Stack.Screen name="CollectionHistory" component={CollectionHistoryScreen} />
          </Stack.Navigator>
        </SafeAreaWrapper>
      </NavigationContainer>
    </UnreadContext.Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    // backgroundColor: '#A9F0D1',
    backgroundColor: 'white',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AppNavigator;