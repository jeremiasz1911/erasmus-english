"use client";

import { useEffect, useMemo, useState } from "react";
import { getRandomTask } from "@/app/lib/db/tasks";
import type { Task, TaskToken } from "@/app/lib/types";
import { joinEn } from "@/app/lib/text";

function TokenChip({
  token,
  onClick,
  active,
}: {
  token: TaskToken;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm",
        active ? "bg-black text-white" : "bg-white hover:bg-neutral-100",
      ].join(" ")}
      type="button"
    >
      {token.pl}
    </button>
  );
}

export default function BuilderPage() {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [reveal, setReveal] = useState(false);

  // tryb "ułóż zdanie"
  const [pool, setPool] = useState<TaskToken[]>([]);
  const [built, setBuilt] = useState<TaskToken[]>([]);
  const correctEn = useMemo(() => (task ? joinEn(task.tokens) : ""), [task]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const t = await getRandomTask();
      setTask(t);
      setReveal(false);
      setFocusIdx(null);

      if (t) {
        // mieszamy tokeny do układania
        const shuffled = [...t.tokens]
          .filter((x) => x.en.trim() !== "?") // zostawimy "?" w odpowiedzi
          .sort(() => Math.random() - 0.5);
        setPool(shuffled);
        setBuilt([]);
      }

      setLoading(false);
    })();
  }, []);

  const showEn = useMemo(() => {
    if (!task) return "";
    return reveal ? (task.answerEn || correctEn) : "";
  }, [task, reveal, correctEn]);

  const showPhon = useMemo(() => {
    if (!task) return "";
    if (!reveal) return "";
    return task.answerPhon || "";
  }, [task, reveal]);

  const builtEn = useMemo(() => joinEn(built) + (built.length ? "?" : ""), [built]);
  const isCorrect = useMemo(() => {
    if (!task) return false;
    const expected = (task.answerEn || correctEn).replace(/\s+/g, " ").trim();
    const got = builtEn.replace(/\s+/g, " ").trim();
    return expected === got;
  }, [task, builtEn, correctEn]);

  async function nextTask() {
    setLoading(true);
    const t = await getRandomTask();
    setTask(t);
    setReveal(false);
    setFocusIdx(null);

    if (t) {
      const shuffled = [...t.tokens].filter((x) => x.en.trim() !== "?").sort(() => Math.random() - 0.5);
      setPool(shuffled);
      setBuilt([]);
    }

    setLoading(false);
  }

  function pickToken(t: TaskToken, idx: number) {
    setBuilt((prev) => [...prev, t]);
    setPool((prev) => prev.filter((_, i) => i !== idx));
  }

  function undoLast() {
    setBuilt((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setPool((p) => [last, ...p]);
      return prev.slice(0, -1);
    });
  }

  if (loading) return <div className="text-neutral-600">Ładowanie…</div>;
  if (!task) return <div className="text-neutral-600">Brak zadań w bazie. Zaseeduj Firestore.</div>;

  const focus = focusIdx != null ? task.tokens[focusIdx] : null;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white p-4">
        <div className="text-sm text-neutral-500">Wylosowane zadanie</div>
        <div className="mt-1 text-lg font-semibold">{task.pl}</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {task.tokens.map((t, i) => (
            <TokenChip
              key={i}
              token={t}
              active={focusIdx === i}
              onClick={() => setFocusIdx(i)}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border bg-neutral-50 p-3">
            <div className="text-xs font-medium text-neutral-500">Kliknięty kafelek</div>
            {focus ? (
              <div className="mt-2 space-y-1">
                <div className="text-sm"><span className="font-semibold">PL:</span> {focus.pl}</div>
                <div className="text-sm"><span className="font-semibold">EN:</span> {focus.en}</div>
                {focus.phon ? (
                  <div className="text-sm"><span className="font-semibold">FON:</span> {focus.phon}</div>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 text-sm text-neutral-600">Kliknij kafelek, aby zobaczyć tłumaczenie.</div>
            )}
          </div>

          <div className="rounded-xl border bg-neutral-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-neutral-500">Odpowiedź</div>
              <button
                onClick={() => setReveal((v) => !v)}
                className="rounded-lg border bg-white px-3 py-1 text-sm hover:bg-neutral-100"
                type="button"
              >
                {reveal ? "Ukryj" : "Pokaż"}
              </button>
            </div>

            {reveal ? (
              <div className="mt-2 space-y-1">
                <div className="text-base font-semibold">{showEn}</div>
                {showPhon ? <div className="text-sm text-neutral-700">{showPhon}</div> : null}
              </div>
            ) : (
              <div className="mt-2 text-sm text-neutral-600">Kliknij „Pokaż”, żeby zobaczyć gotowe zdanie.</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Tryb: ułóż pytanie po angielsku</div>
            <div className="text-xs text-neutral-500">Klikaj elementy we właściwej kolejności.</div>
          </div>

          <div className="flex gap-2">
            <button onClick={undoLast} className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-100" type="button">
              Cofnij
            </button>
            <button onClick={nextTask} className="rounded-lg bg-black px-3 py-2 text-sm text-white hover:opacity-90" type="button">
              Następne
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-neutral-50 p-3">
          <div className="text-xs font-medium text-neutral-500">Twoje zdanie</div>
          <div className="mt-2 text-base font-semibold">{built.length ? builtEn : "—"}</div>
          {built.length ? (
            <div className="mt-1 text-sm">
              {isCorrect ? (
                <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">OK ✅</span>
              ) : (
                <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">Jeszcze nie</span>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-xs font-medium text-neutral-500">Bank słów</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {pool.map((t, i) => (
              <button
                key={i}
                onClick={() => pickToken(t, i)}
                className="rounded-full border bg-white px-3 py-1 text-sm hover:bg-neutral-100"
                type="button"
              >
                {t.en}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Poprawna odpowiedź: <span className="font-medium">{task.answerEn || correctEn}</span>
        </div>
      </div>
    </div>
  );
}