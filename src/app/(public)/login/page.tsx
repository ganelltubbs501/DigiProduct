import { login } from "@/app/actions/auth";
import { AuthForm } from "@/app/components/AuthForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="auth-box">
      <AuthForm mode="login" action={login} />
    </div>
  );
}
