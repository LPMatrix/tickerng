import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mx-auto flex min-h-screen flex-col items-center justify-center px-4">
      <SignUp />
    </div>
  );
}
