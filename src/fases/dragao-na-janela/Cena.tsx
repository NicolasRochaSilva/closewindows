"use client";

import type { CSSProperties, Ref } from "react";
import styles from "./Cena.module.css";

/*
 * A arte da sala do trono, so desenho. Pixel art do Nicolas: grade de 4px,
 * SVG crispEdges em unidades de 1 pixel de arte (= 4px de tela), cor so por
 * variavel. Jogo e Previa montam e animam estas pecas.
 */

/** Tamanho da arte em px de tela. */
export const ARTE_L = 480;
export const ARTE_A = 440;
/** O vao da janela, em px de tela (a cabeca e a folha moram nele). */
export const VAO = { x: 152, y: 72, l: 176, a: 216 };

/** [cor, x, y, largura, altura] em pixels de arte. */
type Bloco = [string, number, number, number, number];

function Blocos({ lista, className }: { lista: Bloco[]; className?: string }) {
  return (
    <g className={className}>
      {lista.map(([cor, x, y, l, a], i) => (
        <rect key={i} x={x} y={y} width={l} height={a} style={{ fill: `var(--${cor})` }} />
      ))}
    </g>
  );
}

/* ---------- Sala: parede, estandartes, piso, tapete, trono, moldura ---------- */

const tijolos: Bloco[] = [];
for (let linha = 0; linha < 14; linha += 1) {
  const y = linha * 6;
  for (let x = linha % 2 ? -6 : 0; x < 120; x += 12) {
    tijolos.push(["stone", x, y, 11, 5]);
    tijolos.push(["iron-light", x, y, 11, 1]);
  }
}

const piso: Bloco[] = [["iron-dark", 0, 80, 120, 30]];
for (let y = 80; y < 110; y += 6) {
  piso.push(["stone-dark", 0, y + 1, 120, 4]);
  for (let x = (y / 6) % 2 ? 0 : 7; x < 120; x += 14) piso.push(["iron-dark", x, y + 1, 1, 4]);
}

const estandarte = (x: number): Bloco[] => [
  ["iron", x - 1, 8, 12, 1],
  ["gold", x - 2, 7, 2, 3],
  ["gold", x + 10, 7, 2, 3],
  ["blood", x, 9, 10, 31],
  ["wood-shadow", x + 9, 9, 1, 31],
  ["blood", x, 40, 4, 4],
  ["blood", x + 6, 40, 4, 4],
  ["wood-shadow", x + 9, 40, 1, 4],
  /* coroa bordada */
  ["gold", x + 2, 18, 6, 3],
  ["gold", x + 2, 16, 1, 2],
  ["gold", x + 4, 15, 2, 3],
  ["gold", x + 7, 16, 1, 2],
  ["gold-light", x + 4, 19, 2, 1],
  ["gold", x + 1, 36, 8, 1],
];

const moldura: Bloco[] = [
  /* arco em degraus */
  ["stone-dark", 50, 4, 20, 3],
  ["stone-dark", 44, 7, 32, 3],
  ["stone-dark", 39, 10, 42, 3],
  ["stone-dark", 35, 13, 50, 3],
  ["stone", 51, 4, 18, 2],
  ["stone", 45, 7, 30, 2],
  ["stone", 40, 10, 40, 2],
  ["stone", 36, 13, 48, 2],
  /* ombreiras */
  ["stone-dark", 33, 16, 5, 58],
  ["stone-dark", 82, 16, 5, 58],
  ["stone", 34, 16, 3, 56],
  ["stone", 83, 16, 3, 56],
  ["stone-dark", 38, 16, 44, 2],
  /* pedra-chave com cravo de ouro */
  ["iron-dark", 57, 2, 6, 10],
  ["stone", 58, 3, 4, 8],
  ["gold", 59, 5, 2, 2],
  /* peitoril */
  ["stone-dark", 30, 72, 60, 5],
  ["stone", 30, 72, 60, 2],
  ["iron-dark", 30, 77, 60, 1],
];

