import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Stack } from "@/components/ui/layout/stack";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

import { routing } from "@/i18n/routing";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

const ubuntu = localFont({
  src: [
    {
      path: "../../../public/assets/fonts/Ubuntu-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/assets/fonts/Ubuntu-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-ubuntu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Edrithm – Education Operations Simplified",
  description:
    "Edrithm is a modern, all-in-one platform designed to give schools, colleges, and educational institutes complete control over their operations.",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "fr" | "de" | "ar" | "ur")) {
    notFound();
  }

  const messages = await getMessages();

  const isRtl = locale === "ar" || locale === "ur";

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={ubuntu.variable}
    >
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <Stack direction="column" className="bg-background relative min-h-screen">
              <Navbar />
              <Stack direction="column" className="flex-1">
                {children}
              </Stack>
            </Stack>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
