import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FileText, ExternalLink, Download } from "lucide-react-native";
import { BRAND_COLORS, StudyMaterial } from "@odisha-rank/shared";
import { getStudyMaterialById } from "../../src/lib/data-service";
import { Header } from "../../src/components/Header";
import { Badge } from "../../src/components/Badge";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";

export default function MaterialDetailScreen() {
  const { materialId } = useLocalSearchParams<{ materialId: string }>();
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!materialId) return;

    const loadMaterial = async () => {
      setIsLoading(true);
      try {
        const found = await getStudyMaterialById(materialId);
        setMaterial(found);
      } catch (err) {
        console.warn("Failed to load material:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMaterial();
  }, [materialId]);

  const handleOpenPdf = async () => {
    const targetUrl = material?.file_url || material?.url;
    if (!targetUrl) return;

    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        Alert.alert(
          "Document Notice",
          "This external document archive cannot be opened directly on this device. You can read the complete verified study summary below."
        );
      }
    } catch {
      Alert.alert(
        "Study Notes Available",
        "Official document reference link is currently in archival state. The comprehensive study notes and syllabus points are displayed below."
      );
    }
  };

  const targetUrl = material?.file_url || material?.url;
  const isGoogleDrive = Boolean(targetUrl?.includes("drive.google.com") || targetUrl?.includes("docs.google.com"));
  const hasExternalDoc = Boolean(targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://") || targetUrl.endsWith(".pdf")));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Study Notes" showBack={true} showCoursePill={false} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            <Text style={styles.loaderText}>Loading study material...</Text>
          </View>
        ) : material ? (
          <View style={styles.container}>
            <View style={styles.metaRow}>
              <Badge
                label={material.material_type.toUpperCase()}
                variant="blue"
                size="sm"
              />
              {isGoogleDrive ? (
                <Badge label="Google Drive" variant="amber" size="sm" />
              ) : material.category ? (
                <Badge label={material.category} variant="slate" size="sm" />
              ) : null}
            </View>

            <Text style={styles.title}>{material.title}</Text>

            {hasExternalDoc && (
              <Button
                title={isGoogleDrive ? "Open in Google Drive" : "Open Document / PDF"}
                onPress={handleOpenPdf}
                size="md"
                variant="outline"
                icon={<ExternalLink size={16} color={BRAND_COLORS.primary} />}
                style={styles.pdfButton}
              />
            )}

            {/* Note Content */}
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                {material.content || material.description || "No text content available."}
              </Text>
            </View>
          </View>
        ) : (
          <EmptyState
            title="Material Not Found"
            description="The requested study material could not be retrieved."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    lineHeight: 26,
    marginBottom: 16,
  },
  pdfButton: {
    marginBottom: 20,
  },
  contentBox: {
    backgroundColor: BRAND_COLORS.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND_COLORS.border,
  },
  contentText: {
    fontSize: 14,
    color: BRAND_COLORS.textPrimary,
    lineHeight: 22,
  },
});
