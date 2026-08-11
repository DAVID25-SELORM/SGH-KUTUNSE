import { cn } from "@/lib/utils";

export const Checkbox = ({
  label,
  id,
  error,
  className,
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: React.ReactNode;
  error?: string;
  ref?: React.Ref<HTMLInputElement>;
}) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    <label htmlFor={id} className="flex items-start gap-3 text-sm text-text-body">
      <input
        id={id}
        ref={ref}
        type="checkbox"
        aria-invalid={Boolean(error)}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-border-default text-purple-deep focus:ring-purple-deep"
        {...props}
      />
      <span>{label}</span>
    </label>
    {error ? (
      <p role="alert" className="text-xs font-medium text-pink-dark">
        {error}
      </p>
    ) : null}
  </div>
);
