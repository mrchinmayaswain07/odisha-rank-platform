import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ShieldCheck,
  Users,
  Layers,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Search,
  UserCheck,
  UserX,
  GraduationCap,
} from "lucide-react-native";
import { BRAND_COLORS, SITE_CONFIG } from "@odisha-rank/shared";
import { useAuth } from "../src/lib/auth-context";
import {
  getAdminOverviewStats,
  getAdminQuestionsList,
  createAdminQuestion,
  deleteAdminQuestion,
  getAdminCoursesList,
  createAdminCourse,
  getAdminMockTestsList,
  createAdminMockTest,
  getAdminMaterialsList,
  createAdminMaterial,
  getAdminStudentsList,
  updateAdminStudentRole,
} from "../src/lib/data-service";
import { Button } from "../src/components/Button";
import { Badge } from "../src/components/Badge";

type AdminTab = "overview" | "questions" | "courses" | "mock-tests" | "materials" | "students";

export default function AdminScreen() {
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab Data States
  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [mockTests, setMockTests] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddMockModal, setShowAddMockModal] = useState(false);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // Form states - Add Question
  const [qText, setQText] = useState("");
  const [qOptA, setQOptA] = useState("");
  const [qOptB, setQOptB] = useState("");
  const [qOptC, setQOptC] = useState("");
  const [qOptD, setQOptD] = useState("");
  const [qCorrectIdx, setQCorrectIdx] = useState(0);
  const [qDifficulty, setQDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [qExplanation, setQExplanation] = useState("");
  const [qExamId, setQExamId] = useState("");

  // Form states - Add Course
  const [cTitle, setCTitle] = useState("");
  const [cBody, setCBody] = useState("");
  const [cSlug, setCSlug] = useState("");
  const [cDesc, setCDesc] = useState("");

  // Form states - Add Mock
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mDuration, setMDuration] = useState("120");
  const [mTotalMarks, setMTotalMarks] = useState("100");
  const [mPassPct, setMPassPct] = useState("40");
  const [mExamId, setMExamId] = useState("");

  // Form states - Add Material
  const [matTitle, setMatTitle] = useState("");
  const [matType, setMatType] = useState("note");
  const [matContent, setMatContent] = useState("");
  const [matUrl, setMatUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Overview Stats
  const loadStats = async () => {
    try {
      setRefreshing(true);
      const data = await getAdminOverviewStats();
      setStats(data);
    } catch (err) {
      console.warn("Could not load admin stats:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data specific to active tab
  const loadTabData = async (tab: AdminTab) => {
    setTabLoading(true);
    try {
      if (tab === "questions") {
        const data = await getAdminQuestionsList();
        setQuestions(data);
        if (courses.length === 0) {
          const cList = await getAdminCoursesList();
          setCourses(cList);
          if (cList[0]) setQExamId(cList[0].id);
        }
      } else if (tab === "courses") {
        const data = await getAdminCoursesList();
        setCourses(data);
      } else if (tab === "mock-tests") {
        const [mData, cList] = await Promise.all([
          getAdminMockTestsList(),
          courses.length === 0 ? getAdminCoursesList() : Promise.resolve(courses),
        ]);
        setMockTests(mData);
        setCourses(cList);
        if (cList[0] && !mExamId) setMExamId(cList[0].id);
      } else if (tab === "materials") {
        const data = await getAdminMaterialsList();
        setMaterials(data);
      } else if (tab === "students") {
        const data = await getAdminStudentsList();
        setStudents(data);
      }
    } catch (err) {
      console.warn("Error loading tab data:", err);
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    getAdminCoursesList().then((cList) => {
      setCourses(cList);
      if (cList[0]) {
        setQExamId(cList[0].id);
        setMExamId(cList[0].id);
      }
    });
  }, []);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchQuery("");
    if (tab !== "overview") {
      loadTabData(tab);
    }
  };

  // Create Question Submit
  const handleCreateQuestion = async () => {
    if (!qText.trim() || !qOptA.trim() || !qOptB.trim()) {
      Alert.alert("Required Fields", "Please enter the question and at least options A and B.");
      return;
    }

    setIsSubmitting(true);
    try {
      const options = [qOptA.trim(), qOptB.trim(), qOptC.trim() || "Option C", qOptD.trim() || "Option D"];
      await createAdminQuestion({
        exam_id: qExamId || (courses[0]?.id),
        question_text: qText.trim(),
        options,
        correct_option_index: qCorrectIdx,
        explanation: qExplanation.trim(),
        difficulty: qDifficulty,
      });

      Alert.alert("Success", "Verified MCQ added to Question Bank.");
      setShowAddQuestionModal(false);
      setQText("");
      setQOptA("");
      setQOptB("");
      setQOptC("");
      setQOptD("");
      setQExplanation("");
      loadTabData("questions");
      loadStats();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create question.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = (id: string, text: string) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete this question?\n\n"${text.substring(0, 50)}..."`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAdminQuestion(id);
              setQuestions((prev) => prev.filter((q) => q.id !== id));
              loadStats();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete question.");
            }
          },
        },
      ]
    );
  };

  // Create Course Submit
  const handleCreateCourse = async () => {
    if (!cTitle.trim() || !cBody.trim() || !cSlug.trim()) {
      Alert.alert("Required Fields", "Please enter course title, conducting body, and slug.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminCourse({
        title: cTitle.trim(),
        conducting_body: cBody.trim(),
        slug: cSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: cDesc.trim() || `Official syllabus and examination curriculum for ${cTitle.trim()}.`,
      });

      Alert.alert("Success", "New course registered in Odisha recruitment catalog.");
      setShowAddCourseModal(false);
      setCTitle("");
      setCBody("");
      setCSlug("");
      setCDesc("");
      loadTabData("courses");
      loadStats();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create course.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Mock Test Submit
  const handleCreateMock = async () => {
    if (!mTitle.trim()) {
      Alert.alert("Required Fields", "Please enter mock test title.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminMockTest({
        exam_id: mExamId || (courses[0]?.id),
        title: mTitle.trim(),
        description: mDesc.trim() || "Full timed syllabus simulation test.",
        duration_minutes: parseInt(mDuration) || 120,
        total_marks: parseFloat(mTotalMarks) || 100,
        negative_marking: 0.25,
        pass_percentage: parseFloat(mPassPct) || 40,
      });

      Alert.alert("Success", "New mock test simulation added.");
      setShowAddMockModal(false);
      setMTitle("");
      setMDesc("");
      loadTabData("mock-tests");
      loadStats();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create mock test.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Study Material Submit
  const handleCreateMaterial = async () => {
    if (!matTitle.trim()) {
      Alert.alert("Required Fields", "Please enter study material title.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Default topic: Paika Rebellion or Kalinga War
      const defaultTopicId = "c1111111-1111-1111-1111-111111111111";
      await createAdminMaterial({
        topic_id: defaultTopicId,
        title: matTitle.trim(),
        material_type: matType,
        content: matContent.trim() || "Official study notes for state exams.",
        url: matUrl.trim() || undefined,
      });

      Alert.alert("Success", "Study material / PDF note uploaded.");
      setShowAddMaterialModal(false);
      setMatTitle("");
      setMatContent("");
      setMatUrl("");
      loadTabData("materials");
      loadStats();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create study material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Student Role
  const handleToggleStudentRole = (student: any) => {
    if (student.email?.toLowerCase() === SITE_CONFIG.admin.rootEmail.toLowerCase()) {
      Alert.alert(
        "Action Prohibited",
        "The root administrator profile is permanent and cannot be demoted or removed."
      );
      return;
    }

    const isCurrentlyAdmin = student.role === "admin";
    const newRole = isCurrentlyAdmin ? "student" : "admin";
    const actionText = isCurrentlyAdmin ? "Revoke Admin privileges from" : "Promote to Admin";

    Alert.alert(
      "Confirm Role Change",
      `${actionText} ${student.full_name || student.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isCurrentlyAdmin ? "Revoke" : "Promote",
          style: isCurrentlyAdmin ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateAdminStudentRole(student.id, newRole);
              setStudents((prev) =>
                prev.map((s) => (s.id === student.id ? { ...s, role: newRole } : s))
              );
              Alert.alert("Success", `User role updated to ${newRole}.`);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to update role.");
            }
          },
        },
      ]
    );
  };

  const handleOpenWebAdmin = async () => {
    const url = "https://odisharank.vercel.app/admin";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Link", `Please open this URL in your browser: ${url}`);
      }
    } catch {
      Alert.alert("Link", `Please open this URL in your browser: ${url}`);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.unauthBox}>
          <ShieldCheck size={48} color={BRAND_COLORS.danger} />
          <Text style={styles.unauthTitle}>Access Restricted</Text>
          <Text style={styles.unauthDesc}>
            This control center is reserved for platform administrators.
          </Text>
          <Button
            title="Return to Student Portal"
            variant="primary"
            size="md"
            onPress={() => router.back()}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>
              Odisha<Text style={{ color: "#38bdf8" }}>Admin</Text>
            </Text>
            <View style={styles.rlsBadge}>
              <Text style={styles.rlsText}>RLS Enforced: Admin</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>Curriculum & Examination Administration</Text>
        </View>
      </View>

      {/* Tabs Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "overview" && styles.tabItemActive]}
            onPress={() => handleTabChange("overview")}
          >
            <Text style={[styles.tabText, activeTab === "overview" && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "questions" && styles.tabItemActive]}
            onPress={() => handleTabChange("questions")}
          >
            <Text style={[styles.tabText, activeTab === "questions" && styles.tabTextActive]}>
              Questions ({stats?.questionsCount ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "courses" && styles.tabItemActive]}
            onPress={() => handleTabChange("courses")}
          >
            <Text style={[styles.tabText, activeTab === "courses" && styles.tabTextActive]}>
              Courses ({stats?.activeCoursesCount ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "mock-tests" && styles.tabItemActive]}
            onPress={() => handleTabChange("mock-tests")}
          >
            <Text style={[styles.tabText, activeTab === "mock-tests" && styles.tabTextActive]}>
              Mock Tests ({stats?.mockTestsCount ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "materials" && styles.tabItemActive]}
            onPress={() => handleTabChange("materials")}
          >
            <Text style={[styles.tabText, activeTab === "materials" && styles.tabTextActive]}>
              Study Notes ({stats?.materialsCount ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === "students" && styles.tabItemActive]}
            onPress={() => handleTabChange("students")}
          >
            <Text style={[styles.tabText, activeTab === "students" && styles.tabTextActive]}>
              Students ({stats?.studentsCount ?? 0})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            {/* Identity Card */}
            <View style={styles.adminCard}>
              <View style={styles.adminDotRow}>
                <View style={styles.liveDot} />
                <Text style={styles.adminSessionLabel}>ADMIN SESSION</Text>
              </View>
              <Text style={styles.adminName}>
                {profile?.full_name || "Chinmaya Swain"} (Admin)
              </Text>
              <Text style={styles.adminEmail}>{user?.email || SITE_CONFIG.admin.rootEmail}</Text>
            </View>

            {/* Quick Actions Bar */}
            <View style={styles.quickActionCard}>
              <Text style={styles.quickActionTitle}>Quick Catalog Actions</Text>
              <View style={styles.quickActionGrid}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    handleTabChange("questions");
                    setShowAddQuestionModal(true);
                  }}
                >
                  <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.quickBtnText}>+ Add MCQ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    handleTabChange("courses");
                    setShowAddCourseModal(true);
                  }}
                >
                  <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.quickBtnText}>+ Add Course</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => {
                    handleTabChange("mock-tests");
                    setShowAddMockModal(true);
                  }}
                >
                  <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.quickBtnText}>+ Create Mock</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Curriculum Statistics</Text>
              <TouchableOpacity onPress={loadStats} disabled={refreshing} style={styles.refreshBtn}>
                <RefreshCw size={14} color={BRAND_COLORS.primary} />
                <Text style={styles.refreshText}>{refreshing ? "Refreshing..." : "Refresh"}</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              <View style={styles.statsGrid}>
                {/* Registered Students */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => handleTabChange("students")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIconBox, { backgroundColor: "#eff6ff" }]}>
                    <Users size={20} color="#2563eb" />
                  </View>
                  <Text style={styles.statCount}>{stats?.studentsCount ?? 0}</Text>
                  <Text style={styles.statTitle}>Registered Students</Text>
                  <Text style={styles.statSub}>Tap to manage roles &rarr;</Text>
                </TouchableOpacity>

                {/* Active Courses */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => handleTabChange("courses")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIconBox, { backgroundColor: "#f5f3ff" }]}>
                    <Layers size={20} color="#7c3aed" />
                  </View>
                  <Text style={styles.statCount}>{stats?.activeCoursesCount ?? 0}</Text>
                  <Text style={styles.statTitle}>Active Courses</Text>
                  <Text style={styles.statSub}>OSSC, OSSSC, OPSC &rarr;</Text>
                </TouchableOpacity>

                {/* Question Bank */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => handleTabChange("questions")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIconBox, { backgroundColor: "#fffbeb" }]}>
                    <HelpCircle size={20} color="#d97706" />
                  </View>
                  <Text style={styles.statCount}>{stats?.questionsCount ?? 0}</Text>
                  <Text style={styles.statTitle}>Question Bank</Text>
                  <Text style={styles.statSub}>Tap to add/delete MCQs &rarr;</Text>
                </TouchableOpacity>

                {/* Mock Tests */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => handleTabChange("mock-tests")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIconBox, { backgroundColor: "#fff1f2" }]}>
                    <Clock size={20} color="#e11d48" />
                  </View>
                  <Text style={styles.statCount}>{stats?.mockTestsCount ?? 0}</Text>
                  <Text style={styles.statTitle}>Mock Tests</Text>
                  <Text style={styles.statSub}>Timed simulations &rarr;</Text>
                </TouchableOpacity>

                {/* Study Materials */}
                <TouchableOpacity
                  style={styles.statCard}
                  onPress={() => handleTabChange("materials")}
                  activeOpacity={0.7}
                >
                  <View style={[styles.statIconBox, { backgroundColor: "#ecfeff" }]}>
                    <FileText size={20} color="#0891b2" />
                  </View>
                  <Text style={styles.statCount}>{stats?.materialsCount ?? 0}</Text>
                  <Text style={styles.statTitle}>Study Materials</Text>
                  <Text style={styles.statSub}>Official notes & PDFs &rarr;</Text>
                </TouchableOpacity>

                {/* Syllabus Streams */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: "#ecfdf5" }]}>
                    <BookOpen size={20} color="#059669" />
                  </View>
                  <Text style={styles.statCount}>{(stats?.chaptersCount || 0) + (stats?.topicsCount || 0)}</Text>
                  <Text style={styles.statTitle}>Syllabus Streams</Text>
                  <Text style={styles.statSub}>
                    {stats?.chaptersCount ?? 0} Chapters &bull; {stats?.topicsCount ?? 0} Topics
                  </Text>
                </View>
              </View>
            )}

            {/* Desktop Administration Portal Shortcut */}
            <View style={styles.desktopPortalCard}>
              <Text style={styles.desktopTitle}>Desktop Administration Portal</Text>
              <Text style={styles.desktopDesc}>
                Advanced batch actions: CSV bulk imports, comprehensive student directory filtering, and syllabus hierarchy tree editing.
              </Text>
              <TouchableOpacity
                style={styles.openWebBtn}
                onPress={handleOpenWebAdmin}
                activeOpacity={0.8}
              >
                <ExternalLink size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.openWebText}>Open Web Admin</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* TAB 2: QUESTIONS MANAGEMENT */}
        {activeTab === "questions" && (
          <View style={styles.tabSection}>
            <View style={styles.tabSectionHeader}>
              <View>
                <Text style={styles.tabSectionTitle}>Question Bank</Text>
                <Text style={styles.tabSectionSub}>Review, add, and curate verified MCQs</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddQuestionModal(true)}
              >
                <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>Add MCQ</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Search size={16} color={BRAND_COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search questions by keyword..."
                placeholderTextColor={BRAND_COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {tabLoading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              questions
                .filter((q) =>
                  !searchQuery.trim() ||
                  q.question_text.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((q, idx) => (
                  <View key={q.id || idx} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Badge
                        label={q.difficulty?.toUpperCase() || "MEDIUM"}
                        variant={q.difficulty === "easy" ? "emerald" : q.difficulty === "hard" ? "amber" : "blue"}
                        size="sm"
                      />
                      {q.exams?.title && (
                        <Badge label={q.exams.title.split(" ")[0]} variant="slate" size="sm" />
                      )}
                      <TouchableOpacity
                        style={styles.deleteIconBtn}
                        onPress={() => handleDeleteQuestion(q.id, q.question_text)}
                      >
                        <Trash2 size={16} color={BRAND_COLORS.danger} />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.questionItemText}>
                      {idx + 1}. {q.question_text}
                    </Text>

                    {/* Options Preview */}
                    <View style={styles.optionsPreviewCol}>
                      {Array.isArray(q.options) &&
                        q.options.map((opt: string, optIdx: number) => {
                          const isCorrect = optIdx === q.correct_option_index;
                          return (
                            <View
                              key={optIdx}
                              style={[
                                styles.optionRow,
                                isCorrect && styles.optionRowCorrect,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.optionLabel,
                                  isCorrect && styles.optionLabelCorrect,
                                ]}
                              >
                                {String.fromCharCode(65 + optIdx)}.
                              </Text>
                              <Text
                                style={[
                                  styles.optionContent,
                                  isCorrect && styles.optionContentCorrect,
                                ]}
                              >
                                {opt}
                              </Text>
                              {isCorrect && (
                                <CheckCircle2 size={14} color="#059669" style={{ marginLeft: "auto" }} />
                              )}
                            </View>
                          );
                        })}
                    </View>

                    {q.explanation && (
                      <View style={styles.explanationBox}>
                        <Text style={styles.explanationText}>
                          <Text style={{ fontWeight: "700" }}>Explanation: </Text>
                          {q.explanation}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
            )}
          </View>
        )}

        {/* TAB 3: COURSES MANAGEMENT */}
        {activeTab === "courses" && (
          <View style={styles.tabSection}>
            <View style={styles.tabSectionHeader}>
              <View>
                <Text style={styles.tabSectionTitle}>Active Examinations</Text>
                <Text style={styles.tabSectionSub}>Manage state recruitment exams</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddCourseModal(true)}
              >
                <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>Add Course</Text>
              </TouchableOpacity>
            </View>

            {tabLoading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              courses.map((c, idx) => (
                <View key={c.id || idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Badge label={c.conducting_body || "Odisha Cadre"} variant="blue" size="sm" />
                    <Badge label="ACTIVE" variant="emerald" size="sm" />
                  </View>
                  <Text style={styles.courseItemTitle}>{c.title}</Text>
                  <Text style={styles.courseItemDesc}>{c.description || "Official state syllabus."}</Text>
                  <Text style={styles.courseSlugText}>Slug: /{c.slug}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 4: MOCK TESTS MANAGEMENT */}
        {activeTab === "mock-tests" && (
          <View style={styles.tabSection}>
            <View style={styles.tabSectionHeader}>
              <View>
                <Text style={styles.tabSectionTitle}>Mock Test Simulations</Text>
                <Text style={styles.tabSectionSub}>Configure timed exam papers</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddMockModal(true)}
              >
                <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>Create Mock</Text>
              </TouchableOpacity>
            </View>

            {tabLoading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              mockTests.map((m, idx) => (
                <View key={m.id || idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Badge label={m.exams?.title || "State Exam"} variant="blue" size="sm" />
                    <Badge label={`${m.duration_minutes} Mins`} variant="slate" size="sm" />
                  </View>
                  <Text style={styles.courseItemTitle}>{m.title}</Text>
                  <Text style={styles.courseItemDesc}>{m.description}</Text>
                  <View style={styles.mockMetaRow}>
                    <Text style={styles.mockMetaText}>Total Marks: {m.total_marks}</Text>
                    <Text style={styles.mockMetaText}>Negative: {m.negative_marking}</Text>
                    <Text style={styles.mockMetaText}>Pass: {m.pass_percentage}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 5: STUDY MATERIALS */}
        {activeTab === "materials" && (
          <View style={styles.tabSection}>
            <View style={styles.tabSectionHeader}>
              <View>
                <Text style={styles.tabSectionTitle}>Study Materials & PDFs</Text>
                <Text style={styles.tabSectionSub}>Official notes, quick reference tables, and PDFs</Text>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddMaterialModal(true)}
              >
                <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.addBtnText}>Add Material</Text>
              </TouchableOpacity>
            </View>

            {tabLoading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              materials.map((mat, idx) => (
                <View key={mat.id || idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Badge label={mat.material_type?.toUpperCase() || "NOTE"} variant="blue" size="sm" />
                    {mat.topics?.title && (
                      <Badge label={mat.topics.title.substring(0, 18) + "..."} variant="slate" size="sm" />
                    )}
                  </View>
                  <Text style={styles.courseItemTitle}>{mat.title}</Text>
                  <Text style={styles.courseItemDesc}>{mat.content}</Text>
                  {mat.url && (
                    <Text style={styles.courseSlugText}>URL: {mat.url}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 6: STUDENT DIRECTORY & ROLES */}
        {activeTab === "students" && (
          <View style={styles.tabSection}>
            <View style={styles.tabSectionHeader}>
              <View>
                <Text style={styles.tabSectionTitle}>Student Directory</Text>
                <Text style={styles.tabSectionSub}>Registered aspirants & admin privileges</Text>
              </View>
              <TouchableOpacity onPress={() => loadTabData("students")} style={styles.refreshSmallBtn}>
                <RefreshCw size={14} color={BRAND_COLORS.primary} />
              </TouchableOpacity>
            </View>

            {tabLoading ? (
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} style={{ marginVertical: 32 }} />
            ) : (
              students.map((st, idx) => {
                const isRootAdmin =
                  st.email?.toLowerCase() === SITE_CONFIG.admin.rootEmail.toLowerCase();
                const isStudentAdmin = st.role === "admin" || isRootAdmin;
                return (
                  <View key={st.id || idx} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Badge
                        label={
                          isRootAdmin
                            ? "ROOT ADMIN (PERMANENT)"
                            : isStudentAdmin
                            ? "ADMIN"
                            : "STUDENT"
                        }
                        variant={isStudentAdmin ? "emerald" : "slate"}
                        size="sm"
                      />
                      <Badge label={`Batch ${st.target_year || 2026}`} variant="blue" size="sm" />
                    </View>

                    <Text style={styles.studentNameText}>{st.full_name || "Aspirant Scholar"}</Text>
                    <Text style={styles.studentEmailText}>{st.email || "No email"}</Text>
                    {st.district && (
                      <Text style={styles.studentDistrictText}>District: {st.district}</Text>
                    )}

                    <View style={styles.roleActionRow}>
                      {isRootAdmin ? (
                        <View
                          style={[
                            styles.roleToggleBtn,
                            { backgroundColor: "#064e3b", borderColor: "#059669" },
                          ]}
                        >
                          <ShieldCheck size={14} color="#34d399" style={{ marginRight: 4 }} />
                          <Text style={{ color: "#34d399", fontSize: 12, fontWeight: "600" }}>
                            Protected Admin
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.roleToggleBtn,
                            isStudentAdmin ? styles.roleToggleRevoke : styles.roleTogglePromote,
                          ]}
                          onPress={() => handleToggleStudentRole(st)}
                        >
                          {isStudentAdmin ? (
                            <>
                              <UserX size={14} color="#dc2626" style={{ marginRight: 4 }} />
                              <Text style={styles.roleToggleRevokeText}>Demote to Student</Text>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} color="#059669" style={{ marginRight: 4 }} />
                              <Text style={styles.roleTogglePromoteText}>Promote to Admin</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL 1: ADD QUESTION */}
      <Modal visible={showAddQuestionModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Question to Bank</Text>
              <TouchableOpacity onPress={() => setShowAddQuestionModal(false)}>
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Question Text *</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: "top" }]}
                multiline
                placeholder="Type question here..."
                value={qText}
                onChangeText={setQText}
              />

              <Text style={styles.formLabel}>Option A *</Text>
              <TextInput style={styles.formInput} placeholder="Option A" value={qOptA} onChangeText={setQOptA} />

              <Text style={styles.formLabel}>Option B *</Text>
              <TextInput style={styles.formInput} placeholder="Option B" value={qOptB} onChangeText={setQOptB} />

              <Text style={styles.formLabel}>Option C</Text>
              <TextInput style={styles.formInput} placeholder="Option C" value={qOptC} onChangeText={setQOptC} />

              <Text style={styles.formLabel}>Option D</Text>
              <TextInput style={styles.formInput} placeholder="Option D" value={qOptD} onChangeText={setQOptD} />

              <Text style={styles.formLabel}>Correct Answer Option</Text>
              <View style={styles.choiceRow}>
                {["A", "B", "C", "D"].map((letter, idx) => (
                  <TouchableOpacity
                    key={letter}
                    style={[styles.choicePill, qCorrectIdx === idx && styles.choicePillActive]}
                    onPress={() => setQCorrectIdx(idx)}
                  >
                    <Text style={[styles.choiceText, qCorrectIdx === idx && styles.choiceTextActive]}>
                      Option {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Difficulty</Text>
              <View style={styles.choiceRow}>
                {(["easy", "medium", "hard"] as const).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[styles.choicePill, qDifficulty === diff && styles.choicePillActive]}
                    onPress={() => setQDifficulty(diff)}
                  >
                    <Text style={[styles.choiceText, qDifficulty === diff && styles.choiceTextActive]}>
                      {diff.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Explanation / Rationale</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: "top" }]}
                multiline
                placeholder="Optional explanation for aspirants..."
                value={qExplanation}
                onChangeText={setQExplanation}
              />

              <Button
                title={isSubmitting ? "Saving MCQ..." : "Save Verified MCQ"}
                variant="primary"
                size="md"
                onPress={handleCreateQuestion}
                disabled={isSubmitting}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: ADD COURSE */}
      <Modal visible={showAddCourseModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Examination Course</Text>
              <TouchableOpacity onPress={() => setShowAddCourseModal(false)}>
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Exam / Course Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Odisha Police SI 2026"
                value={cTitle}
                onChangeText={(t) => {
                  setCTitle(t);
                  setCSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }}
              />

              <Text style={styles.formLabel}>Conducting Body *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Odisha Police Recruitment Board"
                value={cBody}
                onChangeText={setCBody}
              />

              <Text style={styles.formLabel}>URL Slug *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. odisha-police-si"
                value={cSlug}
                onChangeText={setCSlug}
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: "top" }]}
                multiline
                placeholder="Brief curriculum description..."
                value={cDesc}
                onChangeText={setCDesc}
              />

              <Button
                title={isSubmitting ? "Creating Course..." : "Create Course"}
                variant="primary"
                size="md"
                onPress={handleCreateCourse}
                disabled={isSubmitting}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: ADD MOCK TEST */}
      <Modal visible={showAddMockModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Mock Test</Text>
              <TouchableOpacity onPress={() => setShowAddMockModal(false)}>
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Mock Test Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. OSSC CGL Full Mock Test 2"
                value={mTitle}
                onChangeText={setMTitle}
              />

              <Text style={styles.formLabel}>Duration (Minutes)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="120"
                keyboardType="numeric"
                value={mDuration}
                onChangeText={setMDuration}
              />

              <Text style={styles.formLabel}>Total Marks</Text>
              <TextInput
                style={styles.formInput}
                placeholder="100"
                keyboardType="numeric"
                value={mTotalMarks}
                onChangeText={setMTotalMarks}
              />

              <Text style={styles.formLabel}>Pass Percentage (%)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="40"
                keyboardType="numeric"
                value={mPassPct}
                onChangeText={setMPassPct}
              />

              <Button
                title={isSubmitting ? "Creating Simulation..." : "Create Mock Test"}
                variant="primary"
                size="md"
                onPress={handleCreateMock}
                disabled={isSubmitting}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 4: ADD STUDY MATERIAL */}
      <Modal visible={showAddMaterialModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Study Material / PDF</Text>
              <TouchableOpacity onPress={() => setShowAddMaterialModal(false)}>
                <X size={20} color={BRAND_COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.formLabel}>Material Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Odisha River Systems Quick PDF"
                value={matTitle}
                onChangeText={setMatTitle}
              />

              <Text style={styles.formLabel}>Material Type</Text>
              <View style={styles.choiceRow}>
                {["note", "summary", "link"].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.choicePill, matType === t && styles.choicePillActive]}
                    onPress={() => setMatType(t)}
                  >
                    <Text style={[styles.choiceText, matType === t && styles.choiceTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Notes Content / Summary *</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: "top" }]}
                multiline
                placeholder="High-yield facts or overview for revision..."
                value={matContent}
                onChangeText={setMatContent}
              />

              <Text style={styles.formLabel}>Document / PDF URL (Optional)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://example.com/notes.pdf"
                value={matUrl}
                onChangeText={setMatUrl}
                autoCapitalize="none"
              />

              <Button
                title={isSubmitting ? "Uploading..." : "Save Material"}
                variant="primary"
                size="md"
                onPress={handleCreateMaterial}
                disabled={isSubmitting}
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    backgroundColor: "#0f172a",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  rlsBadge: {
    backgroundColor: "#064e3b",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  rlsText: {
    color: "#6ee7b7",
    fontSize: 11,
    fontWeight: "700",
  },
  tabBarContainer: {
    backgroundColor: "#0f172a",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#1e293b",
  },
  tabItemActive: {
    backgroundColor: BRAND_COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  adminCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
  },
  adminDotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  adminSessionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#34d399",
    letterSpacing: 0.5,
  },
  adminName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  adminEmail: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
  },
  quickActionCard: {
    backgroundColor: "#1e293b",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 10,
  },
  quickActionGrid: {
    flexDirection: "row",
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  quickBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#f8fafc",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND_COLORS.primary,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
  },
  statTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 2,
  },
  statSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  desktopPortalCard: {
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  desktopTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  desktopDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 14,
  },
  openWebBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    borderRadius: 8,
  },
  openWebText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  unauthBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND_COLORS.textPrimary,
    marginTop: 16,
  },
  unauthDesc: {
    fontSize: 13,
    color: BRAND_COLORS.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // Tab Section Styles
  tabSection: {
    width: "100%",
  },
  tabSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  tabSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  tabSectionSub: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BRAND_COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  refreshSmallBtn: {
    padding: 8,
    backgroundColor: "#1e293b",
    borderRadius: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
  },
  itemCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  deleteIconBtn: {
    marginLeft: "auto",
    padding: 4,
  },
  questionItemText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    lineHeight: 20,
    marginBottom: 10,
  },
  optionsPreviewCol: {
    gap: 6,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  optionRowCorrect: {
    backgroundColor: "#064e3b",
    borderColor: "#059669",
    borderWidth: 1,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    width: 22,
  },
  optionLabelCorrect: {
    color: "#34d399",
  },
  optionContent: {
    fontSize: 12,
    color: "#cbd5e1",
    flex: 1,
  },
  optionContentCorrect: {
    color: "#ffffff",
    fontWeight: "700",
  },
  explanationBox: {
    backgroundColor: "#1e293b",
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 11,
    color: "#94a3b8",
    lineHeight: 16,
  },
  courseItemTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
  },
  courseItemDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 6,
  },
  courseSlugText: {
    fontSize: 11,
    color: "#38bdf8",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mockMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  mockMetaText: {
    fontSize: 11,
    color: "#cbd5e1",
    fontWeight: "600",
  },
  studentNameText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  studentEmailText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  studentDistrictText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  roleActionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  roleToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleTogglePromote: {
    backgroundColor: "#064e3b",
    borderColor: "#059669",
  },
  roleTogglePromoteText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "700",
  },
  roleToggleRevoke: {
    backgroundColor: "#450a0a",
    borderColor: "#dc2626",
  },
  roleToggleRevokeText: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "700",
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  modalScroll: {
    paddingBottom: 24,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 10,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#ffffff",
    fontSize: 13,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  choicePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#1e293b",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  choicePillActive: {
    backgroundColor: BRAND_COLORS.primary,
    borderColor: BRAND_COLORS.primary,
  },
  choiceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  choiceTextActive: {
    color: "#ffffff",
  },
});
