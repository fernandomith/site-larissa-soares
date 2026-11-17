import type { Metadata } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ClinicProvider } from '@/lib/store';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Estética Larissa Soares | Estética & Cosmetologia, Massoterapia e Lash Design',
  description:
    'Espaço exclusivo de autocuidado e beleza natural por Larissa Soares — Esteticista e Cosmetóloga, Massoterapeuta e Lash Designer. Agende seu horário online.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${cormorant.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAF9F6] text-[#2D2D2D]">
        <ClinicProvider>{children}</ClinicProvider>
      </body>
    </html>
  );
}
