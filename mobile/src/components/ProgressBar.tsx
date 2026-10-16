import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: "blue" | "emerald" | "amber";
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "blue",
  height = 8,
  style,
}) => {
  const clamped = Math.max(0, Math.min(100, progress || 0));

  const getBarColor = () => {
    switch (color) {
      case "emerald":
        return BRAND_COLORS.success;
      case "amber":
        return BRAND_COLORS.warning;
      default:
        return BRAND_COLORS.primary;
    }
  };

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            backgroundColor: getBarColor(),
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
