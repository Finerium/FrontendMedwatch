/**
 * Decorative four-blob ambient background used by the legacy sidebar
 * shell. Marked `"use client"` only because the inline keyframe
 * animations are driven by class-based dark-mode toggling that must
 * react to runtime theme changes.
 */
"use client";

/**
 * Render two layered sets of soft blurred blobs, one for dark mode and
 * one for light mode. The wrapping container is `pointer-events-none`
 * so the decoration never intercepts clicks.
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* ===== Dark mode blobs ===== */}
      <div className="hidden dark:block absolute inset-0">
        {/* Blob 1 - Purple (top-left) */}
        <div
          className="ambient-blob"
          style={{
            width: 600,
            height: 600,
            top: "-10%",
            left: "-5%",
            background:
              "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "0s",
          }}
        />
        {/* Blob 2 - Blue (top-right) */}
        <div
          className="ambient-blob"
          style={{
            width: 500,
            height: 500,
            top: "-5%",
            right: "-5%",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.20), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-5s",
          }}
        />
        {/* Blob 3 - Teal (center-bottom) */}
        <div
          className="ambient-blob"
          style={{
            width: 400,
            height: 400,
            bottom: "5%",
            left: "30%",
            background:
              "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-10s",
          }}
        />
        {/* Blob 4 - Pink (bottom-right) */}
        <div
          className="ambient-blob"
          style={{
            width: 350,
            height: 350,
            bottom: "10%",
            right: "10%",
            background:
              "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-15s",
          }}
        />
      </div>

      {/* ===== Light mode blobs ===== */}
      <div className="block dark:hidden absolute inset-0">
        {/* Blob 1 - Lavender (top-left) */}
        <div
          className="ambient-blob"
          style={{
            width: 600,
            height: 600,
            top: "-10%",
            left: "-5%",
            background:
              "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "0s",
          }}
        />
        {/* Blob 2 - Sky blue (top-right) */}
        <div
          className="ambient-blob"
          style={{
            width: 500,
            height: 500,
            top: "-5%",
            right: "-5%",
            background:
              "radial-gradient(circle, rgba(147,197,253,0.15), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-5s",
          }}
        />
        {/* Blob 3 - Mint (center-bottom) */}
        <div
          className="ambient-blob"
          style={{
            width: 400,
            height: 400,
            bottom: "5%",
            left: "30%",
            background:
              "radial-gradient(circle, rgba(110,231,183,0.10), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-10s",
          }}
        />
        {/* Blob 4 - Amber (bottom-right) */}
        <div
          className="ambient-blob"
          style={{
            width: 350,
            height: 350,
            bottom: "10%",
            right: "10%",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.08), transparent 70%)",
            animation: "blob-float 25s ease-in-out infinite alternate",
            animationDelay: "-15s",
          }}
        />
      </div>
    </div>
  );
}
