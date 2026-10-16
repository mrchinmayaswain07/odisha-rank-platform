import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Profile, Exam, SITE_CONFIG } from "@odisha-rank/shared";
import { getExams, getStudentProfile, updateStudentCourse, updateStudentProfile } from "./data-service";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  activeExam: Exam | null;
  allExams: Exam[];
  isLoading: boolean;
  setActiveCourse: (exam: Exam) => Promise<void>;
  editProfile: (updates: {
    full_name?: string;
    phone?: string | null;
    district?: string | null;
    target_year?: number;
    bio?: string | null;
  }) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (fullName: string, email: string, pass: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load active courses catalog
  const loadExams = async () => {
    try {
      const exams = await getExams();
      setAllExams(exams);
      return exams;
    } catch {
      return [];
    }
  };

  // Check admin privileges via root email or user_roles table
  const checkAdminStatus = async (userObj: User | null) => {
    if (!userObj) {
      setIsAdmin(false);
      return false;
    }

    const email = userObj.email?.toLowerCase();
    if (email === SITE_CONFIG.admin.rootEmail.toLowerCase()) {
      setIsAdmin(true);
      return true;
    }

    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userObj.id)
        .eq("role", "admin")
        .maybeSingle();

      const admin = data?.role === "admin";
      setIsAdmin(admin);
      return admin;
    } catch {
      setIsAdmin(false);
      return false;
    }
  };

  // Sync profile and active target exam
  const syncProfile = async (userObj: User, examsList?: Exam[]) => {
    try {
      await checkAdminStatus(userObj);
      const prof = await getStudentProfile(userObj.id);
      setProfile(prof);

      const catalog = examsList || allExams;
      if (prof?.target_exam_id && catalog.length > 0) {
        const found = catalog.find((e) => e.id === prof.target_exam_id);
        setActiveExam(found || catalog[0] || null);
      } else if (catalog.length > 0) {
        setActiveExam(catalog[0]);
      }
    } catch (err) {
      console.warn("Error syncing profile:", err);
    }
  };

  useEffect(() => {
    // 1. Initial Session Restoration
    const init = async () => {
      try {
        const exams = await loadExams();
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user || null);

        if (data.session?.user) {
          await syncProfile(data.session.user, exams);
        }
      } catch (err) {
        console.warn("Session restore error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // 2. Auth State Change Listener (Login, Logout, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await syncProfile(currentSession.user);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setActiveExam(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setIsLoading(false);
    return { error };
  };

  const signUp = async (fullName: string, email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { full_name: fullName },
      },
    });

    // Create profile row if user was created
    if (data?.user && !error) {
      try {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          target_year: new Date().getFullYear(),
          is_profile_completed: false,
        });
      } catch (err) {
        console.warn("Could not create initial profile:", err);
      }
    }

    setIsLoading(false);
    return { error };
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setActiveExam(null);
    setIsLoading(false);
  };

  const setActiveCourse = async (exam: Exam) => {
    setActiveExam(exam);
    if (user) {
      try {
        await updateStudentCourse(user.id, exam.id);
        setProfile((prev) => (prev ? { ...prev, target_exam_id: exam.id } : null));
      } catch (err) {
        console.warn("Failed to persist course selection:", err);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfile(user);
    }
  };

  const editProfile = async (updates: {
    full_name?: string;
    phone?: string | null;
    district?: string | null;
    target_year?: number;
    bio?: string | null;
  }) => {
    if (!user) throw new Error("User not authenticated");
    const updated = await updateStudentProfile(user.id, updates);
    setProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isAdmin,
        activeExam,
        allExams,
        isLoading,
        setActiveCourse,
        editProfile,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
