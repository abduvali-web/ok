import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://autofood.uz'),
  title: {
    default: "AutoFood - Tizimlashtirilgan Yetkazib Berish Xizmati",
    template: "%s | AutoFood"
  },
  description: "O'zbekistonda restoran va kafelar uchun eng zamonaviy yetkazib berishni avtomatlashtirish tizimi. Kuryerlar nazorati, CRM va hisobotlar.",
  keywords: [
    "AutoFood", "yetkazib berish", "dostavka", "restoran", "crm", "avtomatlashtirish",
    "toshkent", "ozbekiston", "delivery system", "food delivery software",
    "автоматизация доставки", "срм для общепита", "доставка еды ташкент"
  ],
  authors: [{ name: "AutoFood Team", url: "https://autofood.uz" }],
  creator: "AutoFood Inc.",
  publisher: "AutoFood Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AutoFood - Biznesingizni Avtomatlashtiring",
    description: "Restoran va kuryerlik xizmatlari uchun mukammal yechim. 30% gacha xarajatlarni qisqartiring.",
    url: "https://autofood.uz",
    siteName: "AutoFood",
    locale: "uz_UZ",
    type: "website",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AutoFood Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoFood - Delivery Automation",
    description: "Smart delivery management system for restaurants in Uzbekistan.",
    images: ['/og-image.png'],
    creator: "@autofood_uz",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  verification: {
    google: '-E7Q1ex1NuRnBvPvZqMNLA8EaDPjb__gxkOqXXuQ4Lk',
  },
  category: 'business',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AutoFood',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

// Viewport configuration for PWA
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="AutoFood" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AutoFood" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#4f46e5" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192.png" />

        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          <AdminSettingsProvider>
            <ServiceWorkerRegistration />
            {children}
            <PWAInstallPrompt />
            <Toaster />
          </AdminSettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
