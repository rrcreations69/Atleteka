import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { getIdentity } from "@/lib/auth/session";

export default async function RegisterPage() {
  if (await getIdentity()) redirect("/account");
  return (
    <AuthCard title="Create an account" description="Register with your email and a password.">
      <AuthForm mode="register" />
    </AuthCard>
  );
}