const ceu: Bloco[] = [
  ["night", 38, 18, 44, 54],
  ["sky-deep", 38, 52, 44, 20],
  ["sky", 38, 64, 44, 8],
  ["star", 44, 22, 1, 1],
  ["star", 52, 30, 1, 1],
  ["star", 41, 40, 1, 1],
  ["star", 72, 21, 1, 1],
  ["star", 58, 24, 1, 1],
  /* lua crescente */
  ["sun", 47, 25, 2, 1],
  ["sun", 46, 26, 2, 4],
  ["sun", 47, 30, 2, 1],
  /* ameias de uma torre distante */
  ["stone-dark", 40, 60, 10, 12],
  ["stone-dark", 40, 58, 2, 2],
  ["stone-dark", 44, 58, 2, 2],
  ["stone-dark", 48, 58, 2, 2],
  ["window-lit", 44, 63, 2, 3],
];

const tapete: Bloco[] = [
  ["gold", 49, 80, 22, 30],
  ["blood", 50, 80, 20, 30],
  ["wood-shadow", 50, 80, 20, 1],
  ["gold", 52, 84, 1, 26],
  ["gold", 67, 84, 1, 26],
];

const trono: Bloco[] = [
  ["wood-shadow", 98, 60, 18, 46],
  ["wood-dark", 99, 61, 16, 44],
  ["gold", 99, 58, 2, 4],
  ["gold", 106, 56, 2, 6],
  ["gold", 113, 58, 2, 4],
  ["blood", 101, 64, 12, 22],
  ["gold", 101, 64, 12, 1],
  ["wood", 96, 86, 22, 6],
  ["wood-light", 96, 86, 22, 1],
  ["blood", 98, 84, 18, 3],
  ["wood-dark", 97, 92, 3, 14],
  ["wood-dark", 114, 92, 3, 14],
];

/** O fundo inteiro, parado: desenhado uma vez. */
export function Sala() {
  return (
    <svg
      className={styles.sala}
      width={ARTE_L}
      height={ARTE_A}
      viewBox="0 0 120 110"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x={0} y={0} width={120} height={80} style={{ fill: "var(--stone-dark)" }} />
      <Blocos lista={tijolos} />
      <Blocos lista={piso} />
      <Blocos lista={tapete} />
      <Blocos lista={estandarte(6)} />
      <Blocos lista={estandarte(104)} />
      <Blocos lista={ceu} />
      <Blocos lista={moldura} />
      <Blocos lista={trono} />
    </svg>
  );
}

/** Tocha do Nicolas (maca-no-trinco): suporte de ferro, cabo, chama em blocos. */
export function Tocha({ lado, viva }: { lado: "esq" | "dir"; viva: boolean }) {
  return (
    <span className={`${styles.tocha} ${lado === "esq" ? styles.tochaEsq : styles.tochaDir} ${viva ? styles.viva : ""}`}>
      <span className={styles.halo} />
      <span className={styles.chama}>
        <span className={styles.miolo} />
      </span>
      <span className={styles.cabo} />
      <span className={styles.suporte} />
    </span>
  );
}

/* ---------- O dragao (no vao, focinho para a esquerda) ---------- */

const pescoco: Bloco[] = [
  ["dragao", 30, 24, 14, 30],
  ["dragao-escuro", 40, 24, 4, 30],
  ["dragao-ventre", 30, 28, 4, 26],
  ["dragao-escuro", 30, 31, 4, 1],
  ["dragao-escuro", 30, 35, 4, 1],
  ["dragao-escuro", 30, 39, 4, 1],
  ["dragao-escuro", 30, 43, 4, 1],
  ["dragao-escuro", 30, 47, 4, 1],
  ["dragao-escuro", 30, 51, 4, 1],
  ["dragao-claro", 35, 30, 2, 2],
  ["dragao-claro", 37, 38, 2, 2],
  ["dragao-claro", 35, 46, 2, 2],
];

