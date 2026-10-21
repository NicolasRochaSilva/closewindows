"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { FaseApi } from "@/console/contrato";
import { DURATION, impactShake } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Cela, type Fechamento } from "./Cela";
import { inicial, mover, resolver, type Dir, type Estado } from "./nivel";
import styles from "./Jogo.module.css";

/*
 * Fase 7 — A Cela do Carcereiro. Sokoban de masmorra: a janelinha gradeada
 * esta aberta e a tranca ficou pendurada no gancho, do outro lado dos
 * caixotes. Pega a tranca, volta, fecha. Desfazer ou recomecar conta erro.
 */
const QUEM = "o carcereiro";
const SEM_TRANCA = ["Empurrar a janela não tranca nada.", "Sem tranca, não fecha. Regra da casa.", "A tranca tá no gancho. Lá embaixo."];
const DESFEZ = ["Arrependido? Todo preso é.", "Volta, volta.", "Desfazer não apaga o que eu vi.", "Hm. De novo."];
const DEMORA: [number, string][] = [
  [40000, "Dica de graça: caixote não volta. Empurrou errado, desfaz."],
  [80000, "Aquele nicho à esquerda não tá vazio à toa."],
  [120000, "O ralo do corredor engole um caixote inteirinho, sabia?"],
];

const TECLAS: Record<string, Dir> = {
  arrowup: "cima", w: "cima",
  arrowdown: "baixo", s: "baixo",
  arrowleft: "esq", a: "esq",
  arrowright: "dir", d: "dir",
};

type Jogada = { estado: Estado; antes: Estado[] };

