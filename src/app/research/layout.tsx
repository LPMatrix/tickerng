import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description: "Run Discovery and Verification reports on Nigerian Exchange (NGX) stocks.",
  robots: { index: false, follow: false },
};

export default function ResearchLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
