import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  BookOpen,
  Sparkles,
} from "lucide-react-native";
import { BRAND_COLORS } from "@odisha-rank/shared";

interface StopwatchModalProps {
  visible: boolean;
  onClose: () => void;
  onSessionLogged: (minutes: number, notes: string) => Promise<boolean | void>;
  activeTopicTitle?: string;
}

export const StopwatchModal: React.FC<StopwatchModalProps> = ({
  visible,
  onClose,
  onSessionLogged,
  activeTopicTitle = "Self-Study Revision",
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [topicNote, setTopicNote] = useState(activeTopicTitle);
  const [isSaving, setIsSaving] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync topic note if activeTopicTitle changes
  useEffect(() => {
    if (activeTopicTitle) {
      setTopicNote(activeTopicTitle);
    }
  }, [activeTopicTitle]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Clean interval when closed
  const handleClose = () => {
    if (isRunning && elapsedSeconds > 10) {
      Alert.alert(
        "Stopwatch Running",
        "Your stopwatch is currently running. Would you like to pause and keep time, or exit?",
        [
          { text: "Keep Timing", style: "cancel" },
          {
            text: "Pause & Exit",
            onPress: () => {
              setIsRunning(false);
              onClose();
            },
          },
        ]
      );
      return;
    }
    onClose();
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const handleFinishAndSave = async () => {
    if (elapsedSeconds < 15) {
      Alert.alert("Session Too Short", "Please study for at least 15 seconds to log your session.");
      return;
    }

    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    setIsSaving(true);
    try {
      await onSessionLogged(minutes, topicNote || "Focused Self-Study");
      setIsRunning(false);
      setElapsedSeconds(0);
      onClose();
      Alert.alert(
        "🎉 Great Session!",
        `Recorded ${minutes} minute${minutes > 1 ? "s" : ""} of focused study for "${topicNote}".`
      );
    } catch {
      Alert.alert("Save Notice", `Recorded ${minutes}m locally.`);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Format HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={styles.timerIconBox}>
                <Timer size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.cardHeaderTitle}>Study Stopwatch</Text>
                <Text style={styles.cardHeaderSub}>Live focused preparation timer</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Glowing Timer Display */}
          <View style={styles.timerDisplayContainer}>
            <View style={[styles.timerHalo, isRunning && styles.timerHaloActive]}>
              <Text style={styles.timerDigits}>{formatTime(elapsedSeconds)}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, isRunning && styles.statusDotActive]} />
                <Text style={styles.statusText}>
                  {isRunning ? "TIMING IN PROGRESS" : elapsedSeconds > 0 ? "PAUSED" : "READY"}
                </Text>
              </View>
            </View>
          </View>

          {/* Topic/Chapter Selection Input */}
          <View style={styles.topicSection}>
            <Text style={styles.topicLabel}>Active Topic / Task</Text>
            <View style={styles.topicInputWrapper}>
              <BookOpen size={16} color="#64748b" />
              <TextInput
                value={topicNote}
                onChangeText={setTopicNote}
                placeholder="e.g. Quantitative Aptitude - Simplification"
                placeholderTextColor="#94a3b8"
                style={styles.topicInput}
              />
            </View>
          </View>

          {/* Stopwatch Controls */}
          <View style={styles.controlsRow}>
            {/* Reset Button */}
            <TouchableOpacity
              onPress={handleReset}
              disabled={elapsedSeconds === 0}
              style={[styles.resetBtn, elapsedSeconds === 0 && styles.btnDisabled]}
              activeOpacity={0.7}
            >
              <RotateCcw size={18} color={elapsedSeconds === 0 ? "#94a3b8" : "#475569"} />
            </TouchableOpacity>

            {/* Play / Pause Toggle */}
            <TouchableOpacity
              onPress={() => setIsRunning(!isRunning)}
              style={[styles.playBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
              activeOpacity={0.85}
            >
              {isRunning ? (
                <>
                  <Pause size={20} color="#ffffff" />
                  <Text style={styles.playBtnText}>Pause</Text>
                </>
              ) : (
                <>
                  <Play size={20} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.playBtnText}>
                    {elapsedSeconds > 0 ? "Resume" : "Start"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Finish & Save Session */}
            <TouchableOpacity
              onPress={handleFinishAndSave}
              disabled={elapsedSeconds === 0 || isSaving}
              style={[
                styles.finishBtn,
                (elapsedSeconds === 0 || isSaving) && styles.btnDisabled,
              ]}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={18} color="#ffffff" />
                  <Text style={styles.finishBtnText}>Finish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  cardHeaderSub: {
    fontSize: 11,
    color: "#64748b",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  timerDisplayContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  timerHalo: {
    width: "100%",
    backgroundColor: "#091224",
    borderRadius: 20,
    paddingVertical: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#1e293b",
  },
  timerHaloActive: {
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 4,
  },
  timerDigits: {
    fontSize: 42,
    fontWeight: "900",
    color: "#38bdf8",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#94a3b8",
  },
  statusDotActive: {
    backgroundColor: "#10b981",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  topicSection: {
    marginVertical: 12,
  },
  topicLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  topicInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  topicInput: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  resetBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startBtn: {
    backgroundColor: "#2563eb",
  },
  pauseBtn: {
    backgroundColor: "#f59e0b",
  },
  playBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  finishBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  finishBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.45,
  },
});
