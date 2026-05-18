/**
 * MedWatch wordmark plus a heart-rate pulse glyph. Pure presentational
 * component used by the nav bar; no client state required, so it stays
 * a server component.
 *
 * @param props.size - Logo height in pixels (defaults to 22). The
 *   wordmark scales as a function of this value.
 */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.4" />
        <path
          d="M5 12 L9 12 L11 7 L13 17 L15 12 L19 12"
          stroke="var(--teal)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="serif"
        style={{ fontSize: size * 0.95, letterSpacing: "-0.02em", fontWeight: 500 }}
      >
        MedWatch
      </span>
    </div>
  );
}
