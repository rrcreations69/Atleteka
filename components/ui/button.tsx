import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border-input bg-background text-foreground hover:bg-accent",
};

type ButtonVariant = keyof typeof variants;

export function buttonVariants({
  variant = "default",
  className,
}: {
  variant?: ButtonVariant;
  className?: string;
} = {}) {
  return cn(
    "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium motion-safe:transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  );
}

export function Button({
  className,
  variant = "default",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <button
      data-slot="button"
      type={type}
      className={buttonVariants({ variant, className })}
      {...props}
    />
  );
}
