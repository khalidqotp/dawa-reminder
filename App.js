import React from 'react';
import { Text, I18nManager, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { StatusBar } from 'expo-status-bar';

import { AppProvider, useApp } from './src/store/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import MedsScreen from './src/screens/MedsScreen';
import MedFormScreen from './src/screens/MedFormScreen';
import LabsScreen from './src/screens/LabsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TroubleshootScreen from './src/screens/TroubleshootScreen';
import { COLORS, FONT } from './src/theme';

// اتجاه RTL كامل
try {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
} catch (e) {}

// خط Cairo افتراضيًا لكل النصوص
try {
  Text.defaultProps = { ...(Text.defaultProps || {}), style: { fontFamily: 'Cairo_400Regular' } };
} catch (e) {}

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.bg,
    card: '#FFFFFF',
    text: COLORS.text,
    primary: COLORS.primary,
    border: COLORS.border,
  },
};

const TAB_ICONS = {
  Home: 'calendar',
  Meds: 'medkit-outline',
  Labs: 'flask-outline',
  History: 'time-outline',
  Settings: 'settings-outline',
};

function TabsNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        headerTitleStyle: { fontFamily: FONT.bold, fontSize: 18 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.sub,
        tabBarLabelStyle: { fontFamily: FONT.bold, fontSize: 12 },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: 'اليوم' }} />
      <Tabs.Screen name="Meds" component={MedsScreen} options={{ title: 'الأدوية' }} />
      <Tabs.Screen name="Labs" component={LabsScreen} options={{ title: 'التحاليل' }} />
      <Tabs.Screen name="History" component={HistoryScreen} options={{ title: 'السجل' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'الإعدادات' }} />
    </Tabs.Navigator>
  );
}

function Root() {
  const { ready } = useApp();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="MedForm" component={MedFormScreen} options={{ title: 'بيانات الدواء', headerTitleAlign: 'center' }} />
        <Stack.Screen name="Troubleshoot" component={TroubleshootScreen} options={{ title: 'التنبيهات والتذكيرات الدقيقة', headerTitleAlign: 'center' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold });
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <Root />
    </AppProvider>
  );
}
