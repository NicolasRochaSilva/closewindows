"use client";

import { useId, type ReactNode } from "react";
import {
  matrizSombra,
  peDoSol,
  razaoDoSol,
  sombra,
  type Lugar,
  type Mentira,
  type Praca as PracaT,
  type Sol,
} from "./regra";
import type { Vista } from "./useCena";
import styles from "./hidra.module.css";

/*
 * A praca metafisica: ceu verde de fim de tarde, chao ocre, arcada escura,
 * chamine ao longe e sombras compridas demais. Tudo num SVG so, em pixels da
 * caixa; quem anima (Jogo/Previa) so muda numeros e pede outro quadro.
 */

/** Paleta propria do mundo "Cabeca". */
export const PALETA = {
  ceuAlto: "#0a211d",
  ceuMeio: "#21493a",
  ceuBaixo: "#d9c877",
  sol: "#f8edb6",
  chaoLonge: "#9f5223",
  chaoPerto: "#e3a050",
  junta: "#5a2a12",
  sombra: "#211310",
  gesso: "#efe4c9",
  gessoSombra: "#c9b386",
  gessoBorda: "#8d7650",
  vidro: "#d8eedd",
  persiana: "#2c5a45",
  persianaDentro: "#457a5d",
  persianaLinha: "#173327",
  latao: "#d9a43b",
  fachada: "#b0512a",
  fachadaEscura: "#7a3418",
  arco: "#180c09",
  chamine: "#38241d",
  fumaca: "#efe2bb",
  racha: "#180c09",
  rachaLuz: "#fff6dc",
} as const;

export type JanelaNaPraca = { id: number; mentira: Mentira; vista: Vista };

type Props = {
  p: PracaT;
  sol: Sol;
  /** Lado do ceu onde o sol mora (-1 esquerda, 1 direita): a arcada fica do outro. */
  lado: -1 | 1;
  estatua: Lugar;
  janelas: JanelaNaPraca[];
  detalhe: boolean;
  children?: ReactNode;
};

/* ---------- Silhuetas locais (base em y = 0, altura para cima negativa) ---------- */

const MOLDURA = "M-50 0V-150H-56V-158H56V-150H50V0Z";
/* Corpo da moldura: o vao e vazado (evenodd). */
const MOLDURA_VAZADA = `${MOLDURA} M-40 -16V-140H40V-16Z`;
const VIDROS = "M-40 -16V-76H-3V-16Z M3 -16V-76H40V-16Z M-40 -82V-140H-3V-82Z M3 -82V-140H40V-82Z";
const ESTATUA =
  "M-30 0V-80H-34V-88H34V-80H30V0Z M-22 -88C-24 -120 -26 -150 -16 -168H16C26 -150 24 -120 22 -88Z M-6 -166V-182H6V-166Z";

const GRAU = Math.PI / 180;

/** Folha de persiana girando na dobradica (`lado` -1 esquerda, 1 direita), em perspectiva obliqua. */
function folha(lado: -1 | 1, abertura: number) {
  const L = 40;
  const h = lado * 40;
  const phi = abertura * 112 * GRAU;
  const z = L * Math.sin(phi);
  const xf = h - lado * L * Math.cos(phi) + lado * z * 0.45;
  const q = 1 + z * 0.005;
  const yc = -78;
  const topo = yc + (-140 - yc) * q + z * 0.12;
  const pe = yc + (-16 - yc) * q + z * 0.12;
  const contorno = `M${h} -140L${xf} ${topo}L${xf} ${pe}L${h} -16Z`;
  let ripas = "";
  for (let i = 1; i < 11; i += 1) {
    const t = i / 11;
    ripas += `M${h} ${-140 + 124 * t}L${xf} ${topo + (pe - topo) * t}`;
  }
  return { contorno, ripas, dentro: Math.cos(phi) < 0 };
}

function Janela({ v }: { v: Vista }) {
  const esquerda = folha(-1, v.abertura);
  const direita = folha(1, v.abertura);
  const tremor = Math.sin(v.tremor * 38) * v.tremor * 5;
  return (
    <g transform={`translate(${v.x + tremor * v.s} ${v.y}) scale(${v.s})`} opacity={v.alfa}>
      <path d={MOLDURA_VAZADA} fillRule="evenodd" fill={PALETA.gesso} />
      <path d="M50 -150V0H44V-144Z" fill={PALETA.gessoSombra} />
      <path d="M-56 -150H56" stroke={PALETA.gessoBorda} strokeWidth={1.5} />
      {/* Vao vazado: pelo vidro se ve a propria praca. */}
      <rect x={-40.5} y={-140.5} width={81} height={125} fill="none" stroke={PALETA.gessoSombra} strokeWidth={2} />
      <path d="M-3 -140V-16H3V-140Z M-40 -82H40V-76H-40Z" fill={PALETA.gesso} />
      <path d={VIDROS} fill={PALETA.vidro} fillOpacity={0.16} />
      <path d="M-37 -137H-12L-37 -96Z M10 -73H24L4 -40H-6Z" fill="#fff" fillOpacity={0.13} />
      {[esquerda, direita].map((f, i) => (
        <g key={i}>
          <path
            d={f.contorno}
            fill={f.dentro ? PALETA.persianaDentro : PALETA.persiana}
            stroke={PALETA.persianaLinha}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          <path d={f.ripas} stroke={PALETA.persianaLinha} strokeWidth={1.4} strokeOpacity={0.75} />
        </g>
      ))}
      {v.abertura < 0.02 && <rect x={-3} y={-84} width={6} height={14} rx={1} fill={PALETA.latao} />}
      {v.racha > 0 && (
        <g fill="none" strokeLinejoin="bevel">
          <path
            d="M0 -158L5 -131L-3 -104L6 -79L-4 -50L4 -24L0 0"
            stroke={PALETA.racha}
            strokeWidth={3}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - v.racha}
          />
          <path
            d="M2 -158L7 -131L-1 -104L8 -79L-2 -50L6 -24L2 0"
            stroke={PALETA.rachaLuz}
            strokeWidth={1}
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - v.racha}
          />
        </g>
      )}
    </g>
  );
}

