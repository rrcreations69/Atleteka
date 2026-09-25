import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";
import { getIdentity } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const mode = params.mode === "recover" ? "recover" : params.mode === "reset" ? "reset" : "login";
  const identity = await getIdentity();
  if (identity && mode === "login" && params.error !== "link") redirect("/account");
  const expired = mode === "reset" && !identity;
  const formMode = expired ? "recover" : mode;
  const title = formMode === "recover" ? "Reset your password" : formMode === "reset" ? "Choose a new password" : "Sign in";
  return (
    <AuthCard title={title} description={formMode === "recover" ? "Enter your email to request a password reset link." : formMode === "reset" ? "Enter and confirm your new password." : "Welcome back to Atleteka."}>
      {(params.error === "link" || expired) && <p role="alert" className="mb-5 text-sm text-destructive">This link is invalid or expired. Request a new link and open it in the same browser.</p>}
      <AuthForm key={formMode} mode={formMode} />
    </AuthCard>
  );
}
