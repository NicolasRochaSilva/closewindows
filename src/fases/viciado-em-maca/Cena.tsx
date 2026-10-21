"use client";

import { memo, useEffect, useId, useState, type CSSProperties, type Ref } from "react";
import type { Pose } from "./motor";
import styles from "./Cena.module.css";

/*
 * A arte da fase 2: um pomar no fim da tarde, impresso em risografia. Quatro
 * tintas (vermelho, verde, mostarda, azul) sobre papel creme; o contorno azul e
 * uma passada a parte, fora de registro; sombra e luz sao meio-tom. Tudo SVG.
 *
 * Coordenadas em px do MIOLO (400x640): o que precisa caber em qualquer tela.
 * O cenario continua para os lados e para cima/baixo (overflow visivel) e
 * aparece conforme a tela tem sobra.
 */

export const ARTE_L = 400;
export const ARTE_A = 640;
/** Onde o viciado senta no galho. */
export const VICIADO = { x: 75, y: 203 };
/** Centro dos olhos dele (miolo), para as pupilas seguirem as coisas. */
export const OLHOS = { x: VICIADO.x, y: VICIADO.y - 101 };

export const COR = {
  papel: "#f4ead5",
  reboco: "#efdfbf",
  reboco2: "#e2c79a",
  maca: "#e2412f",
  macaEscura: "#a92a24",
  garrafa: "#23705a",
  garrafaEscura: "#16473a",
  mostarda: "#f3b23a",
  tinta: "#2b3a78",
  casca: "#5b3a4f",
  pele: "#f1c09c",
  polpa: "#f7e6b8",
};

/** A paleta vira variaveis CSS no topo da fase (o CSS do modulo usa as mesmas). */
export const varsDaPaleta = Object.fromEntries(
  Object.entries(COR).map(([nome, cor]) => [`--${nome}`, cor]),
) as CSSProperties;

/** Ids de SVG unicos por instancia: a previa e o jogo podem estar montados juntos. */
export function useUid() {
  return `vm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

let graoPronto: string | null = null;

/** Grao do papel: pontinhos de tinta ao acaso, gerados UMA vez num canvas (imagem barata de compor). */
export function Grao() {
  const [url, setUrl] = useState(graoPronto);
  useEffect(() => {
    if (!graoPronto) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 160;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      for (let i = 0; i < 2400; i += 1) {
        ctx.fillStyle = `rgba(43, 58, 120, ${(0.12 + Math.random() * 0.4).toFixed(2)})`;
        ctx.fillRect(Math.floor(Math.random() * 160), Math.floor(Math.random() * 160), 1, 1);
      }
      graoPronto = canvas.toDataURL();
    }
    setUrl(graoPronto);
  }, []);
  return <div className={styles.grao} style={url ? { backgroundImage: `url(${url})` } : undefined} />;
}

const circ = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const elip = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const ret = (x: number, y: number, l: number, a: number) => `M${x} ${y}h${l}v${a}h${-l}Z`;

/** Uma forma em duas passadas de tinta: a cor e, deslocado, o contorno azul. */
function R({ d, cor, opacidade }: { d: string; cor?: string; opacidade?: number }) {
  return (
    <>
      {cor && <path d={d} fill={cor} opacity={opacidade} />}
      <path d={d} className={styles.traco} />
    </>
  );
}

function Pontos({ id, cor, r = 1.5, passo = 5, angulo = 28 }: { id: string; cor: string; r?: number; passo?: number; angulo?: number }) {
  return (
    <pattern id={id} width={passo} height={passo} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angulo})`}>
      <circle cx={passo / 2} cy={passo / 2} r={r} fill={cor} />
    </pattern>
  );
}

/** Mascara de degrade sobre a caixa da forma (0 = some, 1 = inteiro). */
function Degrade({ id, x2 = 0, y2 = 1, de = 0, ate = 1 }: { id: string; x2?: number; y2?: number; de?: number; ate?: number }) {
  return (
    <>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2={x2} y2={y2}>
        <stop offset="0" stopColor="#fff" stopOpacity={de} />
        <stop offset="1" stopColor="#fff" stopOpacity={ate} />
      </linearGradient>
      <mask id={id} maskContentUnits="objectBoundingBox">
        <rect width="1" height="1" fill={`url(#${id}-g)`} />
      </mask>
    </>
  );
}