function Estatua({ l }: { l: Lugar }) {
  return (
    <g transform={`translate(${l.x} ${l.y}) scale(${l.s})`}>
      <path d="M-30 0V-80H30V0Z" fill={PALETA.gessoSombra} />
      <path d="M8 0V-80H30V0Z" fill={PALETA.gessoBorda} fillOpacity={0.55} />
      <path d="M-34 -80V-88H34V-80Z" fill={PALETA.gesso} />
      {/* Manequim: tronco costurado e cabeca de ovo, sem rosto. */}
      <path d="M-22 -88C-24 -120 -26 -150 -16 -168H16C26 -150 24 -120 22 -88Z" fill={PALETA.gesso} />
      <path d="M0 -92V-166" stroke={PALETA.gessoBorda} strokeWidth={1.4} strokeDasharray="4 4" />
      <path d="M-6 -166V-182H6V-166Z" fill={PALETA.gessoSombra} />
      <ellipse cx={0} cy={-206} rx={17} ry={24} fill={PALETA.gesso} />
      <path d="M-15 -200Q0 -195 15 -200M2 -229V-183" stroke={PALETA.gessoBorda} strokeWidth={1.2} fill="none" />
      <ellipse cx={7} cy={-206} rx={8} ry={20} fill={PALETA.gessoSombra} fillOpacity={0.6} />
    </g>
  );
}

/** Arcada do lado esquerdo, em perspectiva para o centro do horizonte. Quem chama espelha. */
function Arcada({ p }: { p: PracaT }) {
  const { largura: W, horizonte: hz } = p;
  const chao = p.altura - hz;
  const vx = W / 2;
  const x0 = -W * 0.02;
  const x1 = W * 0.22;
  const topo0 = hz - hz * 0.6;
  const pe0 = hz + chao * 0.16;
  const k = (x: number) => (vx - x) / (vx - x0);
  const topo = (x: number) => hz + (topo0 - hz) * k(x);
  const pe = (x: number) => hz + (pe0 - hz) * k(x);
  const nivel = (x: number, f: number) => pe(x) + (topo(x) - pe(x)) * f;

  const vaos = 5;
  const kFim = k(x1);
  const bordas = Array.from({ length: vaos + 1 }, (_, i) => vx - (vx - x0) * Math.pow(kFim, i / vaos));
  const arcos = bordas.slice(0, -1).map((a, i) => {
    const b = bordas[i + 1];
    const xa = a + (b - a) * 0.24;
    const xb = b - (b - a) * 0.06;
    const xm = (xa + xb) / 2;
    const mola = (nivel(xa, 0.44) + nivel(xb, 0.44)) / 2;
    const coroa = nivel(xm, 0.62);
    return `M${xa} ${pe(xa)}L${xa} ${nivel(xa, 0.44)}Q${xm} ${2 * coroa - mola} ${xb} ${nivel(xb, 0.44)}L${xb} ${pe(xb)}Z`;
  });

  return (
    <g>
      <path d={`M${x0} ${topo0}L${x1} ${topo(x1)}L${x1} ${pe(x1)}L${x0} ${pe0}Z`} fill={PALETA.fachada} />
      <path
        d={`M${x0} ${topo0}L${x1} ${topo(x1)}L${x1} ${nivel(x1, 0.93)}L${x0} ${nivel(x0, 0.93)}Z`}
        fill={PALETA.fachadaEscura}
      />
      <path d={arcos.join("")} fill={PALETA.arco} />
      <path
        d={`M${x1} ${topo(x1)}L${x1 + W * 0.012} ${topo(x1) + 2}L${x1 + W * 0.012} ${pe(x1) - 1}L${x1} ${pe(x1)}Z`}
        fill={PALETA.fachadaEscura}
      />
    </g>
  );
}

