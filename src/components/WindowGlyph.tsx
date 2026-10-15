/**
 * Janela medieval pixelada desenhada em grade de 16x22 (1 unidade = 1 pixel de arte).
 * Toda coordenada e inteira e shapeRendering=crispEdges: nunca introduza
 * curvas, gradientes ou meio-pixel aqui (CLAUDE.md).
 */
const SILHOUETTE =
  "M5,0 L11,0 L11,1 L13,1 L13,2 L14,2 L14,3 L15,3 L15,4 L16,4 L16,20 L0,20 L0,4 L1,4 L1,3 L2,3 L2,2 L3,2 L3,1 L5,1 Z";

const FRAME =
  "M6,1 L10,1 L10,2 L12,2 L12,3 L13,3 L13,4 L14,4 L14,5 L15,5 L15,19 L1,19 L1,5 L2,5 L2,4 L3,4 L3,3 L4,3 L4,2 L6,2 Z";

const GLASS =
  "M7,2 L9,2 L9,3 L11,3 L11,4 L12,4 L12,5 L13,5 L13,6 L14,6 L14,18 L2,18 L2,6 L3,6 L3,5 L4,5 L4,4 L5,4 L5,3 L7,3 Z";

type Props = {
  /** Altura em pixels de tela. A largura sai proporcional. */
  size?: number;
  /** Desenha o trinco de ferro na lateral direita. */
  latch?: boolean;
  className?: string;
};

export default function WindowGlyph({ size = 48, latch = true, className }: Props) {
  const id = latch ? "glass-clip-latch" : "glass-clip-plain";
  return (
    <svg
      viewBox="-1 0 20 24"
      height={size}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={id}>
          <path d={GLASS} />
        </clipPath>
        <clipPath id={`${id}-bevel`}>
          <rect x="-1" y="0" width="9" height="24" />
        </clipPath>
      </defs>

      {/* Contorno externo, duas camadas para dar o degrade em degraus */}
      <path d={SILHOUETTE} fill="var(--wood-shadow)" transform="translate(0,1)" />
      <path d={SILHOUETTE} fill="var(--wood-dark)" />
      <path d={FRAME} fill="var(--wood)" />
      <path d={FRAME} fill="var(--wood-light)" clipPath={`url(#${id}-bevel)`} />

      {/* Vidro */}
      <path d={GLASS} fill="var(--glass)" />
      <g clipPath={`url(#${id})`}>
        <rect x="2" y="2" width="12" height="4" fill="var(--glass-light)" />
        <rect x="3" y="7" width="2" height="9" fill="var(--glass-light)" />
        <rect x="5" y="9" width="1" height="5" fill="var(--glass-shine)" />
        <rect x="10" y="6" width="3" height="12" fill="var(--glass-deep)" />
        {/* Caixilho em cruz */}
        <rect x="7" y="0" width="2" height="20" fill="var(--wood-dark)" />
        <rect x="7" y="0" width="1" height="20" fill="var(--wood-mid)" />
        <rect x="0" y="10" width="16" height="2" fill="var(--wood-dark)" />
        <rect x="0" y="10" width="16" height="1" fill="var(--wood-mid)" />
      </g>

      {/* Peitoril */}
      <rect x="-1" y="19" width="18" height="2" fill="var(--wood-light)" />
      <rect x="-1" y="21" width="18" height="2" fill="var(--wood-dark)" />
      <rect x="-1" y="23" width="18" height="1" fill="var(--wood-shadow)" />

      {latch && (
        <>
          <rect x="14" y="9" width="3" height="4" fill="var(--iron-dark)" />
          <rect x="14" y="9" width="3" height="1" fill="var(--iron-light)" />
          <rect x="15" y="10" width="1" height="2" fill="var(--iron)" />
        </>
      )}
    </svg>
  );
}
