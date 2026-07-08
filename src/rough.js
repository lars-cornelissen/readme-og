// Tiny "hand-drawn" SVG path helpers (xkcd / excalidraw style).
// Deterministic wobble via a seeded PRNG so output is stable per repo.

export function seededRandom(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// A wobbly line from (x1,y1) to (x2,y2): split into segments and jitter midpoints.
export function roughLine(x1, y1, x2, y2, rnd, wobble = 2.5) {
  const segments = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 80));
  let d = `M ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const nx = x1 + (x2 - x1) * t + (i < segments ? (rnd() - 0.5) * 2 * wobble : 0);
    const ny = y1 + (y2 - y1) * t + (i < segments ? (rnd() - 0.5) * 2 * wobble : 0);
    const cx = x1 + (x2 - x1) * (t - 0.5 / segments) + (rnd() - 0.5) * 2 * wobble;
    const cy = y1 + (y2 - y1) * (t - 0.5 / segments) + (rnd() - 0.5) * 2 * wobble;
    d += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)}`;
  }
  return d;
}

// Hand-drawn rectangle: four rough lines, drawn twice slightly offset
// (double-stroke is the classic sketchy look).
export function roughRect(x, y, w, h, rnd, wobble = 3) {
  const corners = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const paths = [];
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < 4; i++) {
      const [ax, ay] = corners[i];
      const [bx, by] = corners[(i + 1) % 4];
      const o = pass === 0 ? 0 : 1.5;
      paths.push(
        roughLine(
          ax + (rnd() - 0.5) * o,
          ay + (rnd() - 0.5) * o,
          bx + (rnd() - 0.5) * o,
          by + (rnd() - 0.5) * o,
          rnd,
          wobble
        )
      );
    }
  }
  return paths.map((d) => `<path d="${d}" />`).join('\n    ');
}

// Rough circle approximated with jittered cubic arcs.
export function roughCircle(cx, cy, r, rnd, wobble = 1.5) {
  const k = 0.5523 * r;
  const j = () => (rnd() - 0.5) * 2 * wobble;
  const pts = [
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy],
    [cx, cy - r],
  ].map(([px, py]) => [px + j(), py + j()]);
  const d =
    `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` +
    ` C ${cx + r + j()} ${cy + k + j()}, ${cx + k + j()} ${cy + r + j()}, ${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}` +
    ` C ${cx - k + j()} ${cy + r + j()}, ${cx - r + j()} ${cy + k + j()}, ${pts[2][0].toFixed(1)} ${pts[2][1].toFixed(1)}` +
    ` C ${cx - r + j()} ${cy - k + j()}, ${cx - k + j()} ${cy - r + j()}, ${pts[3][0].toFixed(1)} ${pts[3][1].toFixed(1)}` +
    ` C ${cx + k + j()} ${cy - r + j()}, ${cx + r + j()} ${cy - k + j()}, ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  return `<path d="${d}" />`;
}

// A hand-drawn star (for the star count).
export function roughStar(cx, cy, r, rnd, wobble = 1.2) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push([
      cx + Math.cos(angle) * rad + (rnd() - 0.5) * 2 * wobble,
      cy + Math.sin(angle) * rad + (rnd() - 0.5) * 2 * wobble,
    ]);
  }
  const d =
    `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} ` +
    pts
      .slice(1)
      .map(([px, py]) => `L ${px.toFixed(1)} ${py.toFixed(1)}`)
      .join(' ') +
    ' Z';
  return `<path d="${d}" fill="#f5c542" />`;
}

// A wobbly underline with a slight downward bow, like marker pen.
export function roughUnderline(x, y, width, rnd) {
  const midX = x + width / 2 + (rnd() - 0.5) * 10;
  const midY = y + 3 + rnd() * 4;
  const endY = y + (rnd() - 0.5) * 4;
  return `<path d="M ${x} ${y} Q ${midX} ${midY} ${x + width} ${endY}" />`;
}
