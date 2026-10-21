"use client";

import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { View } from "@react-three/drei";
import type { FaseApi, FaseMeta, Qualidade } from "./contrato";
import { useCartucho } from "./cartuchos";
import { api as servidor, type Fechamento } from "./cliente";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./console.module.css";

type Props = {
  fase: FaseMeta;
  qualidade: Qualidade;
  reduzirMovimento: boolean;
  jaFechou: boolean;
  diaria: boolean;
  temProxima: boolean;
  onSair: () => void;
  onDeNovo: () => void;
  onProxima: () => void;
  onFechou: () => void;
};

type Fala = { id: number; texto: string; quem?: string };

/* Respiro entre a janela travar e o resultado subir: deixa a ultima fala e a poeira assentarem. */
const RESPIRO_MS = 1200;
const FALA_MS = 3600;

export const formatarTempo = (ms: number) => {
  const s = ms / 1000;
  const min = Math.floor(s / 60);
  return `${min}:${(s - min * 60).toFixed(1).padStart(4, "0")}`;
};

/** Fase com erro nao derruba o jogo: vira "essa janela emperrou". */
class Emperrou extends Component<{ children: ReactNode; onSair: () => void }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() {
    return { erro: true };
  }
  componentDidCatch(error: unknown) {
    console.error("Cartucho quebrou:", error);
  }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className={styles.emperrou}>
        <p className={styles.emperrouTitulo}>Essa janela emperrou.</p>
        <p className={styles.mute}>Não foi culpa sua. Desta vez.</p>
        <button type="button" className={styles.botao} onClick={this.props.onSair}>
          Voltar à parede
        </button>
      </div>
    );
  }
}

