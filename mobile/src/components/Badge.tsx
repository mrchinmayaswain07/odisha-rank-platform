import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";

interface BadgeProps {
  label: string;
  variant?: "blue" | "emerald" | "amber" | "slate";
  size?: "sm" | "md";
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "blue",
  size = "md",
  style,
  textStyle,
  icon,
}) => {
  const getColors = () => {
    switch (variant) {
      case "emerald":
        return { bg: "#ecfdf5", border: "#a7f3d0", text: "#047857" };
      case "amber":
        return { bg: "#fffbeb", border: "#fde68a", text: "#b45309" };
      case "slate":
        return { bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" };
      default:
        return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: size === "sm" ? 2 : 4,
          paddingHorizontal: size === "sm" ? 8 : 10,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: size === "sm" ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 4,
  },
  text: {
    fontWeight: "700",
  },
});
