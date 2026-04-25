import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tickerng.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "TickerNG — NGX Research Tool",
    template: "%s | TickerNG",
  },
  description: "Fast, structured stock research on the Nigerian Exchange. Discovery and verification reports powered by AI.",
  openGraph: {
    type: "website",
    locale: "en",
    siteName: "TickerNG",
    url: baseUrl,
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
    <ClerkProvider>
      <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
        <body className="min-h-screen font-body">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
