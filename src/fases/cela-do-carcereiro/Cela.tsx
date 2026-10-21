"use client";

import { motion, type Transition } from "motion/react";
import { DURATION, hingeClose } from "@/lib/motion";
import { ALTURA, GANCHO, JANELA, LARGURA, MAPA, RALO, celula, type Dir, type Estado, type Pos } from "./nivel";
import styles from "./Cela.module.css";

/*
 * A cela em pixel art 16 bits, vista de cima em 3/4 (paredes mostram a face).
 * 1 unidade do SVG = 1 pixel da arte; ladrilho de 16. A parede do fundo sobe
 * 16 acima da grade para caber a janela gradeada.
 */
export const LADRILHO = 16;
const TOPO = 16;
export const ARTE_L = LARGURA * LADRILHO;
export const ARTE_A = ALTURA * LADRILHO + TOPO;

/** Fechamento, em etapas: a tranca voa ate a janela, a folha bate, o ferrolho corre. */
export type Fechamento = "aberta" | "voa" | "fecha" | "trava";

type Cor =
  | "iron-dark" | "iron" | "iron-light" | "stone" | "stone-dark" | "wood-shadow" | "wood-dark" | "wood"
  | "wood-mid" | "wood-light" | "gold" | "gold-light" | "flame" | "skin" | "ink" | "night" | "star" | "sky";

/** Um bloco de pixel: retangulo inteiro com cor da paleta. */
function R({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: Cor }) {
  return <rect x={x} y={y} width={w} height={h} style={{ fill: `var(--${c})` }} />;
}

const parede = (x: number, y: number) => "#JT".includes(celula(x, y));

function Chao({ x, y }: Pos) {
  const px = x * LADRILHO;
  const py = y * LADRILHO;
  const torto = (x + y) % 2 ? 4 : 0;
  return (
    <g>
      <R x={px} y={py} w={16} h={16} c="stone-dark" />
      <R x={px} y={py + 7} w={16} h={1} c="iron-dark" />
      <R x={px} y={py + 15} w={16} h={1} c="iron-dark" />
      <R x={px + 7 - torto} y={py} w={1} h={7} c="iron-dark" />
      <R x={px + 11 - torto} y={py + 8} w={1} h={7} c="iron-dark" />
      <R x={px + 1} y={py + 1} w={2} h={1} c="stone" />
      <R x={px + 9 - torto} y={py + 9} w={2} h={1} c="stone" />
      {/* sombra solida da parede de cima */}
      {parede(x, y - 1) && <R x={px} y={py} w={16} h={3} c="iron-dark" />}
    </g>
  );
}

function Ralo() {
  const px = RALO.x * LADRILHO;
  const py = RALO.y * LADRILHO;
  return (
    <g>
      <R x={px + 3} y={py + 4} w={10} h={9} c="iron-dark" />
      {[5, 8, 11].map((bx) => (
        <R key={bx} x={px + bx - 1} y={py + 5} w={1} h={7} c="iron" />
      ))}
      <R x={px + 3} y={py + 4} w={10} h={1} c="iron-light" />
    </g>
  );
}

/** Tijolos de uma face de parede (faixa de altura `h` a partir de `y`). */
function Tijolos({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const fiadas = [];
  for (let fy = 0; fy < h; fy += 4) {
    const desloca = (fy / 4) % 2 ? 4 : 0;
    fiadas.push(<R key={`h${fy}`} x={x} y={y + fy + 3} w={w} h={1} c="stone-dark" />);
    for (let fx = desloca; fx < w; fx += 8) fiadas.push(<R key={`v${fy}-${fx}`} x={x + fx} y={y + fy} w={1} h={3} c="stone-dark" />);
  }
  return (
    <g>
      <R x={x} y={y} w={w} h={h} c="stone" />
      {fiadas}
    </g>
  );
}

/* Parede longe de qualquer chao e rocha macica: nao se desenha (fica o escuro do fundo). */
const encostaNoChao = (x: number, y: number) =>
  [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => !parede(x + dx, y + dy) && celula(x + dx, y + dy) !== "#"));

