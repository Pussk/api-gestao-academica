export type StudentRow = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type CourseRow = {
  id: number;
  title: string;
  workload_hours: number;
  teacher_id: number | null;
  created_at: string;
};

export type EnrollmentStatus = "active" | "completed" | "cancelled";

export type EnrollmentRow = {
  id: number;
  student_id: number;
  course_id: number;
  status: EnrollmentStatus;
  created_at: string;
};

export type EnrollmentDetailsRow = EnrollmentRow & {
  student_name: string;
  course_title: string;
};
