import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("block text-xs font-semibold uppercase leading-6 tracking-[0.1em]", className)}
      {...props}
    />
  );
}
