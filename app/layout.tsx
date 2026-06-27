import type { Metadata, Viewport } from 'next';
import { Roboto, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Navigation from '@/components/navigation';
import { LanguageProvider } from '@/context/LanguageContext';
import { EmergencyBanner, GovernmentFooter } from '@/components/government';

const roboto = Roboto({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b3d91',
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
    <html lang="en" className={`${roboto.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased selection:bg-blue-600/30 selection:text-blue-900 pt-14 md:pt-0">
        <LanguageProvider>
          <Navigation />
          <main className="pt-4 pb-20 md:pt-24 md:pb-8 min-h-screen px-4 max-w-7xl mx-auto flex flex-col gap-6">
            <EmergencyBanner />
            <div className="flex-1">
              {children}
            </div>
          </main>
          <GovernmentFooter />
        </LanguageProvider>
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                if (window.location.hostname === 'localhost') {
                  navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                } else {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
