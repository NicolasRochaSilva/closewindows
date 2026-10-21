"use client";

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
  /** Fase aberta no runner: a janela dela sai da parede (a transicao a leva) e as previas pausam. */
  ativaId: string | null;
  qualidade: Qualidade;
  onJogar: (faseId: string, diaria: boolean) => void;
  onCampanha: () => void;
  onPlacar: () => void;
  onSair: () => void;
};

/** A previa ao vivo da fase dentro da moldura. Some quando a parede esta pausada. */
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

export default function Parede(props: Props) {
  const { usuario, mundos, fases, progresso, ativaId, qualidade } = props;
  const abertas = new Set(progresso?.abertas ?? []);
  const diaria = progresso?.diaria;
  const faseDiaria = fases.find((f) => f.id === diaria?.faseId);
  const fechadasTotal = Object.keys(progresso?.fases ?? {}).length;
  const jogaveisTotal = fases.filter((f) => !f.emObras).length;

  return (
    <main className={styles.parede}>
      <header className={styles.topo}>
        <h1 className={styles.marca}>
          close<em>Windows</em>
        </h1>
        <div className={styles.quem}>
          <span className={styles.mute}>fechador</span> <strong>{usuario}</strong>
          <button type="button" className={styles.link} onClick={props.onSair}>
            sair
          </button>
        </div>
      </header>

      <section className={styles.chamadas}>
        <button type="button" className={styles.chamadaForte} onClick={props.onCampanha}>
          <span className={styles.chamadaTitulo}>{fechadasTotal === 0 ? "Iniciar campanha" : "Continuar campanha"}</span>
          <span className={styles.chamadaSub}>
            {fechadasTotal} de {jogaveisTotal} janelas fechadas
          </span>
        </button>
        {faseDiaria && (
          <button
            type="button"
            className={styles.chamada}
            onClick={() => props.onJogar(faseDiaria.id, true)}
          >
            <span className={styles.chamadaTitulo}>Janela do dia</span>
            <span className={styles.chamadaSub}>
              {faseDiaria.nome} · {diaria?.fechouHoje ? "fechada hoje ✓" : "você está devendo"}
            </span>
          </button>
        )}
        <button type="button" className={styles.chamada} onClick={props.onPlacar}>
          <span className={styles.chamadaTitulo}>Placar</span>
          <span className={styles.chamadaSub}>geral · por fase · hoje</span>
        </button>
      </section>

      {mundos.map((mundo) => {
        const doMundo = fases.filter((f) => f.mundo === mundo.id);
        if (doMundo.length === 0) return null;
        return (
          <section key={mundo.id} className={styles.mundo} aria-label={`Mundo ${mundo.ordem}: ${mundo.nome}`}>
            <h2 className={styles.mundoTitulo}>
              <span className={styles.mundoNumero}>mundo {mundo.ordem}</span> {mundo.nome}
            </h2>
            <ol className={styles.fileira}>
              {doMundo.map((fase) => {
                const info = progresso?.fases[fase.id];
                const aberta = abertas.has(fase.id);
                const ativa = ativaId === fase.id;
                const estado = fase.emObras ? "obras" : !aberta ? "trancada" : info?.fechada ? "fechada" : "aberta";

                return (
                  <li key={fase.id} className={styles.vaga}>
                    {ativa ? (
                      <div className={styles.moldura} aria-hidden="true" />
                    ) : (
                      <motion.button
                        type="button"
                        layoutId={`janela-${fase.id}`}
                        className={styles.moldura}
                        data-estado={estado}
                        disabled={estado === "obras" || estado === "trancada"}
                        onClick={() => props.onJogar(fase.id, false)}
                        transition={{ duration: DURATION.base, ease: EASE_WOOD }}
                        aria-label={`Fase ${fase.ordem}: ${fase.nome}${estado === "trancada" ? " (trancada)" : estado === "obras" ? " (em obras)" : ""}`}
                      >
                        <div className={styles.vidro}>
                          {(estado === "aberta" || estado === "fechada") && (
                            <Previa fase={fase} qualidade={qualidade} pausada={ativaId !== null} />
                          )}
                          {(estado === "trancada" || estado === "obras") && <div className={styles.persiana} />}
                          {estado === "obras" && <span className={styles.fita}>em obras</span>}
                        </div>
                      </motion.button>
                    )}
                    <div className={styles.legenda}>
                      <span className={styles.legendaNome}>
                        <span className={styles.mute}>{fase.ordem}</span> {fase.nome}
                      </span>
                      <span className={styles.legendaNumeros}>
                        {info?.fechada
                          ? `${info.melhorNota} pts · ${formatarTempo(info.melhorTempo ?? 0)}`
                          : estado === "aberta"
                            ? "aberta"
                            : estado === "obras"
                              ? "em obras"
                              : "trancada"}
                      </span>
                    </div>
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
