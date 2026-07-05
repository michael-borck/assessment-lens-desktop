// PROTOTYPE — floating variant switcher. Throwaway.
import { useEffect } from "react";

interface Props {
  variants: string[];
  labels: Record<string, string>;
  current: string;
  onChange: (key: string) => void;
}

export function PrototypeSwitcher({ variants, labels, current, onChange }: Props) {
  const idx = variants.indexOf(current);
  const go = (delta: number) => onChange(variants[(idx + delta + variants.length) % variants.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="proto-switcher">
      <button onClick={() => go(-1)} aria-label="Previous variant">←</button>
      <span className="proto-switcher__label">
        <strong>{current}</strong> — {labels[current]}
      </span>
      <button onClick={() => go(1)} aria-label="Next variant">→</button>
    </div>
  );
}
