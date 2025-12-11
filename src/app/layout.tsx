import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'N0N4 - Protected Creation',
  description: 'Declaración de uso responsable de la IA para la generación de Información documentada.',
};

import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="fixed inset-0 z-[-1] bg-slate-50"></div>
          <Providers>
            <main className="min-h-screen flex flex-col items-center">
              {children}
            </main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
