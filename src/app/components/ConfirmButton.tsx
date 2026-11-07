"use client";

export function ConfirmButton({
  message,
  children,
  className = "btn danger small",
  formAction,
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
  formAction?: (form: FormData) => void | Promise<void>;
}) {
  return (
    <button className={className} formAction={formAction} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
