import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full NGX stock research in under 60 seconds",
  description: "Your personal NGX analyst, on demand. Discovery and verification reports powered by AI — discover opportunities or deep-dive any ticker on the Nigerian Exchange.",
  openGraph: {
    title: "Full NGX stock research in under 60 seconds",
    description: "Your personal NGX analyst, on demand. Discovery and verification reports powered by AI on the Nigerian Exchange.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Full NGX stock research in under 60 seconds",
    description: "Your personal NGX analyst, on demand. AI-powered Discovery and Verification reports for the Nigerian Exchange.",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tickerng.com";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "TickerNG",
      url: baseUrl,
      logo: { "@type": "ImageObject", url: `${baseUrl}/icon.png` },
      description: "Full NGX stock research in under 60 seconds. Your personal NGX analyst, on demand.",
    },
    {
      "@type": "WebApplication",
      "@id": `${baseUrl}/#webapp`,
      name: "TickerNG",
      url: baseUrl,
      applicationCategory: "FinanceApplication",
      description: "AI-powered Discovery and Verification reports for stocks on the Nigerian Exchange (NGX).",
      author: { "@id": `${baseUrl}/#organization` },
    },
  ],
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
