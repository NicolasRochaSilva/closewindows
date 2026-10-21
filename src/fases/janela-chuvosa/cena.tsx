"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Qualidade } from "@/console/contrato";

/*
 * O mundo "Intemperies": um quarto a luz de vela, de noite, com a tempestade
 * do lado de fora. A janela de madeira pintada (branco descascado, seis vidros)
 * abre PARA DENTRO; a camera fica na diagonal, pela direita, entao a folha
 * aberta fica de frente para quem joga.
 *
 * Pecas compartilhadas por Jogo e Previa. Quem anima tudo e o objeto `Clima`,
 * mutavel, que o pai atualiza a cada quadro e os filhos so leem.
 */

/* Medidas em metros de cena. */
export const VAO_L = 1.3;
export const VAO_A = 1.9;
const PAREDE_E = 0.32;
const GUARNICAO = 0.11;
export const FOLHA_E = 0.05;
const MONTANTE = 0.085;
const TRAVESSA_BAIXO = 0.11;
const MAINEL = 0.03;
/** A folha gira em volta deste eixo vertical (dobradica, face de dentro). */
export const DOBRADICA = new THREE.Vector3(-VAO_L / 2, 0, FOLHA_E);
/** Angulo de escancarada (negativo = para dentro do quarto). */
export const ABERTA_MAX = -1.45;
const PEITORIL_Y = -VAO_A / 2;
const VELA = new THREE.Vector3(-VAO_L / 2 - 0.2, PEITORIL_Y, 0.1);
const CORTINA_X = [0.72, 1.2] as const;
const VARAO_Y = VAO_A / 2 + 0.22;

/* Paleta propria do mundo: tempestade fria la fora, ambar quente dentro. */
export const COR = {
  reboco: "#2e2723",
  tinta: "#e6e2d6",
  tintaSombra: "#c9c3b1",
  madeira: "#5b3f2e",
  latao: "#9a7a45",
  ferro: "#26292b",
  cera: "#e9dcbd",
  linho: "#e8e0cf",
  chama: "#ffb062",
  frio: "#8fb0c2",
  morroLonge: "#0d171c",
  morroPerto: "#070c0f",
  cipreste: "#060a0b",
  chuva: "#a9c3cf",
  raio: "#e4edff",
} as const;

/** Estado do tempo, mutavel. O pai escreve; a cena le no useFrame. */
export type Clima = {
  tempo: number;
  /** Vento la fora, 0 a 1 (chuva, arvores). */
  forca: number;
  /** Vento que entra no quarto: forca x quanto a janela esta aberta (vela, cortina). */
  forcaDentro: number;
  /** Integral do vento: quanto a chuva/nuvem ja andou de lado. */
  deriva: number;
  /** Clarao do relampago, 0 a 1. */
  flash: number;
  /** Conta raios: cada numero novo e um desenho novo. */
  raio: number;
  /** Onde o raio caiu, em uv do ceu (o clarao das nuvens nasce ali). */
  flashUv: THREE.Vector2;
  /* Relogio interno do relampago. */
  proximoRaio: number;
  raioDesde: number;
};

export const novoClima = (): Clima => ({
  tempo: 0,
  forca: 1,
  forcaDentro: 1,
  deriva: 0,
  flash: 0,
  raio: 0,
  flashUv: new THREE.Vector2(0.5, 0.7),
  proximoRaio: 2.4,
  raioDesde: 99,
});

/**
 * Avanca o relampago. Devolve true no quadro em que cai um raio (o pai toca o
 * trovao). Fotossensibilidade: no maximo um raio a cada 4s, dois piscos curtos;
 * com `reduzir`, um clarao suave e unico.
 */
export function passoRelampago(c: Clima, dt: number, reduzir: boolean): boolean {
  c.tempo += dt;
  c.deriva += (0.4 + c.forca * 2.2) * dt;
  c.raioDesde += dt;
  c.proximoRaio -= dt;
  const t = c.raioDesde;
  c.flash = reduzir
    ? Math.sin(Math.min(t / 0.9, 1) * Math.PI) * 0.35
    : Math.exp(-t * 13) + (t > 0.17 ? 0.75 * Math.exp(-(t - 0.17) * 9) : 0);
  if (c.proximoRaio > 0) return false;
  c.proximoRaio = 4.5 + Math.random() * 5;
  c.raioDesde = 0;
  c.raio += 1;
  return true;
}

/** Cai um raio agora (fim da fase: a tempestade fica furiosa), se o ultimo nao foi agora ha pouco. */
export function forcarRaio(c: Clima) {
  if (c.raioDesde > 1.5) c.proximoRaio = 0;
}

/* ---------- enquadramento ---------- */

const FOV = 38;
const ALVO = new THREE.Vector3(-0.05, 0.02, 0.38);
const DIRECAO = new THREE.Vector3(0.42, 0.08, 0.9).normalize();

