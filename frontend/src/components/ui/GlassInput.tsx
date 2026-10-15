import React from "react";

interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-white/80 tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`glass-input px-4 py-2.5 text-sm w-full outline-none ${
            error ? "border-rose-400/80 focus:border-rose-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-300 mt-0.5">{error}</span>}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";

interface GlassTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const GlassTextarea = React.forwardRef<
  HTMLTextAreaElement,
  GlassTextareaProps
>(({ label, error, className = "", id, ...props }, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-white/80 tracking-wide"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        ref={ref}
        className={`glass-input px-4 py-2.5 text-sm w-full outline-none resize-none ${
          error ? "border-rose-400/80 focus:border-rose-400" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-300 mt-0.5">{error}</span>}
    </div>
  );
});

GlassTextarea.displayName = "GlassTextarea";