function Parede({ x, y }: Pos) {
  if (!encostaNoChao(x, y)) return null;
  const px = x * LADRILHO;
  const py = y * LADRILHO;
  const face = !parede(x, y + 1);
  return (
    <g>
      <R x={px} y={py} w={16} h={16} c="iron" />
      <R x={px + 2} y={py + 3} w={3} h={1} c="iron-light" />
      <R x={px + 10} y={py + 6} w={2} h={1} c="iron-dark" />
      {!parede(x, y - 1) && <R x={px} y={py} w={16} h={1} c="iron-light" />}
      {face ? <Tijolos x={px} y={py + 8} w={16} h={8} /> : <R x={px} y={py + 15} w={16} h={1} c="iron-dark" />}
    </g>
  );
}

/** A parede do fundo, da borda de cima ate a fileira 0: e onde mora a janela. */
function Fundo() {
  return (
    <g>
      <R x={0} y={-TOPO} w={ARTE_L} h={TOPO + LADRILHO} c="iron-dark" />
      {[...MAPA[1]].map((ch, x) =>
        "#JT".includes(ch) ? null : <Tijolos key={x} x={x * LADRILHO} y={-TOPO + 4} w={LADRILHO} h={TOPO + LADRILHO - 4} />,
      )}
      <R x={0} y={-TOPO} w={ARTE_L} h={4} c="iron-dark" />
    </g>
  );
}

function Tocha({ x, chama }: { x: number; chama: boolean }) {
  const cx = x * LADRILHO + 8;
  return (
    <g>
      <R x={cx - 2} y={-1} w={4} h={2} c="iron-dark" />
      <R x={cx - 1} y={-4} w={2} h={6} c="wood-dark" />
      <g className={chama ? styles.chama : undefined}>
        <R x={cx - 2} y={-9} w={4} h={5} c="flame" />
        <R x={cx - 1} y={-11} w={2} h={3} c="flame" />
        <R x={cx - 1} y={-8} w={2} h={3} c="gold-light" />
      </g>
    </g>
  );
}

/* Coordenadas da janela (em pixels da arte). A folha fechada cobre o vao. */
const VAO_X = JANELA.x * LADRILHO + 3;
const VAO_Y = -10;
const VAO_L = 10;
const VAO_A = 20;

function VaoDaJanela() {
  return (
    <g>
      {/* moldura de pedra em degraus, arco sem curva */}
      <R x={VAO_X - 2} y={VAO_Y - 1} w={VAO_L + 4} h={VAO_A + 2} c="stone-dark" />
      <R x={VAO_X} y={VAO_Y - 3} w={VAO_L} h={2} c="stone-dark" />
      <R x={VAO_X + 2} y={VAO_Y - 4} w={VAO_L - 4} h={1} c="stone-dark" />
      <R x={VAO_X + 1} y={VAO_Y - 2} w={VAO_L - 2} h={2} c="night" />
      <R x={VAO_X} y={VAO_Y} w={VAO_L} h={VAO_A} c="night" />
      <R x={VAO_X} y={VAO_Y + 12} w={VAO_L} h={8} c="sky" />
      <R x={VAO_X + 2} y={VAO_Y + 2} w={1} h={1} c="star" />
      <R x={VAO_X + 7} y={VAO_Y + 5} w={1} h={1} c="star" />
      <R x={VAO_X + 6} y={VAO_Y + 1} w={2} h={2} c="gold-light" />
      {/* grade de ferro */}
      {[2, 5, 8].map((bx) => (
        <R key={bx} x={VAO_X + bx} y={VAO_Y - 1} w={1} h={VAO_A + 1} c="iron-dark" />
      ))}
      <R x={VAO_X} y={VAO_Y + 8} w={VAO_L} h={1} c="iron-dark" />
      {/* peitoril e a argola onde o ferrolho entra */}
      <R x={VAO_X - 3} y={VAO_Y + VAO_A} w={VAO_L + 6} h={2} c="stone" />
      <R x={VAO_X - 3} y={VAO_Y + VAO_A + 2} w={VAO_L + 6} h={1} c="iron-dark" />
      <R x={VAO_X + VAO_L + 1} y={VAO_Y + 8} w={3} h={5} c="iron-dark" />
      <R x={VAO_X + VAO_L + 2} y={VAO_Y + 9} w={1} h={3} c="iron-light" />
    </g>
  );
}

