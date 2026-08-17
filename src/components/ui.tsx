"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconCheck, IconSearch, IconX } from "@/components/icons";

/* -------------------------------------------------------------------------- */
/* Panel                                                                       */
/* -------------------------------------------------------------------------- */

export function Panel({
  title,
  actions,
  children,
  className = "",
  bodyClassName = "panel-body",
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {(title || actions) && (
        <header className="panel-header">
          <h2 className="panel-title">{title}</h2>
          {actions ? <div className="flex items-center gap-1.5">{actions}</div> : null}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** A panel that can be folded away. Open state is remembered per key. */
export function Collapsible({
  title,
  count,
  defaultOpen = false,
  storageKey,
  children,
}: {
  title: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  storageKey?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(`digital-rx:open:${storageKey}`);
      if (saved !== null) setOpen(saved === "1");
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          window.localStorage.setItem(`digital-rx:open:${storageKey}`, next ? "1" : "0");
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  return (
    <section className="panel">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="panel-title">{title}</span>
          {typeof count === "number" && count > 0 && (
            <span className="badge bg-brand-100 text-brand-800">{count}</span>
          )}
        </span>
        <span
          className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          aria-hidden="true"
        >
          ▸
        </span>
      </button>
      {open && <div className="panel-body border-t border-slate-200">{children}</div>}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Form fields                                                                 */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <p className="hint mt-1">{hint}</p>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  className = "",
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className={`relative ${className}`}>
      <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="!pl-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <IconX className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Quick-fill chips shown under a text input. */
export function PresetChips({
  presets,
  onPick,
  active,
}: {
  presets: readonly string[];
  onPick: (value: string) => void;
  active?: string;
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onPick(preset)}
          className={`chip ${active === preset ? "chip-active" : ""}`}
        >
          {preset}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Feedback                                                                    */
/* -------------------------------------------------------------------------- */

export type ToastKind = "success" | "error" | "info";

export function Toast({
  message,
  kind = "info",
  onDismiss,
}: {
  message: string;
  kind?: ToastKind;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, kind === "error" ? 8000 : 3500);
    return () => window.clearTimeout(timer);
  }, [kind, onDismiss]);

  const palette =
    kind === "success"
      ? "bg-brand-700 text-white"
      : kind === "error"
        ? "bg-rose-700 text-white"
        : "bg-slate-800 text-white";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`no-print fixed bottom-5 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg ${palette}`}
    >
      {kind === "success" && <IconCheck className="size-4 shrink-0" />}
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="ml-1 rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <IconX className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const show = useCallback((message: string, kind: ToastKind = "info") => {
    setToast({ message, kind });
  }, []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss };
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                       */
/* -------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-[10vh]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full ${width} rounded-xl bg-white shadow-xl`}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <IconX className="size-4" />
          </button>
        </header>
        <div className="max-h-[65vh] overflow-y-auto p-4">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/** Two-step delete: no browser confirm() dialog, no accidental data loss. */
export function ConfirmButton({
  onConfirm,
  label,
  confirmLabel,
  className = "btn-danger btn-sm",
}: {
  onConfirm: () => void;
  label: React.ReactNode;
  confirmLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}
