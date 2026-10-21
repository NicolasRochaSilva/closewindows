"use client";

import { useRef } from "react";
import type { Qualidade } from "@/console/contrato";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Cela } from "./Cela";
import { inicial } from "./nivel";
import styles from "./Jogo.module.css";

const INICIAL = inicial();

/** Na parede: a cela parada, tocha acesa e a folha aberta balancando no vento. Sem som, sem input. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 0.96, 0.25);
  const vivo = qualidade !== "baixa";

  return (
    <div ref={caixa} className={styles.previa} aria-hidden="true">
      <div style={{ width: ARTE_L * escala, height: ARTE_A * escala }}>
        <Cela estado={INICIAL} vivo={vivo} passo={0} balanca={vivo} />
      </div>
    </div>
  );
}
