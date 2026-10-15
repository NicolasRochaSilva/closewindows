"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { PuzzleProps } from "../types";
import { DURATION, EASE_HINGE, EASE_WOOD, hingeOpen } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import styles from "./Puzzle.module.css";

/**
 * Esforco 0 — a janela tutorial. Um clique no trinco e a folha gira para
 * frente na dobradica da esquerda. A perspectiva vem do palco
 * (Gallery.module.css .slot), por isso nao ha `perspective` aqui.
 */
export default function Puzzle({ onSolved, alreadySolved }: PuzzleProps) {
  const [open, setOpen] = useState(false);

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
        initial={false}
        animate={
          /* Sem `filter` aqui: filtro achata o contexto 3D e o verso
             da folha passa a mostrar o vidro. */
          open ? { rotateY: -104, z: 24 } : { rotateY: 0, z: 0 }
        }
        transition={hingeOpen}
        onAnimationComplete={() => {
          if (!open) return;
          sfx.thud();
          onSolved();
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

        <motion.button
          type="button"
          className={styles.latch}
          onClick={() => {
            sfx.latch();
            sfx.creak(DURATION.swing);
            setOpen(true);
          }}
          disabled={open}
          aria-label={open ? "Trinco solto" : "Soltar o trinco"}
          whileHover={open ? undefined : { x: -4 }}
          whileTap={open ? undefined : { x: 4 }}
          transition={{ duration: DURATION.snap, ease: EASE_WOOD }}
        >
          <span className={styles.latchPlate} />
          <span className={styles.latchStud} />
          <motion.span
            className={styles.latchBar}
            initial={false}
            animate={open ? { rotate: -82 } : { rotate: 0 }}
            transition={{ duration: DURATION.quick, ease: EASE_HINGE }}
          />
        </motion.button>
      </motion.div>

      <span className={styles.sill} />

      {!open && (
        <motion.p
          className={styles.hint}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {alreadySolved ? "solte o trinco outra vez" : "solte o trinco"}
        </motion.p>
      )}
    </div>
  );
}
