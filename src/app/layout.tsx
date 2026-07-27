import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { RouteLoadingIndicator } from "@/components/route-loading-indicator";
import { PageLoading } from "@/components/page-loading";
import { AppLock } from "@/components/app-lock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LapTrack",
  description: "Inventory management and analytics for Mini Tech and T.M. Communication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* Ambient glassmorphism gradient mesh background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/25 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 -right-32 w-96 h-96 bg-violet-500/20 dark:bg-violet-600/25 rounded-full blur-[120px]" />
            <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-sky-500/20 dark:bg-cyan-600/20 rounded-full blur-[120px]" />
          </div>
          <RouteLoadingIndicator />
          <PageLoading />
          <AppLock />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
