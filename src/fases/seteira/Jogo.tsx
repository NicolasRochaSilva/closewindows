"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent } from "react";
import { motion, useAnimate } from "motion/react";
import type { FaseApi } from "@/console/contrato";
import { DURATION, impactShake, panelIn } from "@/lib/motion";
import { sfx } from "@/lib/sfx";
import { useEncaixe } from "../_kit/useEncaixe";
import { Controles } from "./Controles";
import { FILEIRAS } from "./arte";
import { LADO, SALA_A, SALA_L, Sala } from "./Sala";
import { COMECO, INICIAL, LARGURA, acaoPara, passo, type Acao, type Casa, type Estado, type Perigo } from "./turnos";
import styles from "./Seteira.module.css";

/*
 * Fase 6 — A Seteira. Masmorra por turnos: cada passo (ou esperar) e um
 * turno, e lâminas, pendulo e esqueleto andam num ritmo fixo. Levou golpe:
 * erro e volta ao comeco. Empurrou a seteira: a portinhola bate, o ferrolho
 * corre e so entao `api.fechou()`.
 */
const QUEM = "o esqueleto";
const ABERTURA = "Ninguém fecha a minha seteira. Eu gosto do vento.";
const DE_NOVO = "Voltou? O vento sentiu sua falta.";
const ESPERA = "Esperar também é um passo. Espaço, ou a ampulheta.";
const FIM = "…ficou abafado aqui agora.";
const DEBOCHE: Record<Perigo, string[]> = {
  lamina: ["Brilhou, sobe. Todo mundo sabe.", "Lâmina erguida corta, fechador.", "Olha o brilho antes de pisar."],
  pendulo: ["A sombra no chão avisa onde ele cai.", "Pêndulo não espera ninguém.", "Viu a sombra? Pois é."],
  esqueleto: ["Eu ando em círculo. Sempre o mesmo círculo.", "Volta pro começo, fechador.", "Minha ronda, minhas regras."],
};
/* Sem sair do comeco por esse tempo, ele ensina a esperar. */
const ESPERA_MS = 9000;

const TECLAS: Record<string, Acao> = {
  ArrowUp: "cima",
  ArrowDown: "baixo",
  ArrowLeft: "esquerda",
  ArrowRight: "direita",
  w: "cima",
  s: "baixo",
  a: "esquerda",
  d: "direita",
  " ": "esperar",
  ".": "esperar",
};

type Fase = "jogando" | "fechando" | "fechada";
type Jogada = { estado: Estado; golpe: { onde: Casa; t: number } | null; fase: Fase };

