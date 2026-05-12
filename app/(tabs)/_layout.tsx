import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { colors } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'WODs',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>&#9776;</Text>,
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: 'Moves',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>&#9654;</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>&#10010;</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Log',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>&#9201;</Text>,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Gear',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>&#9881;</Text>,
        }}
      />
    </Tabs>
  );
}
