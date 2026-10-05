import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-transparent bg-foreground text-white hover:bg-navy",
  secondary: "border-input bg-field text-foreground hover:bg-accent",
  outline: "border-foreground bg-transparent text-foreground hover:bg-accent",
  inverse: "border-transparent bg-field text-foreground hover:bg-accent",
  ink: "border-transparent bg-foreground text-white hover:bg-navy",
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
    "inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full border px-7 py-2 text-sm font-semibold motion-safe:transition-colors disabled:pointer-events-none disabled:border-transparent disabled:bg-[#d5d8e0] disabled:text-[#37415c]",
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