/** A folha de madeira desenhada FECHADA; aberta e ela espelhada na dobradica (borda esquerda). */
function FolhaArte() {
  return (
    <g>
      <R x={VAO_X} y={VAO_Y} w={VAO_L} h={VAO_A} c="wood-shadow" />
      <R x={VAO_X + 1} y={VAO_Y + 1} w={VAO_L - 2} h={VAO_A - 2} c="wood" />
      {[3, 6].map((tx) => (
        <R key={tx} x={VAO_X + tx} y={VAO_Y + 1} w={1} h={VAO_A - 2} c="wood-dark" />
      ))}
      <R x={VAO_X + 1} y={VAO_Y + 1} w={VAO_L - 2} h={1} c="wood-light" />
      <R x={VAO_X} y={VAO_Y + 3} w={VAO_L} h={2} c="iron-dark" />
      <R x={VAO_X} y={VAO_Y + 15} w={VAO_L} h={2} c="iron-dark" />
      <R x={VAO_X} y={VAO_Y + 3} w={2} h={2} c="iron-light" />
      <R x={VAO_X} y={VAO_Y + 15} w={2} h={2} c="iron-light" />
    </g>
  );
}

/** O ferrolho (a tranca): barra de ferro com pegador dourado, deitado, 10x5. */
function Ferrolho({ x, y }: Pos) {
  return (
    <g>
      <R x={x} y={y + 1} w={10} h={3} c="iron-dark" />
      <R x={x + 1} y={y + 2} w={8} h={1} c="iron-light" />
      <R x={x + 6} y={y} w={2} h={5} c="gold" />
      <R x={x + 6} y={y} w={1} h={2} c="gold-light" />
    </g>
  );
}

function Gancho({ comTranca }: { comTranca: boolean }) {
  const px = GANCHO.x * LADRILHO;
  const py = GANCHO.y * LADRILHO;
  return (
    <g>
      <R x={px + 10} y={py + 2} w={5} h={12} c="wood-dark" />
      <R x={px + 10} y={py + 2} w={5} h={1} c="wood-mid" />
      <R x={px + 12} y={py + 4} w={1} h={3} c="iron-light" />
      <R x={px + 12} y={py + 6} w={3} h={1} c="iron-light" />
      {comTranca && (
        <g>
          <R x={px + 11} y={py + 6} w={3} h={8} c="iron-dark" />
          <R x={px + 12} y={py + 7} w={1} h={6} c="iron-light" />
          <R x={px + 10} y={py + 10} w={5} h={2} c="gold" />
        </g>
      )}
    </g>
  );
}

function Caixote() {
  return (
    <g>
      <R x={2} y={13} w={13} h={3} c="iron-dark" />
      <R x={1} y={1} w={14} h={14} c="wood-shadow" />
      <R x={2} y={2} w={12} h={12} c="wood" />
      <R x={2} y={2} w={12} h={1} c="wood-light" />
      <R x={2} y={2} w={2} h={12} c="wood-mid" />
      <R x={12} y={2} w={2} h={12} c="wood-mid" />
      <R x={4} y={6} w={8} h={1} c="wood-dark" />
      <R x={4} y={10} w={8} h={1} c="wood-dark" />
      {[[2, 3], [13, 3], [2, 12], [13, 12]].map(([nx, ny]) => (
        <R key={`${nx}-${ny}`} x={nx} y={ny} w={1} h={1} c="iron-light" />
      ))}
    </g>
  );
}

const OLHOS: Record<Dir, [number, number] | null> = { baixo: [6, 9], esq: [5, 7], dir: [8, 10], cima: null };

function Fechador({ olhar, comTranca }: { olhar: Dir; comTranca: boolean }) {
  const olhos = OLHOS[olhar];
  const bracoY = comTranca ? 3 : 8;
  return (
    <g>
      <R x={4} y={14} w={8} h={2} c="iron-dark" />
      <R x={5} y={12} w={2} h={3} c="wood-dark" />
      <R x={9} y={12} w={2} h={3} c="wood-dark" />
      <R x={4} y={7} w={8} h={6} c="iron-light" />
      <R x={4} y={9} w={8} h={1} c="iron-dark" />
      <R x={4} y={11} w={8} h={1} c="iron-dark" />
      <R x={3} y={bracoY} w={1} h={4} c="skin" />
      <R x={12} y={bracoY} w={1} h={4} c="skin" />
      <R x={5} y={2} w={6} h={5} c="skin" />
      <R x={5} y={1} w={6} h={olhos ? 2 : 5} c="wood-shadow" />
      {olhos && (
        <g>
          <R x={olhos[0]} y={4} w={1} h={1} c="ink" />
          <R x={olhos[1]} y={4} w={1} h={1} c="ink" />
        </g>
      )}
      {comTranca && <Ferrolho x={3} y={-2} />}
    </g>
  );
}

