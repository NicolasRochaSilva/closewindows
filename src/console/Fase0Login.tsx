"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, PerspectiveCamera, Stars, View } from "@react-three/drei";
import * as THREE from "three";
import type { Qualidade } from "./contrato";
import { api, ErroApi } from "./cliente";
import { sfx } from "@/lib/sfx";
import { DURATION } from "@/lib/motion";
import { enquadrar } from "./enquadramento";
import CapaLogin from "./CapaLogin";
import styles from "./console.module.css";

/*
 * Fase 0: a janela de login. Voce esta dentro de um quarto escuro; a janela
 * esta aberta para dentro, com a cidade de noite la fora. O formulario mora no
 * vidro da folha. Entrou: a folha bate no batente, o trinco trava, poeira, e o
 * jogo comeca.
 */

/* Medidas em unidades do mundo (1 = 1 metro "de cena"). */
const VAO_L = 2.4;
const VAO_A = 3.4;
const MOLDURA = 0.18;
const FOLHA_E = 0.08;
const VIDRO_L = 2.04;
const ABERTA = -0.52;
const FOV = 40;

/* Fisica da folha fechando (rad/s): mola puxa para o batente, atrito segura. */
const MOLA = 90;
const ATRITO = 9;

/* Paleta da cena (arte do console, nao das fases). */
const COR = {
  parede: "#2b303c",
  madeira: "#5a3a22",
  madeiraClara: "#7a4f2c",
  ferro: "#2b2b31",
  ceuTopo: "#0a0f24",
  ceuBase: "#2a2350",
  predio: "#0d0d14",
  luzAcesa: "#f2cc6b",
  lampada: "#ffd2a1",
  poeira: "#b8a58c",
} as const;

type Fase = "aberta" | "fechando" | "fechada";

function Ceu() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { topo: { value: new THREE.Color(COR.ceuTopo) }, base: { value: new THREE.Color(COR.ceuBase) } },
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
        fragmentShader:
          "uniform vec3 topo; uniform vec3 base; varying vec2 vUv; void main(){ gl_FragColor = vec4(mix(base, topo, smoothstep(0.15, 0.85, vUv.y)), 1.); }",
        depthWrite: false,
      }),
    [],
  );
  return (
    <mesh position={[0, 2, -30]} material={material}>
      <planeGeometry args={[120, 60]} />
    </mesh>
  );
}

