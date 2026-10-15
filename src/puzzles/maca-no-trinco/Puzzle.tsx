"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimate, useMotionValue } from "motion/react";
import type { PuzzleProps } from "../types";
import {
  DURATION,
  EASE_HINGE,
  EASE_WOOD,
  bump,
  dash,
  drop,
  hingeClose,
  hingeOpen,
  stroll,
  tossArc,
} from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import styles from "./Puzzle.module.css";

/* Angulos das folhas abertas para fora (a camera e a do palco).
   Pose inicial vai em MotionValue no `style`, nao em `initial`: o palco monta
   com AnimatePresence initial={false}, que ignora `initial` na primeira janela. */
const LEFT_OPEN = -104;
const RIGHT_OPEN = 104;
const LEFT_BUMP = -28;
const RIGHT_BUMP = 28;

/* Caminho do boneco na rua, em px do palco. */
const KID_FROM = -40;
const KID_STOP = 148;
const KID_TO = 500;

/* Arco da maca: mao do boneco -> pico -> encaixada no trinco. */
const APPLE_X = [170, 196, 220];
const APPLE_Y = [400, 104, 146];
const APPLE_FLOOR = 480;

/**
 * A maca no trinco. A janela quadrada comeca aberta, com as duas folhas para
 * fora. Um boneco de mochila chega correndo pela rua e joga uma maca no trinco: com ela
 * ali, nenhuma folha fecha. O jogador tira a maca e fecha a esquerda e depois
 * a direita (a direita fecha por cima) antes que o boneco volte com outra.
 * Fechou a direita primeiro? A esquerda emperra: reabra a direita.
 */
