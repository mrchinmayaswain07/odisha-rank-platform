import React, { useEffect } from "react";
import {
  View,
  Text,
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

interface TabBarLabelProps {
  label: string;
  focused: boolean;
}

function TabBarLabel({ label, focused }: TabBarLabelProps) {
  return (
    <View style={styles.labelWrapper}>
      <Text
        numberOfLines={1}
        style={[
          styles.labelText,
          focused ? styles.labelTextFocused : styles.labelTextInactive,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.activeIndicator,
          focused ? styles.activeIndicatorFocused : styles.activeIndicatorHidden,
        ]}
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
  const barHeight = 62 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_COLORS.primary,
        tabBarInactiveTintColor: "#64748b",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopColor: "#e2e8f0",
          borderTopWidth: 1,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: bottomPadding,
          ...Platform.select({
            ios: {
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
            },
            android: {
              elevation: 8,
            },
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          alignItems: "center",
          justifyContent: "center",
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
              pressed && { opacity: 0.82 },
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
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Dashboard" focused={focused} />
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
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Syllabus" focused={focused} />
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
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Brain Gym" focused={focused} />
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
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Mocks" focused={focused} />
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
          tabBarLabel: ({ focused }) => (
            <TabBarLabel label="Profile" focused={focused} />
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  iconContainerFocused: {
    backgroundColor: "rgba(37, 99, 235, 0.10)",
    borderColor: "rgba(37, 99, 235, 0.12)",
  },
  iconContainerInactive: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  labelWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  labelText: {
    fontSize: 10.5,
    letterSpacing: 0.1,
    textAlign: "center",
  },
  labelTextFocused: {
    fontWeight: "700",
    color: BRAND_COLORS.primary,
  },
  labelTextInactive: {
    fontWeight: "600",
    color: "#64748b",
  },
  activeIndicator: {
    width: 14,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  activeIndicatorFocused: {
    backgroundColor: BRAND_COLORS.primary,
  },
  activeIndicatorHidden: {
    backgroundColor: "transparent",
  },
});
