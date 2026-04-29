// Root index — checks whether the user has completed onboarding.
// First launch → /onboarding. Returning user → /discover.
// Returns null while the async check runs; the splash screen has already
// hidden by the time this executes (fonts are loaded in _layout.tsx first).

import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Always route through /splash first — it handles the intro animation
    // then hands off to /onboarding (dev) or /discover (returning user).
    router.replace('/splash');
  }, []);

  return null;
}
