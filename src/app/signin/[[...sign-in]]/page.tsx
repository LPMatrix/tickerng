import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center px-4">
      <SignIn />
    </div>
  );
}
