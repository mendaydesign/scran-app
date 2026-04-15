// Root layout — wraps every screen in the app.
// GestureHandlerRootView must be the outermost wrapper for react-native-gesture-handler
// to work correctly. SafeAreaProvider makes safe-area insets available to all screens.
// useFonts loads custom fonts before any screen renders; SplashScreen keeps the
// native splash visible until loading is complete.

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SavedRecipesProvider } from '@/context/SavedRecipesContext';
import { PantryProvider } from '@/context/PantryContext';

// Keep the splash screen visible while fonts are loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'ClashGrotesk-Bold':      require('../assets/fonts/ClashGrotesk-Bold.otf'),
    'ClashGrotesk-Semibold':  require('../assets/fonts/ClashGrotesk-Semibold.otf'),
    'NeueHaasDisplay-Light':  require('../assets/fonts/NeueHaasDisplayLight.ttf'),
  });

  useEffect(() => {
    // Hide the splash screen once fonts have loaded (or if loading failed)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are ready — prevents a flash of unstyled text
  if (!fontsLoaded && !fontError) {
    return null;
  }

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