/** Distancia para caber `largura` x `altura` (metros) na tela, em pe ou deitada. */
export function distanciaCamera(size: { width: number; height: number }, largura: number, altura: number) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const aspecto = size.width / Math.max(1, size.height);
  return Math.max(altura / 2 / tanV, largura / 2 / (tanV * aspecto));
}

/**
 * Posiciona a camera na diagonal do quarto; `dx`/`dy` sao parallax e tranco.
 * O aspecto vem de `medida` (o retangulo real): o tamanho da View do drei fica velho ao girar a tela.
 */
export function posicionarCamera(cam: THREE.PerspectiveCamera, medida: { width: number; height: number }, distancia: number, dx = 0, dy = 0) {
  cam.fov = FOV;
  cam.aspect = medida.width / Math.max(1, medida.height);
  cam.position.copy(ALVO).addScaledVector(DIRECAO, distancia);
  cam.position.x += dx;
  cam.position.y += dy;
  cam.lookAt(ALVO);
  cam.updateProjectionMatrix();
}

/* ---------- texturas geradas (sem rede) ---------- */

function semente(n: number) {
  let s = n;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Madeira com tinta branca velha descascando. Gerada num canvas, uma vez. */
function criarTinta() {
  const r = semente(11);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = COR.madeira;
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(25,14,8,0.35)";
  for (let i = 0; i < 70; i += 1) {
    const x = r() * 256;
    g.beginPath();
    g.moveTo(x, 0);
    g.bezierCurveTo(x + r() * 8 - 4, 90, x + r() * 8 - 4, 170, x + r() * 6 - 3, 256);
    g.stroke();
  }
  const tinta = document.createElement("canvas");
  tinta.width = tinta.height = 256;
  const t = tinta.getContext("2d")!;
  t.fillStyle = COR.tinta;
  t.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 260; i += 1) {
    t.fillStyle = r() > 0.5 ? "rgba(170,163,145,0.22)" : "rgba(250,248,240,0.3)";
    t.fillRect(r() * 256, r() * 256, 2 + r() * 14, 2 + r() * 40);
  }
  /* Lascas: buracos irregulares na tinta mostrando a madeira. */
  t.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 34; i += 1) {
    const cx = r() * 256;
    const cy = r() * 256;
    const tam = r() < 0.3 ? 2.2 : 1;
    for (let j = 0; j < 9; j += 1) {
      t.beginPath();
      t.ellipse(cx + (r() * 16 - 8) * tam, cy + (r() * 24 - 12) * tam, (1 + r() * 4) * tam, (2 + r() * 7) * tam, r() * 3, 0, Math.PI * 2);
      t.fill();
    }
  }
  g.drawImage(tinta, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Reboco escuro manchado. */
function criarReboco() {
  const r = semente(29);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = COR.reboco;
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i += 1) {
    const claro = r() > 0.5;
    g.fillStyle = claro ? "rgba(120,100,85,0.10)" : "rgba(0,0,0,0.16)";
    const tam = r() < 0.92 ? 1 + r() * 2 : 8 + r() * 30;
    g.beginPath();
    g.arc(r() * 256, r() * 256, tam, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(0.7, 0.7);
  return tex;
}

/** Texturas da cena, liberadas no unmount. */
export function useTexturas(comReboco: boolean) {
  const tex = useMemo(() => ({ tinta: criarTinta(), reboco: comReboco ? criarReboco() : null }), [comReboco]);
  useEffect(
    () => () => {
      tex.tinta.dispose();
      tex.reboco?.dispose();
    },
    [tex],
  );
  return tex;
}

/** Material criado uma vez e liberado no unmount. */
function useDescartavel<T extends { dispose(): void }>(criar: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const obj = useMemo(criar, deps);
  useEffect(() => () => obj.dispose(), [obj]);
  return obj;
}

/* ---------- shaders ---------- */

const RUIDO = /* glsl */ `
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float ruido(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y);
  }
  float fbm(vec2 p){
    float v = 0., a = .5;
    for (int i = 0; i < OITAVAS; i++) { v += a * ruido(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
    return v;
  }
`;

const VERT_UV = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;

const CEU_L = 140;
const CEU_A = 80;
const CEU = new THREE.Vector3(-14, 2, -32);

/** Nuvens de tempestade correndo com o vento; o raio acende as nuvens por dentro. */
export function Ceu({ clima, qualidade }: { clima: Clima; qualidade: Qualidade }) {
  const mat = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        defines: { OITAVAS: qualidade === "baixa" ? 3 : 5 },
        uniforms: { uTempo: { value: 0 }, uDeriva: { value: 0 }, uFlash: { value: 0 }, uFlashUv: { value: clima.flashUv } },
        vertexShader: VERT_UV,
        fragmentShader: /* glsl */ `
          uniform float uTempo, uDeriva, uFlash; uniform vec2 uFlashUv; varying vec2 vUv;
          ${RUIDO}
          void main(){
            vec2 p = vUv * vec2(9., 5.);
            p.x -= uDeriva * 0.06;
            float n = fbm(p + vec2(uTempo * 0.03, 0.) + fbm(p * 0.6 - uTempo * 0.02) * 1.3);
            vec3 fundo = mix(vec3(0.10, 0.14, 0.16), vec3(0.025, 0.04, 0.05), smoothstep(0.3, 0.68, vUv.y));
            vec3 cor = mix(fundo, vec3(0.22, 0.28, 0.31), smoothstep(0.4, 0.95, n));
            float d = distance(vUv * vec2(1.75, 1.), uFlashUv * vec2(1.75, 1.));
            float luz = uFlash * (0.18 + 2.2 * exp(-d * 9.)) * (0.35 + n * 1.2);
            gl_FragColor = vec4(cor + vec3(0.55, 0.66, 0.85) * luz, 1.);
          }
        `,
        depthWrite: false,
      }),
    [qualidade],
  );
  useFrame(() => {
    mat.uniforms.uTempo.value = clima.tempo;
    mat.uniforms.uDeriva.value = clima.deriva;
    mat.uniforms.uFlash.value = clima.flash;
  });
  return (
    <mesh position={CEU} material={mat}>
      <planeGeometry args={[CEU_L, CEU_A]} />
    </mesh>
  );
}

