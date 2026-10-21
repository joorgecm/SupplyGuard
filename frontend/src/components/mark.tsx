export function Mark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.2 22.6 20.6H1.4Z"
        fill="var(--color-yellow)"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.4 16.6h9.2M9.1 13.3h5.8" stroke="var(--color-ink)" strokeWidth="1.8" />
    </svg>
  );
}
