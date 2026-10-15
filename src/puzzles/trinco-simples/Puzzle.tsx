"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import type { PuzzleProps } from "../types";
import { DURATION, EASE_HINGE, hingeClose } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import styles from "./Puzzle.module.css";

/**
 * Esforco 0 — a janela tutorial. Ela comeca aberta, com a folha girada para
 * frente na dobradica da esquerda. Um clique e a folha volta, bate no batente
 * e o trinco trava. A perspectiva vem do palco (Gallery.module.css .slot),
 * por isso nao ha `perspective` aqui.
 */
export default function Puzzle({ onSolved, alreadySolved }: PuzzleProps) {
  const [closed, setClosed] = useState(false);
  const [latched, setLatched] = useState(false);
  const reported = useRef(false);

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

      <motion.div
        className={styles.leaf}
        initial={{ rotateY: -104, z: 24 }}
        animate={
          /* Sem `filter` aqui: filtro achata o contexto 3D e o verso
             da folha passa a mostrar o vidro. */
          closed ? { rotateY: 0, z: 0 } : { rotateY: -104, z: 24 }
        }
        transition={hingeClose}
        onAnimationComplete={() => {
          if (!closed || latched) return;
          sfx.thud();
          sfx.latch();
          setLatched(true);
        }}
      >
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
          <motion.span
            className={styles.latchBar}
            initial={false}
            animate={latched ? { rotate: 0 } : { rotate: -82 }}
            transition={{ duration: DURATION.quick, ease: EASE_HINGE }}
            onAnimationComplete={() => {
              if (!latched || reported.current) return;
              reported.current = true;
              onSolved();
            }}
          />
        </span>
      </motion.div>

      <span className={styles.sill} />

      <button
        type="button"
        className={styles.closeHit}
        onClick={() => {
          sfx.creak(DURATION.swing);
          setClosed(true);
        }}
        disabled={closed}
        aria-label={closed ? "Janela fechada" : "Fechar a janela"}
      />

      {!closed && (
        <motion.p
          className={styles.hint}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: DURATION.swing * 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {alreadySolved ? "feche a janela outra vez" : "feche a janela"}
        </motion.p>
      )}
    </div>
  );
}
