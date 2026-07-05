// PROTOTYPE — variant switcher for the submission-review screen. Throwaway.
import { useEffect, useState } from "react";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";
import { VariantD } from "./VariantD";
import { VariantE } from "./VariantE";
import { VariantF } from "./VariantF";
import { VariantG } from "./VariantG";
import { VariantH } from "./VariantH";
import { VariantI } from "./VariantI";
import { VariantJ } from "./VariantJ";
import { PrototypeSwitcher } from "./PrototypeSwitcher";
import { SUBMISSION } from "./mock";

const VARIANTS = {
  A: { name: "Rubric ledger (criterion-first)", Comp: VariantA },
  B: { name: "Document alongside signals (split)", Comp: VariantB },
  C: { name: "Triage queue (one signal at a time)", Comp: VariantC },
  D: { name: "Attention triage (by confidence)", Comp: VariantD },
  E: { name: "Cohort-relative compare", Comp: VariantE },
  F: { name: "Document timeline (by section)", Comp: VariantF },
  G: { name: "Cohort overview → drill into D (E+D)", Comp: VariantG },
  H: { name: "Unit dashboard (assessments + runs)", Comp: VariantH },
  I: { name: "LMS ingestion (archive → roster)", Comp: VariantI },
  J: { name: "Signal ↔ rubric mapping (iterative)", Comp: VariantJ },
} as const;
type Key = keyof typeof VARIANTS;

const readVariant = (): Key => {
  const v = new URLSearchParams(location.search).get("variant")?.toUpperCase();
  return (v && v in VARIANTS ? v : "A") as Key;
};

export function ReviewPrototype() {
  const [key, setKey] = useState<Key>(readVariant);
  useEffect(() => {
    const onPop = () => setKey(readVariant());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setVariant = (k: string) => {
    const sp = new URLSearchParams(location.search);
    sp.set("variant", k);
    history.replaceState(null, "", `?${sp.toString()}`);
    setKey(k as Key);
  };

  const { Comp } = VARIANTS[key];
  const labels = Object.fromEntries(Object.entries(VARIANTS).map(([k, v]) => [k, v.name]));

  return (
    <>
      <Comp submission={SUBMISSION} />
      <PrototypeSwitcher variants={Object.keys(VARIANTS)} labels={labels} current={key} onChange={setVariant} />
    </>
  );
}
