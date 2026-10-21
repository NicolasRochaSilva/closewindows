"use client";

import { useEffect, useReducer, useRef } from "react";
import type { FaseApi } from "@/console/contrato";
import { sfx } from "@/lib/sfx";
import { useEncaixe } from "../_kit/useEncaixe";
import { ARTE_A, ARTE_L, Copa, Grao, FolhaArte, Fundo, MacaDesenho, OLHOS, Viciado, useUid, varsDaPaleta } from "./Cena";
import { criarMotor, TRINCO, type EstadoFolha, type Lado, type Motor } from "./motor";
import styles from "./Cena.module.css";

/*
 * Fase 2 — O Viciado em Maçã. A janela de duas folhas comeca aberta; a
 * esquerda fecha primeiro, a direita (com o trinco) por cima. Do galho, o
 * viciado joga maca mordida no ferrolho: com ela ali nada fecha. Ele reage
 * quando voce comeca a fechar. Folha que bate na maca ou na outra folha e erro.
 */
const QUEM = "o viciado";

const rotulo = (lado: Lado, estado: EstadoFolha, venceu: boolean) => {
  const nome = lado === "esq" ? "esquerda" : "direita";
  if (venceu) return "Janela trancada";
  if (estado === "aberta") return `Fechar a folha ${nome}`;
  if (estado === "fechada") return lado === "dir" ? "Reabrir a folha direita" : "Folha esquerda fechada";
  return `Folha ${nome}`;
};

export default function Jogo({ api }: { api: FaseApi }) {
  const uid = useUid();
  const caixa = useRef<HTMLDivElement>(null);
  const encaixe = useRef<HTMLDivElement>(null);
  const escala = useEncaixe(caixa, ARTE_L, ARTE_A, 0.9, 0.01);
  const folhaEsq = useRef<HTMLButtonElement>(null);
  const folhaDir = useRef<HTMLButtonElement>(null);
  const trava = useRef<SVGGElement>(null);
  const maca = useRef<HTMLDivElement>(null);
  const botaoMaca = useRef<HTMLButtonElement>(null);
  const pupilas = useRef<SVGGElement>(null);
  const ponteiro = useRef<{ x: number; y: number } | null>(null);
  const motor = useRef<Motor | null>(null);
  const [, redesenhar] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const m = criarMotor(
      {
        erro: () => api.erro(),
        fechou: () => api.fechou(),
        fala: (texto) => api.fala(texto, QUEM),
        som: (nome) => sfx[nome](),
        mudou: redesenhar,
      },
      { reduzirMovimento: api.reduzirMovimento },
    );
    motor.current = m;
    api.fala(api.jaFechou ? "Você de novo? Trouxe maçã?" : "Opa, visita. Vai fechar? Hmm. Vamos ver.", QUEM);
    m.iniciar(performance.now() / 1000);
    redesenhar();

    /* Um quadro: o motor anda e a gente escreve direto no DOM (sem re-render). */
    let quadro = 0;
    const tique = () => {
      m.passo(performance.now() / 1000);
      desenhar(m);
      quadro = requestAnimationFrame(tique);
    };
    quadro = requestAnimationFrame(tique);
    return () => {
      cancelAnimationFrame(quadro);
      motor.current = null;
    };
  }, [api]);

  function desenhar(m: Motor) {
    if (folhaEsq.current) folhaEsq.current.style.transform = `rotateY(${m.folhas.esq.angulo.valor}deg)`;
    if (folhaDir.current) folhaDir.current.style.transform = `translateZ(1px) rotateY(${m.folhas.dir.angulo.valor}deg)`;
    trava.current?.setAttribute("transform", `rotate(${m.trinco.valor} 5 120)`);

    const { estado, x, y, giro, alfa, tremor } = m.maca;
    if (maca.current) {
      const tranco = tremor * Math.sin(tremor * 40) * 3;
      maca.current.style.transform = `translate(${x + tranco}px, ${y}px) rotate(${giro}deg)`;
      maca.current.style.opacity = estado === "mao" ? "0" : String(Math.max(0, alfa));
    }

    /* Os olhos seguem a maca no ar, o ferrolho quando ele mira, senao o seu dedo. */
    const alvo =
      estado === "voando" || estado === "caindo" ? m.maca : m.pose === "mirando" ? TRINCO : (ponteiro.current ?? TRINCO);
    const dx = alvo.x - OLHOS.x;
    const dy = alvo.y - OLHOS.y;
    const dist = Math.hypot(dx, dy) || 1;
    pupilas.current?.setAttribute("transform", `translate(${((dx / dist) * 3).toFixed(2)} ${((dy / dist) * 3).toFixed(2)})`);
  }

  function apontar(e: React.PointerEvent) {
    const caixaArte = encaixe.current?.getBoundingClientRect();
    if (!caixaArte) return;
    const k = caixaArte.width / ARTE_L;
    ponteiro.current = { x: (e.clientX - caixaArte.left) / k, y: (e.clientY - caixaArte.top) / k };
  }

  const tocar = (lado: Lado) => motor.current?.tocarFolha(lado);

  function tirar() {
    const m = motor.current;
    if (!m) return;
    /* O botao da maca some: o foco vai para a folha que ainda precisa fechar. */
    if (document.activeElement === botaoMaca.current) {
      (m.folhas.esq.estado === "fechada" ? folhaDir : folhaEsq).current?.focus();
    }
    m.tirarMaca();
  }

  const m = motor.current;
  const venceu = m?.venceu ?? false;
  const esq = m?.folhas.esq.estado ?? "aberta";
  const dir = m?.folhas.dir.estado ?? "aberta";
  const classes = [styles.mundo, api.qualidade === "baixa" ? styles.baixa : ""].join(" ");

  return (
    <div ref={caixa} className={classes} style={varsDaPaleta} onPointerMove={apontar} onPointerDown={apontar}>
      <div ref={encaixe} className={styles.encaixe} style={{ transform: `translate(-50%, -50%) scale(${escala})` }}>
        <Fundo uid={uid} />
        <Copa uid={uid} vento={api.qualidade === "alta" && !api.reduzirMovimento} />
        <Viciado uid={uid} pose={m?.pose ?? "mastigando"} pupilas={pupilas} animado={!api.reduzirMovimento} />

        {m?.maca.estado === "presa" && (
          <button ref={botaoMaca} type="button" className={styles.tirar} onClick={tirar} aria-label="Tirar a maçã do trinco" />
        )}

        <div className={styles.janela3d}>
          <div className={`${styles.zona} ${styles.zonaEsq}`} onClick={() => tocar("esq")} aria-hidden="true" />
          <div className={`${styles.zona} ${styles.zonaDir}`} onClick={() => tocar("dir")} aria-hidden="true" />
          <button
            ref={folhaEsq}
            type="button"
            className={`${styles.folha} ${styles.folhaEsq}`}
            onClick={() => tocar("esq")}
            aria-disabled={venceu || esq === "fechada"}
            aria-label={rotulo("esq", esq, venceu)}
          >
            <FolhaArte lado="esq" />
          </button>
          <button
            ref={folhaDir}
            type="button"
            className={`${styles.folha} ${styles.folhaDir}`}
            onClick={() => tocar("dir")}
            aria-disabled={venceu}
            aria-label={rotulo("dir", dir, venceu)}
          >
            <FolhaArte lado="dir" trava={trava} />
          </button>
        </div>

        <div ref={maca} className={styles.maca} aria-hidden="true">
          <svg viewBox="-16 -16 32 32" width="32" height="32" overflow="visible">
            <MacaDesenho />
          </svg>
        </div>
      </div>
      <Grao />
    </div>
  );
}
