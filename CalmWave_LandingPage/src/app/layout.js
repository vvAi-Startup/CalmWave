import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutClient from './layout-client';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CalmWave - Redução de Ruído para TPAC",
  description: "Solução inovadora de redução de ruído para crianças com Transtorno do Processamento Auditivo Central (TPAC), usando IA para entregar áudio cristalino em sala de aula.",
  keywords: "TPAC, redução de ruído, educação inclusiva, acessibilidade auditiva, IA educacional",
  applicationName: "CalmWave",
  authors: [{ name: "CalmWave Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "CalmWave - Redução de Ruído para TPAC",
    description: "Tecnologia de IA para tornar a educação mais acessível",
    url: "https://calmwave-landingpage.vercel.app/",
    siteName: "CalmWave",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://calmwave-landingpage.vercel.app/logo.png",
        width: 1200,
        height: 630,
        alt: "CalmWave - logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CalmWave - Redução de Ruído para TPAC",
    description: "Tecnologia de IA para tornar a educação mais acessível",
    images: ["https://calmwave-landingpage.vercel.app/logo.png"],
    // If you have a twitter handle, replace these values
    site: "@CalmWave",
    creator: "@CalmWave",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
    other: [
      { rel: "apple-touch-icon", url: "/logo.png" },
    ],
  },
  themeColor: "#ffffff",
  alternates: {
    canonical: "https://calmwave-landingpage.vercel.app/",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
