"use client";

import { useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import type { Qualidade } from "@/console/contrato";
import { DURATION, EASE_HINGE, EASE_WOOD, hingeClose } from "@/lib/motion";
import {
  ARTE_A,
  ARTE_L,
  CASA,
  CHAMA,
  ESQUELETO,
  FECHADOR,
  FERROLHO,
  FUNDO,
  GOLPE,
  LAMINA_BAIXA,
  LAMINA_BRILHO,
  LAMINA_ERGUIDA,
  PEGADA,
  PENDULO,
  PORTINHOLA,
  SETEIRA_ARTE,
  SOMBRA,
  TOCHAS,
  pocaDeLuz,
} from "./arte";
import { PX, Pixels, Retangulos } from "./Pixels";
import { FILEIRA_PENDULO, MAPA, SETEIRA, esqueleto, lamina, pendulo, type Casa } from "./turnos";
import styles from "./Seteira.module.css";

/** Lado da casa na tela, antes da escala. */
export const LADO = CASA * PX;
export const SALA_L = ARTE_L * PX;
export const SALA_A = ARTE_A * PX;

/* Fileira -1 e a parede extra do topo: tudo desce uma casa. */
const pos = (c: Casa) => ({ x: c.x * LADO, y: (c.y + 1) * LADO });

const LAMINAS: Casa[] = [];
MAPA.forEach((linha, y) => [...linha].forEach((l, x) => (l === ">" || l === "<") && LAMINAS.push({ x, y })));

const LUZ_LONGE = pocaDeLuz(30);
const LUZ_PERTO = pocaDeLuz(16);

/* Pendulo: pivo 2,5 casas acima do meio do trilho; o angulo leva a lâmina a coluna do turno. */
const EIXO = pendulo(1).x;
const BRACO = LADO * 2.5;
const GRAUS_POR_CASA = (Math.atan(LADO / BRACO) * 180) / Math.PI;

const PARTICULAS: Record<Qualidade, number> = { alta: 16, media: 10, baixa: 5 };

type Props = {
  t: number;
  jogador?: Casa | null;
  /** Muda a cada volta ao comeco: os bonecos aparecem no lugar em vez de deslizar pela sala. */
  vida?: number;
  viradoEsq?: boolean;
  empurrando?: boolean;
  golpe?: Casa | null;
  ventando: boolean;
  fechar: boolean;
  qualidade: Qualidade;
  reduzir: boolean;
  onBateu?: () => void;
  onTravou?: () => void;
};

/** A sala inteira desenhada no turno `t`. Nao tem input: Jogo e Previa a controlam. */
export function Sala({
  t,
  jogador,
  vida = 0,
  viradoEsq,
  empurrando,
  golpe,
  ventando,
  fechar,
  qualidade,
  reduzir,
  onBateu,
  onTravou,
}: Props) {
  const anda = reduzir ? { duration: 0 } : { duration: DURATION.snap, ease: EASE_WOOD };
  const ossos = esqueleto(t);
  const proximoOsso = esqueleto(t + 1);
  const lamina0 = pendulo(t);
  const particulas = reduzir || !ventando ? 0 : PARTICULAS[qualidade];
  const tremula = qualidade !== "baixa" && !reduzir;

  return (
    <div className={styles.sala} style={{ width: SALA_L, height: SALA_A }}>
      <Retangulos rects={FUNDO} largura={ARTE_L} altura={ARTE_A} className={styles.camada} />

      {TOCHAS.map((c) => (
        <div key={`luz${c.x}`} className={`${styles.luz} ${tremula ? styles.luzViva : ""}`} style={centro(c, 30)}>
          <Retangulos rects={LUZ_LONGE} largura={60} altura={60} className={styles.luzLonge} />
          <Retangulos rects={LUZ_PERTO} largura={32} altura={32} className={styles.luzPerto} />
        </div>
      ))}

      {LAMINAS.map((c) => {
        const fase = lamina(c, t);
        const mapa = fase === "erguida" ? LAMINA_ERGUIDA : fase === "brilho" ? LAMINA_BRILHO : LAMINA_BAIXA;
        return (
          <div key={`l${c.x},${c.y}`} className={`${styles.peca} ${fase === "brilho" ? styles.brilho : ""}`} style={xy(c)}>
            <Pixels mapa={mapa} />
          </div>
        );
      })}

      {/* Sombras do pendulo: onde ele esta e, piscando, onde cai no proximo turno. */}
      <div className={`${styles.peca} ${styles.sombra}`} style={xy(lamina0)}>
        <Pixels mapa={SOMBRA} />
      </div>
      <div className={`${styles.peca} ${styles.sombra} ${styles.sombraProxima}`} style={xy(pendulo(t + 1))}>
        <Pixels mapa={SOMBRA} />
      </div>

      <div className={`${styles.peca} ${styles.pegada}`} style={xy(proximoOsso)}>
        <Pixels mapa={PEGADA} />
      </div>

      <Seteira fechar={fechar} reduzir={reduzir} onBateu={onBateu} onTravou={onTravou} />

      {TOCHAS.map((c) => {
        const quadros = ventando ? CHAMA.vento : CHAMA.reta;
        return (
          <div key={`t${c.x}`} className={styles.tocha} style={xy(c)}>
            <Pixels mapa={quadros[0]} className={tremula ? styles.quadroA : undefined} />
            {tremula && <Pixels mapa={quadros[1]} className={styles.quadroB} />}
          </div>
        );
      })}

      <motion.div
        key={`esq${vida}`}
        className={styles.peca}
        initial={false}
        animate={pos(ossos)}
        transition={anda}
      >
        <div className={proximoOsso.x < ossos.x ? styles.espelho : undefined}>
          <Pixels mapa={ESQUELETO} />
        </div>
      </motion.div>

      {jogador && (
        <motion.div
          key={`eu${vida}`}
          className={`${styles.peca} ${golpe ? styles.ferido : ""}`}
          initial={false}
          animate={{ x: pos(jogador).x, y: pos(jogador).y - (empurrando ? PX * 2 : 0) }}
          transition={anda}
        >
          <div className={viradoEsq ? styles.espelho : undefined}>
            <Pixels mapa={FECHADOR} />
          </div>
        </motion.div>
      )}

      {/* Pendulo pendurado no teto: gira no pivo e a lâmina cai na coluna do turno. */}
      <motion.div
        key={`pen${vida}`}
        className={styles.pendulo}
        style={{ left: EIXO * LADO, top: (FILEIRA_PENDULO + 1) * LADO + LADO / 2 - BRACO, height: BRACO + LADO / 2 }}
        initial={false}
        animate={{ rotate: (EIXO - lamina0.x) * GRAUS_POR_CASA }}
        transition={reduzir ? { duration: 0 } : { duration: DURATION.quick, ease: "easeInOut" }}
      >
        <span className={styles.corrente} />
        <Pixels mapa={PENDULO} className={styles.penduloLamina} />
      </motion.div>

      {Array.from({ length: particulas }, (_, i) => (
        <span key={i} className={styles.vento} style={rajada(i)} />
      ))}

      {/* O motion escreve o proprio transform: a escala vai num filho para nao apagar o translate da casa. */}
      {golpe && (
        <div className={styles.peca} style={xy(golpe)}>
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: DURATION.swing, ease: EASE_WOOD }}
          >
            <Pixels mapa={GOLPE} />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function xy(c: Casa): CSSProperties {
  const p = pos(c);
  return { transform: `translate(${p.x}px, ${p.y}px)` };
}

/** Caixa de `raio` pixels de arte centrada na casa `c`. */
function centro(c: Casa, raio: number): CSSProperties {
  const p = pos(c);
  return { left: p.x + LADO / 2 - raio * PX, top: p.y + LADO / 2 - raio * PX };
}

/* Rajada `i`: sai da seteira e desce espalhando. Pseudoaleatorio fixo por indice. */
function rajada(i: number): CSSProperties {
  const giro = (i * 37) % 17;
  return {
    "--x": `${(giro - 8) * PX}px`,
    "--dx": `${(((i * 53) % 21) - 10) * PX * 3}px`,
    "--d": `${((i * 0.37) % 1.6).toFixed(2)}s`,
    "--dur": `${(1.4 + ((i * 0.23) % 0.9)).toFixed(2)}s`,
  } as CSSProperties;
}

/* ---------- A seteira e a portinhola que fecha ---------- */

const POEIRA = [
  { x: 8, y: 20, dx: -8 },
  { x: 20, y: 16, dx: -4 },
  { x: 32, y: 16, dx: 4 },
  { x: 40, y: 20, dx: 8 },
  { x: 12, y: 88, dx: -12 },
  { x: 36, y: 88, dx: 12 },
];

function Seteira({
  fechar,
  reduzir,
  onBateu,
  onTravou,
}: {
  fechar: boolean;
  reduzir: boolean;
  onBateu?: () => void;
  onTravou?: () => void;
}) {
  const [bateu, setBateu] = useState(false);
  const [travou, setTravou] = useState(false);

  return (
    <div className={styles.seteira} style={{ left: SETEIRA.x * LADO }}>
      <Pixels mapa={SETEIRA_ARTE} />
      <div className={styles.vao}>
        <motion.div
          className={styles.portinhola}
          initial={false}
          animate={{ rotateY: fechar ? 0 : -108 }}
          transition={reduzir ? { duration: DURATION.quick } : hingeClose}
          onAnimationComplete={() => {
            if (!fechar || bateu) return;
            setBateu(true);
            onBateu?.();
          }}
        >
          <div className={fechar ? styles.folhaParada : styles.folhaChacoalha}>
            <Pixels mapa={PORTINHOLA} />
          </div>
        </motion.div>
      </div>

      {bateu && (
        <motion.div
          className={styles.ferrolho}
          initial={{ x: 0 }}
          animate={{ x: PX * 3 }}
          transition={{ duration: DURATION.quick, ease: EASE_HINGE }}
          onAnimationComplete={() => {
            if (travou) return;
            setTravou(true);
            onTravou?.();
          }}
        >
          <Pixels mapa={FERROLHO} />
        </motion.div>
      )}

      {bateu &&
        !reduzir &&
        POEIRA.map((p, i) => (
          <motion.span
            key={i}
            className={styles.poeira}
            style={{ left: p.x, top: p.y }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: p.dx, y: PX * 6, opacity: 0 }}
            transition={{ duration: DURATION.swing, ease: EASE_WOOD }}
          />
        ))}
    </div>
  );
}
