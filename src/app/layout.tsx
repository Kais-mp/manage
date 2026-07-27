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
