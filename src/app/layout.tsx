import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://speedphe.rrchs.fr'),
  title: {
    default: 'Casphe | Find Cafes With Fast Wi-Fi for Work',
    template: '%s | Casphe',
  },
  description:
    'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Casphe | Find Cafes With Fast Wi-Fi for Work',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
    url: 'https://speedphe.rrchs.fr',
    siteName: 'Casphe',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casphe | Find Cafes With Fast Wi-Fi for Work',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
