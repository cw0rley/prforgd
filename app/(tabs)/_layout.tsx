import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const iconSize = isDesktop ? 26 : 22;
  const labelSize = isDesktop ? 14 : 10;

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
          paddingTop: isDesktop ? 10 : 6,
          height: Platform.OS === 'ios' ? 85 : isDesktop ? 70 : 58,
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
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Log',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipment"
        options={{
          title: 'Gear',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="build-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="movements"
        options={{
          title: 'Moves',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="play-circle-outline" size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
