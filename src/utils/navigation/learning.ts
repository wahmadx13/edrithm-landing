import { BookOpen } from "lucide-react";
export const learningMenuItems = [
  {
    id: "academics",
    label: "Academics",
    icon: BookOpen,
    children: [
      {
        id: "classes-sections",
        label: "Classes & Sections",
        path: "/admin/academics/classes",
        description: "Class Management & Seating",
      },
      {
        id: "subjects",
        label: "Subjects",
        path: "/admin/academics/subjects",
        description: "Course Library & Syllabi",
      },
      {
        id: "timetable",
        label: "Timetable",
        path: "/admin/academics/timetable",
        description: "Daily Schedules & Periods",
      },
      {
        id: "exams",
        label: "Exams",
        path: "/admin/academics/exams",
        description: "Assessment Planning",
      },
      {
        id: "results",
        label: "Results",
        path: "/admin/academics/results",
        description: "Grading & Report Cards",
      },
      {
        id: "curriculum-planner",
        label: "Curriculum Planner",
        path: "/admin/academics/curriculum",
        description: "Academic Roadmaps",
      },
    ],
  },
];
