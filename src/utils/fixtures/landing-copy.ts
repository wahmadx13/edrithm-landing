import {
  BadgeCheck,
  CloudCheck,
  Combine,
  Hourglass,
  ScrollText,
  ServerCog,
  Sparkles,
  Waypoints,
  Workflow,
  Zap,
} from "lucide-react";
export const PHILOSOPHY_LEGACY_CARDS = [
  {
    icon: ServerCog,
    title: "IT Dependancy",
    description: "Requires dedicated on-site server maintenance and specialized IT staff.",
  },
  {
    icon: ScrollText,
    title: "Contracts",
    description: "Multi-year locked-in agreements with complex hidden fees.",
  },
  {
    icon: Waypoints,
    title: "Complexity",
    description: "Steep learning curve requiring weeks of professional training.",
  },
  {
    icon: Hourglass,
    title: "Speed",
    description: "Legacy codebase results in slow load times and frequent downtime.",
  },
  {
    icon: Workflow,
    title: "Integration",
    description: "Siloed data. Manual exports required for basic reporting.",
  },
];
export const PHILOSOPHY_NEW_STANDARD_CARDS = [
  {
    icon: CloudCheck,
    title: "Zero Maintenance",
    description:
      "Full cloud infrastructure. Updates happen in real-time without touching a server.",
  },
  {
    icon: BadgeCheck,
    title: "Total freedom",
    description: "Flexible monthly billing. Transparent pricing with no hardware lock-in.",
  },
  {
    icon: Sparkles,
    title: "Intuitive UI",
    description: "Designed for administrative ease. Onboard your team in under an hour.",
  },
  {
    icon: Zap,
    title: "Instant Execution",
    description: "Sub-second response times globally via distributed edge computing.",
  },
  {
    icon: Combine,
    title: "Unified Core",
    description: "Open API architecture. Connects instantly with your existing ecosystem.",
  },
];
export const PRICING_PLANS = [
  {
    name: "Starter",
    price: "$49",
    description: "Perfect for small institutes starting their digital journey.",
    features: ["Up to 100 Students", "Standard Dashboards", "Attendance Tracking", "Email Support"],
    buttonText: "Start for Free",
    popular: false,
  },
  {
    name: "Professional",
    price: "$99",
    description: "Advanced features for growing educational campuses.",
    features: [
      "Up to 500 Students",
      "AI Enrollment Insights",
      "Multi-Branch Support",
      "Priority Chat Support",
    ],
    buttonText: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Complete control for large-scale institutional networks.",
    features: [
      "Unlimited Students",
      "Full AI Prediction Suite",
      "Custom API Access",
      "Dedicated account manager",
    ],
    buttonText: "Contact Sales",
    popular: false,
  },
];
