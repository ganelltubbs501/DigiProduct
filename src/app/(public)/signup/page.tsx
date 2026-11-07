import { signup } from "@/app/actions/auth";
import { AuthForm } from "@/app/components/AuthForm";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="auth-box">
      <AuthForm mode="signup" action={signup} />
    </div>
  );
}