/** Morro: silhueta em camadas, levemente acesa pelo clarao. */
function Morro({ clima, z, base, amplitude, cor, sementeN }: { clima: Clima; z: number; base: number; amplitude: number; cor: string; sementeN: number }) {
  const geo = useDescartavel(() => {
    const r = semente(sementeN);
    const forma = new THREE.Shape();
    forma.moveTo(-40, -20);
    let y = base;
    for (let x = -40; x <= 20; x += 1.5) {
      y += (r() - 0.5) * amplitude;
      y = THREE.MathUtils.clamp(y, base - amplitude * 2, base + amplitude * 2);
      forma.lineTo(x, y);
    }
    forma.lineTo(20, -20);
    return new THREE.ShapeGeometry(forma);
  }, [sementeN, base, amplitude]);
  const mat = useDescartavel(() => new THREE.MeshBasicMaterial({ color: cor }), [cor]);
  const baseCor = useMemo(() => new THREE.Color(cor), [cor]);
  const clarao = useMemo(() => new THREE.Color("#3b4c58"), []);
  useFrame(() => mat.color.copy(baseCor).lerp(clarao, clima.flash * 0.35));
  return <mesh geometry={geo} material={mat} position={[0, 0, z]} />;
}

export function Morros({ clima }: { clima: Clima }) {
  return (
    <>
      <Morro clima={clima} z={-22} base={-2.2} amplitude={0.9} cor={COR.morroLonge} sementeN={5} />
      <Morro clima={clima} z={-12} base={-2.6} amplitude={0.6} cor={COR.morroPerto} sementeN={17} />
    </>
  );
}

/** Cipreste que verga com o vento (no vertex shader: zero custo de CPU). */
export function Cipreste({ clima, posicao, altura, fase = 0 }: { clima: Clima; posicao: [number, number, number]; altura: number; fase?: number }) {
  const geo = useDescartavel(() => {
    const r = semente(Math.floor(altura * 100 + fase * 7));
    const forma = new THREE.Shape();
    const larg = altura * 0.1;
    const lado = (sinal: number) => {
      const pts: THREE.Vector2[] = [];
      for (let i = 0; i <= 24; i += 1) {
        const t = i / 24;
        const perfil = Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.95)), 0.75) * (1 - t * 0.45);
        pts.push(new THREE.Vector2(sinal * (larg * perfil + (r() - 0.5) * larg * 0.25), t * altura));
      }
      return pts;
    };
    const esquerda = lado(-1);
    forma.moveTo(0, -0.4);
    esquerda.forEach((p) => forma.lineTo(p.x, p.y));
    lado(1).reverse().forEach((p) => forma.lineTo(p.x, p.y));
    forma.lineTo(0, -0.4);
    return new THREE.ShapeGeometry(forma, 2);
  }, [altura, fase]);
  const mat = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTempo: { value: 0 }, uVento: { value: 0 }, uFlash: { value: 0 }, uAltura: { value: altura }, uFase: { value: fase } },
        vertexShader: /* glsl */ `
          uniform float uTempo, uVento, uAltura, uFase;
          void main(){
            vec3 p = position;
            float k = clamp(p.y / uAltura, 0., 1.);
            float curva = (uVento * 0.9 + 0.12 * sin(uTempo * 1.9 + uFase) + 0.05 * sin(uTempo * 5.3 + uFase)) * k * k * uAltura * 0.22;
            p.x += curva;
            p.y -= abs(curva) * curva * 0.08;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uFlash;
          void main(){ gl_FragColor = vec4(vec3(0.022, 0.035, 0.04) + uFlash * vec3(0.05, 0.07, 0.09), 1.); }
        `,
      }),
    [altura, fase],
  );
  useFrame(() => {
    mat.uniforms.uTempo.value = clima.tempo;
    mat.uniforms.uVento.value = clima.forca;
    mat.uniforms.uFlash.value = clima.flash;
  });
  return <mesh geometry={geo} material={mat} position={posicao} />;
}

