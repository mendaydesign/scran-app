// Root layout — wraps every screen in the app.
// GestureHandlerRootView must be the outermost wrapper for react-native-gesture-handler
// to work correctly. SafeAreaProvider makes safe-area insets available to all screens.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SavedRecipesProvider } from '@/context/SavedRecipesContext';
import { PantryProvider } from '@/context/PantryContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Both context providers wrap everything so state is shared across all tabs. */}
        <SavedRecipesProvider>
          <PantryProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="light" />
          </PantryProvider>
        </SavedRecipesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
