import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getAbsoluteUrl, getPublicUrl, getPublicUrlObject } from '@/lib/site-url';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const PUBLIC_URL = getPublicUrl();
const OG_IMAGE_URL = getAbsoluteUrl('/opengraph-image');

export const metadata: Metadata = {
  metadataBase: getPublicUrlObject(),
  title: {
    default: 'Casphe | Find Fast Wi-Fi Cafes for Remote Work in Vietnam',
    template: '%s | Casphe',
  },
  description:
    'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Casphe | Find Fast Wi-Fi Cafes for Remote Work in Vietnam',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
    url: PUBLIC_URL,
    siteName: 'Casphe',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'Casphe map of cafes with fast Wi-Fi for remote work',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Casphe | Find Fast Wi-Fi Cafes for Remote Work in Vietnam',
    description:
      'Compare real cafe Wi-Fi speed tests and find better places to work remotely in Hanoi and Ho Chi Minh City.',
    images: [OG_IMAGE_URL],
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
