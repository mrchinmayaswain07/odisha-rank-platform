import React, { useEffect } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  Layers,
  Brain,
  Award,
  User,
  LucideIcon,
} from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";
import { useAuth } from "../../src/lib/auth-context";

interface TabBarIconProps {
  Icon: LucideIcon;
  focused: boolean;
  color: string;
}

function TabBarIcon({ Icon, focused, color }: TabBarIconProps) {
  return (
    <View
      style={[
        styles.iconContainer,
        focused ? styles.iconContainerFocused : styles.iconContainerInactive,
      ]}
    >
      <Icon
        size={20}
        color={focused ? BRAND_COLORS.primary : color}
        strokeWidth={focused ? 2.3 : 1.9}
      />
    </View>
  );
}

export default function TabLayout() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/(auth)/login");
    }
  }, [session, isLoading]);

  // Android safe-area calculation: gracefully adapts to system gesture nav or 3-button nav
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 4 : 8;
  const barHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_COLORS.primary,
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          ...Platform.select({
            ios: {
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
            },
            android: {
              elevation: 6,
            },
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "700",
          letterSpacing: 0.1,
          marginTop: 2,
          marginBottom: 0,
        },
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{
              color: "rgba(37, 99, 235, 0.08)",
              borderless: true,
              radius: 36,
            }}
            style={({ pressed }) => [
              props.style as any,
              pressed && { opacity: 0.85 },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={LayoutDashboard} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="syllabus"
        options={{
          title: "Syllabus",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Layers} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="brain-gym"
        options={{
          title: "Brain Gym",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Brain} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mock-tests"
        options={{
          title: "Mocks",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={Award} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon Icon={User} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerFocused: {
    backgroundColor: "rgba(37, 99, 235, 0.10)",
  },
  iconContainerInactive: {
    backgroundColor: "transparent",
  },
});
