import type { Metadata } from "next";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params; // consume for Next 15
  return {
    title: "Shared report",
    description: "A shared EquiScan research report from the Nigerian Exchange (NGX).",
    robots: { index: false, follow: false },
  };
}

export default function SharedReportLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
