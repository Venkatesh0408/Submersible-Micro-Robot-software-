// Lightweight branded fallback for React.lazy Suspense boundaries.
// Pure CSS (no animation lib) so it paints instantly before page chunks load.
export default function LoadingAnimation() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#070b14",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "3px solid rgba(18,211,224,0.18)",
          borderTopColor: "#22d3ee",
          animation: "sub-spin 0.75s linear infinite",
          boxShadow: "0 0 24px rgba(18,211,224,0.25)",
        }}
      />
      <style>{`@keyframes sub-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){[role=status] div{animation-duration:1.6s}}`}</style>
    </div>
  );
}
