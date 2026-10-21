"use client";

import type { Qualidade } from "@/console/contrato";
import { Janelinha } from "./Janelinha";
import { Papel } from "./Papel";
import { OBJETOS } from "./objetos";
import styles from "./Memoria.module.css";

/* Ordem em que as lembrancas se revelam na parede, uma de cada vez, para sempre. */
const CICLO = [2, 0, 4, 1, 5, 3];

/** Na parede: as seis janelas azuis derivando, uma lembranca acendendo por vez. Sem som, sem clique. */
export default function Previa({ qualidade }: { qualidade: Qualidade }) {
  const parada = qualidade === "baixa";
  return (
    <div className={`${styles.mundo} ${styles.previa} ${parada ? styles.calmo : ""}`} aria-hidden="true">
      <Papel qualidade={qualidade === "alta" ? "media" : qualidade} />
      <div className={styles.gradePrevia}>
        {OBJETOS.map((_, id) => (
          <div key={id} className={styles.cela}>
            <span className={styles.deriva} style={{ animationDelay: `${-id * 1.7}s`, animationDuration: `${6 + (id % 3)}s` }}>
              <Janelinha
                objeto={id}
                fechada={false}
                calmo={false}
                revelando={parada && id === CICLO[0]}
                ciclo={parada ? undefined : CICLO.indexOf(id)}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
