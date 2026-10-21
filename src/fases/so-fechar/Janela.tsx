"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import styles from "./Janela.module.css";

/** Tamanho da arte em px (grade de 4px do Nicolas). */
export const JANELA_L = 252;
export const JANELA_A = 472;
/** Largura para encaixar na tela: a folha aberta gira para fora da moldura (~120px a esquerda). */
export const JANELA_L_COM_FOLHA = JANELA_L + 128;

type Props = {
  /** Animacao da folha (rotateY/z). A folha comeca aberta. */
  folha: HTMLMotionProps<"div">;
  /** Animacao da barra do trinco (rotate). */
  trinco: HTMLMotionProps<"span">;
};

/** A janela em arco de pedra do tutorial do Nicolas, so a arte. Jogo e Previa a animam. */
export function Janela({ folha, trinco }: Props) {
  return (
    <div className={styles.window}>
      <div className={styles.arch}>
        <span className={`${styles.archRow} ${styles.archRow5}`} />
        <span className={`${styles.archRow} ${styles.archRow4}`} />
        <span className={`${styles.archRow} ${styles.archRow3}`} />
        <span className={`${styles.archRow} ${styles.archRow2}`} />
        <span className={`${styles.archRow} ${styles.archRow1}`} />
        <span className={`${styles.archRow} ${styles.archRow0}`} />
        <span className={styles.keystone} />
        <span className={styles.keystoneStud} />
      </div>

      <div className={styles.opening}>
        <div className={styles.sky}>
          <div className={styles.skyBand} />
          <div className={styles.stars} />
          <div className={styles.sun} />
          <div className={styles.towerTop} />
          <div className={styles.tower} />
          <div className={styles.towerWindow} />
          <div className={styles.hillBack} />
          <div className={styles.hillFront} />
        </div>
      </div>

      {/* Sem `filter` na folha: filtro achata o contexto 3D e o verso passa a mostrar o vidro. */}
      <motion.div className={styles.leaf} {...folha}>
        <div className={styles.pane}>
          <span className={`${styles.shine} ${styles.shineA}`} />
          <span className={`${styles.shine} ${styles.shineB}`} />
          <span className={`${styles.shine} ${styles.shineC}`} />
        </div>
        <div className={styles.mullionV} />
        <div className={styles.mullionH} />
        <span className={`${styles.hinge} ${styles.hingeTop}`} />
        <span className={`${styles.hinge} ${styles.hingeBottom}`} />

        <span className={styles.latch}>
          <span className={styles.latchPlate} />
          <span className={styles.latchStud} />
          <motion.span className={styles.latchBar} {...trinco} />
        </span>
      </motion.div>

      <span className={styles.sill} />
    </div>
  );
}