const cranio: Bloco[] = [
  /* chifres curvando para tras */
  ["chifre", 32, 7, 3, 6],
  ["chifre", 34, 4, 2, 4],
  ["chifre", 36, 2, 1, 3],
  ["chifre", 26, 8, 2, 5],
  ["chifre", 27, 6, 2, 2],
  /* cabeca */
  ["dragao", 20, 12, 18, 15],
  ["dragao-claro", 22, 12, 14, 1],
  ["dragao-escuro", 20, 25, 18, 2],
  ["chifre", 36, 18, 3, 3],
  ["chifre", 38, 16, 2, 2],
  /* focinho */
  ["dragao", 8, 16, 14, 6],
  ["dragao", 8, 15, 4, 1],
  ["dragao-claro", 10, 16, 10, 1],
  ["wood-shadow", 10, 17, 2, 1],
  ["wood-shadow", 14, 17, 2, 1],
  /* boca: o fundo vermelho aparece quando a mandibula desce */
  ["blood", 10, 22, 13, 4],
];

const sobrancelha: Bloco[] = [["dragao-escuro", 22, 13, 8, 2]];
const olhoAberto: Bloco[] = [
  ["gold-light", 24, 15, 5, 3],
  ["ink", 25, 15, 1, 3],
];
const olhoFinta: Bloco[] = [
  ["dragao-escuro", 22, 14, 8, 2],
  ["gold-light", 24, 16, 5, 1],
  ["ink", 25, 16, 1, 1],
];
const olhoCansado: Bloco[] = [
  ["dragao-escuro", 24, 15, 5, 2],
  ["gold-light", 24, 17, 5, 1],
  ["ink", 25, 17, 1, 1],
];

const dentes: Bloco[] = [
  ["ink", 8, 22, 15, 1],
  ["glass-shine", 10, 22, 1, 2],
  ["glass-shine", 13, 22, 1, 2],
  ["glass-shine", 16, 22, 1, 2],
  ["glass-shine", 19, 22, 1, 2],
];

export const mandibula: Bloco[] = [
  ["dragao-escuro", 10, 23, 14, 4],
  ["dragao-ventre", 12, 26, 12, 1],
  ["glass-shine", 12, 22, 1, 1],
  ["glass-shine", 17, 22, 1, 1],
];

const narinasAcesas: Bloco[] = [
  ["flame", 9, 16, 4, 3],
  ["flame", 13, 16, 4, 3],
  ["gold-light", 10, 17, 2, 1],
  ["gold-light", 14, 17, 2, 1],
];

export type Olho = "aberto" | "finta" | "cansado";

