"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, RotateCcw, Eye, EyeOff } from "lucide-react";

import { getRandomTask } from "@/app/lib/db/tasks";
import type { Task, TaskToken } from "@/app/lib/types";
import { joinEn } from "@/app/lib/text";

function isPunct(s: string) {
  return ["?", "!", ".", ",", ":"].includes((s ?? "").trim());
}

function IconBtn({
  onClick,
  children,
  label,
  variant = "ghost",
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  variant?: "ghost" | "primary";
}) {
  const base =
    "flex h-12 w-12 items-center justify-center rounded-2xl border transition active:scale-[0.98]";
  const cls =
    variant === "primary"
      ? "border-cyan-300/20 bg-cyan-400/90 text-slate-950 hover:bg-cyan-300"
      : "border-white/10 bg-white/5 text-white hover:bg-white/10";

  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}

function sentenceWithQ(tokens: TaskToken[]) {
  if (!tokens.length) return "";
  const s = joinEn(tokens).replace(/\s+/g, " ").trim();
  return s.endsWith("?") ? s : `${s}?`;
}

export default function BuilderPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const [pool, setPool] = useState<TaskToken[]>([]);
  const [built, setBuilt] = useState<TaskToken[]>([]);

  // “ostatnio kliknięte” — na telefonie ważniejsze niż hover
  const [activeToken, setActiveToken] = useState<TaskToken | null>(null);

  // feedback przy złym kliknięciu
  const [feedback, setFeedback] = useState<
    | { type: "ok"; msg: string }
    | { type: "warn"; msg: string }
    | null
  >(null);

  // animacja “shake” gdy źle
  const [shakeKey, setShakeKey] = useState(0);

  const [showAnswer, setShowAnswer] = useState(false);

  const expectedTokens = useMemo(() => {
    if (!task) return [];
    return task.tokens.filter((t) => !isPunct(t.en));
  }, [task]);

  const expectedEn = useMemo(() => {
    if (!task) return "";
    const base = (task.answerEn || joinEn(task.tokens)).replace(/\s+/g, " ").trim();
    return base;
  }, [task]);

  const builtEn = useMemo(() => sentenceWithQ(built), [built]);

  const nextExpected = useMemo(() => {
    const idx = built.length;
    return expectedTokens[idx]?.en ?? null;
  }, [built.length, expectedTokens]);

  const isCorrect = useMemo(() => {
    if (!task) return false;
    return builtEn.replace(/\s+/g, " ").trim() === expectedEn;
  }, [builtEn, expectedEn, task]);

  async function loadTask() {
    setLoading(true);
    const t = await getRandomTask();
    setTask(t);

    setBuilt([]);
    setActiveToken(null);
    setFeedback(null);
    setShakeKey(0);
    setShowAnswer(false);

    if (t) {
      const shuffled = [...t.tokens]
        .filter((x) => !isPunct(x.en))
        .sort(() => Math.random() - 0.5);
      setPool(shuffled);
    } else {
      setPool([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetCurrent() {
    setPool((prev) => [...built, ...prev].sort(() => Math.random() - 0.5));
    setBuilt([]);
    setActiveToken(null);
    setFeedback(null);
    setShakeKey(0);
  }

  function undo() {
    setBuilt((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setPool((p) => [last, ...p]);
      setActiveToken(last);
      setFeedback(null);
      return prev.slice(0, -1);
    });
  }

  function pickToken(t: TaskToken, idx: number) {
    // pokaż tłumaczenie klikniętego słowa
    setActiveToken(t);

    // sprawdź czy to jest następne oczekiwane słowo (po EN)
    const expected = nextExpected;
    const ok =
      expected == null ||
      t.en.trim().toLowerCase() === expected.trim().toLowerCase();

    if (!ok) {
      setFeedback({
        type: "warn",
        msg: `Ups 😅 Następne powinno być: "${expected}"`,
      });
      setShakeKey((x) => x + 1);
    } else {
      setFeedback({ type: "ok", msg: "Dobrze ✅" });
    }

    setBuilt((prev) => [...prev, t]);
    setPool((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) {
    return <div className="text-slate-300">Ładowanie…</div>;
  }

  if (!task) {
    return <div className="text-slate-300">Brak zadań w bazie. Zaseeduj Firestore.</div>;
  }

  return (
    <div className="-mx-4 -my-6 min-h-[100dvh] bg-slate-950 text-white">
      <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-4 pb-28 pt-4">
        {/* TOP: zadanie + podgląd */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-slate-300">Wylosowane zadanie</div>
              <div className="mt-1 text-lg font-semibold">{task.pl}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowAnswer((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
              {showAnswer ? "Ukryj" : "Podgląd"}
            </button>
          </div>

          <AnimatePresence>
            {showAnswer ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="mt-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3"
              >
                <div className="text-xs text-slate-300">Poprawna odpowiedź</div>
                <div className="mt-1 text-base font-semibold">{expectedEn}</div>
                {task.answerPhon ? <div className="mt-1 text-sm text-slate-200">{task.answerPhon}</div> : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* ŚRODEK: panel tłumaczenia + zdanie */}
        <motion.div
          key={shakeKey}
          initial={feedback?.type === "warn" ? { x: -6 } : false}
          animate={feedback?.type === "warn" ? { x: [ -6, 6, -4, 4, 0 ] } : { x: 0 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4"
        >
          <div className="text-xs font-medium text-amber-100/80">Tłumaczenie (kliknięte słowo)</div>

          {activeToken ? (
            <div className="mt-2">
              <div className="text-lg font-semibold">
                {activeToken.en} <span className="text-amber-100/70">→</span>{" "}
                <span className="text-amber-100">{activeToken.pl}</span>
              </div>
              {activeToken.phon ? (
                <div className="mt-1 text-sm text-amber-100/80">{activeToken.phon}</div>
              ) : null}
            </div>
          ) : (
            <div className="mt-2 text-sm text-amber-100/80">
              Kliknij słowo z banku na dole – tu pokaże się tłumaczenie i fonetyka.
            </div>
          )}

          <AnimatePresence>
            {feedback ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className={`mt-3 rounded-xl px-3 py-2 text-sm ${
                  feedback.type === "warn"
                    ? "bg-rose-500/15 text-rose-100"
                    : "bg-emerald-500/15 text-emerald-100"
                }`}
              >
                {feedback.msg}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {nextExpected && !isCorrect ? (
            <div className="mt-2 text-xs text-amber-100/70">
              Podpowiedź: następne słowo po EN to <span className="font-semibold">{nextExpected}</span>
            </div>
          ) : null}
        </motion.div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-slate-300">Twoje zdanie (EN)</div>
          <div className="mt-2 text-xl font-semibold">{builtEn || "—"}</div>

          {isCorrect ? (
            <div className="mt-2 inline-block rounded-xl bg-emerald-500/15 px-3 py-1 text-sm text-emerald-100">
              ✅ Super, to jest poprawnie!
            </div>
          ) : null}
        </div>

        {/* “Twoje słowa” – kafelki EN/PL */}
        <div className="mt-4">
          <div className="text-xs font-medium text-slate-300">Twoje słowa (EN → PL)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {built.map((t, i) => (
                <motion.button
                  key={`${t.en}-${t.pl}-${i}`}
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setActiveToken(t)}
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                >
                  <div className="text-sm font-semibold">{t.en}</div>
                  <div className="text-xs text-cyan-200">{t.pl}</div>
                  {t.phon ? <div className="text-[11px] text-slate-300">{t.phon}</div> : null}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* DÓŁ STICKY: kontrolki + bank słów */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <IconBtn label="Cofnij" onClick={undo}>
              <ArrowLeft />
            </IconBtn>

            <IconBtn label="Reset od początku" onClick={resetCurrent}>
              <RotateCcw />
            </IconBtn>

            <IconBtn label="Następne zadanie" onClick={loadTask} variant="primary">
              <ArrowRight />
            </IconBtn>
          </div>

          <div className="mt-3">
            <div className="text-xs text-slate-300">Bank słów (klikaj)</div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {pool.map((t, i) => (
                <motion.button
                  key={`${t.en}-${t.pl}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => pickToken(t, i)}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
                  type="button"
                >
                  {t.en}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}