"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  description,
  children,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  dangerous = false,
  disabled = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  children?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  dangerous?: boolean;
  disabled?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const processingRef = useRef(false);
  const [processing, setProcessing] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () =>
        panelRef.current
          ?.querySelector<HTMLElement>("button:not([disabled])")
          ?.focus(),
      0,
    );
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processingRef.current) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ];
      if (!focusable.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  async function executeConfirm() {
    if (processing || disabled) return;
    setProcessing(true);
    try {
      await onConfirm();
    } finally {
      setProcessing(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !processing) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-purple-deep/20 bg-white p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-pink-accent">
              SGH Administration
            </p>
            <h2
              id={titleId}
              className="mt-1 text-2xl font-semibold text-purple-deep"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Close confirmation"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p id={descriptionId} className="mt-4 text-text-body">
          {description}
        </p>
        {children && <div className="mt-5">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="min-h-12 rounded-xl border px-5 py-3 font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void executeConfirm()}
            disabled={processing || disabled}
            className={`min-h-12 rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${dangerous ? "bg-red-700" : "bg-purple-deep"}`}
          >
            {processing ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
