"use client";

import { useEffect, useMemo, useRef, type PointerEvent as PE } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { FaseApi } from "@/console/contrato";
import { sfx } from "@/lib/sfx";
import {
  ABERTA_MAX,
  Ceu,
  Chuva,
  Cipreste,
  COR,
  Cortina,
  distanciaCamera,
  DOBRADICA,
  Folha,
  forcarRaio,
  Luzes,
  Morros,
  novoClima,
  passoRelampago,
  posicionarCamera,
  Quarto,
  Raio,
  useTexturas,
  Vela,
} from "./cena";
import { avancar, forca, novoVento } from "./vento";
import styles from "./Jogo.module.css";

/*
 * Fase 3 — A Janela Chuvosa. A tempestade empurra a folha para dentro; voce a
 * arrasta de volta nas calmarias. Se a rajada chega com a folha na sua mao,
 * ela arranca e escancara: erro. O aviso vem antes: a vela deita, a cortina
 * incha, o vento assobia. Encostou no batente fora da rajada: trava.
 */

const QUEM = "a tempestade";
const ARRANCOU = ["Escorregou?", "Eu sopro, você corre atrás.", "Segura firme. Brincadeira: solta.", "Quase. Mentira, nem quase."];
const FALSO = ["Medroso.", "Só um susto."];
/* Falas por tempo de jogo (s), enquanto a janela esta aberta. */
const ROTEIRO: [number, string][] = [
  [8.5, "Quando a vela deita, é a minha vez."],
  [17, "Tenho a noite toda."],
  [27, "A chuva tá entrando, viu?"],
];

/* Mao no puxador: mola criticamente amortecida e velocidade maxima (madeira molhada pesa). */
const MAO_K = 60;
const MAO_C = 15.5;
const VEL_MAX = 2.6;
/* Folha passa um tico do batente: o puxao chega a travar. */
const ALEM = 0.08;
/* Onde a mao pega antes de saber (perto do puxador). */
const RAIO_PADRAO = 1.1;

type Pegada = "toque" | "tecla" | null;

