"use client";

import { useRef } from "react";
import type { Qualidade } from "@/console/contrato";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Copa, Grao, FolhaArte, Fundo, Viciado, useUid, varsDaPaleta } from "./Cena";
import styles from "./Cena.module.css";

/** Na parede: ele no galho mastigando, as folhas abanando no vento. Sem som, sem clique. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const uid = useUid();
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 1, 0.01);
  const vivo = qualidade !== "baixa" ? styles.vivo : "";

  return (
    <div
      ref={caixa}
      className={`${styles.mundo} ${styles.previa} ${qualidade === "baixa" ? styles.baixa : ""}`}
      style={varsDaPaleta}
      aria-hidden="true"
    >
      <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <Fundo uid={uid} />
        <Copa uid={uid} vento={qualidade === "alta"} />
        <Viciado uid={uid} pose="mastigando" animado={qualidade !== "baixa"} />
        <div className={styles.janela3d}>
          <div className={`${styles.folha} ${styles.folhaEsq} ${vivo}`}>
            <FolhaArte lado="esq" />
          </div>
          <div className={`${styles.folha} ${styles.folhaDir} ${vivo}`}>
            <FolhaArte lado="dir" />
          </div>
        </div>
      </div>
      <Grao />
    </div>
  );
}
