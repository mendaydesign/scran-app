// Root index — redirects immediately to the Discover tab.
// This file must exist so Expo Router has a handler for the '/' route,
// but all real content lives under (tabs)/discover.tsx.
// Redirect uses router.replace so the back button never returns here.

import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/discover" />;
}
