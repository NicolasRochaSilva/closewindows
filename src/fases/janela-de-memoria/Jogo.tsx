"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { FaseApi } from "@/console/contrato";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import { Janelinha } from "./Janelinha";
import { Papel } from "./Papel";
import { OBJETOS, rotulo } from "./objetos";
import styles from "./Memoria.module.css";

/*
 * Fase 5 — A Janela de Memória. Seis janelas de cianotipia flutuam no papel
 * azul; cada uma guarda a imagem latente de um objeto e uma nota. Elas se
 * revelam numa sequencia e o jogador fecha na mesma ordem. Tres rodadas (3, 4
 * e 5 lembrancas); na terceira, as janelas trocam de lugar depois de mostrar.
 * Errou: a janela superexpoe, api.erro(), a rodada e mostrada de novo. No fim
 * sobra a unica janela que nunca acendeu: ela vem para o centro e se fecha.
 */
const QUEM = "a memória";
const RODADAS = [3, 4, 5];
const ROMANOS = ["i", "ii", "iii"];

/* Ritmo do teste, em ms. */
const INICIO = 1500;
const ANTES = 650;
const PASSO = 820;
const REVELA = 560;
const EMBARALHO = DURATION.swing * 1000 + 250;
const ENTRE = 1000;
const ERRO_ABRE = 750;
const ERRO_REPETE = 1700;

const ERROS = ["Não era essa.", "Eu lembro de tudo. Você, a gente vê.", "De novo. Mais devagar.", "Quase. Quase não conta."];
const ERRO_LUA = "Não era a lua. Nunca é a lua.";
const LUA = OBJETOS.findIndex((o) => o.nome === "lua");

type Etapa = "mostrando" | "vez" | "entre" | "final" | "fechando" | "fechada";

const ESTADO: Record<Etapa, string> = {
  mostrando: "observe",
  vez: "feche na mesma ordem",
  entre: "",
  final: "feche a última",
  fechando: "",
  fechada: "",
};

/** Cinco lembrancas distintas: cada rodada usa o comeco da lista (Genius sem repetir janela). */
function sortearSequencia() {
  const ids = OBJETOS.map((_, i) => i);
  for (let i = ids.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, RODADAS[RODADAS.length - 1]);
}

/** Nova arrumacao em que nenhuma janela fica no mesmo lugar. */
function embaralhar(ordem: number[]) {
  for (;;) {
    const nova = [...ordem].sort(() => Math.random() - 0.5);
    if (nova.every((id, i) => id !== ordem[i])) return nova;
  }
}