type CabecaProps = {
  olho: Olho;
  /** Pecas que o Jogo anima por conta propria (mandibula, brilho das narinas, fumaca). */
  ref?: Ref<SVGSVGElement>;
  mandibulaRef?: Ref<SVGGElement>;
  narinasRef?: Ref<SVGGElement>;
  fumaca?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** A cabeca inteira num SVG do tamanho do vao (o vao corta o que sobra a direita). */
export function Cabeca({ ref, olho, mandibulaRef, narinasRef, fumaca, className, style }: CabecaProps) {
  return (
    <svg
      ref={ref}
      className={className}
      style={style}
      width={VAO.l}
      height={VAO.a}
      viewBox="0 0 44 54"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Blocos lista={pescoco} />
      <Blocos lista={cranio} />
      <g ref={mandibulaRef}>
        <Blocos lista={mandibula} />
      </g>
      <Blocos lista={dentes} />
      <Blocos lista={sobrancelha} />
      <Blocos lista={olho === "aberto" ? olhoAberto : olho === "finta" ? olhoFinta : olhoCansado} />
      <g ref={narinasRef} className={styles.narinas}>
        <Blocos lista={narinasAcesas} />
      </g>
      {fumaca && (
        <g className={styles.fumaca}>
          <rect x={8} y={12} width={3} height={3} />
          <rect x={13} y={10} width={3} height={3} />
          <rect x={10} y={6} width={3} height={3} />
          <rect x={5} y={8} width={2} height={2} />
        </g>
      )}
    </svg>
  );
}

/* ---------- O fogo: cone de blocos saindo da boca, descendo para o jogador ---------- */

const CAMADAS = ["blood", "flame", "gold", "gold-light"] as const;

function cone(tremido: number): Bloco[] {
  const blocos: Bloco[] = [];
  CAMADAS.forEach((cor, camada) => {
    for (let i = 0; i < 30; i += 1) {
      const centro = 50 - Math.round(i * 0.9);
      const meia = Math.max(0, Math.round((1 + i * 0.55) * (1 - camada * 0.24)) + (i % 2 ? tremido : -tremido));
      if (meia > 0) blocos.push([cor, centro - meia, i * 2, meia * 2, 2]);
    }
  });
  return blocos;
}
const QUADRO_A = cone(0);
const QUADRO_B = cone(1);

/** Origem (boca) em px de tela, sem contar o recuo da cabeca. */
export const BOCA = { x: VAO.x + 9 * 4, y: VAO.y + 23 * 4 };

/** Desenho do fogo; a caixa e posicionada pelo CSS com a boca no canto de cima, a 50 unidades da esquerda. */
export function Fogo({ simples }: { simples: boolean }) {
  return (
    <svg className={styles.fogoArte} width={240} height={240} viewBox="0 0 60 60" shapeRendering="crispEdges" aria-hidden="true">
      <Blocos lista={QUADRO_A} className={simples ? undefined : styles.quadroA} />
      {!simples && <Blocos lista={QUADRO_B} className={styles.quadroB} />}
    </svg>
  );
}

/* ---------- A folha: madeira, caixilho em cruz, vidro (da para ver o dragao atras) ---------- */

const folhaFrente: Bloco[] = [
  ["glass", 4, 4, 17, 21],
  ["glass", 23, 4, 17, 21],
  ["glass", 4, 29, 17, 21],
  ["glass", 23, 29, 17, 21],
];
const brilhos: Bloco[] = [
  ["glass-shine", 6, 6, 3, 9],
  ["glass-light", 25, 6, 2, 6],
  ["glass-shine", 6, 31, 3, 9],
  ["glass-light", 25, 31, 2, 6],
];
const caixilho: Bloco[] = [
  /* moldura da folha */
  ["wood", 0, 0, 44, 3],
  ["wood", 0, 51, 44, 3],
  ["wood", 0, 0, 3, 54],
  ["wood", 41, 0, 3, 54],
  ["wood-light", 0, 0, 44, 1],
  ["wood-light", 0, 0, 1, 54],
  ["wood-dark", 0, 53, 44, 1],
  ["wood-dark", 43, 0, 1, 54],
  ["wood-dark", 21, 3, 2, 48],
  ["wood-dark", 3, 25, 38, 4],
  ["wood-mid", 21, 3, 1, 48],
  ["wood-mid", 3, 25, 38, 1],
  ["wood-shadow", 3, 3, 38, 1],
  ["wood-shadow", 3, 3, 1, 48],
  /* dobradicas */
  ["iron-dark", 0, 8, 7, 4],
  ["iron-light", 0, 8, 7, 1],
  ["iron-dark", 0, 42, 7, 4],
  ["iron-light", 0, 42, 7, 1],
  /* espelho do trinco */
  ["iron-dark", 37, 22, 5, 10],
  ["iron-light", 37, 22, 5, 1],
  ["gold", 38, 24, 2, 2],
];

export function FolhaArte() {
  return (
    <svg className={styles.folhaArte} width={VAO.l} height={VAO.a} viewBox="0 0 44 54" shapeRendering="crispEdges" aria-hidden="true">
      <g className={styles.vidro}>
        <Blocos lista={folhaFrente} />
        <Blocos lista={brilhos} />
      </g>
      <Blocos lista={caixilho} />
    </svg>
  );
}
