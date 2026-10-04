import { CircleDollarSign, FileText, MessageSquare } from "lucide-react";
export const operationsMenuItems = [
  {
    id: "finance",
    label: "Finance",
    icon: CircleDollarSign,
    children: [
      {
        id: "fee-records",
        label: "Fee Records",
        path: "/admin/finance/fees",
        description: "Student Payment Histories",
      },
      {
        id: "dues-tracking",
        label: "Dues Tracking",
        path: "/admin/finance/dues",
        description: "Pending & Outstanding Balances",
      },
      {
        id: "expense-tracking",
        label: "Expense Tracking",
        path: "/admin/finance/expenses",
        description: "Operational Cost Monitoring",
      },
      {
        id: "scholarships",
        label: "Scholarships / Discounts",
        path: "/admin/finance/scholarships",
        description: "Fee Waiver Management",
      },
      {
        id: "financial-summary",
        label: "Financial Summary",
        path: "/admin/finance/summary",
        description: "Comprehensive Budget & Collection Health",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    children: [
      {
        id: "student-reports",
        label: "Student Reports",
        path: "/admin/reports/students",
        description: "Enrollment, Attendance & Performance",
      },
      {
        id: "academic-reports",
        label: "Academic Reports",
        path: "/admin/reports/academics",
        description: "Results, Exams & Progress Analysis",
      },
      {
        id: "financial-reports",
        label: "Financial Reports",
        path: "/admin/reports/finance",
        description: "Revenue, Expenses & Fee Collection",
      },
      {
        id: "staff-reports",
        label: "Staff Reports",
        path: "/admin/reports/staff",
        description: "Attendance, Payroll & Performance",
      },
      {
        id: "custom-reports",
        label: "Custom Reports",
        path: "/admin/reports/custom",
        description: "Build & Export Tailored Reports",
      },
      {
        id: "analytics-dashboard",
        label: "Analytics Dashboard",
        path: "/admin/reports/analytics",
        description: "Visual Insights & Trends",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    icon: MessageSquare,
    children: [
      {
        id: "announcements",
        label: "Announcements",
        path: "/admin/communication/announcements",
        description: "Broadcast to All Students & Staff",
      },
      {
        id: "notices",
        label: "Notices",
        path: "/admin/communication/notices",
        description: "Important Circulars & Legal Updates",
      },
      {
        id: "messaging-logs",
        label: "Messaging Logs",
        path: "/admin/communication/messages",
        description: "Internal Chat & Query History",
      },
      {
        id: "email-sms-logs",
        label: "Email/SMS Logs",
        path: "/admin/communication/logs",
        description: "External Communication Tracking",
      },
    ],
  },
];
