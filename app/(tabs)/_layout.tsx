import { Tabs } from 'expo-router';
import { Text, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../../src/theme';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const iconSize = isDesktop ? 28 : 22;
  const labelSize = isDesktop ? 14 : 11;

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
          paddingBottom: Platform.OS === 'ios' ? 24 : isDesktop ? 12 : 8,
          paddingTop: isDesktop ? 12 : 8,
          height: Platform.OS === 'ios' ? 90 : isDesktop ? 75 : 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: labelSize,
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
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#9776;</Text>,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#10010;</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Log',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#9201;</Text>,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Gear',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#9881;</Text>,
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: 'Moves',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#9654;</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: iconSize, color }}>&#9787;</Text>,
        }}
      />
    </Tabs>
  );
}
