import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '../styles/hero-animations.css';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Flower Ecommerce Platform',
  description: 'A rustic, artisanal flower e-commerce and event booking website.',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f5f5dc" />
        {/* Place any other meta tags or analytics scripts here */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <Navbar />
              {children}
      </body>
    </html>
  );
}