export default function Jogo({ api }: { api: FaseApi }) {
  const caixa = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 0.98, 1);
  const [jogo, setJogo] = useState<Jogada>(() => ({ estado: inicial(), antes: [] }));
  const [fechamento, setFechamento] = useState<Fechamento>("aberta");
  const timers = useRef<number[]>([]);
  const falas = useRef({ semTranca: 0, desfez: 0 });
  const semSaida = useRef(false);
  const reportou = useRef(false);

  const calmo = api.reduzirMovimento;
  const passo = calmo ? 0 : DURATION.snap;

  useEffect(() => {
    api.fala(
      api.jaFechou ? "Você de novo? Pendurei a tranca no gancho outra vez." : "Quer fechar a janela? A tranca tá no gancho, do outro lado dos caixotes. Vai buscar.",
      QUEM,
    );
  }, [api]);

  useEffect(() => {
    if (fechamento !== "aberta") return;
    const ts = DEMORA.map(([ms, texto]) => window.setTimeout(() => api.fala(texto, QUEM), ms));
    return () => ts.forEach(clearTimeout);
  }, [api, fechamento]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function depois(segundos: number, f: () => void) {
    timers.current.push(window.setTimeout(f, calmo ? 0 : segundos * 1000));
  }

  /* A tranca voa ate a janela, a folha bate no batente, o ferrolho corre. */
  function fechar() {
    setFechamento("voa");
    sfx.toss();
    const bate = DURATION.base + DURATION.swing;
    depois(DURATION.base, () => {
      setFechamento("fecha");
      sfx.creak(DURATION.swing);
    });
    depois(bate, () => {
      sfx.slam(1);
      setFechamento("trava");
    });
    depois(bate + DURATION.quick, () => sfx.latch());
    depois(bate + DURATION.quick + DURATION.base, () => {
      if (reportou.current) return;
      reportou.current = true;
      api.fala("Trancou. Pelo menos agora não entra vento.", QUEM);
      api.fechou();
    });
  }

  function andar(d: Dir) {
    if (fechamento !== "aberta") return;
    const { estado: novo, evento } = mover(jogo.estado, d);
    const avanca = () => setJogo({ estado: novo, antes: [...jogo.antes, jogo.estado] });

    switch (evento) {
      case "andou":
        avanca();
        return;
      case "empurrou":
        avanca();
        sfx.arrasto();
        if (!semSaida.current && !resolver(novo)) {
          semSaida.current = true;
          api.fala("Hehe. Daí não sai mais. Desfaz ou recomeça.", QUEM);
        }
        return;
      case "pegou":
        avanca();
        sfx.latch();
        api.fala("Ei, isso é meu! …Tá. Fecha logo essa janela.", QUEM);
        return;
      case "semTranca":
        setJogo({ ...jogo, estado: novo });
        sfx.thud();
        api.fala(SEM_TRANCA[falas.current.semTranca++ % SEM_TRANCA.length], QUEM);
        return;
      case "fechou":
        setJogo({ ...jogo, estado: novo });
        fechar();
        return;
      case "bateu":
        setJogo({ ...jogo, estado: novo });
    }
  }

  function desfazer() {
    const anterior = jogo.antes.at(-1);
    if (fechamento !== "aberta" || !anterior) return;
    setJogo({ estado: anterior, antes: jogo.antes.slice(0, -1) });
    semSaida.current = semSaida.current && !resolver(anterior);
    api.erro();
    sfx.thud();
    api.fala(DESFEZ[falas.current.desfez++ % DESFEZ.length], QUEM);
  }

  function recomecar() {
    if (fechamento !== "aberta" || jogo.antes.length === 0) return;
    setJogo({ estado: inicial(), antes: [] });
    semSaida.current = false;
    api.erro();
    sfx.slam(0.4);
    api.fala("Do começo. Eu tenho a noite toda.", QUEM);
  }

  /* Teclado: setas/WASD andam; Z (ou Backspace) desfaz; R recomeca. */
  const aoTeclar = useRef<(e: KeyboardEvent) => void>(() => {});
  aoTeclar.current = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tecla = e.key.toLowerCase();
    const d = TECLAS[tecla];
    if (d) {
      e.preventDefault();
      andar(d);
    } else if (tecla === "z" || tecla === "backspace") {
      e.preventDefault();
      if (!e.repeat) desfazer();
    } else if (tecla === "r") {
      e.preventDefault();
      if (!e.repeat) recomecar();
    }
  };
  useEffect(() => {
    const ouvir = (e: KeyboardEvent) => aoTeclar.current(e);
    window.addEventListener("keydown", ouvir);
    return () => window.removeEventListener("keydown", ouvir);
  }, []);

  const parado = fechamento !== "aberta";

  return (
    <div className={styles.mundo}>
      <div ref={caixa} className={styles.tabuleiro}>
        <motion.div
          className={styles.arte}
          style={{ width: ARTE_L * escala, height: ARTE_A * escala }}
          animate={fechamento === "trava" && !calmo ? impactShake : { x: 0 }}
        >
          <Cela estado={jogo.estado} fechamento={fechamento} vivo={!calmo && api.qualidade !== "baixa"} passo={passo} />
        </motion.div>
      </div>

      <div className={styles.controles}>
        <div className={styles.cruz} role="group" aria-label="Andar e empurrar">
          {(["cima", "esq", "dir", "baixo"] as const).map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.botao} ${styles[d]}`}
              onClick={() => andar(d)}
              disabled={parado}
              aria-label={ROTULO[d]}
            >
              <Seta d={d} />
            </button>
          ))}
        </div>
        <div className={styles.acoes}>
          <button type="button" className={styles.botao} onClick={desfazer} disabled={parado || jogo.antes.length === 0} aria-label="Desfazer a última jogada (tecla Z)">
            Desfazer
          </button>
          <button type="button" className={styles.botao} onClick={recomecar} disabled={parado || jogo.antes.length === 0} aria-label="Recomeçar a cela (tecla R)">
            Recomeçar
          </button>
        </div>
      </div>
    </div>
  );
}

const ROTULO: Record<Dir, string> = {
  cima: "Andar para cima",
  baixo: "Andar para baixo",
  esq: "Andar para a esquerda",
  dir: "Andar para a direita",
};

/** Seta em degraus de pixel, apontando para cima; o CSS gira conforme a direcao. */
function Seta({ d }: { d: Dir }) {
  return (
    <svg className={`${styles.seta} ${styles[`seta_${d}`]}`} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true">
      <rect x={5} y={1} width={2} height={1} />
      <rect x={4} y={2} width={4} height={1} />
      <rect x={3} y={3} width={6} height={1} />
      <rect x={2} y={4} width={8} height={1} />
      <rect x={1} y={5} width={10} height={1} />
      <rect x={4} y={6} width={4} height={5} />
    </svg>
  );
}