type Props = {
  estado: Estado;
  /** Undefined na Previa: folha parada (ou balancando por CSS), sem motion. */
  fechamento?: Fechamento;
  /** Chama da tocha piscando (parada com movimento reduzido ou qualidade baixa). */
  vivo: boolean;
  /** Duracao de cada passo (0 com movimento reduzido). */
  passo: number;
  /** Folha balancando ao vento (so Previa). */
  balanca?: boolean;
};

const em = (p: Pos) => ({ x: p.x * LADRILHO, y: p.y * LADRILHO });

/* Onde o ferrolho para: deitado na folha fechada, ponta dentro da argola. */
const FERROLHO_FIM = { x: VAO_X + 4, y: VAO_Y + 8 };
const FERROLHO_SOLTO = { x: FERROLHO_FIM.x - 4, y: FERROLHO_FIM.y };

export function Cela({ estado, fechamento, vivo, passo, balanca }: Props) {
  const anda: Transition = { duration: passo, ease: "linear" };
  const fechada = fechamento === "fecha" || fechamento === "trava";
  const pe = em(estado.jogador);

  const chao: Pos[] = [];
  const paredes: Pos[] = [];
  MAPA.forEach((linha, y) =>
    [...linha].forEach((ch, x) => {
      if (y === 0) return;
      (parede(x, y) ? paredes : chao).push({ x, y });
    }),
  );

  return (
    <svg
      className={styles.svg}
      viewBox={`0 ${-TOPO} ${ARTE_L} ${ARTE_A}`}
      width={ARTE_L}
      height={ARTE_A}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <Fundo />
      {chao.map((p) => <Chao key={`${p.x}-${p.y}`} {...p} />)}
      {paredes.map((p) => <Parede key={`${p.x}-${p.y}`} {...p} />)}
      <Ralo />
      <Tocha x={2} chama={vivo} />
      <Tocha x={6} chama={vivo} />
      <VaoDaJanela />

      {fechamento === undefined ? (
        <g className={`${styles.folha} ${balanca ? styles.balanca : ""}`}>
          <FolhaArte />
        </g>
      ) : (
        <motion.g
          className={styles.folha}
          style={{ originX: 0, originY: 0.5 }}
          initial={false}
          animate={{ scaleX: fechada ? 1 : -1 }}
          transition={passo ? hingeClose : { duration: 0 }}
        >
          <FolhaArte />
        </motion.g>
      )}

      {fechamento === "trava" && (
        <motion.g initial={{ x: FERROLHO_SOLTO.x, y: FERROLHO_SOLTO.y }} animate={{ x: FERROLHO_FIM.x, y: FERROLHO_FIM.y }} transition={{ duration: passo ? DURATION.quick : 0, ease: "easeIn" }}>
          <Ferrolho x={0} y={0} />
        </motion.g>
      )}

      <Gancho comTranca={!estado.tranca} />

      {estado.caixotes.map((c, i) => (
        <motion.g key={i} initial={false} animate={em(c)} transition={anda}>
          <Caixote />
        </motion.g>
      ))}

      <motion.g initial={false} animate={pe} transition={anda}>
        <Fechador olhar={estado.olhar} comTranca={estado.tranca && (fechamento === undefined || fechamento === "aberta")} />
      </motion.g>

      {fechamento === "voa" && (
        <motion.g initial={{ x: pe.x + 3, y: pe.y - 2 }} animate={FERROLHO_SOLTO} transition={{ duration: passo ? DURATION.base : 0, ease: "easeOut" }}>
          <Ferrolho x={0} y={0} />
        </motion.g>
      )}
    </svg>
  );
}
