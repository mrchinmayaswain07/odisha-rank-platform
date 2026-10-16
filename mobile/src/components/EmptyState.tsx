import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.button}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
    marginVertical: 12,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND_COLORS.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  button: {
    marginTop: 16,
  },
});
