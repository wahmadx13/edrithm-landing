import { CircleDollarSign, MessageSquare, UserCheck, Users } from "lucide-react";
export const QUICK_ACTIONS = [
  { id: "add-student", label: "Add Student", icon: Users, path: "/admin/students/add" },
  { id: "add-teacher", label: "Add Teacher", icon: UserCheck, path: "/admin/staff/add" },
  {
    id: "record-fee",
    label: "Record Fee",
    icon: CircleDollarSign,
    path: "/admin/finance/fees/record",
  },
  {
    id: "create-announcement",
    label: "Create Announcement",
    icon: MessageSquare,
    path: "/admin/communication/announcements/create",
  },
];
export const MOCK_USER = {
  name: "Principal Henderson",
  role: "SUPER ADMIN",
  email: "principal@school.edu",
  campus: "Main Campus",
  lastLogin: "Today, 09:45 AM",
  avatar: "/assets/avatars/principal.png", // Placeholder
};
