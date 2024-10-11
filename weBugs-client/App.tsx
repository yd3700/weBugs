import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeAuth } from './firebaseConfig';

export default function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return <AppNavigator />;
}