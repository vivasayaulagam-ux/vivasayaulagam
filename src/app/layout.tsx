import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import WhatsAppFab from "@/components/ui/WhatsAppFab";
import AuthProvider from "@/components/providers/AuthProvider";
import dbConnect from "@/lib/db";
import Setting from "@/models/Setting";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vivasaya Ulagam — Premium Organic Tamil Nadu Products",
  description: "Premium organic local foods direct from Tamil Nadu farms. Pure Ghee, Millets, Honey & Cold Pressed Oils.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch dynamic CMS primary color
  let primaryColor: string | undefined;
  try {
    await dbConnect();
    const colorSetting = await Setting.findOne({ key: "primary_color" });
    if (colorSetting) {
      primaryColor = colorSetting.value;
    }
  } catch (error) {
    console.error("Failed to fetch primary_color setting", error);
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className={poppins.variable}>
      <body
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-secondary)",
          color: "var(--color-dark)",
          overflowX: "hidden",
          ...(primaryColor ? { "--color-primary": "#34a121" } : {}),
        } as React.CSSProperties}
      >
        <AuthProvider>
          {children}
          <WhatsAppFab />
        </AuthProvider>
      </body>
    </html>
  );
}
