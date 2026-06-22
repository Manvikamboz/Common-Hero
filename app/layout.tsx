import type { Metadata, Viewport } from 'next';
import { Outfit, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navigation from '@/components/navigation';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  title: 'Community Hero | Hyperlocal Civic Issue Reporting',
  description: 'A hyperlocal civic issue reporting and resolution platform powered by Google AI Studio (Gemini API). Report potholes, streetlight outages, water leaks, and more — validated by your community.',
  keywords: ['civic reporting', 'community', 'pothole', 'municipal', 'Gemini AI', 'Next.js'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Community Hero',
  },
  openGraph: {
    title: 'Community Hero | Civic Issue Reporter',
    description: 'AI-powered hyperlocal civic issue reporting platform.',
    type: 'website',
    locale: 'en_IN',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-violet-500/30 selection:text-violet-200">
        <Navigation />
        <main className="pt-4 pb-20 md:pt-24 md:pb-8 min-h-screen px-4 max-w-7xl mx-auto">
          {children}
        </main>
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
