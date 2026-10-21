import { memo } from "react";

/**
 * Sprite em pixel art a partir de um mapa de letras: cada letra e uma cor da
 * paleta (variavel CSS), "." e transparente. Um pixel de arte = 4px na tela.
 * Pixels iguais vizinhos na mesma linha viram um <rect> so.
 */

export const PX = 4;

/** Letra do mapa → variavel CSS. Globais do Nicolas + a paleta da masmorra (Seteira.module.css). */
const COR: Record<string, string> = {
  o: "--ink",
  X: "--wood-shadow",
  b: "--wood-dark",
  W: "--wood",
  M: "--wood-mid",
  h: "--wood-light",
  H: "--wood-highlight",
  s: "--skin",
  t: "--glass-deep",
  T: "--sky",
  w: "--osso",
  O: "--osso-sombra",
  r: "--blood",
  f: "--flame",
  G: "--gold",
  g: "--gold-light",
  I: "--iron-dark",
  i: "--iron",
  l: "--iron-light",
  S: "--stone",
  D: "--stone-dark",
  L: "--pedra-clara",
  B: "--breu",
  K: "--sky-deep",
  N: "--night",
  Y: "--sky",
  "*": "--star",
  c: "--chao",
  C: "--chao-claro",
  j: "--chao-junta",
  p: "--paper",
};

export type Retangulo = { x: number; y: number; w: number; h: number; c: string };

/** Mapa de letras → retangulos (corridas horizontais). */
export function corridas(mapa: readonly string[]): Retangulo[] {
  const saida: Retangulo[] = [];
  mapa.forEach((linha, y) => {
    let x = 0;
    while (x < linha.length) {
      const c = linha[x];
      let fim = x + 1;
      while (fim < linha.length && linha[fim] === c) fim += 1;
      if (c !== "." && c !== " ") saida.push({ x, y, w: fim - x, h: 1, c });
      x = fim;
    }
  });
  return saida;
}

type Props = {
  mapa: readonly string[];
  className?: string;
};

/** Desenha um mapa de letras. Tamanho natural: largura x altura do mapa, vezes PX. */
export const Pixels = memo(function Pixels({ mapa, className }: Props) {
  const l = mapa[0].length;
  const a = mapa.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${l} ${a}`}
      width={l * PX}
      height={a * PX}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {corridas(mapa).map((r) => (
        <rect key={`${r.x},${r.y}`} x={r.x} y={r.y} width={r.w} height={r.h} style={{ fill: `var(${COR[r.c]})` }} />
      ))}
    </svg>
  );
});

/** Retangulos ja prontos (o chao inteiro, a luz), num SVG so. */
export const Retangulos = memo(function Retangulos({
  rects,
  largura,
  altura,
  className,
}: {
  rects: readonly Retangulo[];
  largura: number;
  altura: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${largura} ${altura}`}
      width={largura * PX}
      height={altura * PX}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} style={{ fill: `var(${COR[r.c]})` }} />
      ))}
    </svg>
  );
});
