"use client";

import type { CSSProperties } from "react";
import { motion, type Transition } from "motion/react";
import { DURATION, EASE_HINGE, EASE_WOOD, hingeClose } from "@/lib/motion";
import { Objeto } from "./objetos";
import styles from "./Memoria.module.css";

/* Folhas abertas para fora, passando um pouco do perpendicular. */
const ABERTA = 100;

const fechaRapido: Transition = { duration: DURATION.base, ease: EASE_HINGE };
const abre: Transition = { duration: DURATION.base, ease: EASE_WOOD };

type Props = {
  objeto: number;
  /** Folhas fechadas. Toda janela comeca aberta. */
  fechada: boolean;
  /** A lembranca esta exposta agora. */
  revelando?: boolean;
  /** Muda a cada erro nesta janela: reinicia o clarao de superexposicao. */
  queima?: number;
  /** Tecla que fecha esta janela (so aparece com mouse). */
  tecla?: number;
  /** A janela final: folha pesada e trinco. */
  grande?: boolean;
  travada?: boolean;
  calmo: boolean;
  /** Ritmo de cena (previa): expoe sozinha em ciclo. */
  ciclo?: number;
  onFolhaParou?: () => void;
  onTravou?: () => void;
};

/** Uma janela de cianotipia: moldura em linha de luz, vidro azul, a lembranca latente e duas folhas. */
export function Janelinha({ objeto, fechada, revelando, queima, tecla, grande, travada, calmo, ciclo, onFolhaParou, onTravou }: Props) {
  const fecha = grande ? hingeClose : fechaRapido;
  /* Com movimento reduzido as folhas nao giram: aparecem. */
  const folha = (lado: 1 | -1) => ({
    initial: false as const,
    animate: calmo ? { rotateY: 0, opacity: fechada ? 1 : 0 } : { rotateY: fechada ? 0 : lado * ABERTA, opacity: 1 },
    transition: fechada ? fecha : abre,
  });

  return (
    <span
      className={`${styles.janela} ${grande ? styles.grande : ""} ${ciclo !== undefined ? styles.ciclo : ""}`}
      data-revelando={revelando || undefined}
      data-fechada={fechada || undefined}
      style={ciclo !== undefined ? ({ "--i": ciclo } as CSSProperties) : undefined}
    >
      <span className={styles.vidro}>
        <span className={styles.brilho} />
        <Objeto id={objeto} className={styles.objeto} />
      </span>
      {queima !== undefined && <span key={queima} className={styles.queima} />}
      {tecla !== undefined && <span className={styles.tecla}>{tecla}</span>}

      <motion.span
        className={`${styles.folha} ${styles.folhaE}`}
        {...folha(-1)}
        onAnimationComplete={() => fechada && onFolhaParou?.()}
      />
      <motion.span className={`${styles.folha} ${styles.folhaD}`} {...folha(1)} />

      {grande && (
        <motion.span
          className={styles.trinco}
          initial={false}
          animate={{ rotate: travada ? 0 : -80, opacity: fechada ? 1 : 0 }}
          transition={{ duration: DURATION.quick, ease: EASE_HINGE }}
          onAnimationComplete={() => travada && onTravou?.()}
        />
      )}
    </span>
  );
}