export default function Jogo({ api }: { api: FaseApi }) {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const clima = useMemo(novoClima, []);
  const vento = useMemo(novoVento, []);
  const tex = useTexturas(true);
  const qualidade = api.qualidade;
  const reduzir = api.reduzirMovimento;

  const folha = useRef<THREE.Group>(null);
  const macaneta = useRef<THREE.Group>(null);
  const alvo = useRef<THREE.Mesh>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const camada = useRef<HTMLDivElement>(null);

  const camAtual = useMemo(() => ({ dx: 0, dy: 0 }), []);
  const f = useMemo(() => ({
    ang: ABERTA_MAX,
    vel: 0,
    pegada: null as Pegada,
    ponteiro: -1,
    /* Onde a mao pegou: distancia da dobradica e altura. */
    raio: RAIO_PADRAO,
    gy: 0,
    ndc: new THREE.Vector2(),
    paralaxe: new THREE.Vector2(),
    segurouNoAviso: false,
    travada: false,
    desde: 0,
    trincou: false,
    raioFinal: false,
    fechou: false,
    tranco: 0,
    ultimaBatida: 0,
    trovaoEm: -1,
    trovaoPerto: 0,
    arrancadas: 0,
    falsos: 0,
    roteiro: 0,
    somEm: 0,
  }), []);

  const aux = useMemo(() => ({ p: new THREE.Vector3(), raycaster: new THREE.Raycaster(), ndc: new THREE.Vector2() }), []);
  const som = useRef<{
    chuva: ReturnType<typeof sfx.rain>;
    vento: ReturnType<typeof sfx.wind>;
    rangido: ReturnType<typeof sfx.creakFollow>;
  }>({ chuva: null, vento: null, rangido: null });

  /* Som continuo de chuva e vento: nasce com a fase, morre com ela. */
  useEffect(() => {
    const s = som.current;
    s.chuva = sfx.rain();
    s.vento = sfx.wind();
    return () => {
      s.chuva?.stop();
      s.vento?.stop();
      s.rangido?.stop();
    };
  }, []);

  useEffect(() => {
    api.fala(api.jaFechou ? "Voltou pra se molhar?" : "Fecha. Se conseguir.", QUEM);
    const toque = window.matchMedia("(pointer: coarse)").matches;
    const dica = setTimeout(
      () => !f.travada && api.fala(toque ? "Arrasta a folha. Eu espero." : "Arrasta a folha. Ou segura espaço. Eu espero.", QUEM),
      3800,
    );
    return () => clearTimeout(dica);
  }, [api, f]);

  function segurar(modo: Pegada) {
    if (f.travada) return;
    f.pegada = modo;
  }

  function soltar() {
    f.pegada = null;
    f.ponteiro = -1;
  }

  /* Teclado: segurar espaco/enter puxa; soltar a tecla solta a folha. */
  useEffect(() => {
    const ehTecla = (e: KeyboardEvent) => e.code === "Space" || e.key === " " || e.key === "Enter";
    const outroControle = (t: EventTarget | null) =>
      t instanceof HTMLElement && t !== botao.current && !!t.closest("button, a, input, textarea, select");
    const desce = (e: KeyboardEvent) => {
      if (!ehTecla(e) || outroControle(e.target)) return;
      e.preventDefault();
      if (!e.repeat && !f.pegada) segurar("tecla");
    };
    const sobe = (e: KeyboardEvent) => {
      if (ehTecla(e) && f.pegada === "tecla") soltar();
    };
    const perdeu = () => soltar();
    window.addEventListener("keydown", desce);
    window.addEventListener("keyup", sobe);
    window.addEventListener("blur", perdeu);
    botao.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", desce);
      window.removeEventListener("keyup", sobe);
      window.removeEventListener("blur", perdeu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function paraNdc(e: PE<HTMLDivElement>, destino: THREE.Vector2) {
    const r = e.currentTarget.getBoundingClientRect();
    destino.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  /* Toque/mouse: so agarra se o raio do ponteiro acerta a folha (ou a folga em volta). */
  function agarrar(e: PE<HTMLDivElement>) {
    if (f.travada || f.pegada || !alvo.current) return;
    paraNdc(e, aux.ndc);
    aux.raycaster.setFromCamera(aux.ndc, cam);
    const acerto = aux.raycaster.intersectObject(alvo.current, false)[0];
    if (!acerto) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    f.ponteiro = e.pointerId;
    f.ndc.copy(aux.ndc);
    f.raio = Math.max(0.3, Math.hypot(acerto.point.x - DOBRADICA.x, acerto.point.z - DOBRADICA.z));
    f.gy = acerto.point.y;
    segurar("toque");
  }

  function mover(e: PE<HTMLDivElement>) {
    paraNdc(e, f.paralaxe);
    if (e.pointerId === f.ponteiro) f.ndc.copy(f.paralaxe);
  }

  function largar(e: PE<HTMLDivElement>) {
    if (e.pointerId === f.ponteiro) soltar();
  }

  /** Angulo em que o ponto agarrado fica sob o dedo (busca na projecao: robusto em qualquer camera). */
  function anguloDoPonteiro() {
    const medir = (a: number) => {
      aux.p.set(DOBRADICA.x + f.raio * Math.cos(a), f.gy, DOBRADICA.z - f.raio * Math.sin(a)).project(cam);
      return Math.abs(aux.p.x - f.ndc.x);
    };
    const passos = 32;
    const passo = (ALEM - ABERTA_MAX) / passos;
    let melhor = f.ang;
    let menor = Infinity;
    for (let i = 0; i <= passos; i += 1) {
      const a = ABERTA_MAX + passo * i;
      const d = medir(a);
      if (d < menor) [menor, melhor] = [d, a];
    }
    const centro = melhor;
    for (let i = -6; i <= 6; i += 1) {
      const a = centro + (passo / 6) * i;
      const d = medir(a);
      if (d < menor) [menor, melhor] = [d, a];
    }
    return THREE.MathUtils.clamp(melhor, ABERTA_MAX, ALEM);
  }

  function arrancar() {
    soltar();
    f.vel = -7.5;
    f.arrancadas += 1;
    if (!reduzir) f.tranco = 0.8;
    api.erro();
    api.fala(ARRANCOU[(f.arrancadas - 1) % ARRANCOU.length], QUEM);
  }

  function travar(velocidade: number) {
    soltar();
    f.travada = true;
    f.ang = 0;
    f.vel = 0;
    f.desde = 0;
    if (!reduzir) f.tranco = 0.6;
    sfx.slam(THREE.MathUtils.clamp(velocidade / VEL_MAX, 0.45, 1));
    som.current.chuva?.muffle(true);
    som.current.rangido?.stop();
  }

  useFrame((_, dtBruto) => {
    const dt = Math.min(dtBruto, 1 / 30);
    const s = som.current;

    /* Tempo, relampago e trovao (o som chega depois da luz). */
    if (passoRelampago(clima, dt, reduzir)) {
      const atraso = 0.25 + Math.random() * 1.1;
      f.trovaoEm = clima.tempo + atraso;
      f.trovaoPerto = 1 - atraso / 1.35;
    }
    if (f.trovaoEm > 0 && clima.tempo >= f.trovaoEm) {
      f.trovaoEm = -1;
      sfx.thunder(f.trovaoPerto * (f.travada ? 0.6 : 1));
    }

    /* Vento: a tempestade continua la fora mesmo depois de fechar. */
    const evento = avancar(vento, dt);
    if (!f.travada) {
      if (evento === "aviso") f.segurouNoAviso = f.pegada !== null;
      if (evento === "rajada" && f.pegada) arrancar();
      if (evento === "falso" && f.segurouNoAviso && !f.pegada && f.falsos < FALSO.length) {
        api.fala(FALSO[f.falsos++], QUEM);
      }
      const roteiro = ROTEIRO[f.roteiro];
      if (roteiro && clima.tempo >= roteiro[0]) {
        f.roteiro += 1;
        api.fala(roteiro[1], QUEM);
      }
    }
    clima.forca += (forca(vento) - clima.forca) * Math.min(1, dt * 5);
    const abertura = THREE.MathUtils.clamp(f.ang / ABERTA_MAX, 0, 1);
    clima.forcaDentro = clima.forca * Math.min(1, abertura * 1.8);

    /* Fisica da folha. */
    if (!f.travada) {
      const rajada = vento.fase === "rajada";
      const t = clima.tempo;
      const sopro = -(0.5 + 15 * Math.pow(clima.forca, 1.6)) * (1 + 0.3 * Math.sin(t * 7.3) * Math.sin(t * 2.9));
      const comMao = f.pegada !== null && !rajada;
      let acel: number;
      if (comMao) {
        const mira = f.pegada === "tecla" ? ALEM : anguloDoPonteiro();
        acel = MAO_K * (mira - f.ang) - MAO_C * f.vel + sopro * 0.25;
      } else {
        acel = sopro - 0.8 * f.vel;
      }
      f.vel += acel * dt;
      if (comMao) f.vel = THREE.MathUtils.clamp(f.vel, -VEL_MAX, VEL_MAX);
      f.ang += f.vel * dt;

      /* Bate na parede de dentro e volta um pouco. */
      if (f.ang < ABERTA_MAX) {
        f.ang = ABERTA_MAX;
        if (f.vel < -1.2 && t - f.ultimaBatida > 0.25) {
          f.ultimaBatida = t;
          sfx.slam(Math.min(1, -f.vel / 8) * 0.7);
          if (!reduzir) f.tranco = Math.max(f.tranco, Math.min(0.5, -f.vel * 0.05));
        }
        f.vel = Math.abs(f.vel) * 0.3;
      }
      /* Chegou no batente: fora da rajada, trava; na rajada, ricocheteia. */
      if (f.ang >= 0) {
        if (!rajada && (f.pegada || f.vel > 0.4)) travar(f.vel);
        else {
          f.ang = 0;
          f.vel = -Math.abs(f.vel) * 0.4;
        }
      }

      /* Rangido acompanha a velocidade da folha. */
      const rapidez = Math.abs(f.vel);
      if (rapidez > 0.25 && (!s.rangido || !s.rangido.alive())) s.rangido = sfx.creakFollow();
      s.rangido?.speed(rapidez / 4);
    } else {
      /* Fechou: a cremona gira, trinca, e a tempestade faz o ultimo escarcéu. */
      f.desde += dt;
      if (!f.trincou && f.desde > 0.15) {
        f.trincou = true;
        sfx.latch();
        api.fala(api.jaFechou ? "De novo você. Tá." : "…tá. Essa foi sua.", QUEM);
      }
      if (!f.raioFinal && f.desde > 0.55) {
        f.raioFinal = true;
        if (!reduzir) forcarRaio(clima);
      }
      if (!f.fechou && f.desde > 1.1) {
        f.fechou = true;
        api.fechou();
      }
    }

    if (folha.current) folha.current.rotation.y = f.ang;
    if (macaneta.current) {
      const alvoMacaneta = f.trincou ? 0 : -Math.PI / 2;
      macaneta.current.rotation.z += (alvoMacaneta - macaneta.current.rotation.z) * Math.min(1, dt * 16);
    }

    /* Vento no ouvido: 10x por segundo basta. */
    if (s.vento && clima.tempo >= f.somEm) {
      f.somEm = clima.tempo + 0.1;
      s.vento.strength(clima.forca * (f.travada ? 0.3 : 0.45 + 0.55 * abertura));
    }

    /* Camera: parallax leve (parado se segurando, para o dedo nao "escorregar") + tranco. */
    f.tranco = Math.max(0, f.tranco - dt * 2.8);
    const tranco = f.tranco * f.tranco;
    const livre = !reduzir && !f.pegada;
    const dx = (livre ? f.paralaxe.x * 0.12 : 0) + (Math.random() - 0.5) * 0.08 * tranco;
    const dy = (livre ? f.paralaxe.y * 0.06 : 0) + (Math.random() - 0.5) * 0.08 * tranco;
    /* Em pe (celular) aperta a largura: a cortina pode cortar, a folha nao. */
    const r = camada.current?.getBoundingClientRect();
    const medida = r && r.width > 0 ? r : size;
    const distancia = distanciaCamera(medida, medida.width < medida.height ? 1.9 : 2.5, 2.75);
    const suave = Math.min(1, dt * 4);
    camAtual.dx += (dx - camAtual.dx) * (tranco > 0.01 ? 1 : suave);
    camAtual.dy += (dy - camAtual.dy) * (tranco > 0.01 ? 1 : suave);
    posicionarCamera(cam, medida, distancia, camAtual.dx, camAtual.dy);
  });

  const muitos = qualidade === "alta" ? 6000 : qualidade === "media" ? 3200 : 1300;
  const camadas = qualidade === "alta" ? 3 : qualidade === "media" ? 2 : 1;

  return (
    <>
      <PerspectiveCamera makeDefault near={0.05} far={80} />
      <color attach="background" args={[COR.reboco]} />

      <Ceu clima={clima} qualidade={qualidade} />
      <Morros clima={clima} />
      <Cipreste clima={clima} posicao={[-3.9, -3.4, -8]} altura={5.4} />
      <Cipreste clima={clima} posicao={[-6.5, -3.4, -11]} altura={6.2} fase={1.7} />
      {qualidade !== "baixa" && <Cipreste clima={clima} posicao={[-1.9, -3.3, -13]} altura={4.4} fase={3.1} />}
      <Raio clima={clima} />
      <Chuva clima={clima} quantidade={muitos} />

      <Luzes clima={clima} />
      <Quarto tex={tex} />
      <Vela clima={clima} />
      <Cortina clima={clima} />
      <Folha clima={clima} tex={tex} folha={folha} macaneta={macaneta} alvo={alvo} camadas={camadas} angulo={ABERTA_MAX} />

      <Environment resolution={qualidade === "alta" ? 128 : 64} frames={1}>
        <Lightformer form="rect" intensity={1.2} color={COR.frio} position={[-1, 2, -6]} scale={[8, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color={COR.chama} position={[-2, -1, 3]} scale={[2, 2, 1]} />
      </Environment>

      {/* Camada DOM sobre a view: recebe toque (sem rolar a pagina) e o foco do teclado. */}
      {/* Preenche o conteiner por CSS (nao pelo tamanho da View, que fica velho ao girar a tela). */}
      <Html calculatePosition={() => [0, 0]} wrapperClass={styles.envoltorio} style={{ inset: 0 }} zIndexRange={[1, 0]}>
        <div
          ref={camada}
          className={styles.camada}
          onPointerDown={agarrar}
          onPointerMove={mover}
          onPointerUp={largar}
          onPointerCancel={largar}
          onLostPointerCapture={largar}
        >
          <button
            ref={botao}
            type="button"
            className={styles.botao}
            aria-label="Puxar a janela: segure espaço ou enter. Solte antes da rajada."
          />
        </div>
      </Html>
    </>
  );
}