const MAX = 2400;
const MIN = -2000;

/* Grama: dentes de serra ao longo do chao inteiro. */
const GRAMA = (() => {
  let d = `M${MIN} 604`;
  for (let x = MIN; x < MAX; x += 12) d += `l6 ${x % 36 === 0 ? -11 : -7}l6 ${x % 36 === 0 ? 11 : 7}`;
  return `${d}V700H${MIN}Z`;
})();

/** Maca mordida, centrada em 0,0 (raio ~13). */
export function MacaDesenho() {
  return (
    <>
      <R d="M0 -8C6 -14 14 -10 13 -1C12 9 5 13 0 11C-5 13 -12 9 -13 -1C-14 -10 -6 -14 0 -8Z" cor={COR.maca} />
      <R d="M13.5 -6a5 5 0 0 0 0 9a4 4 0 0 1 -3 -4.5a4 4 0 0 1 3 -4.5Z" cor={COR.polpa} />
      <path d={elip(-6, -3, 2.4, 3.6)} fill={COR.papel} />
      <path d="M0 -8L1.5 -14" stroke={COR.tinta} strokeWidth="2" strokeLinecap="round" />
      <R d="M1.5 -12q6 -6 10 -1q-6 3 -10 1Z" cor={COR.garrafa} />
    </>
  );
}

/** Talo de maca comida, jogado na grama (a historia do personagem). */
function Talo({ x, y, giro = 0 }: { x: number; y: number; giro?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro})`}>
      <R d="M-6 -9h12q-3 4 -3 9q0 5 3 9h-12q3 -4 3 -9q0 -5 -3 -9Z" cor={COR.polpa} />
      <path d="M-6 -9h12v2.5h-12ZM-6 6.5h12v2.5h-12Z" fill={COR.maca} />
      <path d="M0 -9l1 -4" stroke={COR.tinta} strokeWidth="1.6" />
    </g>
  );
}

function Descascado({ x, y, uid }: { x: number; y: number; uid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0c10 -9 32 -8 40 1c7 10 -1 23 -14 25c-13 4 -31 0 -31 -12c0 -6 2 -10 5 -14Z" fill={COR.reboco2} />
      <g clipPath={`url(#${uid}-lasca)`} stroke={COR.macaEscura} strokeWidth="1.4" fill={COR.maca} fillOpacity=".3">
        <path d={`${ret(-6, -2, 18, 8)}${ret(14, -2, 18, 8)}${ret(34, -2, 18, 8)}${ret(3, 8, 18, 8)}${ret(23, 8, 18, 8)}${ret(-8, 18, 18, 8)}${ret(12, 18, 18, 8)}${ret(32, 18, 18, 8)}`} />
      </g>
      <path d="M0 0c10 -9 32 -8 40 1c7 10 -1 23 -14 25c-13 4 -31 0 -31 -12c0 -6 2 -10 5 -14Z" className={styles.traco} />
    </g>
  );
}

