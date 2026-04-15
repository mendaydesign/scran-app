// Tab navigator layout — three bottom tabs: Discover, Saved, Pantry.
// Active tab shows a solid green circle behind the icon; labels are hidden.

import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/tokens';

// Renders the icon inside a green circle when the tab is active
function TabIcon({
  name,
  focused,
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
}) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? '#ffffff' : Colors.textSecondary}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          // Fixed height + explicit bottom padding so the bar stays visible
          // on both notched and non-notched devices
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'compass' : 'compass-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'heart' : 'heart-outline'}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'basket' : 'basket-outline'}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.primary,
  },
});
