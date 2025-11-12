import type { Metadata } from 'next';
import { DM_Serif_Display, Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Providers } from './providers';

const dmSerif = DM_Serif_Display({ 
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Vesaki - AI Personal Shopping Assistant',
  description: 'Discover and virtually try on fashion with AI-powered personal styling',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${dmSerif.variable} ${inter.variable} font-sans antialiased`} suppressHydrationWarning>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
