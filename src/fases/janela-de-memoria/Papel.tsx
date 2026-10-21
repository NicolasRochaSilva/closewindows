import type { Qualidade } from "@/console/contrato";
import styles from "./Memoria.module.css";

/* Perfil de uma cabeca olhando para a esquerda, em linha de luz. As janelas flutuam dentro dela. */
const CABECA =
  "M300 500C300 440 310 410 330 380C370 320 382 240 360 170C335 80 250 30 170 40C100 50 60 110 62 180C63 205 55 220 42 245L30 270C28 278 40 282 50 285C48 295 52 302 50 310C46 318 54 322 52 330C50 345 60 360 90 365C120 370 140 390 150 420L160 500";

/** O papel de cianotipia: emulsao azul manchada, a cabeca em dupla exposicao e o grao. */
export function Papel({ qualidade }: { qualidade: Qualidade }) {
  return (
    <div className={styles.papel} aria-hidden="true">
      <span className={styles.luz} />
      <svg className={styles.cabeca} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">
        <path className={styles.cabecaEco} d={CABECA} />
        <path d={CABECA} />
      </svg>
      <span className={`${styles.grao} ${qualidade === "alta" ? styles.graoVivo : ""}`} />
      <span className={styles.borda} />
    </div>
  );
}
