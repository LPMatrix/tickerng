import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EquiScan — NGX Research Tool",
  description: "Fast, structured stock research on the Nigerian Exchange. Discovery and verification reports powered by AI.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
