// Root index — checks whether the user has completed onboarding.
// First launch → /onboarding. Returning user → /discover.
// Returns null while the async check runs; the splash screen has already
// hidden by the time this executes (fonts are loaded in _layout.tsx first).

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      router.replace(seen ? '/discover' : '/onboarding');
    })();
  }, []);

  return null;
}