/** Ceu, parede, janela (moldura e quarto), chao. Estatico: desenha uma vez. */
export const Fundo = memo(function Fundo({ uid }: { uid: string }) {
  const url = (n: string) => `url(#${uid}-${n})`;
  const id = (n: string) => `${uid}-${n}`;
  const tijolos = Array.from({ length: 9 }, (_, i) => 84 + i * 25.8);

  return (
    <svg className={styles.camada} viewBox="-600 0 1600 640" aria-hidden="true">
      <defs>
        <Pontos id={id("pt")} cor={COR.tinta} />
        <Pontos id={id("pm")} cor={COR.maca} r={1.7} />
        <Pontos id={id("pg")} cor={COR.garrafa} r={1.9} />
        <Pontos id={id("py")} cor={COR.mostarda} r={1.9} />
        <Pontos id={id("pp")} cor={COR.papel} r={1.3} passo={4} />
        <Degrade id={id("desce")} />
        <Degrade id={id("sobe")} de={1} ate={0} />
        <Degrade id={id("direita")} x2={1} y2={0} de={0} ate={1} />
        <radialGradient id={id("brilho-g")}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={id("brilho")} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={url("brilho-g")} />
        </mask>
        <pattern id={id("telha")} width="22" height="13" patternUnits="userSpaceOnUse">
          <path d="M0 13a11 11 0 0 1 22 0" fill="none" stroke={COR.macaEscura} strokeWidth="2" />
          <circle cx="11" cy="8" r="1.3" fill={COR.mostarda} />
        </pattern>
        <clipPath id={id("lasca")}>
          <path d="M0 0c10 -9 32 -8 40 1c7 10 -1 23 -14 25c-13 4 -31 0 -31 -12c0 -6 2 -10 5 -14Z" />
        </clipPath>
      </defs>

      {/* Ceu do fim de tarde: papel cru, mostarda por cima, vermelho em meio-tom no horizonte. */}
      <rect x={MIN} y="-800" width={MAX - MIN} height="1000" fill={COR.papel} />
      <rect x={MIN} y="-800" width={MAX - MIN} height="1000" fill={COR.mostarda} mask={url("desce")} />
      <rect x={MIN} y="40" width={MAX - MIN} height="160" fill={url("pm")} mask={url("desce")} />
      <circle cx="318" cy="96" r="70" fill={url("pp")} />
      <R d={circ(318, 96, 42)} cor={COR.papel} />
      <path d="M262 112h120a4 4 0 0 1 0 8h-120a4 4 0 0 1 0 -8ZM300 128h96a4 4 0 0 1 0 7h-96a4 4 0 0 1 0 -7ZM520 70h140a4 4 0 0 1 0 8h-140a4 4 0 0 1 0 -8Z" fill={COR.papel} />
      <path d="M232 52q5 -6 10 0q5 -6 10 0M262 34q4 -5 8 0q4 -5 8 0M560 40q5 -6 10 0q5 -6 10 0" fill="none" stroke={COR.tinta} strokeWidth="2" strokeLinecap="round" />

      {/* Beiral de telha e calha. */}
      <rect x={MIN} y="182" width={MAX - MIN} height="28" fill={COR.maca} />
      <rect x={MIN} y="182" width={MAX - MIN} height="28" fill={url("telha")} />
      <rect x={MIN} y="207" width={MAX - MIN} height="7" fill={COR.tinta} />

      {/* Parede de reboco, a luz vindo da direita, a sombra do beiral e da arvore. */}
      <rect x={MIN} y="214" width={MAX - MIN} height="400" fill={COR.reboco} />
      <rect x={MIN} y="214" width={MAX - MIN} height="400" fill={COR.mostarda} opacity=".22" mask={url("direita")} />
      <rect x={MIN} y="214" width={MAX - MIN} height="30" fill={url("pt")} mask={url("sobe")} />
      <g fill={url("pg")} opacity=".6">
        <circle cx="-170" cy="300" r="90" />
        <circle cx="-50" cy="262" r="62" />
        <circle cx="-250" cy="400" r="72" />
        <circle cx="34" cy="320" r="34" />
        <circle cx="-90" cy="380" r="40" />
      </g>
      <Descascado x={-170} y={470} uid={uid} />
      <Descascado x={-480} y={300} uid={uid} />
      <Descascado x={330} y={566} uid={uid} />
      <Descascado x={800} y={420} uid={uid} />
      <path d="M326 548l-6 12l7 9l-5 14M-300 240l8 14l-4 10l9 16" fill="none" stroke={COR.tinta} strokeWidth="1.3" opacity=".7" />

      {/* Calha descendo. */}
      <R d={ret(452, 210, 12, 404)} cor={COR.tinta} opacidade={0.85} />
      <path d={`${ret(448, 300, 20, 6)}${ret(448, 470, 20, 6)}`} fill={COR.tinta} />

      {/* A janela: verga de tijolo, moldura verde descascada, o quarto escuro. */}
      {tijolos.map((x, i) => (
        <R key={x} d={ret(x, 250, 24.6, 20)} cor={i % 2 ? COR.maca : COR.macaEscura} />
      ))}
      <R d={ret(190, 244, 20, 28)} cor={COR.papel} />
      <R d={ret(95, 270, 210, 258)} cor={COR.garrafa} />
      <path d={`${circ(99, 281, 3)}${elip(301, 402, 2.5, 5)}${elip(100, 468, 2, 4)}${elip(206, 274, 5, 2)}`} fill={COR.papel} />
      <rect x="110" y="285" width="180" height="240" fill={COR.tinta} />
      <circle cx="236" cy="345" r="96" fill={url("py")} opacity=".8" />
      <circle cx="236" cy="345" r="58" fill={COR.mostarda} opacity=".4" />
      <path d="M236 285v37" stroke={COR.papel} strokeWidth="1.5" opacity=".7" />
      <R d="M224 322h24l7 14h-38Z" cor={COR.maca} />
      <circle cx="236" cy="339" r="4" fill={COR.papel} />
      <g transform="rotate(-3 148 380)">
        <rect x="126" y="352" width="44" height="58" fill={COR.papel} opacity=".9" />
        <path d={circ(148, 374, 9)} fill={COR.maca} />
        <circle cx="148" cy="374" r="15" fill="none" stroke={COR.tinta} strokeWidth="3" />
        <path d="M137 385l22 -22" stroke={COR.tinta} strokeWidth="3" />
        <text x="148" y="403" className={styles.placaNao}>
          NÃO!
        </text>
      </g>
      <rect x="110" y="472" width="180" height="53" fill={url("pp")} opacity=".25" />
      <path d={`${ret(104, 300, 6, 14)}${ret(104, 494, 6, 14)}${ret(290, 300, 6, 14)}${ret(290, 494, 6, 14)}`} fill={COR.tinta} />

      {/* Peitoril e o ferrolho do meio: e ali que a maca entala. */}
      <rect x="78" y="545" width="244" height="16" fill={url("pt")} mask={url("sobe")} />
      <R d="M80 525H320L324 545H76Z" cor={COR.papel} />
      <path d="M80 530H320" stroke={COR.reboco2} strokeWidth="2" />
      <R d={ret(192, 517, 16, 8)} cor={COR.tinta} />
      <rect x="197" y="519" width="6" height="3" fill={COR.papel} />

      {/* Plaquinha do numero da casa: fase 2. */}
      <R d="M371 290h18a3 3 0 0 1 3 3v26a3 3 0 0 1 -3 3h-18a3 3 0 0 1 -3 -3v-26a3 3 0 0 1 3 -3Z" cor={COR.garrafa} />
      <text x="380" y="313" className={styles.placa}>
        2
      </text>

      {/* A janela do vizinho, fechadinha (a direita, so em tela larga). */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <R key={i} d={ret(552 + i * 26, 260, 25.4, 20)} cor={i % 2 ? COR.macaEscura : COR.maca} />
      ))}
      <R d={ret(560, 280, 70, 240)} cor={COR.garrafa} />
      <R d={ret(630, 280, 70, 240)} cor={COR.garrafa} />
      <path
        d={Array.from({ length: 15 }, (_, i) => `M566 ${296 + i * 14}h58M636 ${296 + i * 14}h58`).join("")}
        stroke={COR.garrafaEscura}
        strokeWidth="3"
      />
      <path d={`${circ(574, 510, 7)}${circ(600, 506, 8)}${circ(660, 508, 7)}${circ(688, 504, 8)}`} fill={COR.garrafa} />
      <path d={`${circ(586, 502, 6)}${circ(646, 500, 6)}`} fill={COR.mostarda} />
      <path d={`${circ(616, 498, 7)}${circ(674, 498, 6)}`} fill={COR.maca} />
      <R d={ret(552, 518, 156, 26)} cor={COR.macaEscura} />

      {/* O estoque dele: um caixote de macas (a esquerda, so em tela larga). */}
      <R d={ret(-432, 550, 124, 62)} cor={COR.mostarda} />
      <path d="M-432 570h124M-432 592h124" stroke={COR.tinta} strokeWidth="1.6" />
      <text x="-370" y="588" className={styles.caixote}>
        MAÇÃS
      </text>
      {[-416, -392, -368, -344, -322, -404, -380, -356, -334].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i < 5 ? 540 : 522})`}>
          <R d={circ(0, 0, 11)} cor={COR.maca} />
          <path d={elip(-4, -3, 2, 3)} fill={COR.papel} />
        </g>
      ))}

      {/* Chao: grama verde, meio-tom de sol, talos que ele largou. */}
      <path d={GRAMA} fill={COR.garrafa} />
      <rect x={MIN} y="600" width={MAX - MIN} height="34" fill={url("py")} opacity=".55" />
      <rect x={MIN} y="640" width={MAX - MIN} height="500" fill={COR.garrafaEscura} />
      <Talo x={58} y={618} giro={-70} />
      <Talo x={-92} y={624} giro={20} />
      <Talo x={252} y={628} giro={80} />
      <Talo x={150} y={634} giro={-15} />
      <Talo x={-262} y={618} giro={60} />
      <Talo x={760} y={622} giro={-40} />
      {[
        [334, 621],
        [-142, 626],
        [-472, 618],
      ].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <R d={circ(0, 0, 9)} cor={COR.maca} />
        </g>
      ))}
    </svg>
  );
});

const COPA: [number, number, number][] = [
  [-260, 60, 120],
  [-120, 0, 130],
  [20, -30, 110],
  [130, -40, 70],
  [120, 40, 80],
  [170, 110, 46],
  [60, 120, 64],
  [-60, 110, 90],
  [-200, 150, 80],
  [-330, 170, 70],
];
const MACAS_NO_PE: [number, number][] = [
  [-120, 60],
  [-40, 100],
  [20, 30],
  [100, 40],
  [150, 90],
  [-200, 130],
  [-80, 170],
  [180, 130],
  [-290, 90],
  [-20, -10],
];

/** A macieira: tronco, o galho dele e a copa (que balanca, se der). */
export const Copa = memo(function Copa({ uid, vento }: { uid: string; vento: boolean }) {
  const url = (n: string) => `url(#${uid}-${n})`;
  return (
    <>
      <svg className={styles.camada} viewBox="-600 0 1600 640" aria-hidden="true">
        <R d="M-34 660C-26 560 -24 380 -16 232C-12 200 4 190 24 196C20 262 22 420 28 560C30 610 36 640 44 660Z" cor={COR.casca} />
        <path d="M-34 660C-26 560 -24 380 -16 232L2 226C0 380 -2 560 0 660Z" fill={url("pt")} opacity=".8" />
        <R d="M-50 640q20 -20 24 -40l10 8q-8 20 -34 32ZM34 640q-10 -16 -12 -36l10 -4q4 24 16 40Z" cor={COR.casca} />
      </svg>

      {/* A copa e uma camada propria, do tamanho dela: balancar e so compor, sem repintar. */}
      <svg className={`${styles.camadaCopa} ${vento ? styles.copa : ""}`} viewBox="-460 -180 700 420" aria-hidden="true">
        <g className={styles.copaTraco}>
          {COPA.map(([x, y, r]) => (
            <path key={`${x},${y}`} d={circ(x, y, r)} />
          ))}
        </g>
        {COPA.map(([x, y, r]) => (
          <path key={`${x},${y}`} d={circ(x, y, r)} fill={COR.garrafa} />
        ))}
        <path d={`${circ(-80, 150, 70)}${circ(40, 160, 40)}${circ(-220, 190, 60)}`} fill={COR.garrafaEscura} opacity=".85" />
        <path d={`${circ(40, -40, 84)}${circ(140, 20, 50)}${circ(-130, -60, 70)}`} fill={url("py")} />
        {MACAS_NO_PE.map(([x, y]) => (
          <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
            <R d={circ(0, 0, 9)} cor={COR.maca} />
            <path d={elip(-3, -3, 1.8, 2.6)} fill={COR.papel} />
          </g>
        ))}
      </svg>

      {/* O galho onde ele mora. */}
      <svg className={styles.camada} viewBox="-600 0 1600 640" aria-hidden="true">
        <R d="M6 194C60 186 120 186 184 191C188 193 188 198 184 199C124 200 70 206 10 226Z" cor={COR.casca} />
        <path d="M150 191C156 178 160 170 172 160" fill="none" stroke={COR.casca} strokeWidth="4" strokeLinecap="round" />
        <R d="M172 160q14 -10 22 2q-12 8 -22 -2ZM160 174q-14 -10 -20 2q12 6 20 -2Z" cor={COR.garrafa} />
      </svg>
    </>
  );
});

