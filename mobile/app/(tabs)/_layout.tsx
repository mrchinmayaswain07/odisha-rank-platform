import React from "react";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Layers,
  HelpCircle,
  Award,
  User,
} from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_COLORS.primary,
        tabBarInactiveTintColor: BRAND_COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: BRAND_COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="syllabus"
        options={{
          title: "Syllabus",
          tabBarIcon: ({ color, size }) => (
            <Layers size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, size }) => (
            <HelpCircle size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mock-tests"
        options={{
          title: "Mocks",
          tabBarIcon: ({ color, size }) => (
            <Award size={size || 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <User size={size || 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
