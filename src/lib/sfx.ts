"use client";

/**
 * Efeitos sonoros sintetizados na hora (Web Audio). O jogo nao carrega
 * arquivo de audio: som de 16 bits se faz com oscilador e ruido, igual
 * a arte se faz com bloco de pixel. Ver CLAUDE.md secao "Som".
 */

const MUTE_KEY = "cw_muted";

/* Pentatonica de La (A4 a A5): qualquer sequencia soa como melodia. */
const NOTAS = [440, 523.25, 587.33, 659.25, 783.99, 880];

let context: AudioContext | null = null;
let muted = false;
let restored = false;

function restore() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    /* storage bloqueado (aba privada estrita): comeca com som */
  }
}

/** O contexto so nasce no primeiro gesto do jogador (politica do navegador). */
function audio(): AudioContext | null {
  restore();
  if (muted || typeof window === "undefined") return null;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
  return context;
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const frames = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function ping(
  ctx: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  seconds: number,
  peak: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(from, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + seconds);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

export const sfx = {
  /** Ferro batendo: estalo curto e seco. */
  latch() {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.08);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 2400;
    band.Q.value = 6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    source.connect(band).connect(gain).connect(ctx.destination);
    source.start(now);

    ping(ctx, "square", 220, 90, 0.07, 0.12);
  },

  /** Dobradica rangendo enquanto a folha gira. */
  creak(seconds = 0.9) {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + seconds);

    /* O tremor e o que faz soar a madeira velha, e nao uma sirene. */
    const wobble = ctx.createOscillator();
    wobble.type = "sine";
    wobble.frequency.value = 11;
    const wobbleDepth = ctx.createGain();
    wobbleDepth.gain.value = 26;
    wobble.connect(wobbleDepth).connect(osc.frequency);

    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 900;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

    osc.connect(low).connect(gain).connect(ctx.destination);
    osc.start(now);
    wobble.start(now);
    osc.stop(now + seconds + 0.02);
    wobble.stop(now + seconds + 0.02);
  },

  /**
   * Rangido que segue a mao: volume e tom acompanham a velocidade da folha
   * (`speed`, 0 a 1). Morre sozinho em 1s; quem chama abre outro se a folha
   * ainda se mexe.
   */
  creakFollow() {
    const ctx = audio();
    if (!ctx) return null;
    const now = ctx.currentTime;
    const ends = now + 1;

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 150;

    const wobble = ctx.createOscillator();
    wobble.type = "sine";
    wobble.frequency.value = 11;
    const wobbleDepth = ctx.createGain();
    wobbleDepth.gain.value = 26;
    wobble.connect(wobbleDepth).connect(osc.frequency);

    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 900;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.setValueAtTime(0.0001, ends - 0.06);
    gain.gain.linearRampToValueAtTime(0, ends);

    osc.connect(low).connect(gain).connect(ctx.destination);
    osc.start(now);
    wobble.start(now);
    osc.stop(ends);
    wobble.stop(ends);

    return {
      speed(value: number) {
        const at = ctx.currentTime;
        if (at > ends - 0.06) return;
        const level = Math.min(Math.max(value, 0), 1);
        gain.gain.cancelScheduledValues(at);
        gain.gain.setTargetAtTime(0.0001 + level * 0.06, at, 0.03);
        gain.gain.setValueAtTime(gain.gain.value, ends - 0.06);
        gain.gain.linearRampToValueAtTime(0, ends);
        osc.frequency.setTargetAtTime(140 + level * 220, at, 0.05);
      },
      alive() {
        return ctx.currentTime < ends - 0.06;
      },
      stop() {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      },
    };
  },

  /**
   * Pancada de madeira no batente com forca (0 a 1): estalo de ruido + baque
   * grave. Tom varia um pouco a cada vez para nao soar sempre igual.
   */
  slam(force = 1) {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const level = Math.min(Math.max(force, 0.2), 1);
    const detune = 0.95 + Math.random() * 0.1;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.12);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 700 * detune;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4 * level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    source.connect(low).connect(gain).connect(ctx.destination);
    source.start(now);

    ping(ctx, "triangle", 120 * detune, 45 * detune, 0.22, 0.26 * level);
  },

  /** Madeira parando no batente. */
  thud() {
    const ctx = audio();
    if (!ctx) return;
    ping(ctx, "triangle", 150, 55, 0.16, 0.22);
  },

  /** Algo arremessado cortando o ar: ruido varrendo de grave para agudo. */
  toss() {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const seconds = 0.22;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, seconds);

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 3;
    band.frequency.setValueAtTime(500, now);
    band.frequency.exponentialRampToValueAtTime(2600, now + seconds);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);

    source.connect(band).connect(gain).connect(ctx.destination);
    source.start(now);
  },

  /** Fruta batendo na madeira. */
  plop() {
    const ctx = audio();
    if (!ctx) return;
    ping(ctx, "triangle", 520, 180, 0.09, 0.18);
  },

  /** Mordida na maca: tres estalos de ruido agudo, cada vez mais fracos. */
  bite() {
    const ctx = audio();
    if (!ctx) return;
    for (let i = 0; i < 3; i += 1) {
      const at = ctx.currentTime + i * 0.045;
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx, 0.04);
      const high = ctx.createBiquadFilter();
      high.type = "highpass";
      high.frequency.value = 1800 + i * 500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2 - i * 0.05, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
      source.connect(high).connect(gain).connect(ctx.destination);
      source.start(at);
    }
  },

  /**
   * Chuva continua: ruido em laco, chiado agudo. `muffle(true)` e a janela
   * fechada: o grave fica, o chiado some. Quem chama tem que `stop()`.
   */
  rain() {
    const ctx = audio();
    if (!ctx) return null;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 2);
    source.loop = true;

    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 400;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 7000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 1.2);

    source.connect(high).connect(low).connect(gain).connect(ctx.destination);
    source.start(now);

    return {
      muffle(closed: boolean) {
        const at = ctx.currentTime;
        low.frequency.setTargetAtTime(closed ? 650 : 7000, at, 0.08);
        gain.gain.setTargetAtTime(closed ? 0.045 : 0.07, at, 0.1);
      },
      stop() {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        source.stop(ctx.currentTime + 0.5);
      },
    };
  },

  /**
   * Vento continuo: ruido num passa-banda estreito que assobia mais agudo e
   * mais alto conforme `strength` (0 a 1). Quem chama tem que `stop()`.
   */
  wind() {
    const ctx = audio();
    if (!ctx) return null;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 2);
    source.loop = true;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 300;
    band.Q.value = 4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);

    source.connect(band).connect(gain).connect(ctx.destination);
    source.start(now);

    return {
      strength(value: number) {
        const at = ctx.currentTime;
        const level = Math.min(Math.max(value, 0), 1);
        band.frequency.setTargetAtTime(260 + level * level * 900, at, 0.12);
        band.Q.setTargetAtTime(3 + level * 9, at, 0.12);
        gain.gain.setTargetAtTime(0.02 + level * 0.22, at, 0.08);
      },
      stop() {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        source.stop(ctx.currentTime + 0.5);
      },
    };
  },

  /** Trovao: estalo seco quando perto (`near` 0 a 1), sempre o ronco grave rolando. */
  thunder(near = 0.5) {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const level = Math.min(Math.max(near, 0), 1);
    const seconds = 2.2 + (1 - level) * 1.4;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, seconds);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.setValueAtTime(380 + level * 900, now);
    low.frequency.exponentialRampToValueAtTime(90, now + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35 + level * 0.3, now + 0.04 + (1 - level) * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(low).connect(gain).connect(ctx.destination);
    source.start(now);

    ping(ctx, "triangle", 70, 32, seconds * 0.7, 0.18 * (0.5 + level));
  },

  /** Vidro rachando e a coisa se partindo em duas: estalo agudo + dois tons que se afastam. */
  split() {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.14);
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 3200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    source.connect(high).connect(gain).connect(ctx.destination);
    source.start(now);

    ping(ctx, "sine", 880, 520, 0.32, 0.1);
    ping(ctx, "sine", 880, 1320, 0.32, 0.08);
  },

  /** Riso sibilado da hidra: tres sopros de ruido, cada um mais curto. */
  hiss() {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, 0.5);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 4200;
    band.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    [0, 0.16, 0.29].forEach((at, i) => {
      gain.gain.exponentialRampToValueAtTime(0.12 - i * 0.03, now + at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.12 - i * 0.02);
    });
    source.connect(band).connect(gain).connect(ctx.destination);
    source.start(now);
  },

  /**
   * Sino de vidro numa escala pentatonica (`indice` 0 a 5): fundamental, um
   * parcial inarmonico curto e uma oitava abaixo bem baixinha.
   */
  nota(indice: number) {
    const ctx = audio();
    if (!ctx) return;
    const f = NOTAS[indice % NOTAS.length];
    ping(ctx, "sine", f, f, 1.1, 0.14);
    ping(ctx, "sine", f * 2.76, f * 2.76, 0.4, 0.03);
    ping(ctx, "triangle", f / 2, f / 2, 0.6, 0.04);
  },

  /** Superexposicao: chiado claro que estoura e um zumbido caindo. */
  queima() {
    const ctx = audio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const seconds = 0.4;

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx, seconds);
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(high).connect(gain).connect(ctx.destination);
    source.start(now);

    ping(ctx, "sawtooth", 380, 70, 0.35, 0.06);
  },

  /** Vitoria registrada. */
  chime() {
    const ctx = audio();
    if (!ctx) return;
    ping(ctx, "square", 660, 660, 0.09, 0.08);
    window.setTimeout(() => {
      const later = audio();
      if (later) ping(later, "square", 990, 990, 0.14, 0.08);
    }, 90);
  },

  setMuted(value: boolean) {
    restore();
    muted = value;
    try {
      window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    } catch {
      /* sem storage: o mudo vale so ate recarregar */
    }
  },

  isMuted() {
    restore();
    return muted;
  },
};
