"use client";

import { useEffect, useRef, useState } from "react";
import type { FaseApi } from "@/console/contrato";
import { DURATION, EASE_HINGE, hingeClose } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import { useEncaixe } from "../_kit/useEncaixe";
import { Janela, JANELA_A, JANELA_L_COM_FOLHA } from "./Janela";
import styles from "./Janela.module.css";

/*
 * Fase 1 — Só Fechar. A janela tutorial do Nicolas, agora com boca: ela
 * debocha de quem demora e de quem clica na parede. Um clique na janela e
 * acabou. Clique fora da janela conta como erro.
 */
const QUEM = "a janela";
const PAREDE = ["Isso é a parede.", "Errou a janela. Como?", "A janela é a coisa com vidro.", "Sério?"];
const DEMORA: [number, string][] = [
  [5000, "É um clique. Na janela."],
  [11000, "Tô começando a me preocupar com você."],
];

export default function Jogo({ api }: { api: FaseApi }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, JANELA_L_COM_FOLHA, JANELA_A);
  const [fechada, setFechada] = useState(false);
  const [travada, setTravada] = useState(false);
  const errosNaParede = useRef(0);
  const reportou = useRef(false);

  useEffect(() => {
    api.fala(api.jaFechou ? "De novo? Gostou, né." : "Fecha aí. É só isso.", QUEM);
  }, [api]);

  useEffect(() => {
    if (fechada) return;
    const timers = DEMORA.map(([ms, texto]) => setTimeout(() => api.fala(texto, QUEM), ms));
    return () => timers.forEach(clearTimeout);
  }, [api, fechada]);

  function fechar() {
    if (fechada) return;
    sfx.creak(DURATION.swing);
    setFechada(true);
  }

  function errou() {
    if (fechada) return;
    api.erro();
    sfx.thud();
    api.fala(PAREDE[errosNaParede.current++ % PAREDE.length], QUEM);
  }

  return (
    <div ref={caixa} className={styles.mundo} onPointerDown={(e) => e.target === e.currentTarget && errou()}>
      <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <Janela
          folha={{
            initial: { rotateY: -104, z: 24 },
            animate: fechada ? { rotateY: 0, z: 0 } : { rotateY: -104, z: 24 },
            transition: hingeClose,
            onAnimationComplete: () => {
              if (!fechada || travada) return;
              sfx.thud();
              sfx.latch();
              setTravada(true);
            },
          }}
          trinco={{
            initial: false,
            animate: travada ? { rotate: 0 } : { rotate: -82 },
            transition: { duration: DURATION.quick, ease: EASE_HINGE },
            onAnimationComplete: () => {
              if (!travada || reportou.current) return;
              reportou.current = true;
              api.fala("Viu, é fácil fechar a janela, né?", QUEM);
              api.fechou();
            },
          }}
        />
        <button
          type="button"
          className={styles.closeHit}
          onClick={fechar}
          aria-disabled={fechada}
          aria-label={fechada ? "Janela fechada" : "Fechar a janela"}
        />
      </div>
    </div>
  );
}
