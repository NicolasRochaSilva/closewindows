"use client";

import { motion } from "motion/react";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./PixelArrow.module.css";

type Props = {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  label: string;
};

/** Seta de madeira com ponta de ferro, em grade de 14x16. */
export default function PixelArrow({ direction, onClick, disabled, label }: Props) {
  const flip = direction === "prev";
  return (
    <motion.button
      type="button"
      className={styles.arrow}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      whileHover={disabled ? undefined : { x: flip ? -4 : 4 }}
      whileTap={disabled ? undefined : { x: flip ? -8 : 8, scale: 0.94 }}
      transition={{ duration: DURATION.snap, ease: EASE_WOOD }}
    >
      <svg
        viewBox="0 0 14 16"
        height={52}
        className={styles.svg}
        shapeRendering="crispEdges"
        aria-hidden="true"
        style={flip ? { transform: "scaleX(-1)" } : undefined}
      >
        {/* Haste */}
        <rect x="0" y="6" width="9" height="4" fill="var(--wood-shadow)" />
        <rect x="0" y="6" width="9" height="2" fill="var(--wood-light)" />
        <rect x="0" y="8" width="9" height="1" fill="var(--wood)" />

        {/* Ponta de ferro em degraus */}
        <rect x="7" y="2" width="2" height="12" fill="var(--wood-shadow)" />
        <rect x="9" y="3" width="2" height="10" fill="var(--iron-dark)" />
        <rect x="11" y="5" width="2" height="6" fill="var(--iron)" />
        <rect x="13" y="7" width="1" height="2" fill="var(--iron-light)" />
        <rect x="9" y="4" width="2" height="2" fill="var(--iron-light)" />

        {/* Penas */}
        <rect x="0" y="3" width="2" height="3" fill="var(--blood)" />
        <rect x="0" y="10" width="2" height="3" fill="var(--blood)" />
        <rect x="2" y="4" width="1" height="2" fill="var(--gold)" />
        <rect x="2" y="10" width="1" height="2" fill="var(--gold)" />
      </svg>
    </motion.button>
  );
}