export default function Puzzle({ onSolved, alreadySolved }: PuzzleProps) {
  const [scope, animate] = useAnimate();
  const leftRef = useRef<HTMLButtonElement>(null);
  const rightRef = useRef<HTMLButtonElement>(null);
  const appleRef = useRef<HTMLButtonElement>(null);
  const kidRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  /* Poses iniciais como MotionValue: sobrevivem a re-render e ao palco. */
  const leftTurn = useMotionValue(LEFT_OPEN);
  const rightTurn = useMotionValue(RIGHT_OPEN);
  const barTurn = useMotionValue(-90);
  const appleX = useMotionValue(APPLE_X[0]);
  const appleY = useMotionValue(APPLE_Y[0]);
  const appleOpacity = useMotionValue(0);
  const kidX = useMotionValue(KID_FROM);

  const [leftShut, setLeftShut] = useState(false);
  const [rightShut, setRightShut] = useState(false);
  const [appleStuck, setAppleStuck] = useState(false);
  const [carrying, setCarrying] = useState(true);
  const [walking, setWalking] = useState(false);
  const [won, setWon] = useState(false);

  /* Espelhos para a cena do boneco, que roda fora do ciclo de render. */
  const leftShutRef = useRef(false);
  const rightShutRef = useRef(false);
  const stuckRef = useRef(false);
  const wonRef = useRef(false);
  const busy = useRef({ left: false, right: false });
  const gestured = useRef(false);
  const release = useRef<(() => void) | null>(null);

  /* O boneco age sozinho: so faz barulho depois de um gesto do jogador na
     pagina (trocar de janela conta), nunca no carregamento. */
  const canSound = () => gestured.current || navigator.userActivation?.hasBeenActive === true;

  /* Cena do boneco: entra correndo, joga a maca, sai e so volta quando ela cai. */
  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const pause = (seconds: number) =>
      new Promise<void>((resolve) => timers.push(setTimeout(resolve, seconds * 1000)));

    async function scene() {
      while (alive && !wonRef.current) {
        const kid = kidRef.current;
        const apple = appleRef.current;
        const arm = armRef.current;
        if (!kid || !apple || !arm) return;

        setCarrying(true);
        setWalking(true);
        await animate(kid, { x: [KID_FROM, KID_STOP] }, dash);
        if (!alive) return;
        if (wonRef.current) {
          await animate(kid, { x: KID_TO }, stroll);
          return;
        }

        setWalking(false);
        void animate(arm, { rotate: [0, -150, 0] }, { duration: DURATION.toss, ease: EASE_WOOD });
        setCarrying(false);
        if (canSound()) sfx.toss();
        await animate(
          apple,
          { x: APPLE_X, y: APPLE_Y, rotate: [0, 200, 360], opacity: 1 },
          tossArc,
        );
        if (!alive) return;

        if (leftShutRef.current && rightShutRef.current) {
          /* Bate no vidro fechado e cai. */
          await animate(apple, { y: APPLE_FLOOR, opacity: 0 }, drop);
        } else {
          stuckRef.current = true;
          setAppleStuck(true);
          if (canSound()) sfx.plop();
        }

        setWalking(true);
        await animate(kid, { x: KID_TO }, stroll);
        setWalking(false);
        if (!alive) return;

        if (stuckRef.current) {
          await new Promise<void>((resolve) => {
            release.current = resolve;
          });
        }
        if (!alive) return;
        await pause(DURATION.rearm);
      }
    }

    void scene();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      release.current?.();
    };
  }, [animate]);

  async function knock(element: HTMLElement, open: number, near: number) {
    sfx.thud();
    await animate(element, { rotateY: [open, near, open] }, bump);
  }

  async function closeLeft() {
    gestured.current = true;
    const leaf = leftRef.current;
    if (!leaf || busy.current.left || leftShutRef.current || wonRef.current) return;
    busy.current.left = true;

    if (stuckRef.current || rightShutRef.current) {
      await knock(leaf, LEFT_OPEN, LEFT_BUMP);
    } else {
      leftShutRef.current = true;
      setLeftShut(true);
      sfx.creak(DURATION.swing);
      await animate(leaf, { rotateY: 0 }, hingeClose);
      sfx.thud();
    }
    busy.current.left = false;
  }

  async function toggleRight() {
    gestured.current = true;
    const leaf = rightRef.current;
    if (!leaf || busy.current.right || wonRef.current) return;
    busy.current.right = true;

    if (rightShutRef.current) {
      /* Reabrir para destravar a esquerda. */
      rightShutRef.current = false;
      setRightShut(false);
      sfx.creak(DURATION.swing);
      await animate(leaf, { rotateY: RIGHT_OPEN }, hingeOpen);
    } else if (stuckRef.current) {
      await knock(leaf, RIGHT_OPEN, RIGHT_BUMP);
    } else {
      rightShutRef.current = true;
      setRightShut(true);
      sfx.creak(DURATION.swing);
      await animate(leaf, { rotateY: 0 }, hingeClose);
      sfx.thud();
      if (leftShutRef.current && !stuckRef.current) await lock();
    }
    busy.current.right = false;
  }

  async function lock() {
    const bar = barRef.current;
    if (!bar || wonRef.current) return;
    wonRef.current = true;
    setWon(true);
    sfx.latch();
    await animate(bar, { rotate: 0 }, { duration: DURATION.quick, ease: EASE_HINGE });
    onSolved();
  }

  async function takeApple() {
    gestured.current = true;
    const apple = appleRef.current;
    if (!apple || !stuckRef.current) return;
    stuckRef.current = false;
    setAppleStuck(false);
    sfx.plop();
    await animate(apple, { y: APPLE_FLOOR, opacity: 0, rotate: 450 }, drop);
    release.current?.();
    release.current = null;
  }

  let hint = alreadySolved ? "feche a janela outra vez" : "feche as duas folhas";
  if (appleStuck) hint = "tire a maca do trinco";
  else if (rightShut && !leftShut) hint = "a direita fecha por cima: reabra";

  return (
    <div ref={scope} className={styles.scene}>
      <Torch side="left" />
      <Torch side="right" />

      <div className={styles.frame}>
        <div className={styles.view}>
          <div className={styles.skyBand} />
          <div className={styles.stars} />
          <div className={styles.sun} />
          <div className={styles.hillBack} />
          <div className={styles.hillFront} />
        </div>
      </div>

      <motion.button
        ref={leftRef}
        type="button"
        className={`${styles.leaf} ${styles.leafLeft}`}
        style={{ rotateY: leftTurn }}
        onClick={closeLeft}
        disabled={leftShut || won}
        aria-label={leftShut ? "Folha esquerda fechada" : "Fechar a folha esquerda"}
      >
        <span className={styles.pane}>
          <span className={styles.shine} />
        </span>
        <span className={styles.keeper} />
        <span className={`${styles.hinge} ${styles.hingeLeftTop}`} />
        <span className={`${styles.hinge} ${styles.hingeLeftBottom}`} />
      </motion.button>

      <motion.button
        ref={rightRef}
        type="button"
        className={`${styles.leaf} ${styles.leafRight}`}
        style={{ rotateY: rightTurn }}
        onClick={toggleRight}
        disabled={won}
        aria-label={
          won ? "Janela trancada" : rightShut ? "Reabrir a folha direita" : "Fechar a folha direita"
        }
      >
        <span className={styles.pane}>
          <span className={styles.shine} />
        </span>
        <span className={styles.overlap} />
        <motion.span ref={barRef} className={styles.bar} style={{ rotate: barTurn }} />
        <span className={`${styles.hinge} ${styles.hingeRightTop}`} />
        <span className={`${styles.hinge} ${styles.hingeRightBottom}`} />
      </motion.button>

      <span className={styles.sill} />

      <motion.button
        ref={appleRef}
        type="button"
        className={styles.apple}
        onClick={takeApple}
        disabled={!appleStuck}
        style={{
          x: appleX,
          y: appleY,
          z: 16,
          opacity: appleOpacity,
          pointerEvents: appleStuck ? "auto" : "none",
        }}
        aria-label="Tirar a maca do trinco"
      >
        <AppleSprite />
      </motion.button>

      <div className={styles.street}>
        <motion.div
          ref={kidRef}
          className={`${styles.kid} ${walking ? styles.walking : ""}`}
          style={{ x: kidX }}
          aria-hidden
        >
          <KidSprite />
          <motion.span ref={armRef} className={styles.arm}>
            {carrying && <span className={styles.handApple} />}
          </motion.span>
        </motion.div>
        <span className={styles.ground} />
      </div>

      {!won && (
        <motion.p
          className={styles.hint}
          initial={{ opacity: 0.45 }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: DURATION.swing * 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {hint}
        </motion.p>
      )}
    </div>
  );
}

