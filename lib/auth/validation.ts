import { z } from "zod";

const email = z.string().trim().pipe(z.email("Enter a valid email address.").max(254));
const password = z.string().min(1, "Enter your password.").max(1024, "Password is too long.");

export const loginSchema = z.object({ email, password });
export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer."),
});
export const recoverySchema = z.object({ email });
export const passwordSchema = z.object({ password, confirmPassword: password }).refine(
  (value) => value.password === value.confirmPassword,
  { message: "Passwords must match.", path: ["confirmPassword"] },
);
export const profileSchema = z.object({
  id: z.uuid(),
  display_name: z.string(),
  role: z.enum(["customer", "admin"]),
});
export const callbackCodeSchema = z.string().min(1).max(2048).regex(/^[a-zA-Z0-9_-]+$/);

export type AuthState = {
  error?: string;
  message?: string;
  fields?: Partial<Record<"email" | "password" | "displayName" | "confirmPassword", string>>;
};

export function validationError(error: z.ZodError): AuthState {
  const fields: NonNullable<AuthState["fields"]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password" || key === "displayName" || key === "confirmPassword") {
      fields[key] ??= issue.message;
    }
  }
  return { error: "Check the highlighted fields.", fields };
}
