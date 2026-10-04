import { UserCheck, Users } from "lucide-react";
export const peopleMenuItems = [
  {
    id: "students",
    label: "Students",
    icon: Users,
    expanded: true,
    children: [
      {
        id: "student-directory",
        label: "Student Directory",
        path: "/student",
        description: "Manage Student Profiles",
      },
      {
        id: "attendance",
        label: "Attendance",
        path: "/student/attendance",
        description: "Daily & Monthly Tracking",
      },
      {
        id: "performance",
        label: "Performance",
        path: "/student/performance",
        description: "Grades & Performance",
      },
    ],
  },
  {
    id: "teachers-staff",
    label: "Teachers & Staff",
    icon: UserCheck,
    children: [
      {
        id: "teacher-directory",
        label: "Teacher Directory",
        path: "/admin/staff/teachers",
        description: "Manage Educators & Skills",
      },
      {
        id: "staff-directory",
        label: "Staff Directory",
        path: "/admin/staff/directory",
        description: "Administrative Personnel",
      },
      {
        id: "staff-attendance",
        label: "Attendance",
        path: "/admin/staff/attendance",
        description: "Clock-in & Leave Tracking",
      },
      {
        id: "performance-reviews",
        label: "Performance Reviews",
        path: "/admin/staff/reviews",
        description: "Evaluations & Feedback",
      },
      {
        id: "salary-tracking",
        label: "Salary Tracking",
        path: "/admin/staff/salary",
        description: "Payroll & Bonuses",
      },
      {
        id: "receipt-uploads",
        label: "Receipt Uploads",
        path: "/admin/staff/receipts",
        description: "Expense Reimbursements",
      },
    ],
  },
];
