"use client";

import { motion } from "motion/react";
import type { RankRow } from "@/lib/ranking";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./RankingBoard.module.css";

type Props = {
  rows: RankRow[];
  username: string;
};

export default function RankingBoard({ rows, username }: Props) {
  return (
    <aside className={`pixel-panel ${styles.board}`}>
      <h2 className={styles.heading}>Os Melhores</h2>

      {rows.length === 0 ? (
        <p className={styles.empty}>
          Nenhuma janela foi fechada ainda.
          <br />
          Seja o primeiro.
        </p>
      ) : (
        <ol className={styles.list}>
          {rows.map((row, index) => (
            <motion.li
              key={row.username}
              className={`${styles.row} ${row.username === username ? styles.me : ""}`}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: DURATION.quick,
                ease: EASE_WOOD,
                delay: 0.06 * index,
              }}
            >
              <span className={`${styles.position} ${row.position === 1 ? styles.crown : ""}`}>
                {row.position === 1 ? "I" : row.position}
              </span>
              <span className={styles.name}>{row.username}</span>
              <span className={styles.effort}>
                {row.effort}
                <span className={styles.effortUnit}>pts</span>
              </span>
            </motion.li>
          ))}
        </ol>
      )}

      <p className={styles.footer}>pontos = soma do esforco para fechar as janelas</p>
    </aside>
  );
}
