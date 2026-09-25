import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TextFieldProps = Omit<ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
};

export function TextField({
  id,
  label,
  description,
  error,
  required,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...props
}: TextFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const associations = [describedBy, descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div data-slot="text-field" className="min-w-0 space-y-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 font-normal text-muted-foreground">(required)</span>}
      </Label>
      {description && <p id={descriptionId} className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      <Input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : invalid}
        aria-describedby={associations || undefined}
      />
      {error && <p id={errorId} className="text-sm leading-relaxed text-destructive">{error}</p>}
    </div>
  );
}
