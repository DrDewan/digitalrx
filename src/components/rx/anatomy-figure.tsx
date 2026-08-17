/**
 * A schematic body used to tag the region examined. Purely a picker aid —
 * it is never printed.
 */
const REGION_PATHS: Record<string, { d: string; fill: string }> = {
  head: { d: "M20 2 Q30 0 40 2 L38 20 Q30 24 22 20 Z", fill: "#3b82f6" },
  neck: { d: "M24 20 L36 20 L35 32 L25 32 Z", fill: "#6366f1" },
  chest: { d: "M18 32 L42 32 L40 58 L20 58 Z", fill: "#0ea5e9" },
  abdomen: { d: "M20 56 L40 56 L39 72 L21 72 Z", fill: "#14b8a6" },
  pelvis: { d: "M21 70 L39 70 L38 82 L22 82 Z", fill: "#8b5cf6" },
  upper_limb: {
    d: "M8 36 L20 32 L18 50 L6 54 Z M40 32 L52 36 L44 54 L32 50 Z",
    fill: "#f59e0b",
  },
  lower_limb: {
    d: "M18 82 L28 80 L26 98 L16 98 Z M32 80 L42 82 L44 98 L34 98 Z",
    fill: "#ef4444",
  },
  back: { d: "M22 30 L38 30 L37 70 L23 70 Z", fill: "#64748b" },
};

export function AnatomyFigure({ region, active }: { region: string; active: boolean }) {
  const highlight = REGION_PATHS[region];
  const stroke = active ? "#0f7f6d" : "#94a3b8";

  return (
    <svg viewBox="0 0 60 100" className="h-16 w-auto" aria-hidden="true">
      <g fill="none" stroke={stroke} strokeWidth={1.2}>
        <ellipse cx="30" cy="12" rx="10" ry="11" />
        <line x1="30" y1="23" x2="30" y2="58" />
        <line x1="30" y1="35" x2="12" y2="48" />
        <line x1="30" y1="35" x2="48" y2="48" />
        <line x1="30" y1="58" x2="18" y2="92" />
        <line x1="30" y1="58" x2="42" y2="92" />
      </g>
      {highlight && (
        <path
          d={highlight.d}
          fill={highlight.fill}
          opacity={active ? 0.55 : 0.22}
          stroke={stroke}
          strokeWidth={0.8}
        />
      )}
    </svg>
  );
}
