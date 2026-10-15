import WindowGlyph from "./WindowGlyph";
import styles from "./Logo.module.css";

type Props = {
  /** Tamanho da fonte do letreiro em px. O vitral acompanha. */
  size?: number;
  tagline?: string;
};

export default function Logo({ size = 72, tagline }: Props) {
  return (
    <div>
      <div className={styles.logo} style={{ ["--logo-size" as string]: `${size}px` }}>
        <span className={styles.word}>close</span>
        <WindowGlyph size={size * 0.92} latch className={styles.glyph} />
        <span className={styles.word}>Windows</span>
      </div>
      {tagline && <p className={styles.tagline}>{tagline}</p>}
      <h1 className="visually-hidden">closeWindows</h1>
    </div>
  );
}
