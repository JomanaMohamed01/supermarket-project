import { AuthForm } from "@/components/AuthForm";
import { redirectIfAuthenticated } from "@/lib/auth";

export default async function SignupPage() {
  await redirectIfAuthenticated();
  return <AuthForm mode="signup" />;
}
