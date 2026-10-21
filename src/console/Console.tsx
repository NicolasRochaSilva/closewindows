"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { Qualidade } from "./contrato";
import { FASES, MUNDOS } from "@/fases/catalogo";
import type { Progresso } from "@/lib/progresso";
import { api } from "./cliente";
import { prefereMenosMovimento, qualidadeDoAparelho } from "./qualidade";
import Palco3D from "./Palco3D";
import Fase0Login from "./Fase0Login";
import Parede from "./Parede";
import Runner from "./Runner";
import Placar from "./Placar";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./console.module.css";

type Jogando = { faseId: string; diaria: boolean; rodada: number };

/**
 * O videogame: decide a tela (login → parede → fase) e guarda o progresso.
 * As fases sao cartuchos; o console so os executa.
 */
export default function Console({ usuario: inicial }: { usuario: string | null }) {
  const [usuario, setUsuario] = useState(inicial);
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [jogando, setJogando] = useState<Jogando | null>(null);
  const [placar, setPlacar] = useState(false);
  const [qualidade, setQualidade] = useState<Qualidade>("media");
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    setQualidade(qualidadeDoAparelho());
    setReduzirMovimento(prefereMenosMovimento());
  }, []);

  const atualizar = useCallback(async () => {
    try {
      const eu = await api.eu();
      setProgresso(eu.progresso);
    } catch {
      /* sessao expirou: volta para a janela de login */
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    if (usuario) void atualizar();
  }, [usuario, atualizar]);

  /* Com a fase em tela cheia, a parede por baixo nao rola. */
  useEffect(() => {
    document.body.style.overflow = jogando ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [jogando]);

  /** Proxima fase da campanha: a primeira aberta ainda nao fechada; tudo fechado = a ultima aberta. */
  const proximaDaCampanha = useCallback(
    (alem?: string) => {
      if (!progresso) return null;
      const abertas = FASES.filter((f) => progresso.abertas.includes(f.id));
      const depois = alem ? abertas.filter((f) => f.ordem > (FASES.find((x) => x.id === alem)?.ordem ?? 0)) : abertas;
      return (
        depois.find((f) => !progresso.fases[f.id]?.fechada)?.id ??
        (alem ? depois[0]?.id : abertas[abertas.length - 1]?.id) ??
        null
      );
    },
    [progresso],
  );

  const jogar = (faseId: string, diaria: boolean) => setJogando({ faseId, diaria, rodada: Date.now() });

  async function sair() {
    await api.sair().catch(() => {});
    setJogando(null);
    setProgresso(null);
    setUsuario(null);
  }

  const faseAtual = jogando ? FASES.find((f) => f.id === jogando.faseId) : undefined;
  const proxima = jogando ? proximaDaCampanha(jogando.faseId) : null;

  return (
    <Palco3D qualidade={qualidade}>
      <AnimatePresence mode="wait">
        {!usuario ? (
          <motion.div
            key="login"
            className={styles.telaLogin}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_WOOD }}
          >
            <Fase0Login qualidade={qualidade} reduzirMovimento={reduzirMovimento} onEntrou={setUsuario} />
          </motion.div>
        ) : (
          <motion.div
            key="jogo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.base, ease: EASE_WOOD }}
          >
            <LayoutGroup>
              <Parede
                usuario={usuario}
                mundos={MUNDOS}
                fases={FASES}
                progresso={progresso}
                ativaId={jogando?.faseId ?? null}
                qualidade={qualidade}
                onJogar={jogar}
                onCampanha={() => {
                  /* Progresso ainda carregando: a campanha sempre comeca pela primeira fase. */
                  const id = proximaDaCampanha() ?? FASES.find((f) => !f.emObras)?.id;
                  if (id) jogar(id, false);
                }}
                onPlacar={() => setPlacar(true)}
                onSair={sair}
              />
              <AnimatePresence>
                {jogando && faseAtual && (
                  <Runner
                    key={`${jogando.faseId}-${jogando.rodada}`}
                    fase={faseAtual}
                    qualidade={qualidade}
                    reduzirMovimento={reduzirMovimento}
                    jaFechou={Boolean(progresso?.fases[faseAtual.id]?.fechada)}
                    diaria={jogando.diaria}
                    temProxima={Boolean(proxima && proxima !== faseAtual.id)}
                    onFechou={atualizar}
                    onSair={() => setJogando(null)}
                    onDeNovo={() => jogar(faseAtual.id, jogando.diaria)}
                    onProxima={() => proxima && jogar(proxima, false)}
                  />
                )}
              </AnimatePresence>
            </LayoutGroup>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {placar && usuario && <Placar fases={FASES} usuario={usuario} onFechar={() => setPlacar(false)} />}
      </AnimatePresence>
    </Palco3D>
  );
}
