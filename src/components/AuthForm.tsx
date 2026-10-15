"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import Logo from "./Logo";
import { DURATION, EASE_WOOD, panelIn, shake } from "@/lib/motion";
import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

const COPY = {
  login: {
    heading: "Entrar",
    submit: "Entrar",
    endpoint: "/api/auth/login",
    switchText: "Ainda nao tem nome por aqui?",
    switchHref: "/cadastro",
    switchLabel: "criar conta",
  },
  signup: {
    heading: "Novo fechador",
    submit: "Firmar o nome",
    endpoint: "/api/auth/signup",
    switchText: "Ja tem conta?",
    switchHref: "/login",
    switchLabel: "entrar",
  },
} as const;

export default function AuthForm({ mode }: { mode: Mode }) {
  const copy = COPY[mode];
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [scope, animate] = useAnimate<HTMLFormElement>();

  function refuse(message: string) {
    setError(message);
    animate(scope.current, { x: shake.x }, shake.transition);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(copy.endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        refuse(body.error ?? "Algo emperrou. Tente de novo.");
        return;
      }

      router.replace("/jogo");
    } catch {
      refuse("Nao foi possivel falar com o servidor");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.screen}>
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...panelIn, delay: 0.05 }}
      >
        <Logo size={64} tagline="feche todas as janelas" />
      </motion.div>

      <motion.div
        className={styles.cardSlot}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={panelIn}
      >
      <form ref={scope} onSubmit={onSubmit} className={`pixel-panel ${styles.card}`}>
        <h2 className={styles.heading}>{copy.heading}</h2>

        <div className={styles.field}>
          <label className={`pixel-label ${styles.pixelLabel}`} htmlFor="username">
            Nome
          </label>
          <input
            id="username"
            name="username"
            className="pixel-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={20}
            required
          />
          {mode === "signup" && (
            <p className={styles.hint}>3 a 20 caracteres: letras, numeros e _</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={`pixel-label ${styles.pixelLabel}`} htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="pixel-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            maxLength={72}
            required
          />
          {mode === "signup" && <p className={styles.hint}>ao menos 6 caracteres</p>}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              className={styles.errorSlot}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: DURATION.quick, ease: EASE_WOOD }}
            >
              <p className="pixel-error" role="alert">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.actions}>
          <button type="submit" className={`pixel-btn ${styles.submit}`} disabled={pending}>
            {pending ? "..." : copy.submit}
          </button>
          <p className={styles.switch}>
            {copy.switchText} <Link href={copy.switchHref}>{copy.switchLabel}</Link>
          </p>
        </div>
      </form>
      </motion.div>
    </main>
  );
}
