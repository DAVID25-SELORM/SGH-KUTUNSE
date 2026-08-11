import { cn } from "@/lib/utils";

const fieldBase =
  "min-h-11 w-full rounded-xl border border-border-default bg-white px-4 py-2.5 text-base text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-purple-deep focus:border-transparent transition-colors sm:text-sm";

function FieldWrapper({
  label,
  htmlFor,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-text-dark">
        {label}
        {required ? <span className="text-pink-accent"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs font-medium text-pink-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = ({
  label,
  id,
  error,
  required,
  className,
  wrapperClassName,
  ref,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  wrapperClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}) => (
  <FieldWrapper label={label} htmlFor={id!} error={error} required={required} className={wrapperClassName}>
    <input
      id={id}
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(fieldBase, error && "border-pink-dark", className)}
      {...props}
    />
  </FieldWrapper>
);

export const Textarea = ({
  label,
  id,
  error,
  required,
  className,
  wrapperClassName,
  ref,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  wrapperClassName?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
}) => (
  <FieldWrapper label={label} htmlFor={id!} error={error} required={required} className={wrapperClassName}>
    <textarea
      id={id}
      ref={ref}
      rows={4}
      aria-invalid={Boolean(error)}
      className={cn(fieldBase, "min-h-28 resize-y", error && "border-pink-dark", className)}
      {...props}
    />
  </FieldWrapper>
);

export const Select = ({
  label,
  id,
  error,
  required,
  className,
  wrapperClassName,
  children,
  ref,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  wrapperClassName?: string;
  ref?: React.Ref<HTMLSelectElement>;
}) => (
  <FieldWrapper label={label} htmlFor={id!} error={error} required={required} className={wrapperClassName}>
    <select
      id={id}
      ref={ref}
      aria-invalid={Boolean(error)}
      className={cn(fieldBase, "bg-white", error && "border-pink-dark", className)}
      {...props}
    >
      {children}
    </select>
  </FieldWrapper>
);
