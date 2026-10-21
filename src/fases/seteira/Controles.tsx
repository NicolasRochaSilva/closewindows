import { AMPULHETA, SETA } from "./arte";
import { Pixels } from "./Pixels";
import type { Acao } from "./turnos";
import styles from "./Seteira.module.css";

const BOTOES: { acao: Acao; rotulo: string }[] = [
  { acao: "cima", rotulo: "Andar para cima" },
  { acao: "esquerda", rotulo: "Andar para a esquerda" },
  { acao: "esperar", rotulo: "Esperar um turno" },
  { acao: "direita", rotulo: "Andar para a direita" },
  { acao: "baixo", rotulo: "Andar para baixo" },
];

/** Cruz de direcao + ampulheta (esperar). Toque e clique; o teclado e tratado no Jogo. */
export function Controles({ onAcao, parado }: { onAcao: (a: Acao) => void; parado: boolean }) {
  return (
    <div className={styles.controles}>
      {BOTOES.map(({ acao, rotulo }) => (
        <button
          key={acao}
          type="button"
          className={`${styles.botao} ${styles[acao]}`}
          aria-label={rotulo}
          disabled={parado}
          onClick={() => onAcao(acao)}
        >
          <Pixels mapa={acao === "esperar" ? AMPULHETA : SETA} />
        </button>
      ))}
      <p className={styles.dica}>
        setas ou WASD
        <br />
        espaço espera
      </p>
    </div>
  );
}