/* Tocha: acesa no tema escuro (chama com brilho desfocado), apagada no claro. */
function Torch({ side }: { side: "left" | "right" }) {
  return (
    <span className={`${styles.torch} ${side === "left" ? styles.torchLeft : styles.torchRight}`}>
      <span className={styles.glow} />
      <span className={styles.flame}>
        <span className={styles.flameCore} />
      </span>
      <span className={styles.stick} />
      <span className={styles.ash} />
      <span className={styles.sconce} />
    </span>
  );
}

/* Boneco de mochila em grade de 8x12 pixels (cada pixel = 4px). */
function KidSprite() {
  return (
    <svg
      className={styles.kidBody}
      width={32}
      height={48}
      viewBox="0 0 8 12"
      shapeRendering="crispEdges"
    >
      <rect className={styles.cHair} x={2} y={0} width={4} height={1} />
      <rect className={styles.cHair} x={2} y={1} width={1} height={2} />
      <rect className={styles.cSkin} x={3} y={1} width={3} height={3} />
      <rect className={styles.cInk} x={5} y={2} width={1} height={1} />
      <rect className={styles.cPack} x={0} y={4} width={2} height={4} />
      <rect className={styles.cPackFlap} x={0} y={4} width={2} height={1} />
      <rect className={styles.cBuckle} x={1} y={6} width={1} height={1} />
      <rect className={styles.cShirt} x={2} y={4} width={4} height={4} />
      <rect className={styles.cHair} x={2} y={4} width={1} height={3} />
      <rect className={styles.cPants} x={2} y={8} width={4} height={2} />
      <rect className={styles.cBoot} x={2} y={10} width={1} height={2} />
      <rect className={styles.cBoot} x={5} y={10} width={1} height={2} />
    </svg>
  );
}

/* Maca em grade de 5x5 pixels. */
function AppleSprite() {
  return (
    <svg width={20} height={20} viewBox="0 0 5 5" shapeRendering="crispEdges" aria-hidden>
      <rect className={styles.cHair} x={2} y={0} width={1} height={1} />
      <rect className={styles.cLeaf} x={3} y={0} width={1} height={1} />
      <rect className={styles.cShirt} x={1} y={1} width={3} height={1} />
      <rect className={styles.cShirt} x={0} y={2} width={5} height={2} />
      <rect className={styles.cShirt} x={1} y={4} width={3} height={1} />
      <rect className={styles.cShine} x={1} y={2} width={1} height={1} />
    </svg>
  );
}