/* Braco do arremesso por pose: [ombro, cotovelo] em graus (0 = pendurado; horario). */
const BRACO: Record<Pose, [number, number]> = {
  mastigando: [10, 110],
  derrotado: [10, 110],
  mirando: [215, -15],
  arremessou: [290, 0],
  rindo: [20, -60],
  bravo: [10, 90],
  pegando: [200, 0],
};

function Boca({ pose }: { pose: Pose }) {
  switch (pose) {
    case "mastigando":
    case "derrotado":
      return (
        <g className={styles.mastiga}>
          <R d={elip(14, -83, 7, 6)} cor={COR.pele} />
          <path d="M-8 -81q4 2 8 0q4 -2 7 0" fill="none" stroke={COR.tinta} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case "mirando":
      return <path d="M-9 -82q10 5 19 -5" fill="none" stroke={COR.tinta} strokeWidth="2.4" strokeLinecap="round" />;
    case "rindo":
      return (
        <>
          <R d="M-12 -87Q0 -64 12 -87Z" cor={COR.tinta} />
          <path d="M-10 -86H10L9 -82.5H-9Z" fill={COR.papel} />
          <path d={elip(0, -74, 5, 3)} fill={COR.maca} />
        </>
      );
    case "bravo":
      return <path d="M-8 -78q8 -7 16 0" fill="none" stroke={COR.tinta} strokeWidth="2.4" strokeLinecap="round" />;
    default:
      return <R d={elip(1, -81, 4, 5)} cor={COR.tinta} />;
  }
}

/** O viciado, sentado no galho. `pose` troca braco, boca e sobrancelhas. */
export function Viciado({ uid, pose, pupilas, animado }: { uid: string; pose: Pose; pupilas?: Ref<SVGGElement>; animado: boolean }) {
  const comMaca = pose !== "arremessou" && pose !== "rindo" && pose !== "bravo";
  return (
    <svg className={styles.camadaViciado} viewBox="0 40 200 240" aria-hidden="true">
      <g transform={`translate(${VICIADO.x} ${VICIADO.y})`}>
        <g className={`${styles.corpo} ${animado ? styles.vivo : ""}`} data-pose={pose}>
          <g className={styles.perna}>
            <R d="M-16 -2H-5L-8 42H-18Z" cor={COR.tinta} />
            <R d={elip(-15, 46, 9, 5)} cor={COR.maca} />
          </g>
          <g className={`${styles.perna} ${styles.pernaB}`}>
            <R d="M5 -2H16L17 40H7Z" cor={COR.tinta} />
            <R d={elip(13, 44, 9, 5)} cor={COR.maca} />
          </g>

          {/* Braco de apoio, agarrado ao galho. */}
          <R d="M-20 -60L-12 -56L-22 -28L-31 -32Z" cor={COR.garrafa} />
          <R d="M-31 -32L-22 -28L-26 -6L-33 -6Z" cor={COR.pele} />
          <R d={circ(-29, -3, 5.5)} cor={COR.pele} />

          {/* Camiseta mostarda manchada de maca, camisa xadrez verde aberta. */}
          <R d="M-20 -62Q0 -66 20 -62L19 0Q0 4 -19 0Z" cor={COR.mostarda} />
          <path d="M-4 -36q7 -6 12 0q5 7 -3 9q-10 3 -9 -9Z" fill={COR.maca} opacity=".85" />
          <R d="M-22 -62L-10 -60L-12 2L-22 2Q-26 -30 -22 -62Z" cor={COR.garrafa} />
          <R d="M22 -62L10 -60L12 2L22 2Q26 -30 22 -62Z" cor={COR.garrafa} />
          <path d="M22 -62L10 -60L12 2L22 2Q26 -30 22 -62Z" fill={`url(#${uid}-pt)`} opacity=".45" />
          <R d={circ(16, -47, 4.5)} cor={COR.maca} />
          <R d={ret(11, -46, 10, 9)} cor={COR.garrafaEscura} />

          <R d={ret(-5, -72, 10, 12)} cor={COR.pele} />
          <R d={elip(-25, -94, 4, 6)} cor={COR.pele} />
          <R d={elip(25, -94, 4, 6)} cor={COR.pele} />
          <R d={elip(0, -96, 25, 28)} cor={COR.pele} />
          <R d="M-26 -100Q-31 -128 -10 -126L-6 -139L0 -126L8 -137L10 -124Q31 -126 26 -102Q18 -116 0 -114Q-16 -116 -26 -100Z" cor={COR.tinta} />

          {/* Olheiras de quem nao dorme, olhos arregalados com veia. */}
          <path d="M-17 -93q8 6 16 0M1 -93q8 6 16 0" fill="none" stroke={COR.tinta} strokeWidth="3" opacity=".35" />
          <R d={circ(-9, -101, 7.5)} cor={COR.papel} />
          <R d={circ(9, -101, 7.5)} cor={COR.papel} />
          <path d="M-16 -100l3 .5M-15.5 -97l3 -1M16 -100l-3 .5M15.5 -97l-3 -1" stroke={COR.maca} strokeWidth=".9" />
          <g ref={pupilas}>
            <path d={`${circ(-9, -101, 3.3)}${circ(9, -101, 3.3)}`} fill={COR.tinta} />
          </g>
          <path className={styles.palpebra} d="M-16.5 -101A7.5 7.5 0 0 1 -1.5 -101ZM1.5 -101A7.5 7.5 0 0 1 16.5 -101Z" fill={COR.pele} stroke={COR.tinta} strokeWidth="1.2" />
          <path className={`${styles.sobr} ${styles.sobrE}`} d="M-17 -113L-3 -111" />
          <path className={`${styles.sobr} ${styles.sobrD}`} d="M3 -111L17 -113" />
          <path d="M1 -96q5 4 -1 7" fill="none" stroke={COR.tinta} strokeWidth="1.6" strokeLinecap="round" />
          <Boca pose={pose} />

          {/* Braco do arremesso: ombro e cotovelo. */}
          <g transform="translate(20 -58)">
            <g className={styles.braco} style={{ transform: `rotate(${BRACO[pose][0]}deg)` }}>
              <R d="M-5 -2H5L5 21H-5Z" cor={COR.garrafa} />
              <g transform="translate(0 20)">
                <g className={styles.braco} style={{ transform: `rotate(${BRACO[pose][1]}deg)` }}>
                  <R d="M-4 0H4L3.5 14H-3.5Z" cor={COR.pele} />
                  {comMaca && (
                    <g transform="translate(0 25) scale(.75)">
                      <MacaDesenho />
                    </g>
                  )}
                  <R d={circ(0, 17, 5.5)} cor={COR.pele} />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Folha da janela, so a arte (quem gira e o botao em volta). A direita tem o trinco. */
export function FolhaArte({ lado, trava }: { lado: "esq" | "dir"; trava?: Ref<SVGGElement> }) {
  const vidros = [10, 84, 158];
  return (
    <svg className={styles.folhaArte} viewBox={lado === "esq" ? "0 0 90 240" : "-6 0 96 240"} aria-hidden="true">
      {lado === "dir" && <R d={ret(-6, 0, 8, 240)} cor={COR.garrafaEscura} />}
      <R d={ret(0, 0, 90, 240)} cor={COR.garrafa} />
      {vidros.map((y) => (
        <g key={y}>
          <rect x="10" y={y} width="70" height="68" fill={COR.tinta} opacity=".42" />
          <path d={`M10 ${y + 46}L50 ${y}H66L10 ${y + 62}Z`} fill={COR.mostarda} opacity=".55" />
          <path d={`M60 ${y + 68}L80 ${y + 44}V${y + 52}L67 ${y + 68}Z`} fill={COR.papel} opacity=".5" />
          <path d={ret(10, y, 70, 68)} className={styles.traco} />
        </g>
      ))}
      <path d={`${circ(5, 34, 2)}${elip(85, 140, 2, 4)}${elip(46, 4, 4, 1.6)}${circ(84, 232, 2.4)}`} fill={COR.papel} />
      {lado === "esq" ? (
        <>
          <path d={`${ret(-2, 26, 5, 16)}${ret(-2, 198, 5, 16)}`} fill={COR.tinta} />
          <R d={ret(84, 113, 6, 14)} cor={COR.tinta} />
        </>
      ) : (
        <>
          <path d={`${ret(87, 26, 5, 16)}${ret(87, 198, 5, 16)}`} fill={COR.tinta} />
          <R d={ret(0, 110, 10, 20)} cor={COR.tinta} />
          <g ref={trava} transform="rotate(-80 5 120)">
            <rect x="-16" y="118" width="22" height="4.5" rx="2" fill={COR.tinta} />
            <circle cx="-16" cy="120" r="3.4" fill={COR.tinta} />
            <circle cx="5" cy="120" r="1.6" fill={COR.papel} />
          </g>
        </>
      )}
    </svg>
  );
}
