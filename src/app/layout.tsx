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
    default: 'Casphe | Fast Wi-Fi Cafes for Remote Work in Vietnam',
    template: '%s | Casphe',
  },
  description:
    'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Casphe | Fast Wi-Fi Cafes for Remote Work in Vietnam',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
    url: 'https://speedphe.rrchs.fr',
    siteName: 'Casphe',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Casphe map of cafes with fast Wi-Fi for remote work',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casphe | Fast Wi-Fi Cafes for Remote Work in Vietnam',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
    images: ['/opengraph-image'],
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
