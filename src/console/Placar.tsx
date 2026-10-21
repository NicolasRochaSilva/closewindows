"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { FaseMeta } from "./contrato";
import { api, type PlacarDados } from "./cliente";
import { formatarTempo } from "./Runner";
import { DURATION, EASE_WOOD } from "@/lib/motion";
import styles from "./console.module.css";

type Aba = "geral" | "fase" | "hoje";

export default function Placar({ fases, usuario, onFechar }: { fases: FaseMeta[]; usuario: string; onFechar: () => void }) {
  const [dados, setDados] = useState<PlacarDados | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [aba, setAba] = useState<Aba>("geral");
  const jogaveis = fases.filter((f) => !f.emObras);
  const [faseId, setFaseId] = useState(jogaveis[0]?.id ?? "");

  useEffect(() => {
    api.placar().then(setDados, () => setFalhou(true));
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const nomeFase = (id: string) => fases.find((f) => f.id === id)?.nome ?? id;
  const eu = (nome: string) => (nome === usuario ? styles.linhaMinha : undefined);

  return (
    <motion.div
      className={styles.placarFundo}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: DURATION.quick, ease: EASE_WOOD }}
      onClick={onFechar}
    >
      <motion.div
        className={styles.placar}
        role="dialog"
        aria-label="Placar"
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        transition={{ duration: DURATION.base, ease: EASE_WOOD }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.placarTopo}>
          <h2 className={styles.placarTitulo}>Placar</h2>
          <button type="button" className={styles.link} onClick={onFechar}>
            fechar
          </button>
        </header>

        <div className={styles.abas} role="tablist">
          {(["geral", "fase", "hoje"] as const).map((a) => (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={aba === a}
              className={styles.aba}
              onClick={() => setAba(a)}
            >
              {a === "geral" ? "Geral" : a === "fase" ? "Por fase" : "Hoje"}
            </button>
          ))}
        </div>

        {falhou && <p className={styles.aviso}>Não deu para carregar o placar.</p>}
        {!dados && !falhou && <p className={styles.mute}>carregando…</p>}

        {dados && aba === "geral" && (
          <ol className={styles.tabela}>
            {dados.geral.length === 0 && <li className={styles.mute}>Ninguém fechou nada ainda.</li>}
            {dados.geral.map((l, i) => (
              <li key={l.username} className={eu(l.username)}>
                <span className={styles.pos}>{i + 1}</span>
                <span className={styles.nome}>{l.username}</span>
                <span className={styles.num}>{l.fases} fases</span>
                <span className={styles.numForte}>{l.total}</span>
              </li>
            ))}
          </ol>
        )}

        {dados && aba === "fase" && (
          <>
            <select className={styles.seletor} value={faseId} onChange={(e) => setFaseId(e.target.value)} aria-label="Fase">
              {jogaveis.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ordem}. {f.nome}
                </option>
              ))}
            </select>
            <ol className={styles.tabela}>
              {(dados.porFase[faseId] ?? []).length === 0 && <li className={styles.mute}>Ninguém fechou essa ainda.</li>}
              {(dados.porFase[faseId] ?? []).map((l, i) => (
                <li key={l.username} className={eu(l.username)}>
                  <span className={styles.pos}>{i + 1}</span>
                  <span className={styles.nome}>{l.username}</span>
                  <span className={styles.num}>{l.erros} erros</span>
                  <span className={styles.numForte}>{formatarTempo(l.timeMs)}</span>
                </li>
              ))}
            </ol>
          </>
        )}

        {dados && aba === "hoje" && (
          <>
            <p className={styles.mute}>
              Janela do dia: <strong>{nomeFase(dados.dia.faseId)}</strong>
            </p>
            <ol className={styles.tabela}>
              {dados.dia.top.length === 0 && <li className={styles.mute}>Ninguém fechou hoje. Ainda.</li>}
              {dados.dia.top.map((l, i) => (
                <li key={l.username} className={eu(l.username)}>
                  <span className={styles.pos}>{i + 1}</span>
                  <span className={styles.nome}>{l.username}</span>
                  <span className={styles.numForte}>{l.nota}</span>
                </li>
              ))}
            </ol>
            <div className={styles.devendo}>
              <p>
                <span className={styles.ok}>fecharam</span> {dados.dia.fecharam.join(", ") || "ninguém"}
              </p>
              <p>
                <span className={styles.ruim}>devendo</span> {dados.dia.devendo.join(", ") || "ninguém 🎉"}
              </p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