export default function Jogo({ api }: { api: FaseApi }) {
  const palco = useRef<HTMLDivElement>(null);
  const sala = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(palco, SALA_L, SALA_A, 0.98, 0.125);
  const [cena, animar] = useAnimate<HTMLDivElement>();
  const reduzir = api.reduzirMovimento;

  /* Estado do jogo em ref: duas teclas no mesmo quadro nao leem estado velho. */
  const jogo = useRef<Jogada>({ estado: INICIAL, golpe: null, fase: "jogando" });
  const [, redesenhar] = useReducer((n: number) => n + 1, 0);
  const [vida, setVida] = useState(0);
  const [viradoEsq, setViradoEsq] = useState(false);
  const [fechar, setFechar] = useState(false);
  const [ventando, setVentando] = useState(true);

  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const vento = useRef<ReturnType<typeof sfx.wind>>(null);
  const deboches = useRef<Record<Perigo, number>>({ lamina: 0, pendulo: 0, esqueleto: 0 });
  const reportou = useRef(false);
  const fechou = useRef(false);

  const depois = useCallback((ms: number, fn: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  const tremer = useCallback(() => {
    if (!reduzir && cena.current) void animar(cena.current, { x: impactShake.x }, impactShake.transition);
  }, [animar, cena, reduzir]);

  const comecarAFechar = useCallback(() => {
    if (fechou.current) return;
    fechou.current = true;
    sfx.creak(DURATION.swing);
    setFechar(true);
  }, []);

  useEffect(() => {
    api.fala(api.jaFechou ? DE_NOVO : ABERTURA, QUEM);
    const lista = timers.current;
    return () => {
      lista.forEach(clearTimeout);
      lista.clear();
      vento.current?.stop();
    };
  }, [api]);

  useEffect(() => {
    const id = setTimeout(() => {
      const { estado, fase } = jogo.current;
      if (fase === "jogando" && estado.jogador.y === COMECO.y) api.fala(ESPERA, QUEM);
    }, ESPERA_MS);
    return () => clearTimeout(id);
  }, [api]);

  const agir = useCallback(
    (acao: Acao) => {
      const j = jogo.current;
      if (j.fase !== "jogando" || j.golpe) return;
      const r = passo(j.estado, acao);
      if (r.tipo === "parede") {
        sfx.thud();
        return;
      }

      /* O vento so comeca a soar depois de um gesto (politica de audio do navegador). */
      vento.current ??= sfx.wind();
      if (acao === "esquerda") setViradoEsq(true);
      if (acao === "direita") setViradoEsq(false);

      if (r.tipo === "andou") {
        j.estado = r.estado;
        sfx.passo();
        vento.current?.strength(0.15 + 0.45 * (1 - r.estado.jogador.y / COMECO.y));
        redesenhar();
        return;
      }

      if (r.tipo === "dano") {
        j.golpe = { onde: r.onde, t: r.t };
        redesenhar();
        sfx.golpe();
        tremer();
        api.erro();
        const falas = DEBOCHE[r.por];
        api.fala(falas[deboches.current[r.por]++ % falas.length], QUEM);
        depois(DURATION.swing * 1000, () => {
          j.golpe = null;
          j.estado = INICIAL;
          setVida((v) => v + 1);
          vento.current?.strength(0.15);
        });
        return;
      }

      j.fase = "fechando";
      sfx.thud();
      redesenhar();
      /* Sem movimento reduzido a camera chega perto primeiro; a portinhola fecha no fim do zoom. */
      if (reduzir) comecarAFechar();
    },
    [api, comecarAFechar, depois, reduzir, tremer],
  );

  function bateu() {
    sfx.slam(1);
    tremer();
  }

  function travou() {
    sfx.latch();
    setVentando(false);
    vento.current?.stop();
    vento.current = null;
    jogo.current.fase = "fechada";
    api.fala(FIM, QUEM);
    depois(DURATION.base * 1000, () => {
      if (reportou.current) return;
      reportou.current = true;
      api.fechou();
    });
  }

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const acao = TECLAS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!acao) return;
      /* Espaco num botao focado e clique do botao, nao "esperar". */
      if (e.key === " " && e.target instanceof HTMLButtonElement) return;
      e.preventDefault();
      agir(acao);
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [agir]);

  /* Toque numa casa vizinha (ou na propria, para esperar) anda ate ela. */
  function tocar(e: PointerEvent<HTMLDivElement>) {
    const el = sala.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const lado = r.width / LARGURA;
    const casa = { x: Math.floor((e.clientX - r.left) / lado), y: Math.floor((e.clientY - r.top) / lado) - 1 };
    if (casa.x < 0 || casa.x >= LARGURA || casa.y < -1 || casa.y >= FILEIRAS - 1) return;
    const acao = acaoPara(jogo.current.estado.jogador, casa);
    if (acao) agir(acao);
  }

  const { estado, golpe, fase } = jogo.current;
  const fechando = fase !== "jogando";

  return (
    <div className={styles.mundo}>
      <div className={styles.layout}>
        <div ref={palco} className={styles.palco} onPointerDown={tocar}>
          <div className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
            <div ref={cena}>
              <motion.div
                className={styles.camera}
                initial={false}
                animate={fechando && !reduzir ? { y: SALA_A / 2 - LADO, scale: 2.5 } : { y: 0, scale: 1 }}
                transition={panelIn}
                onAnimationComplete={() => fechando && comecarAFechar()}
              >
                <div ref={sala}>
                  <Sala
                    t={golpe ? golpe.t : estado.t}
                    jogador={golpe ? golpe.onde : estado.jogador}
                    vida={vida}
                    viradoEsq={viradoEsq}
                    empurrando={fechando}
                    golpe={golpe?.onde}
                    ventando={ventando}
                    fechar={fechar}
                    qualidade={api.qualidade}
                    reduzir={reduzir}
                    onBateu={bateu}
                    onTravou={travou}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <Controles onAcao={agir} parado={fechando} />
      </div>
    </div>
  );
}
