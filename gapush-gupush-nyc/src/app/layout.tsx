import type { Metadata, Viewport } from "next";
import { Poppins, Baloo_2 } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { UIProvider } from "@/lib/ui-context";
import { ClientChrome } from "@/components/layout/ClientChrome";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Gapush Gupush NYC — Authentic Bangladeshi Street Food",
  description:
    "Order ahead and skip the wait at Gapush Gupush NYC — authentic Bangladeshi street food. Fuchka, Chap, Biryani & more. Demo ordering experience.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e85d2a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${poppins.variable} ${baloo.variable} antialiased`}>
        <AppProvider>
          <ToastProvider>
            <UIProvider>
              <ClientChrome>{children}</ClientChrome>
            </UIProvider>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
