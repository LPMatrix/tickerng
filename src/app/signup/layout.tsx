import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your free account",
  description: "Sign up for EquiScan — full NGX stock research in under 60 seconds. Free tier: unlimited Discovery and Verification reports.",
};

export default function SignUpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
