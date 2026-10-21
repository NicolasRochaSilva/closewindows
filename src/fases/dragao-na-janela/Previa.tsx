"use client";

import { useRef } from "react";
import type { Qualidade } from "@/console/contrato";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Cabeca, Fogo, FolhaArte, Sala, Tocha } from "./Cena";
import styles from "./Cena.module.css";

/** Na parede: o dragao inspira e cospe em laco lento (CSS), folha aberta. Sem som, sem clique. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 0.96, 0.05);
  const parada = qualidade === "baixa";

  return (
    <div ref={caixa} className={`${styles.mundo} ${styles.previa} ${parada ? styles.previaParada : ""}`} aria-hidden="true">
      <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <Sala />
        <Tocha lado="esq" viva={!parada} />
        <Tocha lado="dir" viva={!parada} />
        <div className={styles.vao}>
          <Cabeca className={styles.cabeca} olho="aberto" />
        </div>
        <div className={styles.palcoFolha}>
          <div className={styles.folha} style={{ transform: "rotateY(-100deg)" }}>
            <div className={styles.verso} />
            <FolhaArte />
          </div>
        </div>
        <div className={styles.fogoTrilho}>
          <div className={styles.fogo}>
            <Fogo simples={parada} />
          </div>
        </div>
      </div>
    </div>
  );
}