/** Predios ao longe com janelas acesas: as outras janelas da cidade, ainda abertas. */
function Cidade({ quantidade }: { quantidade: number }) {
  const predios = useMemo(() => {
    let semente = 7;
    const aleatorio = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: quantidade }, (_, i) => {
      const largura = 1.2 + aleatorio() * 1.8;
      const altura = 2 + aleatorio() * 7;
      const x = -14 + i * (28 / quantidade) + aleatorio();
      const z = -14 - aleatorio() * 8;
      const luzes = Array.from({ length: Math.floor(aleatorio() * 6) + 1 }, () => [
        (aleatorio() - 0.5) * (largura - 0.4),
        -altura / 2 + 0.6 + aleatorio() * (altura - 1.2),
      ]);
      return { largura, altura, x, z, luzes };
    });
  }, [quantidade]);

  return (
    <group position={[0, -4.2, 0]}>
      {predios.map((p, i) => (
        <group key={i} position={[p.x, p.altura / 2, p.z]}>
          <mesh>
            <boxGeometry args={[p.largura, p.altura, 1]} />
            <meshBasicMaterial color={COR.predio} />
          </mesh>
          {p.luzes.map(([lx, ly], j) => (
            <mesh key={j} position={[lx, ly, 0.51]}>
              <planeGeometry args={[0.18, 0.24]} />
              <meshBasicMaterial color={COR.luzAcesa} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Parede do quarto com o vao recortado (quatro blocos) e a moldura de madeira. */
function ParedeEMoldura() {
  const muito = 20;
  const espessura = 0.4;
  return (
    <group>
      {[
        [0, VAO_A / 2 + muito / 2, muito * 2, muito],
        [0, -VAO_A / 2 - muito / 2, muito * 2, muito],
        [-VAO_L / 2 - muito / 2, 0, muito, VAO_A],
        [VAO_L / 2 + muito / 2, 0, muito, VAO_A],
      ].map(([x, y, l, a], i) => (
        <mesh key={i} position={[x, y, -espessura / 2]}>
          <boxGeometry args={[l, a, espessura]} />
          {/* Emissivo leve: o reboco fica ardosia como o muro da casca, mesmo com a luz quente. */}
          <meshStandardMaterial color={COR.parede} emissive={COR.parede} emissiveIntensity={0.55} roughness={0.92} />
        </mesh>
      ))}
      {/* Moldura */}
      {[
        [0, VAO_A / 2 + MOLDURA / 2, VAO_L + MOLDURA * 2, MOLDURA],
        [0, -VAO_A / 2 - MOLDURA / 2, VAO_L + MOLDURA * 2, MOLDURA],
        [-VAO_L / 2 - MOLDURA / 2, 0, MOLDURA, VAO_A],
        [VAO_L / 2 + MOLDURA / 2, 0, MOLDURA, VAO_A],
      ].map(([x, y, l, a], i) => (
        <mesh key={i} position={[x, y, 0.02]}>
          <boxGeometry args={[l, a, 0.12]} />
          <meshStandardMaterial color={COR.madeira} roughness={0.7} />
        </mesh>
      ))}
      {/* Peitoril */}
      <mesh position={[0, -VAO_A / 2 - MOLDURA - 0.06, 0.16]}>
        <boxGeometry args={[VAO_L + 0.8, 0.12, 0.5]} />
        <meshStandardMaterial color={COR.madeiraClara} roughness={0.6} />
      </mesh>
    </group>
  );
}

const POEIRA = 70;

/** Poeira e lascas soltas na pancada. Instancias: um draw call so. */
function Poeira({ disparo }: { disparo: number }) {
  const malha = useRef<THREE.InstancedMesh>(null!);
  const graos = useRef(
    Array.from({ length: POEIRA }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), vida: 0 })),
  );
  const auxiliar = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!disparo) return;
    for (const g of graos.current) {
      g.p.set(VAO_L / 2 - 0.05, (Math.random() - 0.5) * VAO_A, 0.1);
      g.v.set(0.3 + Math.random() * 1.6, (Math.random() - 0.2) * 1.8, 0.4 + Math.random() * 1.4);
      g.vida = 0.5 + Math.random() * 0.7;
    }
  }, [disparo]);

  useFrame((_, dt) => {
    const passo = Math.min(dt, 1 / 30);
    graos.current.forEach((g, i) => {
      if (g.vida > 0) {
        g.vida -= passo;
        g.v.y -= 4 * passo;
        g.p.addScaledVector(g.v, passo);
      }
      auxiliar.position.copy(g.p);
      auxiliar.scale.setScalar(g.vida > 0 ? Math.min(g.vida, 0.4) * 0.09 : 0);
      auxiliar.updateMatrix();
      malha.current.setMatrixAt(i, auxiliar.matrix);
    });
    malha.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={malha} args={[undefined, undefined, POEIRA]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={COR.poeira} roughness={1} />
    </instancedMesh>
  );
}

type CenaProps = {
  qualidade: Qualidade;
  reduzirMovimento: boolean;
  estado: Fase;
  chacoalho: number;
  onBateu: () => void;
  /** Container DOM fixo do formulario. Sem ele o <Html> troca de alvo depois de montar e o form some. */
  camada: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
};

function Cena({ qualidade, reduzirMovimento, estado, chacoalho, onBateu, camada, children }: CenaProps) {
  const camera = useRef<THREE.PerspectiveCamera>(null!);
  const folha = useRef<THREE.Group>(null!);
  const trinco = useRef<THREE.Mesh>(null!);
  const fisica = useRef({ angulo: ABERTA, velocidade: 0, bateu: false, tremor: 0, chacoalho: 0 });
  const [disparoPoeira, setDisparoPoeira] = useState(0);
  const { size } = useThree();

  /* Enquadramento: a janela inteira cabe no lado (ou embaixo) da capa. */
  const { distancia, pxPorUnidade, desvioX, desvioY } = enquadrar(
    size.width,
    size.height,
    { altura: VAO_A + 1.3, largura: VAO_L + 0.5 },
    Math.tan(THREE.MathUtils.degToRad(FOV / 2)),
  );

  useEffect(() => {
    if (chacoalho) fisica.current.chacoalho = 1;
  }, [chacoalho]);

  useFrame((state, dt) => {
    const f = fisica.current;
    const passo = Math.min(dt, 1 / 30);

    if (estado !== "aberta" && !f.bateu) {
      f.velocidade += (-MOLA * f.angulo - ATRITO * f.velocidade) * passo;
      f.angulo += f.velocidade * passo;
      if (f.angulo >= 0) {
        f.angulo = 0;
        f.velocidade = 0;
        f.bateu = true;
        if (!reduzirMovimento) {
          f.tremor = 1;
          setDisparoPoeira((n) => n + 1);
        }
        onBateu();
      }
    }

    /* Senha errada: a folha sacode no lugar, debochando. */
    const sacode = f.chacoalho > 0 ? Math.sin(state.clock.elapsedTime * 40) * 0.05 * f.chacoalho : 0;
    f.chacoalho = Math.max(0, f.chacoalho - passo * 2.2);
    folha.current.rotation.y = f.angulo + sacode;

    /* Trinco gira para travar logo depois da batida. */
    const alvoTrinco = f.bateu ? 0 : -1.3;
    trinco.current.rotation.z += (alvoTrinco - trinco.current.rotation.z) * Math.min(1, passo * 18);

    /* Camera: leve parallax com o ponteiro + tranco da pancada. */
    f.tremor = Math.max(0, f.tremor - passo * 3.5);
    const tranco = f.tremor * f.tremor;
    const px = desvioX + (reduzirMovimento ? 0 : state.pointer.x * 0.22);
    const py = desvioY + (reduzirMovimento ? 0 : state.pointer.y * 0.14);
    const cam = camera.current;
    cam.position.x += (px - cam.position.x) * Math.min(1, passo * 3) + (Math.random() - 0.5) * 0.12 * tranco;
    cam.position.y += (py - cam.position.y) * Math.min(1, passo * 3) + (Math.random() - 0.5) * 0.12 * tranco;
    cam.position.z = distancia;
    cam.lookAt(desvioX, desvioY, 0);
  });

  return (
    <>
      <PerspectiveCamera ref={camera} makeDefault fov={FOV} position={[desvioX, desvioY, distancia]} near={0.1} far={100} />
      <color attach="background" args={[COR.parede]} />
      <fog attach="fog" args={[COR.ceuBase, 18, 42]} />

      <Ceu />
      <Stars radius={40} depth={10} count={qualidade === "baixa" ? 600 : 1800} factor={3} fade speed={0.4} />
      <Cidade quantidade={qualidade === "baixa" ? 10 : 18} />

      <ambientLight intensity={0.7} color="#b9c3dd" />
      <directionalLight position={[3, 4, -10]} intensity={0.6} color="#9fb4ff" />
      <pointLight position={[-2.5, -1.2, 3.5]} intensity={18} distance={14} color={COR.lampada} />
      <pointLight position={[2.8, 2.6, 2.5]} intensity={6} distance={9} color="#9fb4ff" />

      <ParedeEMoldura />

      {/* Folha: gira na dobradica esquerda */}
      <group ref={folha} position={[-VAO_L / 2, 0, 0.04]} rotation={[0, ABERTA, 0]}>
        <group position={[VAO_L / 2, 0, 0]}>
          {[
            [0, VAO_A / 2 - 0.09, VAO_L, 0.18],
            [0, -VAO_A / 2 + 0.09, VAO_L, 0.18],
            [-VAO_L / 2 + 0.09, 0, 0.18, VAO_A],
            [VAO_L / 2 - 0.09, 0, 0.18, VAO_A],
          ].map(([x, y, l, a], i) => (
            <mesh key={i} position={[x, y, 0]}>
              <boxGeometry args={[l, a, FOLHA_E]} />
              <meshStandardMaterial color={COR.madeiraClara} roughness={0.55} />
            </mesh>
          ))}
          <mesh>
            <planeGeometry args={[VIDRO_L, VAO_A - 0.36]} />
            {/* Vidro fume: a cidade some atras do formulario e so aparece pela fresta. */}
            <meshPhysicalMaterial
              color="#13203a"
              transparent
              opacity={0.82}
              roughness={0.18}
              metalness={0}
              specularIntensity={0}
              envMapIntensity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Trinco na borda livre */}
          <mesh position={[VAO_L / 2 - 0.09, 0, FOLHA_E / 2 + 0.03]}>
            <boxGeometry args={[0.08, 0.3, 0.05]} />
            <meshStandardMaterial color={COR.ferro} metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh ref={trinco} position={[VAO_L / 2 - 0.09, 0, FOLHA_E / 2 + 0.07]} rotation={[0, 0, -1.3]}>
            <boxGeometry args={[0.36, 0.05, 0.04]} />
            <meshStandardMaterial color={COR.ferro} metalness={0.8} roughness={0.3} />
          </mesh>

          <Html
            transform
            portal={camada as React.RefObject<HTMLElement>}
            position={[0, 0.05, FOLHA_E / 2 + 0.01]}
            distanceFactor={400 / pxPorUnidade}
            zIndexRange={[20, 10]}
            pointerEvents={estado === "aberta" ? "auto" : "none"}
          >
            <div style={{ width: VIDRO_L * pxPorUnidade * 0.86 }}>{children}</div>
          </Html>
        </group>
      </group>

      {!reduzirMovimento && <Poeira disparo={disparoPoeira} />}

      <Environment resolution={qualidade === "alta" ? 256 : 64} frames={1}>
        <Lightformer form="rect" intensity={2} color="#9fb4ff" position={[0, 3, -6]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={3} color={COR.lampada} position={[-4, 0, 5]} scale={[3, 5, 1]} />
      </Environment>
    </>
  );
}

type Props = {
  qualidade: Qualidade;
  reduzirMovimento: boolean;
  onEntrou: (username: string) => void;
};

export default function Fase0Login({ qualidade, reduzirMovimento, onEntrou }: Props) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [estado, setEstado] = useState<Fase>("aberta");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [chacoalho, setChacoalho] = useState(0);
  const quem = useRef("");
  const camada = useRef<HTMLDivElement>(null);

  /*
   * O <View> do drei le o retangulo no resize do canvas ANTES de atualiza-lo no
   * quadro, e fica com o tamanho velho (girar o celular quebrava o enquadramento
   * e o form). Remonta a cena quando a tela muda — nunca no meio do fechamento.
   */
  const [medida, setMedida] = useState(0);
  const aberta = estado === "aberta";
  useEffect(() => {
    if (!aberta) return;
    let espera = 0;
    const mudou = () => {
      clearTimeout(espera);
      espera = window.setTimeout(() => setMedida((n) => n + 1), 200);
    };
    window.addEventListener("resize", mudou);
    return () => {
      clearTimeout(espera);
      window.removeEventListener("resize", mudou);
    };
  }, [aberta]);

  const DEBOCHE: Record<number, string> = {
    401: "Nome ou senha errados. A janela lembra de você. Você não lembra dela.",
    403: "Código do time errado. Essa janela não abre para estranhos.",
    409: "Esse nome já foi tomado. Seja criativo.",
  };

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const dados = new FormData(evento.currentTarget);
    const usuario = String(dados.get("usuario") ?? "");
    const senha = String(dados.get("senha") ?? "");
    const codigo = String(dados.get("codigo") ?? "");
    setEnviando(true);
    setErro(null);
    try {
      const r = modo === "entrar" ? await api.entrar(usuario, senha) : await api.cadastrar(usuario, senha, codigo);
      quem.current = r.username;
      sfx.creak(DURATION.base);
      setEstado("fechando");
    } catch (e) {
      const status = e instanceof ErroApi ? e.status : 0;
      setErro(DEBOCHE[status] ?? (e instanceof Error ? e.message : "Algo deu errado."));
      setChacoalho((n) => n + 1);
      sfx.thud();
    } finally {
      setEnviando(false);
    }
  }

  function bateu() {
    sfx.slam(1);
    setTimeout(() => sfx.latch(), DURATION.hitStop * 1000);
    setEstado("fechada");
    /* Mais um respiro para o alivio dele no cartaz ser visto antes de a parede entrar. */
    const respiro = reduzirMovimento ? 0 : DURATION.rearm;
    setTimeout(() => onEntrou(quem.current), (DURATION.swing + DURATION.base + respiro) * 1000);
  }

  return (
    <>
    <CapaLogin fechou={estado === "fechada"} reduzirMovimento={reduzirMovimento} />
    <div ref={camada} className={styles.camadaForm} />
    <View key={medida} className={styles.viewCheia}>
      <Cena
        qualidade={qualidade}
        reduzirMovimento={reduzirMovimento}
        estado={estado}
        chacoalho={chacoalho}
        onBateu={bateu}
        camada={camada}
      >
        <form className={styles.loginForm} onSubmit={enviar} data-estado={estado}>
          {/* O deboche toma o lugar da instrucao: o vidro nao comporta os dois. */}
          {erro ? (
            <p className={styles.loginErro} role="alert">
              {erro}
            </p>
          ) : (
            <p className={styles.loginSub}>
              {modo === "entrar" ? "Para jogar, feche esta janela." : "Conta nova. Peça o código ao time."}
            </p>
          )}
          <label className={styles.loginCampo}>
            <span>usuário</span>
            <input name="usuario" autoComplete="username" required minLength={3} maxLength={20} />
          </label>
          <label className={styles.loginCampo}>
            <span>senha</span>
            <input
              name="senha"
              type="password"
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
              required
              minLength={6}
              maxLength={72}
            />
          </label>
          {modo === "cadastrar" && (
            <label className={styles.loginCampo}>
              <span>código do time</span>
              <input name="codigo" autoComplete="off" required />
            </label>
          )}
          <button type="submit" className={styles.placa} disabled={enviando || estado !== "aberta"}>
            <span className={styles.placaTitulo}>
              {enviando ? "Fechando…" : modo === "entrar" ? "Entrar e fechar a janela" : "Criar conta e fechar"}
            </span>
          </button>
          <button
            type="button"
            className={styles.link}
            onClick={() => {
              setModo(modo === "entrar" ? "cadastrar" : "entrar");
              setErro(null);
            }}
          >
            {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
          </button>
        </form>
      </Cena>
    </View>
    </>
  );
}
