import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-wine",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
  outline: "border-foreground bg-transparent text-foreground hover:bg-accent",
  inverse: "border-transparent bg-background text-foreground hover:bg-accent",
  ink: "border-transparent bg-foreground text-background hover:bg-navy",
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
    "inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-sm border px-7 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] motion-safe:transition-colors disabled:pointer-events-none disabled:border-transparent disabled:bg-[#d5d8e0] disabled:text-[#37415c]",
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
