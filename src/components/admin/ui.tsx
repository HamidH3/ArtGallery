"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useId } from "react";

/* Small, consistent form controls for the dashboard. */

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  optional,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor?: string;
  optional?: boolean;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={htmlFor} className="admin-label">
        {label}
        {optional ? <span className="admin-optional">optional</span> : null}
      </label>
      {children}
      {error ? (
        <p className="admin-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="admin-hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`admin-input ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`admin-input admin-textarea ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`admin-input admin-select ${props.className ?? ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="admin-toggle-row">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="admin-switch"
      >
        <span className="admin-switch-knob" />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-[1.02rem] text-ink">{label}</span>
        {description ? <span className="block text-[0.92rem] leading-snug text-umber">{description}</span> : null}
      </label>
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export function Button({
  variant = "primary",
  busy,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; busy?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || busy} className={`admin-button admin-button-${variant} ${className}`}>
      {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  return (
    <div className={`admin-notice admin-notice-${tone}`} role={tone === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}
