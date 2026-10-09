import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

import { AuthProvider, useAuth } from './src/store/authStore';

// Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import HomeScreen from './src/screens/student/HomeScreen';
import ComplaintsScreen from './src/screens/student/ComplaintsScreen';
import NewComplaintScreen from './src/screens/student/NewComplaintScreen';
import LostFoundScreen from './src/screens/shared/LostFoundScreen';
import ProfileScreen from './src/screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, focused, isMain = false }) => {
  return (
    <View style={[styles.iconContainer, isMain && styles.mainIconContainer]}>
      <Text style={[styles.iconText, { color: isMain ? '#FFF' : color }, isMain && styles.mainIconText]}>
        {name}
      </Text>
    </View>
  );
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#8B8BA7',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="🏠" color={color} focused={focused} />
        }}
      />
      <Tab.Screen 
        name="Complaints" 
        component={ComplaintsScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="📄" color={color} focused={focused} />
        }}
      />
      <Tab.Screen 
        name="NewComplaint" 
        component={NewComplaintScreen} 
        options={{
          tabBarLabel: 'New',
          tabBarIcon: ({ color, focused }) => <TabIcon name="➕" color={color} focused={focused} isMain />
        }}
      />
      <Tab.Screen 
        name="LostFound" 
        component={LostFoundScreen} 
        options={{
          tabBarLabel: 'Lost & Found',
          tabBarIcon: ({ color, focused }) => <TabIcon name="🔍" color={color} focused={focused} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => <TabIcon name="👤" color={color} focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F1A' } }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <NavigationContainer theme={{ colors: { background: '#0F0F1A' } }}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
  },
  tabBar: {
    backgroundColor: '#1A1A2E',
    borderTopWidth: 0,
    elevation: 0,
    height: 60,
    paddingBottom: 5,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIconContainer: {
    backgroundColor: '#6C63FF',
    width: 48,
    height: 48,
    borderRadius: 24,
    marginTop: -20,
    elevation: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconText: {
    fontSize: 20,
  },
  mainIconText: {
    fontSize: 24,
  }
});
