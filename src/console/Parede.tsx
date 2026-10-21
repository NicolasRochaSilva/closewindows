"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { View } from "@react-three/drei";
import type { FaseMeta, Mundo, Qualidade } from "./contrato";
import type { Progresso } from "@/lib/progresso";
import { useCartucho } from "./cartuchos";
import { formatarTempo } from "./Runner";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./console.module.css";

type Props = {
  usuario: string;
  mundos: Mundo[];
  fases: FaseMeta[];
  progresso: Progresso | null;
  /** Fase aberta no runner: a janela dela sai do muro (a transicao a leva) e as previas pausam. */
  ativaId: string | null;
  qualidade: Qualidade;
  onJogar: (faseId: string, diaria: boolean) => void;
  onCampanha: () => void;
  onPlacar: () => void;
  onSair: () => void;
};

/*
 * Muro de demolicao: cada fase e uma janela recuperada diferente — formato,
 * tinta da moldura e altura no muro mudam com a ordem. Nenhuma janela igual.
 */
type Forma = "arco" | "alta" | "larga" | "dupla" | "redonda";
const FORMAS: { forma: Forma; l: number; a: number }[] = [
  { forma: "arco", l: 200, a: 270 },
  { forma: "larga", l: 280, a: 200 },
  { forma: "alta", l: 170, a: 290 },
  { forma: "redonda", l: 220, a: 220 },
  { forma: "dupla", l: 250, a: 240 },
];
const DESNIVEL = [0, 44, 12, 56, 24];

function vitrine(ordem: number) {
  const i = (ordem - 1) % FORMAS.length;
  return {
    ...FORMAS[i],
    style: {
      "--moldura": `var(--moldura-${((ordem - 1) % 6) + 1})`,
      "--l": `${FORMAS[i].l}px`,
      "--a": `${FORMAS[i].a}px`,
      "--desnivel": `${DESNIVEL[i]}px`,
    } as CSSProperties,
  };
}

/** A previa ao vivo da fase dentro do vidro. Some quando o muro esta pausado. */
function Previa({ fase, qualidade, pausada }: { fase: FaseMeta; qualidade: Qualidade; pausada: boolean }) {
  const { cartucho } = useCartucho(pausada ? null : fase.id);
  if (pausada || !cartucho) return null;
  const { Previa: Componente } = cartucho;
  if (fase.tipo === "three") {
    return (
      <View className={styles.viewCheia}>
        <Componente qualidade={qualidade} />
      </View>
    );
  }
  return <Componente qualidade={qualidade} />;
}

function legenda(estado: string, nota?: number | null, tempo?: number | null) {
  if (estado === "fechada") return `Fechada com ${nota} pontos em ${formatarTempo(tempo ?? 0)}`;
  if (estado === "aberta") return "Ainda aberta";
  if (estado === "obras") return "Em obras";
  return "Trancada até você fechar a anterior";
}

export default function Parede(props: Props) {
  const { usuario, mundos, fases, progresso, ativaId, qualidade } = props;
  const abertas = new Set(progresso?.abertas ?? []);
  const diaria = progresso?.diaria;
  const faseDiaria = fases.find((f) => f.id === diaria?.faseId);
  const fechadasTotal = Object.keys(progresso?.fases ?? {}).length;
  const jogaveisTotal = fases.filter((f) => !f.emObras).length;

  return (
    <main className={styles.muro}>
      <header className={styles.topo}>
        <div>
          <h1 className={styles.letreiro}>Close Windows</h1>
          <p className={styles.lema}>Toda fase é fechar uma janela. Nenhuma fecha do mesmo jeito.</p>
        </div>
        <p className={styles.quem}>
          {usuario}
          <button type="button" className={styles.link} onClick={props.onSair}>
            Sair
          </button>
        </p>
      </header>

      <nav className={styles.placas} aria-label="Ações">
        <button type="button" className={`${styles.placa} ${styles.placaGrande}`} onClick={props.onCampanha}>
          <span className={styles.placaTitulo}>{fechadasTotal === 0 ? "Começar campanha" : "Continuar campanha"}</span>
          <span className={styles.placaSub}>
            {fechadasTotal} de {jogaveisTotal} janelas fechadas
          </span>
        </button>
        {faseDiaria && (
          <button type="button" className={styles.placa} onClick={() => props.onJogar(faseDiaria.id, true)}>
            <span className={styles.placaTitulo}>Janela do dia</span>
            <span className={styles.placaSub}>
              {faseDiaria.nome}, {diaria?.fechouHoje ? "já fechada hoje" : "você está devendo"}
            </span>
          </button>
        )}
        <button type="button" className={styles.lousinha} onClick={props.onPlacar}>
          Placar
        </button>
      </nav>

      {mundos.map((mundo) => {
        const doMundo = fases.filter((f) => f.mundo === mundo.id);
        if (doMundo.length === 0) return null;
        return (
          <section key={mundo.id} className={styles.mundo} aria-label={`Mundo ${mundo.ordem}: ${mundo.nome}`}>
            <h2 className={styles.mundoNome}>{mundo.nome}</h2>
            <ol className={styles.fiada}>
              {doMundo.map((fase) => {
                const info = progresso?.fases[fase.id];
                const aberta = abertas.has(fase.id);
                const ativa = ativaId === fase.id;
                const estado = fase.emObras ? "obras" : !aberta ? "trancada" : info?.fechada ? "fechada" : "aberta";
                const { forma, style } = vitrine(fase.ordem);
                const travada = estado === "obras" || estado === "trancada";

                return (
                  <li key={fase.id} className={styles.vaga} style={style} data-estado={estado}>
                    {ativa ? (
                      <div className={styles.janela} data-forma={forma} aria-hidden="true" />
                    ) : (
                      <motion.button
                        type="button"
                        layoutId={`janela-${fase.id}`}
                        className={styles.janela}
                        data-forma={forma}
                        disabled={travada}
                        onClick={() => props.onJogar(fase.id, false)}
                        transition={{ duration: DURATION.base, ease: EASE_WOOD }}
                        aria-label={`Fase ${fase.ordem}, ${fase.nome}. ${legenda(estado, info?.melhorNota, info?.melhorTempo)}`}
                      >
                        <span className={styles.vidro}>
                          {!travada && <Previa fase={fase} qualidade={qualidade} pausada={ativaId !== null} />}
                          {travada && (
                            <span className={styles.tabuas} aria-hidden="true">
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                          {estado === "obras" && <span className={styles.pichacao}>em obras</span>}
                        </span>
                        {forma === "dupla" && <span className={styles.mainel} aria-hidden="true" />}
                      </motion.button>
                    )}
                    <span className={styles.peitoril} aria-hidden="true" />
                    <p className={styles.legenda}>
                      <span className={styles.legendaNome}>{fase.nome}</span>
                      <span className={styles.legendaEstado}>{legenda(estado, info?.melhorNota, info?.melhorTempo)}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </main>
  );
}