/* Caixa onde chove: so do lado de fora (z < parede). */
const CHUVA_CENTRO = new THREE.Vector3(-3, 0.5, -4.6);
const CHUVA_CAIXA = new THREE.Vector3(9, 9, 8.2);

/**
 * Chuva inteira na GPU: cada gota e um risco instanciado; queda, deriva do
 * vento e inclinacao saem do vertex shader. A CPU so passa tempo e vento.
 */
export function Chuva({ clima, quantidade }: { clima: Clima; quantidade: number }) {
  const geo = useDescartavel(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("uv", base.getAttribute("uv"));
    const offsets = new Float32Array(quantidade * 3);
    const rnd = new Float32Array(quantidade);
    const r = semente(3);
    for (let i = 0; i < quantidade; i += 1) {
      offsets[i * 3] = r() * CHUVA_CAIXA.x;
      offsets[i * 3 + 1] = r() * CHUVA_CAIXA.y;
      offsets[i * 3 + 2] = r() * CHUVA_CAIXA.z;
      rnd[i] = r();
    }
    g.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
    g.setAttribute("aRnd", new THREE.InstancedBufferAttribute(rnd, 1));
    g.instanceCount = quantidade;
    base.dispose();
    return g;
  }, [quantidade]);
  const mat = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTempo: { value: 0 },
          uVento: { value: 0 },
          uDeriva: { value: 0 },
          uFlash: { value: 0 },
          uCaixa: { value: CHUVA_CAIXA },
          uCentro: { value: CHUVA_CENTRO },
          uCor: { value: new THREE.Color(COR.chuva) },
        },
        vertexShader: /* glsl */ `
          attribute vec3 aOffset; attribute float aRnd;
          uniform float uTempo, uVento, uDeriva; uniform vec3 uCaixa, uCentro;
          varying vec2 vUv; varying float vAlfa;
          void main(){
            float vel = 8. + aRnd * 4.;
            vec3 p = aOffset;
            p.y = mod(p.y - uTempo * vel, uCaixa.y);
            p.x = mod(p.x + uDeriva * (0.8 + aRnd * 0.5), uCaixa.x);
            p.z = mod(p.z + uDeriva * (0.6 + aRnd * 0.4), uCaixa.z);
            p += uCentro - uCaixa * 0.5;
            vec3 dir = normalize(vec3(uVento * 5.5, -vel, uVento * 4.));
            vec3 paraCam = normalize(cameraPosition - p);
            vec3 lado = normalize(cross(dir, paraCam));
            vec3 w = p + dir * position.y * (0.28 + aRnd * 0.2) + lado * position.x * 0.011;
            vUv = uv;
            vAlfa = 0.18 + aRnd * 0.32;
            gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uCor; uniform float uFlash; varying vec2 vUv; varying float vAlfa;
          void main(){
            float a = (1. - abs(vUv.x - .5) * 2.) * smoothstep(0., .5, vUv.y);
            gl_FragColor = vec4(uCor * (0.55 + uFlash * 1.6), a * vAlfa * (1. + uFlash));
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uTempo.value = clima.tempo;
    mat.uniforms.uVento.value = clima.forca;
    mat.uniforms.uDeriva.value = clima.deriva;
    mat.uniforms.uFlash.value = clima.flash;
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={1} />;
}

const RAIO_PONTOS = 96;

/** O raio: um risco ramificado, redesenhado a cada clarao, visto pela janela. */
export function Raio({ clima }: { clima: Clima }) {
  const { camera } = useThree();
  const grupo = useRef<THREE.Group>(null!);
  const ultimo = useRef(0);
  const geo = useDescartavel(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RAIO_PONTOS * 2 * 3), 3));
    const indices: number[] = [];
    for (let i = 0; i < RAIO_PONTOS - 1; i += 1) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    g.setIndex(indices);
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const mat = useDescartavel(
    () =>
      new THREE.MeshBasicMaterial({
        color: COR.raio,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const aux = useMemo(() => ({ alvo: new THREE.Vector3(), dir: new THREE.Vector3() }), []);

  useFrame(() => {
    mat.opacity = Math.min(1, clima.flash * 1.2);
    if (clima.raio === ultimo.current) return;
    ultimo.current = clima.raio;

    /* Escolhe um ponto do vao e segue o raio de visao ate longe: o raio cai onde se ve. */
    aux.alvo.set((Math.random() - 0.5) * VAO_L * 0.8, VAO_A * (0.1 + Math.random() * 0.3), -PAREDE_E);
    aux.dir.copy(aux.alvo).sub(camera.position).normalize();
    const s = (-20 - camera.position.z) / aux.dir.z;
    grupo.current.position.copy(camera.position).addScaledVector(aux.dir, s);
    grupo.current.lookAt(camera.position);
    /* Clarao das nuvens nasce no mesmo ponto, projetado no ceu. */
    const sCeu = (CEU.z - camera.position.z) / aux.dir.z;
    const noCeu = camera.position.clone().addScaledVector(aux.dir, sCeu);
    clima.flashUv.set((noCeu.x - CEU.x) / CEU_L + 0.5, (noCeu.y - CEU.y) / CEU_A + 0.5);

    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    let n = 0;
    const par = (xa: number, xb: number, y: number) => {
      pos.setXYZ(n * 2, xa, y, 0);
      pos.setXYZ(n * 2 + 1, xb, y, 0);
      n += 1;
    };
    /* Tronco tem de onde brotar galho: guarda os pontos. */
    const tronco: [number, number][] = [];
    const galho = (x0: number, y0: number, passos: number, largura: number, deriva: number) => {
      let x = x0;
      let y = y0;
      if (n > 0) {
        /* Dois pares degenerados entre tiras: os triangulos da emenda tem area zero. */
        const ux = pos.getX(n * 2 - 1);
        const uy = pos.getY(n * 2 - 1);
        par(ux, ux, uy);
        pos.setXYZ(n * 2, x - largura, y, 0);
        pos.setXYZ(n * 2 + 1, x - largura, y, 0);
        n += 1;
      }
      for (let i = 0; i < passos && n < RAIO_PONTOS; i += 1) {
        const w = largura * (1 - i / passos);
        par(x - w, x + w, y);
        tronco.push([x, y]);
        x += (Math.random() - 0.5) * 0.9 + deriva;
        y -= 0.35 + Math.random() * 0.3;
      }
    };
    galho(0, 7, 40, 0.07, 0.02);
    const [ax, ay] = tronco[8 + Math.floor(Math.random() * 8)];
    galho(ax, ay, 14, 0.035, 0.18);
    const [bx, by] = tronco[18 + Math.floor(Math.random() * 10)];
    galho(bx, by, 12, 0.03, -0.18);
    pos.needsUpdate = true;
    geo.setDrawRange(0, Math.max(0, (n - 1) * 6));
  });

  return (
    <group ref={grupo}>
      <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={2} />
    </group>
  );
}

/* ---------- o quarto ---------- */

type Texturas = ReturnType<typeof useTexturas>;

/** Parede (reboco com o vao recortado), forro do vao, guarnicao pintada, peitoril e varao. */
export function Quarto({ tex }: { tex: Texturas }) {
  const tinta = useDescartavel(() => new THREE.MeshStandardMaterial({ map: tex.tinta, roughness: 0.72 }), [tex]);
  const reboco = useDescartavel(
    () => new THREE.MeshStandardMaterial(tex.reboco ? { map: tex.reboco, roughness: 0.96 } : { color: COR.reboco, roughness: 0.96 }),
    [tex],
  );
  const latao = useDescartavel(() => new THREE.MeshStandardMaterial({ color: COR.latao, metalness: 0.85, roughness: 0.35 }), []);
  /* Forma com furo: o uv sai em metros, entao o reboco tem a mesma escala em toda a parede. */
  const parede = useDescartavel(() => {
    const forma = new THREE.Shape();
    forma.moveTo(-10, -8);
    forma.lineTo(10, -8);
    forma.lineTo(10, 8);
    forma.lineTo(-10, 8);
    const furo = new THREE.Path();
    furo.moveTo(-VAO_L / 2, -VAO_A / 2);
    furo.lineTo(-VAO_L / 2, VAO_A / 2);
    furo.lineTo(VAO_L / 2, VAO_A / 2);
    furo.lineTo(VAO_L / 2, -VAO_A / 2);
    forma.holes.push(furo);
    return new THREE.ShapeGeometry(forma);
  }, []);
  const g = GUARNICAO;
  return (
    <group>
      <mesh geometry={parede} material={reboco} />
      {/* Forro do vao (a madeira pintada que reveste a espessura da parede) */}
      {[
        [0, VAO_A / 2 + 0.01, VAO_L, 0.02],
        [-VAO_L / 2 - 0.01, 0, 0.02, VAO_A],
        [VAO_L / 2 + 0.01, 0, 0.02, VAO_A],
      ].map(([x, y, l, a], i) => (
        <mesh key={i} position={[x, y, -PAREDE_E / 2]} material={tinta}>
          <boxGeometry args={[l, a, PAREDE_E]} />
        </mesh>
      ))}
      {/* Guarnicao */}
      {[
        [0, VAO_A / 2 + g / 2, VAO_L + g * 2, g],
        [-VAO_L / 2 - g / 2, 0, g, VAO_A],
        [VAO_L / 2 + g / 2, 0, g, VAO_A],
      ].map(([x, y, l, a], i) => (
        <mesh key={i} position={[x, y, 0.015]} material={tinta}>
          <boxGeometry args={[l, a, 0.03]} />
        </mesh>
      ))}
      {/* Peitoril: entra no vao e avanca para o quarto */}
      <mesh position={[0, PEITORIL_Y - 0.0225, 0.04 - PAREDE_E / 2]} material={tinta}>
        <boxGeometry args={[VAO_L + 0.75, 0.045, PAREDE_E + 0.42]} />
      </mesh>
      <mesh position={[0, PEITORIL_Y - 0.075, 0.12]} material={tinta}>
        <boxGeometry args={[VAO_L + 0.6, 0.06, 0.04]} />
      </mesh>
      {/* Varao da cortina */}
      <mesh position={[0.3, VARAO_Y, 0.11]} rotation={[0, 0, Math.PI / 2]} material={latao}>
        <cylinderGeometry args={[0.012, 0.012, 1.9, 10]} />
      </mesh>
    </group>
  );
}

/** Vela no peitoril: a chama deita no vento (o aviso da rajada) e a luz do quarto treme junto. */
export function Vela({ clima, comLuz = true }: { clima: Clima; comLuz?: boolean }) {
  const chama = useRef<THREE.Mesh>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const luz = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  const geoChama = useDescartavel(() => new THREE.PlaneGeometry(0.05, 0.12).translate(0, 0.05, 0), []);
  const matChama = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uVida: { value: 1 } },
        vertexShader: VERT_UV,
        fragmentShader: /* glsl */ `
          uniform float uVida; varying vec2 vUv;
          void main(){
            vec2 p = vUv - vec2(.5, .3);
            p.x *= 2.7;
            p.y *= p.y > 0. ? 1.15 : 2.8;
            float d = length(p);
            float a = smoothstep(.5, .12, d) * uVida;
            vec3 cor = mix(vec3(1., .42, .1), vec3(1., .93, .7), smoothstep(.38, .05, d));
            cor = mix(cor, vec3(.3, .45, 1.), smoothstep(.12, -.05, vUv.y) * .7);
            gl_FragColor = vec4(cor * 1.6, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const matHalo = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uForca: { value: 1 } },
        vertexShader: VERT_UV,
        fragmentShader: /* glsl */ `
          uniform float uForca; varying vec2 vUv;
          void main(){ float d = length(vUv - .5) * 2.; gl_FragColor = vec4(vec3(1., .6, .28), pow(max(0., 1. - d), 2.5) * .22 * uForca); }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const pavio = VELA.clone().add(new THREE.Vector3(0, 0.155, 0));

  useFrame(() => {
    const t = clima.tempo;
    const v = clima.forcaDentro;
    const tremor = Math.sin(t * 23) * 0.5 + Math.sin(t * 37 + 1.3) * 0.3 + Math.sin(t * 9.1) * 0.2;
    chama.current.quaternion.copy(camera.quaternion);
    chama.current.rotateZ(-v * 1.15 - tremor * (0.05 + v * 0.2));
    chama.current.scale.set(1 + v * 0.25, Math.max(0.35, 1 - v * 0.55 + tremor * 0.06), 1);
    matChama.uniforms.uVida.value = 1 - v * 0.35;
    halo.current.quaternion.copy(camera.quaternion);
    const brilho = (1 - v * 0.65) * (0.92 + tremor * 0.08);
    matHalo.uniforms.uForca.value = brilho;
    if (luz.current) luz.current.intensity = 2.6 * brilho;
  });

  return (
    <group>
      <group position={VELA}>
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry args={[0.06, 0.065, 0.012, 24]} />
          <meshStandardMaterial color={COR.latao} metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.03, 0.032, 0.15, 20]} />
          <meshStandardMaterial color={COR.cera} roughness={0.55} emissive={COR.chama} emissiveIntensity={0.18} />
        </mesh>
      </group>
      <mesh ref={chama} position={pavio} geometry={geoChama} material={matChama} renderOrder={4} />
      <mesh ref={halo} position={pavio.clone().add(new THREE.Vector3(0, 0.05, 0))} material={matHalo} renderOrder={4}>
        <planeGeometry args={[0.7, 0.7]} />
      </mesh>
      {comLuz && <pointLight ref={luz} position={pavio.clone().add(new THREE.Vector3(0.05, 0.08, 0.06))} color={COR.chama} intensity={2.6} distance={0} decay={2} />}
    </group>
  );
}

/** Cortina de linho: incha para dentro com o vento que entra (vertex shader sobre o material padrao). */
export function Cortina({ clima }: { clima: Clima }) {
  const largura = CORTINA_X[1] - CORTINA_X[0];
  const altura = VARAO_Y - PEITORIL_Y - 0.06;
  const uniforms = useMemo(() => ({ uTempo: { value: 0 }, uVento: { value: 0 } }), []);
  const mat = useDescartavel(() => {
    const m = new THREE.MeshStandardMaterial({ color: COR.linho, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.86 });
    m.onBeforeCompile = (s) => {
      s.uniforms.uTempo = uniforms.uTempo;
      s.uniforms.uVento = uniforms.uVento;
      s.vertexShader = s.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTempo, uVento;")
        .replace(
          "#include <beginnormal_vertex>",
          "vec3 objectNormal = normalize(vec3(-cos(position.x * 46.) * 0.55, 0., 1.));",
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `
          vec3 transformed = position;
          float solto = clamp((${(altura / 2).toFixed(3)} - position.y) / ${altura.toFixed(3)}, 0., 1.);
          float s2 = solto * solto;
          transformed.z += sin(position.x * 46.) * 0.014;
          transformed.z += uVento * 0.55 * s2 + (sin(position.y * 3.1 - uTempo * 2.6 + position.x * 5.) * 0.03 + sin(uTempo * 1.3) * 0.01) * solto * (0.25 + uVento);
          transformed.x += uVento * 0.22 * s2 - sin(position.y * 2. + uTempo * 3.) * 0.02 * uVento * solto;
          `,
        );
    };
    return m;
  }, []);
  useFrame(() => {
    uniforms.uTempo.value = clima.tempo;
    uniforms.uVento.value = clima.forcaDentro;
  });
  return (
    <mesh position={[(CORTINA_X[0] + CORTINA_X[1]) / 2, VARAO_Y - altura / 2 - 0.02, 0.11]} material={mat} renderOrder={1}>
      <planeGeometry args={[largura, altura, 18, 30]} />
    </mesh>
  );
}

/* ---------- a folha ---------- */

const VIDRO_L = VAO_L - MONTANTE * 2;
const VIDRO_A = VAO_A - MONTANTE - TRAVESSA_BAIXO - 0.01;

/**
 * Vidro com chuva escorrendo: gotas grandes que descem aos trancos deixando
 * rastro de gotinhas, mais uma camada de respingo parado. Brilho segue o raio.
 */
function useVidro(clima: Clima, camadas: number) {
  const mat = useDescartavel(
    () =>
      new THREE.ShaderMaterial({
        defines: { CAMADAS: camadas },
        uniforms: { uTempo: { value: 0 }, uFlash: { value: 0 }, uTamanho: { value: new THREE.Vector2(VIDRO_L, VIDRO_A) } },
        vertexShader: VERT_UV,
        fragmentShader: /* glsl */ `
          uniform float uTempo, uFlash; uniform vec2 uTamanho; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

          // Uma camada de gotas que escorrem. Devolve (lente, rastro, sombra).
          vec3 escorre(vec2 m, float t, float colunas, float semente){
            float largura = uTamanho.x / colunas;
            float altura = largura * 2.6;
            vec2 g = vec2(m.x / largura, m.y / altura);
            vec2 id = floor(g);
            float r = h(id + semente);
            vec2 st = (fract(g) - .5) * vec2(largura, altura);
            float fase = fract(t * (.05 + r * .07) + r * 7.31);
            // Desce aos trancos: segura, escorrega, segura.
            float y = .5 - fase - sin(fase * 6.2831 * 2.) * .045;
            y *= altura * .92;
            float x = (r - .5) * largura * .5 + sin(fase * 12. + r * 6.) * largura * .06;
            float raio = largura * (.13 + r * .1);
            vec2 d = st - vec2(x, y);
            d.y *= d.y > 0. ? .8 : 1.15;
            float lente = smoothstep(raio, raio * .55, length(d));
            // Rastro: gotinhas acima da gota, sumindo para cima.
            float acima = st.y - y;
            float faixa = smoothstep(raio * .55, raio * .2, abs(st.x - x)) * step(0., acima) * smoothstep(altura * .6, 0., acima);
            vec2 pg = vec2(st.x - x, fract(acima / (raio * 1.6)) - .5);
            float gotinha = smoothstep(.35, .15, length(pg * vec2(1. / (raio * .6), 1.))) * faixa;
            float existe = step(.25, r);
            return vec3(lente, gotinha * .8 + faixa * .12, smoothstep(raio * 1.1, raio * .6, length(d - vec2(0., -raio * .25)))) * existe;
          }

          void main(){
            vec2 m = vUv * uTamanho;
            float lente = 0., rastro = 0.;
            for (int i = 0; i < CAMADAS; i++){
              float fi = float(i);
              vec3 c = escorre(m + vec2(fi * .37, fi * .71), uTempo, 9. + fi * 7., fi * 13.);
              lente = max(lente, c.x);
              rastro = max(rastro, c.y);
            }
            // Respingo parado: gotinhas redondas que piscam ao ser renovadas.
            vec2 gs = m * 34.;
            vec2 ids = floor(gs);
            float rs = h(ids);
            float vida = fract(uTempo * .15 + rs);
            float resp = smoothstep(.22, .08, length(fract(gs) - .5 - (vec2(h(ids + 3.), h(ids + 7.)) - .5) * .5)) * step(.62, rs) * smoothstep(1., .7, vida);
            float gota = max(lente, max(rastro, resp * .7));
            // Luz falsa de lente: borda de cima clara, de baixo escura.
            vec3 base = vec3(.11, .16, .19);
            vec3 brilho = vec3(.55, .66, .74) * (.45 + uFlash * 2.2);
            vec3 cor = mix(base, brilho, gota * .8);
            float alfa = .1 + gota * .5 + uFlash * .05;
            gl_FragColor = vec4(cor, alfa);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [camadas],
  );
  useFrame(() => {
    mat.uniforms.uTempo.value = clima.tempo;
    mat.uniforms.uFlash.value = clima.flash;
  });
  return mat;
}