export default function Praca({ p, sol, lado, estatua, janelas, detalhe, children }: Props) {
  const uid = useId().replace(/:/g, "");
  const { largura: W, altura: H, horizonte: hz } = p;
  const chao = H - hz;
  const pe = peDoSol(p, sol);
  const razao = razaoDoSol(sol.elevacao);
  const solY = hz - (sol.elevacao / 32) * hz * 0.85;
  const solR = Math.min(28, Math.max(8, Math.min(W, H) * 0.026));

  const sEstatua = sombra({ giro: 0, escala: 1 }, estatua, pe, razao);
  /* Desenha de tras para a frente. */
  const ordem = [...janelas].sort((a, b) => a.vista.y - b.vista.y);
  const chamineX = lado < 0 ? W * 0.16 : W * 0.84;
  const chamineA = hz * 0.42;
  const chamineL = Math.max(5, W * 0.016);

  const juntas: string[] = [];
  for (let i = -8; i <= 8; i += 1) juntas.push(`M${W / 2} ${hz}L${W / 2 + i * W * 0.22} ${H}`);
  for (const t of [0.06, 0.16, 0.3, 0.48, 0.72]) juntas.push(`M0 ${hz + chao * t}H${W}`);

  return (
    <div className={styles.palco}>
      <svg className={styles.cena} viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}ceu`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALETA.ceuAlto} />
            <stop offset="0.62" stopColor={PALETA.ceuMeio} />
            <stop offset="1" stopColor={PALETA.ceuBaixo} />
          </linearGradient>
          <linearGradient id={`${uid}chao`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={PALETA.chaoLonge} />
            <stop offset="1" stopColor={PALETA.chaoPerto} />
          </linearGradient>
          <radialGradient id={`${uid}halo`}>
            <stop offset="0" stopColor={PALETA.sol} stopOpacity={0.55} />
            <stop offset="1" stopColor={PALETA.sol} stopOpacity={0} />
          </radialGradient>
        </defs>

        <rect width={W} height={hz + 1} fill={`url(#${uid}ceu)`} />
        <circle cx={pe.x} cy={solY} r={solR * 6} fill={`url(#${uid}halo)`} />
        <circle cx={pe.x} cy={solY} r={solR} fill={PALETA.sol} />

        {/* Ao longe: muro baixo, trem e a chamine fumegando do lado do sol. */}
        <rect x={0} y={hz - Math.max(3, H * 0.006)} width={W} height={Math.max(3, H * 0.006)} fill={PALETA.chamine} opacity={0.55} />
        <g fill={PALETA.chamine} opacity={0.8}>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={W * (0.5 + lado * 0.02) + i * W * 0.026} y={hz - H * 0.012} width={W * 0.022} height={H * 0.012} />
          ))}
        </g>
        <path
          d={`M${chamineX - chamineL / 2} ${hz}L${chamineX - chamineL * 0.35} ${hz - chamineA}H${chamineX + chamineL * 0.35}L${chamineX + chamineL / 2} ${hz}Z`}
          fill={PALETA.chamine}
        />
        <path
          d={`M${chamineX} ${hz - chamineA - 2}c${-lado * W * 0.03} ${-hz * 0.08} ${lado * W * 0.02} ${-hz * 0.14} ${-lado * W * 0.05} ${-hz * 0.22}s${-lado * W * 0.02} ${-hz * 0.06} ${-lado * W * 0.08} ${-hz * 0.1}`}
          stroke={PALETA.fumaca}
          strokeWidth={Math.max(3, chamineL * 0.9)}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
        />

        <rect y={hz} width={W} height={chao} fill={`url(#${uid}chao)`} />
        <path d={juntas.join("")} stroke={PALETA.junta} strokeWidth={1} strokeOpacity={0.12} />
        <rect y={hz} width={W} height={1.5} fill={PALETA.ceuBaixo} opacity={0.6} />

        <g transform={lado < 0 ? `translate(${W} 0) scale(-1 1)` : undefined}>
          <Arcada p={p} />
        </g>

        {/* Sombras primeiro (todas no chao), corpos depois: sombra nunca pinta por cima de corpo. */}
        <g fill={PALETA.sombra}>
          <path d={ESTATUA} transform={matrizSombra(estatua, sEstatua.angulo, sEstatua.razao)} />
          <ellipse cx={0} cy={-206} rx={17} ry={24} transform={matrizSombra(estatua, sEstatua.angulo, sEstatua.razao)} />
          {janelas.map(({ id, mentira, vista: v }) => {
            const s = sombra(mentira, v, pe, razao);
            const m = matrizSombra(v, s.angulo, s.razao);
            return (
              <g key={id} opacity={v.alfa}>
                <path d={`${MOLDURA} ${VIDROS}`} fillRule="evenodd" transform={m} />
                {/* Persianas fechando apagam a luz que passava pelo vidro. */}
                <path d={VIDROS} transform={m} opacity={1 - v.abertura} />
              </g>
            );
          })}
        </g>

        <Estatua l={estatua} />
        {ordem.map(({ id, vista }) => (
          <Janela key={id} v={vista} />
        ))}
      </svg>
      {detalhe && <div className={styles.grao} />}
      <div className={styles.vinheta} />
      {children}
    </div>
  );
}