export default function Runner(props: Props) {
  const { fase, qualidade, reduzirMovimento, jaFechou, diaria, onSair } = props;
  const { cartucho, falhou } = useCartucho(fase.id);

  const [pronto, setPronto] = useState(false);
  const [erros, setErros] = useState(0);
  const [falas, setFalas] = useState<Fala[]>([]);
  const [resultado, setResultado] = useState<Fechamento | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [falhaServidor, setFalhaServidor] = useState<string | null>(null);

  const tentativa = useRef<Promise<string> | null>(null);
  const inicio = useRef(0);
  const fechada = useRef(false);
  const relogio = useRef<HTMLSpanElement>(null);
  const proximaFala = useRef(0);

  /* A fase so comeca quando a janela termina de crescer ate a tela cheia. */
  const comecar = useCallback(() => setPronto(true), []);
  useEffect(() => {
    const reserva = setTimeout(comecar, (DURATION.base + 0.2) * 1000);
    return () => clearTimeout(reserva);
  }, [comecar]);

  /* A tentativa nasce ANTES do cartucho montar: erro()/fechou() sempre tem onde registrar. */
  const [ativo, setAtivo] = useState(false);
  useEffect(() => {
    if (!pronto || !cartucho || tentativa.current) return;
    inicio.current = performance.now();
    tentativa.current = servidor.comecar(fase.id).then((t) => t.id);
    tentativa.current.catch((e: Error) => setFalhaServidor(e.message));
    setAtivo(true);
  }, [pronto, cartucho, fase.id]);

  const aoFechar = useRef(props.onFechou);
  aoFechar.current = props.onFechou;

  /* Relogio na tela: escreve direto no texto, sem re-renderizar a fase a cada quadro. */
  useEffect(() => {
    if (!ativo) return;
    let quadro = 0;
    const tique = () => {
      if (relogio.current && !fechada.current) {
        relogio.current.textContent = formatarTempo(performance.now() - inicio.current);
      }
      quadro = requestAnimationFrame(tique);
    };
    quadro = requestAnimationFrame(tique);
    return () => cancelAnimationFrame(quadro);
  }, [ativo]);

  const faseApi: FaseApi = useMemo(
    () => ({
      erro() {
        if (fechada.current) return;
        setErros((n) => n + 1);
        void tentativa.current?.then((id) => servidor.erro(id)).catch(() => {});
      },
      fechou() {
        if (fechada.current) return;
        fechada.current = true;
        const pendente = tentativa.current;
        if (!pendente) return;
        pendente
          .then((id) => servidor.fechar(id))
          .then((r) => {
            setResultado(r);
            if (relogio.current) relogio.current.textContent = formatarTempo(r.timeMs);
            aoFechar.current();
          })
          .catch((e: Error) => setFalhaServidor(e.message));
        setTimeout(() => setMostrarResultado(true), RESPIRO_MS);
      },
      fala(texto, quem) {
        const id = ++proximaFala.current;
        setFalas((atuais) => [...atuais.slice(-1), { id, texto, quem }]);
        setTimeout(() => setFalas((atuais) => atuais.filter((f) => f.id !== id)), FALA_MS);
      },
      qualidade,
      reduzirMovimento,
      jaFechou,
    }),
    // A api e criada uma vez por tentativa; o cartucho guarda a referencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const Jogo = cartucho?.Jogo;

  /*
   * Duas camadas: a fase fica ABAIXO do canvas 3D (para uma fase "three" aparecer
   * por cima do fundo dela), e HUD/falas/resultado ficam ACIMA do canvas.
   */
  return (
    <>
    <motion.section
      layoutId={`janela-${fase.id}`}
      className={styles.runner}
      transition={{ duration: DURATION.base, ease: EASE_WOOD }}
      onLayoutAnimationComplete={comecar}
      aria-label={`Fase ${fase.ordem}: ${fase.nome}`}
    >
      <div className={styles.palcoFase}>
        <Emperrou onSair={onSair}>
          {falhou && <p className={styles.carregando}>Não deu para abrir essa janela. Confira a conexão.</p>}
          {!falhou && !Jogo && <p className={styles.carregando}>abrindo a janela…</p>}
          {ativo && Jogo && fase.tipo === "dom" && <Jogo api={faseApi} />}
          {ativo && Jogo && fase.tipo === "three" && (
            <View className={styles.viewCheia}>
              <Jogo api={faseApi} />
            </View>
          )}
        </Emperrou>
      </div>
    </motion.section>

    <motion.div
      className={styles.camadaHud}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.quick, ease: EASE_WOOD }}
    >
      <header className={styles.hud}>
        <button type="button" className={styles.hudSair} onClick={onSair} aria-label="Sair da fase">
          ← parede
        </button>
        <div className={styles.hudTitulo}>
          <span className={styles.hudOrdem}>{diaria ? "janela do dia" : `fase ${fase.ordem}`}</span>
          <span className={styles.hudNome}>{fase.nome}</span>
        </div>
        <div className={styles.hudNumeros}>
          <span ref={relogio} className={styles.hudTempo} aria-label="tempo">
            0:00.0
          </span>
          <span className={styles.hudErros} aria-label={`${erros} erros`}>
            {erros} {erros === 1 ? "erro" : "erros"}
          </span>
        </div>
      </header>

      <div className={styles.falas} aria-live="polite">
        <AnimatePresence>
          {falas.map((f) => (
            <motion.p
              key={f.id}
              className={styles.fala}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.quick, ease: EASE_WOOD }}
            >
              {f.quem && <span className={styles.falaQuem}>{f.quem}</span>}
              {f.texto}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {falhaServidor && (
        <p className={styles.aviso} role="alert">
          O placar não registrou: {falhaServidor}
        </p>
      )}

      <AnimatePresence>
        {mostrarResultado && (
          <motion.div
            className={styles.resultado}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION.base, ease: EASE_WOOD }}
          >
            <motion.div
              className={styles.resultadoCartao}
              initial={{ y: 24 }}
              animate={{ y: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_WOOD }}
              role="dialog"
              aria-label="Resultado"
            >
              <p className={styles.resultadoFechou}>Fechou.</p>
              {resultado ? (
                <>
                  <p className={styles.resultadoNota}>{resultado.nota}</p>
                  {resultado.recorde && (
                    <p className={styles.resultadoRecorde}>{resultado.primeira ? "primeira vez" : "novo recorde"}</p>
                  )}
                  <dl className={styles.resultadoLinhas}>
                    <dt>tempo</dt>
                    <dd>{formatarTempo(resultado.timeMs)}</dd>
                    <dt>alvo</dt>
                    <dd>{formatarTempo(fase.tempoAlvo * 1000)}</dd>
                    <dt>erros</dt>
                    <dd>{resultado.erros}</dd>
                  </dl>
                </>
              ) : (
                !falhaServidor && <p className={styles.mute}>contando os pontos…</p>
              )}
              <div className={styles.resultadoAcoes}>
                {props.temProxima && !diaria && (
                  <button type="button" className={styles.botaoForte} onClick={props.onProxima}>
                    Próxima janela
                  </button>
                )}
                <button type="button" className={styles.botao} onClick={props.onDeNovo}>
                  De novo
                </button>
                <button type="button" className={styles.botao} onClick={onSair}>
                  Parede
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
}
