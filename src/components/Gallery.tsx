"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Logo from "./Logo";
import PixelArrow from "./PixelArrow";
import RankingBoard from "./RankingBoard";
import { puzzles } from "@/puzzles/registry";
import type { RankRow } from "@/lib/ranking";
import { DURATION, EASE_WOOD, panelIn } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import styles from "./Gallery.module.css";

type Props = {
  username: string;
  solvedIds: string[];
  ranking: RankRow[];
};

export default function Gallery({ username, solvedIds, ranking }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [solved, setSolved] = useState(() => new Set(solvedIds));
  const [rows, setRows] = useState(ranking);
  const [toast, setToast] = useState<{ name: string; effort: number } | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => setMuted(sfx.isMuted()), []);

  const puzzle = puzzles[index];
  const many = puzzles.length > 1;

  const go = useCallback((step: number) => {
    setDirection(step);
    setIndex((current) => {
      const next = current + step;
      return next < 0 || next > puzzles.length - 1 ? current : next;
    });
  }, []);

  useEffect(() => {
    if (!many) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, many]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const onSolved = useCallback(async () => {
    const current = puzzles[index];
    const first = !solved.has(current.id);
    setSolved((previous) => new Set(previous).add(current.id));
    if (!first) return;

    setToast({ name: current.name, effort: current.effort });
    sfx.chime();

    const response = await fetch("/api/solve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ puzzleId: current.id }),
    });
    if (!response.ok) return;

    const ranked = (await fetch("/api/ranking").then((r) => r.json())) as { ranking: RankRow[] };
    setRows(ranked.ranking);
  }, [index, solved]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const Puzzle = puzzle.Component;

  return (
    <div className={styles.screen}>
      <header className={styles.topbar}>
        <Logo size={34} />
        <div className={styles.who}>
          <span>
            fechador <span className={styles.whoName}>{username}</span>
          </span>
          <button
            type="button"
            className={`pixel-btn ${styles.logout}`}
            aria-pressed={muted}
            aria-label={muted ? "Ligar o som" : "Desligar o som"}
            onClick={() => {
              const next = !muted;
              sfx.setMuted(next);
              setMuted(next);
              if (!next) sfx.latch();
            }}
          >
            som {muted ? "off" : "on"}
          </button>
          <button type="button" className={`pixel-btn ${styles.logout}`} onClick={logout}>
            sair
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <section className={styles.stage}>
          <div className={styles.stageRow}>
            {many && (
              <PixelArrow
                direction="prev"
                label="Janela anterior"
                onClick={() => go(-1)}
                disabled={index === 0}
              />
            )}

            <div className={styles.slot}>
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={puzzle.id}
                  initial={{ opacity: 0, x: direction * 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -48 }}
                  transition={{ duration: DURATION.quick, ease: EASE_WOOD }}
                >
                  <Puzzle onSolved={onSolved} alreadySolved={solved.has(puzzle.id)} />
                </motion.div>
              </AnimatePresence>
            </div>

            {many && (
              <PixelArrow
                direction="next"
                label="Proxima janela"
                onClick={() => go(1)}
                disabled={index === puzzles.length - 1}
              />
            )}
          </div>

          <motion.div
            key={`${puzzle.id}-plaque`}
            className={`pixel-panel ${styles.plaque}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={panelIn}
          >
            <p className={styles.plaqueName}>{puzzle.name}</p>
            <div className={styles.plaqueMeta}>
              <span>por {puzzle.author}</span>
              <span className={styles.plaqueEffort}>esforco {puzzle.effort}</span>
              {solved.has(puzzle.id) && <span className={styles.sealed}>vencida</span>}
            </div>
          </motion.div>

          {many && (
            <p className={styles.counter}>
              janela {index + 1} de {puzzles.length}
            </p>
          )}
        </section>

        <RankingBoard rows={rows} username={username} />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.p
            className={styles.toast}
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 24, x: "-50%" }}
            transition={panelIn}
            role="status"
          >
            {toast.name} cedeu{" "}
            <span className={styles.toastEffort}>+{toast.effort} pts</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
