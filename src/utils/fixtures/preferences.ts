export const PASSWORD_STRENGTH_CONFIG = [
  {
    color: "bg-white/10 dark:bg-white/5",
    text: "Too short",
    detail: "Minimum 6 characters",
    shadow: "",
  },
  {
    color: "bg-red-500",
    text: "Weak",
    detail: "Mix uppercase and lowercase characters",
    shadow: "shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  },
  {
    color: "bg-orange-500",
    text: "Fair",
    detail: "Add a number for security",
    shadow: "shadow-[0_0_8px_rgba(249,115,22,0.5)]",
  },
  {
    color: "bg-yellow-500",
    text: "Good",
    detail: "Add a special character",
    shadow: "shadow-[0_0_8px_rgba(234,179,8,0.5)]",
  },
  {
    color: "bg-green-500",
    text: "Strong",
    detail: "Your password is secure",
    shadow: "shadow-[0_0_8px_rgba(34,197,94,0.5)]",
  },
];
export const LOCALES = [
  { code: "en", name: "English", flag: "/assets/country-flags/en.svg" },
  { code: "fr", name: "Français", flag: "/assets/country-flags/fr.svg" },
  { code: "de", name: "Deutsch", flag: "/assets/country-flags/de.svg" },
  { code: "ar", name: "العربية", flag: "/assets/country-flags/sa.svg" },
  { code: "ur", name: "اردو", flag: "/assets/country-flags/pk.svg" },
] as const;
