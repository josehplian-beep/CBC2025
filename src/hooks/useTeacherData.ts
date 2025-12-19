/**
 * useTeacherData Hook
 * 
 * Fetches the current logged-in teacher's data and their assigned classes.
 * Links the auth user to their teacher profile via member_id.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TeacherClass {
  id: string;
  class_name: string;
  description: string | null;
  studentCount: number;
}

interface TeacherProfile {
  id: string;
  full_name: string;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
}

interface TeacherDataState {
  teacher: TeacherProfile | null;
  classes: TeacherClass[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTeacherData(): TeacherDataState {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Find the member linked to this user
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        setError("No member profile linked to your account");
        setLoading(false);
        return;
      }

      // Find the teacher linked to this member
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("id, full_name, photo_url, email, phone, bio")
        .eq("member_id", memberData.id)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (!teacherData) {
        setError("You are not registered as a teacher");
        setLoading(false);
        return;
      }

      setTeacher(teacherData);

      // Fetch classes assigned to this teacher
      const { data: classTeachersData, error: ctError } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", teacherData.id);

      if (ctError) throw ctError;

      if (!classTeachersData || classTeachersData.length === 0) {
        setClasses([]);
        setLoading(false);
        return;
      }

      const classIds = classTeachersData.map((ct) => ct.class_id);

      // Fetch class details
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("id, class_name, description")
        .in("id", classIds)
        .order("class_name");

      if (classesError) throw classesError;

      // Fetch student counts for each class
      const { data: studentCounts, error: scError } = await supabase
        .from("student_classes")
        .select("class_id")
        .in("class_id", classIds);

      if (scError) throw scError;

      // Count students per class
      const countMap: Record<string, number> = {};
      studentCounts?.forEach((sc) => {
        countMap[sc.class_id] = (countMap[sc.class_id] || 0) + 1;
      });

      const enrichedClasses: TeacherClass[] = (classesData || []).map((cls) => ({
        ...cls,
        studentCount: countMap[cls.id] || 0,
      }));

      setClasses(enrichedClasses);
    } catch (err) {
      console.error("Error fetching teacher data:", err);
      setError("Failed to load your classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, [fetchTeacherData]);

  return {
    teacher,
    classes,
    loading,
    error,
    refetch: fetchTeacherData,
  };
}
