import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import WhatsAppFab from "@/components/ui/WhatsAppFab";
import AuthProvider from "@/components/providers/AuthProvider";
import MetaPixel from "@/components/analytics/MetaPixel";
import MetaPageViewTracker from "@/components/analytics/MetaPageViewTracker";
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
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Vivasaya Ulagam — Premium Organic Tamil Nadu Products",
    description: "Premium organic local foods direct from Tamil Nadu farms. Pure Ghee, Millets, Honey & Cold Pressed Oils.",
    url: "https://vivasayaulagam.com",
    siteName: "Vivasaya Ulagam",
    images: [
      {
        url: "https://vivasayaulagam.com/logo1.png",
        width: 1200,
        height: 630,
        alt: "Vivasaya Ulagam",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vivasaya Ulagam — Premium Organic Tamil Nadu Products",
    description: "Premium organic local foods direct from Tamil Nadu farms.",
    images: ["https://vivasayaulagam.com/logo1.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch dynamic CMS settings
  let primaryColor: string | undefined;
  let metaDomainVerification: string | undefined;

  try {
    await dbConnect();
    const [colorSetting, metaSetting] = await Promise.all([
      Setting.findOne({ key: "primary_color" }),
      Setting.findOne({
        key: { $in: ["meta_domain_verification", "meta_domain_verification_code", "facebook_domain_verification"] },
      }),
    ]);

    if (colorSetting) {
      primaryColor = colorSetting.value;
    }
    if (metaSetting && metaSetting.value && String(metaSetting.value).trim()) {
      metaDomainVerification = String(metaSetting.value).trim();
    }
  } catch (error) {
    console.error("Failed to fetch layout settings", error);
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className={poppins.variable}>
      <head>
        {metaDomainVerification && (
          <meta name="facebook-domain-verification" content={metaDomainVerification} />
        )}
      </head>
      <body
        style={{
          fontFamily: "var(--font-body)",
          backgroundColor: "var(--color-secondary)",
          color: "var(--color-dark)",
          overflowX: "hidden",
          ...(primaryColor ? { "--color-primary": "#34a121" } : {}),
        } as React.CSSProperties}
      >
        <MetaPixel />
        <Suspense fallback={null}>
          <MetaPageViewTracker />
        </Suspense>
        <AuthProvider>
          {children}
          <WhatsAppFab />
        </AuthProvider>
      </body>
    </html>
  );
}
