"use client";

import { useRef } from "react";
import type { Qualidade } from "@/console/contrato";
import { DURATION } from "@/lib/motion";
import { useEncaixe } from "../_kit/useEncaixe";
import { Janela, JANELA_A, JANELA_L_COM_FOLHA } from "./Janela";
import styles from "./Janela.module.css";

/** Na parede: a janela aberta, balancando de leve no vento. Sem som, sem clique. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, JANELA_L_COM_FOLHA, JANELA_A, 0.92, 0.05);
  const balanco = qualidade === "baixa" ? undefined : { rotateY: [-104, -94, -104], z: 24 };

  return (
    <div ref={caixa} className={`${styles.mundo} ${styles.previa}`} aria-hidden="true">
      <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <Janela
          folha={{
            initial: { rotateY: -104, z: 24 },
            animate: balanco,
            transition: { duration: DURATION.stroll * 2, repeat: Infinity, ease: "easeInOut" },
          }}
          trinco={{ initial: { rotate: -82 } }}
        />
      </div>
    </div>
  );
}
