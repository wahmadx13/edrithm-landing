import { Network, Settings2 } from "lucide-react";
export const administrationMenuItems = [
  {
    id: "branch-management",
    label: "Branch Management",
    icon: Network,
    children: [
      {
        id: "branch-list",
        label: "Branch List",
        path: "/admin/branches/list",
        description: "Overview of All Institutional Locations",
      },
      {
        id: "branch-kpis",
        label: "Branch KPIs",
        path: "/admin/branches/kpis",
        description: "Real-time Performance Metrics by Branch",
      },
      {
        id: "branch-comparison",
        label: "Branch Comparison",
        path: "/admin/branches/comparison",
        description: "Side-by-side Growth & Revenue Analysis",
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings2,
    children: [
      {
        id: "roles-permissions",
        label: "Roles & Permissions",
        path: "/admin/admin/roles",
        description: "Manage User Access Levels",
      },
      {
        id: "settings",
        label: "Settings",
        path: "/admin/admin/settings",
        description: "Global System Configuration",
      },
      {
        id: "audit-logs",
        label: "Audit Logs",
        path: "/admin/admin/audit",
        description: "Track All System Activities",
      },
      {
        id: "data-io",
        label: "Data Import/Export",
        path: "/admin/admin/data",
        description: "Bulk Management of Records",
      },
      {
        id: "integrations",
        label: "Integrations",
        path: "/admin/admin/integrations",
        description: "Connect Third-party Services & APIs",
      },
    ],
  },
];
