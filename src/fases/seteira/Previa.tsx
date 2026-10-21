"use client";

import { useEffect, useRef, useState } from "react";
import type { Qualidade } from "@/console/contrato";
import { useEncaixe } from "../_kit/useEncaixe";
import { LADO, SALA_L, Sala } from "./Sala";
import styles from "./Seteira.module.css";

/* Na parede mostra so o alto da sala (seteira, camara e pendulo), que e onde a coisa acontece. */
const RECORTE_A = LADO * 8;
const TURNO_MS: Record<Qualidade, number> = { alta: 600, media: 600, baixa: 1000 };

/** A masmorra rodando sozinha: esqueleto na ronda, pendulo e lâminas no ritmo. Sem fechador, sem som. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, SALA_L, RECORTE_A, 1, 0.05);
  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setT((n) => n + 1), TURNO_MS[qualidade]);
    return () => clearInterval(id);
  }, [qualidade]);

  return (
    <div ref={caixa} className={`${styles.mundo} ${styles.previa}`} aria-hidden="true">
      <div className={styles.encaixeTopo} style={{ transform: `translateX(-50%) scale(${escala})`, transformOrigin: "50% 0" }}>
        <Sala t={t} ventando fechar={false} qualidade={qualidade} reduzir={false} />
      </div>
    </div>
  );
}