export default function Jogo({ api }: { api: FaseApi }) {
  const [sequencia] = useState(sortearSequencia);
  const ultima = OBJETOS.findIndex((_, i) => !sequencia.includes(i));

  const [rodada, setRodada] = useState(0);
  const [etapa, setEtapa] = useState<Etapa>("entre");
  const [revelando, setRevelando] = useState<number | null>(null);
  const [fechadas, setFechadas] = useState<number[]>([]);
  /* ordem[posicao] = objeto. As teclas 1–6 seguem a posicao na tela. */
  const [ordem, setOrdem] = useState(() => OBJETOS.map((_, i) => i));
  const [queima, setQueima] = useState<{ id: number; n: number } | null>(null);
  const [travada, setTravada] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nErros = useRef(0);
  const errou = useRef(false);
  const reportou = useRef(false);
  const botaoFinal = useRef<HTMLButtonElement>(null);
  const calmo = api.reduzirMovimento;

  const depois = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  function mostrar(r: number) {
    const atual = sequencia.slice(0, RODADAS[r]);
    setEtapa("mostrando");
    atual.forEach((id, k) => {
      depois(ANTES + k * PASSO, () => {
        setRevelando(id);
        sfx.nota(id);
      });
      depois(ANTES + k * PASSO + REVELA, () => setRevelando(null));
    });
    let fim = ANTES + atual.length * PASSO;
    if (r === RODADAS.length - 1) {
      depois(fim, () => {
        setOrdem(embaralhar);
        api.fala("Agora lembra do que era. Não de onde estava.", QUEM);
      });
      fim += EMBARALHO;
    }
    depois(fim, () => setEtapa("vez"));
  }

  useEffect(() => {
    api.fala(api.jaFechou ? "Você de novo. Eu lembro." : "Eu mostro. Você fecha na mesma ordem.", QUEM);
    depois(INICIO, () => mostrar(0));
    const pendentes = timers.current;
    return () => pendentes.forEach(clearTimeout);
    // Roda uma vez por tentativa: a sequencia e sorteada na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Quem trava na hora de lembrar ouve alguma coisa. */
  useEffect(() => {
    if (etapa !== "vez" && etapa !== "final") return;
    const texto =
      etapa === "final"
        ? "É só fechar. Essa você nem precisa lembrar."
        : fechadas.length === 0
          ? "Começa pela primeira. Ela costuma ser a primeira."
          : "Eu espero. Eu tenho tempo. Você, nem tanto.";
    const t = setTimeout(() => api.fala(texto, QUEM), 9000);
    return () => clearTimeout(t);
  }, [api, etapa, fechadas.length]);

  useEffect(() => {
    if (etapa === "final") botaoFinal.current?.focus({ preventScroll: true });
  }, [etapa]);

  function concluirRodada() {
    setEtapa("entre");
    if (rodada === RODADAS.length - 1) {
      api.fala("Sobrou uma. Dessa você não precisa lembrar.", QUEM);
      depois(ENTRE + 300, () => setEtapa("final"));
      return;
    }
    if (rodada === 0) api.fala("Até aí, qualquer um.", QUEM);
    else api.fala("Hm. Agora sem a ajuda do lugar.", QUEM);
    depois(ENTRE, () => setFechadas([]));
    depois(ENTRE * 2, () => {
      setRodada(rodada + 1);
      mostrar(rodada + 1);
    });
  }

  function fechar(id: number) {
    if (etapa === "final") {
      if (id !== ultima) return;
      sfx.creak(DURATION.swing);
      setEtapa("fechando");
      return;
    }
    if (etapa !== "vez" || fechadas.includes(id)) return;

    const atual = sequencia.slice(0, RODADAS[rodada]);
    if (id === atual[fechadas.length]) {
      sfx.nota(id);
      const novas = [...fechadas, id];
      setFechadas(novas);
      if (novas.length === atual.length) concluirRodada();
      return;
    }

    api.erro();
    sfx.queima();
    errou.current = true;
    setQueima((q) => ({ id, n: (q?.n ?? 0) + 1 }));
    api.fala(id === LUA ? ERRO_LUA : ERROS[nErros.current++ % ERROS.length], QUEM);
    setEtapa("entre");
    depois(ERRO_ABRE, () => setFechadas([]));
    depois(ERRO_REPETE, () => mostrar(rodada));
  }

  /* Teclado: 1–6 pela posicao na tela; Enter/Espaco ja valem pelo <button>. */
  const aoTeclar = useRef<(e: KeyboardEvent) => void>(() => {});
  aoTeclar.current = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = Number(e.key);
    if (!Number.isInteger(n) || n < 1 || n > ordem.length) return;
    fechar(etapa === "final" ? ultima : ordem[n - 1]);
  };
  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => aoTeclar.current(e);
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, []);

  function travou() {
    if (reportou.current) return;
    reportou.current = true;
    api.fala(!errou.current ? "Nem eu lembraria melhor." : "Pronto. Vou esquecer que você demorou.", QUEM);
    setEtapa("fechada");
    api.fechou();
  }

  const noFinal = etapa === "final" || etapa === "fechando" || etapa === "fechada";
  const camada = { layout: !calmo, transition: { duration: DURATION.swing, ease: EASE_WOOD } };

  return (
    <div className={`${styles.mundo} ${calmo ? styles.calmo : ""} ${api.qualidade === "baixa" ? styles.baixa : ""}`}>
      <Papel qualidade={api.qualidade} />

      <header className={styles.placa}>
        <p className={styles.rodadas} aria-label={`rodada ${rodada + 1} de ${RODADAS.length}`}>
          {ROMANOS.map((r, i) => (
            <span key={r} data-feita={i < rodada || noFinal || undefined} data-atual={(i === rodada && !noFinal) || undefined}>
              {r}
            </span>
          ))}
        </p>
        <p className={styles.estado} aria-live="polite">
          {ESTADO[etapa]}
        </p>
      </header>

      <div className={styles.grade} data-final={noFinal || undefined}>
        {ordem.map((id, posicao) =>
          noFinal && id === ultima ? (
            <div key={`vazio-${id}`} className={styles.cela} />
          ) : (
            <motion.div key={id} layoutId={`memoria-${id}`} className={styles.cela} {...camada}>
              <span className={styles.deriva} style={{ animationDelay: `${-id * 1.7}s`, animationDuration: `${6 + (id % 3)}s` }}>
                <button
                  type="button"
                  className={styles.alvo}
                  onClick={() => fechar(id)}
                  aria-disabled={etapa !== "vez" || fechadas.includes(id)}
                  aria-label={`Janela ${rotulo(id)}${fechadas.includes(id) ? ", fechada" : ""}`}
                  tabIndex={noFinal ? -1 : 0}
                >
                  <Janelinha
                    objeto={id}
                    fechada={fechadas.includes(id) || (noFinal && sequencia.includes(id))}
                    revelando={revelando === id}
                    queima={queima?.id === id ? queima.n : undefined}
                    tecla={posicao + 1}
                    calmo={calmo}
                  />
                </button>
              </span>
            </motion.div>
          ),
        )}
      </div>

      {noFinal && (
        <div className={styles.palcoFinal}>
          <motion.div layoutId={`memoria-${ultima}`} className={styles.celaFinal} {...camada}>
            <button
              ref={botaoFinal}
              type="button"
              className={styles.alvo}
              onClick={() => fechar(ultima)}
              aria-disabled={etapa !== "final"}
              aria-label={etapa === "final" ? `Fechar a janela ${rotulo(ultima)}` : "Janela fechada"}
            >
              <Janelinha
                objeto={ultima}
                grande
                fechada={etapa !== "final"}
                travada={travada}
                calmo={calmo}
                onFolhaParou={() => {
                  if (travada) return;
                  sfx.thud();
                  sfx.latch();
                  setTravada(true);
                }}
                onTravou={travou}
              />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
