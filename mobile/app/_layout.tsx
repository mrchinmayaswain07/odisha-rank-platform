import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { AuthProvider } from "../src/lib/auth-context";
import { supabase } from "../src/lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    // Handle deep links for email verification and password reset
    const handleDeepLink = async (event: { url: string }) => {
      const data = Linking.parse(event.url);
      if (data.queryParams?.access_token && data.queryParams?.refresh_token) {
        await supabase.auth.setSession({
          access_token: String(data.queryParams.access_token),
          refresh_token: String(data.queryParams.refresh_token),
        });
      }
    };

    const sub = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="course-select"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{ presentation: "modal", headerShown: false }}
          />
          <Stack.Screen
            name="admin"
            options={{ presentation: "card", headerShown: false }}
          />
          <Stack.Screen name="topic/[topicId]" options={{ headerShown: false }} />
          <Stack.Screen name="material/[materialId]" options={{ headerShown: false }} />
          <Stack.Screen name="mock-test/[testId]" options={{ headerShown: false }} />
          <Stack.Screen name="mock-test/[testId]/result" options={{ headerShown: false }} />
          <Stack.Screen name="games/index" options={{ headerShown: false }} />
          <Stack.Screen name="games/[gameId]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
