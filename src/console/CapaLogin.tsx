"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import styles from "./console.module.css";

/*
 * A capa do login: um cartaz lambe-lambe colado no muro. Ele, de costas, com o
 * notebook aberto na mao, encara o castelo onde moram todas as janelas que ele jura
 * ter deixado abertas. Camadas SVG com parallax no ponteiro; quando a folha do
 * login bate, a janela mais alta do castelo fecha e ele respira aliviado.
 */

/** Pseudoaleatorio com semente: o cartaz e sempre o mesmo, no servidor e no cliente. */
function sorteio(semente: number) {
  let s = semente;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Borda de papel rasgado: poligono serrilhado em %, dentro de `fundo`% de cada lado. */
function rasgo(semente: number, fundo: number) {
  const r = sorteio(semente);
  const pontos: string[] = [];
  const passos = 16;
  for (let i = 0; i < passos; i++) pontos.push(`${(i / passos) * 100}% ${r() * fundo}%`);
  for (let i = 0; i < passos; i++) pontos.push(`${100 - r() * fundo}% ${(i / passos) * 100}%`);
  for (let i = passos; i > 0; i--) pontos.push(`${(i / passos) * 100}% ${100 - r() * fundo}%`);
  for (let i = passos; i > 0; i--) pontos.push(`${r() * fundo}% ${(i / passos) * 100}%`);
  return `polygon(${pontos.join(",")})`;
}

const BORDA_PAPEL = rasgo(11, 1.6);
const BORDA_ARTE = rasgo(23, 1.1);

const ESTRELAS = (() => {
  const r = sorteio(5);
  return Array.from({ length: 48 }, () => ({ x: r() * 100, y: r() * 58, raio: 0.12 + r() * 0.32, pisca: r() > 0.7 }));
})();

/** Torre com ameias no topo, ate o chao do desenho. */
function ameiada(x0: number, x1: number, topo: number, base = 460) {
  const p = [`M${x0} ${base}V${topo - 9}`];
  let x = x0;
  while (x < x1) {
    x = Math.min(x + 11, x1);
    p.push(`H${x}`);
    if (x >= x1) break;
    x = Math.min(x + 8, x1);
    p.push(`V${topo}H${x}V${topo - 9}`);
  }
  p.push(`V${base}Z`);
  return p.join("");
}

const cone = (x0: number, x1: number, y: number, ponta: number) => `M${x0} ${y}L${(x0 + x1) / 2} ${ponta}L${x1} ${y}Z`;

/** Janela de topo em arco. */
const arco = (x: number, y: number, l: number, a: number) =>
  `M${x} ${y + a}V${y + l / 2}A${l / 2} ${l / 2} 0 0 1 ${x + l} ${y + l / 2}V${y + a}Z`;

type Vao = { x: number; y: number; l: number; a: number; folhas?: boolean; pisca?: boolean };

const VAOS: Vao[] = [
  /* corpo central */
  { x: 162, y: 148, l: 10, a: 18 },
  { x: 184, y: 148, l: 10, a: 18 },
  { x: 218, y: 148, l: 10, a: 18, folhas: true },
  { x: 240, y: 148, l: 10, a: 18, pisca: true },
  { x: 162, y: 192, l: 10, a: 18 },
  { x: 184, y: 192, l: 10, a: 18 },
  { x: 218, y: 192, l: 10, a: 18 },
  { x: 162, y: 236, l: 10, a: 18, folhas: true },
  { x: 218, y: 236, l: 10, a: 18 },
  { x: 240, y: 236, l: 10, a: 18 },
  { x: 184, y: 280, l: 10, a: 18, pisca: true },
  { x: 218, y: 280, l: 10, a: 18 },
  { x: 240, y: 280, l: 10, a: 18 },
  /* torre da esquerda */
  { x: 70, y: 206, l: 9, a: 15 },
  { x: 92, y: 206, l: 9, a: 15, folhas: true },
  { x: 80, y: 246, l: 9, a: 15 },
  { x: 70, y: 290, l: 9, a: 15, pisca: true },
  { x: 92, y: 290, l: 9, a: 15 },
  { x: 80, y: 334, l: 9, a: 15 },
  /* torre da direita */
  { x: 306, y: 226, l: 9, a: 15 },
  { x: 328, y: 226, l: 9, a: 15, pisca: true },
  { x: 316, y: 268, l: 9, a: 15, folhas: true },
  { x: 306, y: 312, l: 9, a: 15 },
  { x: 328, y: 312, l: 9, a: 15 },
  /* muralha */
  { x: 36, y: 362, l: 8, a: 13 },
  { x: 124, y: 360, l: 8, a: 13, pisca: true },
  { x: 268, y: 360, l: 8, a: 13 },
  { x: 358, y: 362, l: 8, a: 13 },
];

/* Torres do fundo, mais apagadas pela distancia. */
const VAOS_LONGE: Vao[] = [
  { x: 135, y: 96, l: 7, a: 11 },
  { x: 135, y: 140, l: 7, a: 11 },
  { x: 271, y: 118, l: 7, a: 11 },
  { x: 271, y: 162, l: 7, a: 11 },
];

/** A janela mais alta: a fase 0. E ela que fecha quando o login entra. */
const ZERO: Vao = { x: 199, y: 76, l: 14, a: 26 };

/** Folhas abertas para fora; o CSS faz balancar e, na janela zero, bater. */
function Folhas({ v }: { v: Vao }) {
  const aba = v.l * 0.58;
  return (
    <>
      <polygon
        className={styles.folhaEsq}
        points={`${v.x},${v.y + 1} ${v.x - aba},${v.y - 2} ${v.x - aba},${v.y + v.a + 2} ${v.x},${v.y + v.a}`}
      />
      <polygon
        className={styles.folhaDir}
        points={`${v.x + v.l},${v.y + 1} ${v.x + v.l + aba},${v.y - 2} ${v.x + v.l + aba},${v.y + v.a + 2} ${v.x + v.l},${v.y + v.a}`}
      />
    </>
  );
}

const profundidade = (p: number) => ({ "--p": p }) as CSSProperties;

function Castelo() {
  return (
    <svg className={`${styles.camada} ${styles.castelo}`} style={profundidade(7)} viewBox="0 0 400 460" aria-hidden>
      <defs>
        <radialGradient id="capa-halo" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stopColor="#ffc66b" stopOpacity="0.3" />
          <stop offset="0.6" stopColor="#f08a3c" stopOpacity="0.08" />
          <stop offset="1" stopColor="#f08a3c" stopOpacity="0" />
        </radialGradient>
        <filter id="capa-brilho" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="205" cy="230" rx="230" ry="230" fill="url(#capa-halo)" />

      {/* Torres do fundo: azuladas pela lua */}
      <g fill="#1b2038">
        <path d={ameiada(128, 150, 70)} />
        <path d={cone(123, 155, 64, 26)} />
        <path d={ameiada(262, 286, 92)} />
        <path d={cone(257, 291, 86, 48)} />
      </g>
      <g fill="#c98a4a" opacity="0.7">
        {VAOS_LONGE.map((v, i) => (
          <path key={i} d={arco(v.x, v.y, v.l, v.a)} />
        ))}
      </g>

      {/* Massa do castelo */}
      <g fill="#0f1222">
        <path d={ameiada(150, 262, 128)} />
        <path d={ameiada(186, 226, 64, 130)} />
        <path d={cone(178, 234, 58, 0)} />
        <path d={ameiada(58, 112, 186)} />
        <path d={cone(50, 120, 180, 110)} />
        <path d={ameiada(296, 346, 206)} />
        <path d={cone(288, 354, 200, 138)} />
        <path d={ameiada(20, 380, 342)} />
      </g>
      {/* Luar no lado direito de cada torre */}
      <g fill="#262c4a">
        <rect x="257" y="128" width="5" height="332" />
        <rect x="221" y="64" width="5" height="66" />
        <rect x="107" y="186" width="5" height="274" />
        <rect x="341" y="206" width="5" height="254" />
        <path d={`M206 0L234 58H228Z`} />
        <path d={`M85 110L120 180H113Z`} />
        <path d={`M321 138L354 200H347Z`} />
      </g>
      {/* Bandeirinha na ponta */}
      <path className={styles.bandeira} d="M206 0V-18L224 -12L206 -6" fill="none" stroke="#b23a2e" strokeWidth="3" />

      <g filter="url(#capa-brilho)">
        {VAOS.map((v, i) => (
          <path
            key={i}
            className={v.pisca ? styles.pisca : undefined}
            style={v.pisca ? { animationDelay: `${(i % 5) * 1.3}s` } : undefined}
            d={arco(v.x, v.y, v.l, v.a)}
            fill={i % 4 === 1 ? "#f08a3c" : "#ffc66b"}
          />
        ))}
        <path className={styles.janelaZero} d={arco(ZERO.x, ZERO.y, ZERO.l, ZERO.a)} />
        <path d={arco(188, 396, 36, 64)} fill="#f08a3c" />
      </g>
      <g fill="#8a5a2b">
        {VAOS.filter((v) => v.folhas).map((v, i) => (
          <g key={i} className={styles.bate} style={{ animationDelay: `${i * 0.9}s` }}>
            <Folhas v={v} />
          </g>
        ))}
        <g className={styles.folhasZero}>
          <Folhas v={ZERO} />
        </g>
      </g>
    </svg>
  );
}

/* Paleta do heroi: noite fria, contraluz quente do castelo (filtro) e luz fria da tela. */
const PELE = "#d9a07e";
const PELE_SOMBRA = "#a8745a";
const CABELO = "#1c120b";
const MOLETOM = "#2a5d58";
const MOLETOM_SOMBRA = "#1b403d";
const CALCA = "#232c40";
const CALCA_SOMBRA = "#181f2f";
const TENIS = "#16161c";
const CACHECOL = "#b23a2e";
const CACHECOL_SOMBRA = "#7e2a22";
const TELA = "#8ecae6";

/** De costas, encarando o castelo. O notebook aberto na mao, tela acesa, como uma espada. */
function Heroi() {
  return (
    <svg className={`${styles.camada} ${styles.heroi}`} style={profundidade(16)} viewBox="0 0 260 420" aria-hidden>
      <defs>
        {/* Contraluz: o que sobra da silhueta deslocada vira um filete quente na borda direita. */}
        <filter id="capa-contraluz" x="-10%" y="-10%" width="120%" height="120%">
          <feOffset in="SourceAlpha" dx="-3.2" dy="1.6" result="desloc" />
          <feComposite in="SourceAlpha" in2="desloc" operator="out" result="borda" />
          <feGaussianBlur in="borda" stdDeviation="0.5" result="bordaMacia" />
          <feFlood floodColor="#ffc66b" floodOpacity="0.95" />
          <feComposite in2="bordaMacia" operator="in" result="luz" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="luz" />
          </feMerge>
        </filter>
        <radialGradient id="capa-tela-halo">
          <stop offset="0" stopColor={TELA} stopOpacity="0.5" />
          <stop offset="1" stopColor={TELA} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="134" cy="404" rx="62" ry="8" fill="#05060a" opacity="0.6" />
      <ellipse className={styles.telaChao} cx="214" cy="402" rx="44" ry="7" fill={TELA} />

      <g className={styles.respira}>
        <g filter="url(#capa-contraluz)">
          {/* Pernas abertas, base firme */}
          <path d="M104 262L132 262L126 330L118 394L96 394L104 320Z" fill={CALCA_SOMBRA} />
          <path d="M132 262L160 262L166 330L174 394L150 394L142 326Z" fill={CALCA} />
          <path d="M92 388H122C124 388 126 392 126 396V402H90V394C90 390 90 388 92 388Z" fill={TENIS} />
          <path d="M148 388H176C178 388 180 392 180 396V402H146V394C146 390 146 388 148 388Z" fill={TENIS} />

          <g className={styles.alivia}>
            {/* Braco esquerdo: punho fechado */}
            <path d="M94 134C80 150 78 190 84 228L98 228C96 196 98 164 106 142Z" fill={MOLETOM_SOMBRA} />
            <circle cx="91" cy="236" r="10" fill={PELE_SOMBRA} />

            {/* Costas do moletom, capuz caido sobre os ombros */}
            <path
              d="M92 132C96 116 112 110 130 110C148 110 164 116 168 132C174 170 172 220 166 266L98 266C90 220 86 170 92 132Z"
              fill={MOLETOM}
            />
            <path d="M92 132C86 170 90 220 98 266L112 266C104 220 102 170 106 128Z" fill={MOLETOM_SOMBRA} />
            <path d="M98 254H166V266H98Z" fill={MOLETOM_SOMBRA} />
            <path d="M106 118C108 104 120 98 130 98C140 98 152 104 154 118C152 136 140 144 130 144C120 144 108 136 106 118Z" fill={MOLETOM_SOMBRA} />
            <path d="M114 120C118 132 142 132 146 120" stroke="#132e2c" strokeWidth="2.4" fill="none" />

            {/* Braco direito descendo ate o notebook */}
            <path d="M158 130C178 140 202 186 236 232L226 244C196 206 172 172 152 150Z" fill={MOLETOM} />

            {/* Cabeca de costas, virada de leve para o castelo */}
            <g className={styles.cabeca}>
              <path d="M120 90H140V112H120Z" fill={PELE_SOMBRA} />
              <ellipse cx="163" cy="70" rx="5" ry="9" fill={PELE} />
              <path d="M98 70C96 40 112 26 132 26C154 26 166 42 164 66C164 84 154 98 132 100C112 100 100 88 98 70Z" fill={CABELO} />
              <path d="M102 44C90 38 78 40 70 48C82 46 92 50 99 56ZM114 32C104 24 92 24 82 30C94 30 102 34 106 40ZM134 27C128 19 116 17 106 20C116 22 122 26 124 31Z" fill={CABELO} />
            </g>

            {/* Cachecol: volta no pescoco e ponta voando para tras */}
            <path d="M110 98C122 106 142 106 152 98L154 110C142 118 120 118 108 110Z" fill={CACHECOL} />
            <g className={styles.cachecol}>
              <path d="M112 104C92 104 72 96 50 100C60 108 56 120 46 126C70 124 94 118 114 114Z" fill={CACHECOL_SOMBRA} />
              <path d="M66 102L62 120M78 104L76 118" stroke="#ebe6da" strokeWidth="2" opacity="0.45" />
            </g>
          </g>
        </g>

        {/* Notebook aberto, tela virada para nos: a espada de luz dele */}
        <g className={styles.alivia}>
          <ellipse cx="208" cy="222" rx="58" ry="46" fill="url(#capa-tela-halo)" />
          <path d="M166 330L174 394" stroke={TELA} strokeWidth="2" opacity="0.55" />
          <g transform="rotate(-5 208 226)">
            <path d="M176 236H238L246 254H168Z" fill="#2b3346" />
            <path d="M180 240H234M178 245H238M176 250H240" stroke="#11151f" strokeWidth="1.6" strokeDasharray="4 2" />
            <rect x="178" y="192" width="60" height="44" rx="3.5" fill="#1d2433" />
            <rect className={styles.tela} x="182" y="196" width="52" height="36" rx="1.5" />
            <g className={styles.telaJanela} fill="none" stroke="#1d4f91" strokeWidth="2">
              <rect x="189" y="202" width="16" height="13" rx="1" />
              <path d="M197 202V215M189 208.5H205" />
            </g>
            <path className={styles.telaJanela} d="M211 205H227M211 210H223M211 215H226M189 222H219" stroke="#1d4f91" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path className={styles.telaOk} d="M198 214L205 221L220 205" fill="none" stroke="#1d4f91" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <ellipse cx="236" cy="244" rx="9" ry="8" fill={PELE} />
          <path d="M232 238C238 236 244 240 244 246" stroke={TELA} strokeWidth="1.6" fill="none" opacity="0.8" />
        </g>
      </g>

      {/* Ufa: o bafo de alivio na noite fria */}
      <g className={styles.sopro} fill="#ebe6da">
        <ellipse cx="176" cy="74" rx="7" ry="5" />
        <ellipse cx="188" cy="66" rx="9" ry="6" />
        <ellipse cx="202" cy="58" rx="7" ry="5" />
      </g>
    </svg>
  );
}

type Props = { fechou: boolean; reduzirMovimento: boolean };

export default function CapaLogin({ fechou, reduzirMovimento }: Props) {
  const cartaz = useRef<HTMLDivElement>(null);

  /* Parallax: o ponteiro vira --mx/--my no cartaz; cada camada anda conforme sua profundidade. */
  useEffect(() => {
    const el = cartaz.current;
    if (reduzirMovimento || !el) return;
    let quadro = 0;
    const mexeu = (e: PointerEvent) => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => {
        el.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", mexeu);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("pointermove", mexeu);
    };
  }, [reduzirMovimento]);

  return (
    <div className={styles.capa}>
      <div className={styles.colado}>
      <div ref={cartaz} className={styles.cartaz} data-fechou={fechou} style={{ clipPath: BORDA_PAPEL }}>
        <div
          className={styles.arte}
          style={{ clipPath: BORDA_ARTE }}
          role="img"
          aria-label="De costas, um rapaz com o notebook aberto na mão, como uma espada, encara um castelo cheio de janelas acesas."
        >
          <div className={`${styles.camada} ${styles.ceu}`} style={profundidade(2)}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
              {ESTRELAS.map((e, i) => (
                <circle
                  key={i}
                  className={e.pisca ? styles.pisca : undefined}
                  style={e.pisca ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined}
                  cx={e.x}
                  cy={e.y}
                  r={e.raio}
                  fill="#e8f6fd"
                />
              ))}
            </svg>
          </div>
          <svg className={`${styles.camada} ${styles.lua}`} style={profundidade(3)} viewBox="0 0 100 100" aria-hidden>
            <defs>
              <radialGradient id="capa-luar">
                <stop offset="0.35" stopColor="#f3ecd2" stopOpacity="0.32" />
                <stop offset="1" stopColor="#f3ecd2" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="50" fill="url(#capa-luar)" />
            <circle cx="50" cy="50" r="21" fill="#f3ecd2" />
            <g fill="#d9cfae" opacity="0.75">
              <circle cx="43" cy="44" r="4.5" />
              <circle cx="57" cy="56" r="3" />
              <circle cx="47" cy="59" r="2" />
            </g>
          </svg>
          <svg
            className={`${styles.camada} ${styles.morroLonge}`}
            style={profundidade(4)}
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0 70Q70 30 150 52Q230 20 300 44Q360 58 400 34V160H0Z" fill="#1a2138" />
          </svg>
          <Castelo />
          <svg
            className={`${styles.camada} ${styles.morroPerto}`}
            style={profundidade(9)}
            viewBox="0 0 400 160"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path d="M0 64Q110 30 210 40Q300 50 400 24V160H0Z" fill="#121727" />
          </svg>
          <div className={`${styles.camada} ${styles.nevoa}`} style={profundidade(11)} />
          <svg
            className={`${styles.camada} ${styles.chao}`}
            style={profundidade(14)}
            viewBox="0 0 400 120"
            preserveAspectRatio="xMinYMax slice"
            aria-hidden
          >
            <path d="M0 34Q70 14 150 26Q200 34 236 66Q262 88 400 98V120H0Z" fill="#0d0f16" />
            <path d="M0 34Q70 14 150 26Q200 34 236 66" fill="none" stroke="#3a4150" strokeWidth="2" />
          </svg>
          <Heroi />
        </div>

        <h1 className={styles.cartazTitulo}>
          <span>Close</span> <span>Windows</span>
        </h1>
        <p className={styles.cartazLore}>
          Ele jura que deixou uma janela aberta.
          <strong> Hoje ele vai fechar todas.</strong>
        </p>
        <div className={styles.papel} aria-hidden />
      </div>
      <span className={`${styles.fita} ${styles.fitaEsq}`} aria-hidden />
      <span className={`${styles.fita} ${styles.fitaDir}`} aria-hidden />
      </div>
    </div>
  );
}
