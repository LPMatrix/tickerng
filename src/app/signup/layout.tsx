import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Sign up for TickerNG — full NGX stock research in under 60 seconds. Free tier includes unlimited Discovery and 3 Verification reports per month.",
};

export default function SignUpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
