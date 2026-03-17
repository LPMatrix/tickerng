import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://equiscan.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "EquiScan — NGX Research Tool",
    template: "%s | EquiScan",
  },
  description: "Fast, structured stock research on the Nigerian Exchange. Discovery and verification reports powered by AI.",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "EquiScan",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="min-h-screen font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