type FolhaProps = {
  clima: Clima;
  tex: Texturas;
  folha: RefObject<THREE.Group | null>;
  macaneta?: RefObject<THREE.Group | null>;
  /** Alvo de toque invisivel: a folha inteira e mais uma folga. */
  alvo?: RefObject<THREE.Mesh | null>;
  camadas: number;
  angulo: number;
};

/** A folha: madeira pintada, seis vidros molhados, cremona na borda livre. Gira na dobradica. */
export function Folha({ clima, tex, folha, macaneta, alvo, camadas, angulo }: FolhaProps) {
  const tinta = useDescartavel(() => new THREE.MeshStandardMaterial({ map: tex.tinta, roughness: 0.68 }), [tex]);
  const ferro = useDescartavel(() => new THREE.MeshStandardMaterial({ color: COR.ferro, metalness: 0.75, roughness: 0.4 }), []);
  const latao = useDescartavel(() => new THREE.MeshStandardMaterial({ color: COR.latao, metalness: 0.9, roughness: 0.28 }), []);
  const vidro = useVidro(clima, camadas);
  const L = VAO_L;
  const A = VAO_A - 0.01;
  const M = MONTANTE;
  const vidroY = (TRAVESSA_BAIXO - M) / 2;

  return (
    <group ref={folha} position={DOBRADICA} rotation={[0, angulo, 0]}>
      <group position={[L / 2, 0.005, -FOLHA_E / 2]}>
        {/* Montantes e travessas */}
        {[
          [0, A / 2 - M / 2, L, M],
          [0, -A / 2 + TRAVESSA_BAIXO / 2, L, TRAVESSA_BAIXO],
          [-L / 2 + M / 2, 0, M, A],
          [L / 2 - M / 2, 0, M, A],
        ].map(([x, y, l, a], i) => (
          <mesh key={i} position={[x, y, 0]} material={tinta}>
            <boxGeometry args={[l, a, FOLHA_E]} />
          </mesh>
        ))}
        {/* Mainel: uma vertical, duas horizontais = seis vidros */}
        <mesh position={[0, vidroY, 0]} material={tinta}>
          <boxGeometry args={[MAINEL, VIDRO_A, FOLHA_E * 0.7]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, vidroY + (s * VIDRO_A) / 6, 0]} material={tinta}>
            <boxGeometry args={[VIDRO_L, MAINEL, FOLHA_E * 0.7]} />
          </mesh>
        ))}
        <mesh position={[0, vidroY, 0]} material={vidro} renderOrder={3}>
          <planeGeometry args={[VIDRO_L, VIDRO_A]} />
        </mesh>
        {/* Cremona: espelho fixo e alavanca que gira para travar */}
        <mesh position={[L / 2 - M / 2, 0, FOLHA_E / 2 + 0.006]} material={latao}>
          <boxGeometry args={[0.035, 0.2, 0.012]} />
        </mesh>
        <group ref={macaneta} position={[L / 2 - M / 2, 0.03, FOLHA_E / 2 + 0.02]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh position={[0, -0.065, 0.006]} material={latao}>
            <boxGeometry args={[0.022, 0.14, 0.018]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={latao}>
            <cylinderGeometry args={[0.014, 0.014, 0.02, 12]} />
          </mesh>
        </group>
        {/* Dobradicas */}
        {[-0.62, 0.62].map((y) => (
          <mesh key={y} position={[-L / 2, y, FOLHA_E / 2]} material={ferro}>
            <cylinderGeometry args={[0.012, 0.012, 0.11, 10]} />
          </mesh>
        ))}
        {alvo && (
          <mesh ref={alvo} position={[0, 0, 0.03]}>
            <planeGeometry args={[L + 0.2, A + 0.2]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}

/** Luzes da cena: frio que entra pela janela (o raio passa por aqui) e um ambiente fraco. */
export function Luzes({ clima }: { clima: Clima }) {
  const fora = useRef<THREE.DirectionalLight>(null!);
  const ceu = useRef<THREE.HemisphereLight>(null!);
  useFrame(() => {
    fora.current.intensity = 0.9 + clima.flash * 7;
    ceu.current.intensity = 0.9 + clima.flash * 1.5;
  });
  return (
    <>
      <hemisphereLight ref={ceu} args={[COR.frio, "#2a1c14", 0.9]} />
      <directionalLight ref={fora} position={[-3, 4, -6]} color={COR.frio} intensity={0.9} />
      <pointLight position={[2.2, 1.4, 2.4]} color="#ffd7aa" intensity={4} distance={0} decay={2} />
    </>
  );
}
