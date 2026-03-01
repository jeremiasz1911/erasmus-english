"use client";

import { useEffect, useMemo, useState } from "react";
import { getSomeVocab } from "@/app/lib/db/vocab";
import type { Vocab } from "@/app/lib/types";

function Flashcard({ item }: { item: Vocab }) {
  const [flip, setFlip] = useState(false);

  return (
    <button
      onClick={() => setFlip((v) => !v)}
      className="w-full rounded-2xl border bg-white p-4 text-left hover:bg-neutral-50"
      type="button"
    >
      {!flip ? (
        <div>
          <div className="text-xs text-neutral-500">PL</div>
          <div className="text-xl font-bold">{item.pl}</div>
        </div>
      ) : (
        <div>
          <div className="text-xs text-neutral-500">EN</div>
          <div className="text-xl font-bold">{item.en}</div>
          {item.phon ? <div className="mt-1 text-sm text-neutral-700">{item.phon}</div> : null}
        </div>
      )}
      <div className="mt-3 text-xs text-neutral-500">Kliknij, aby odwrócić</div>
    </button>
  );
}

export default function LearnPage() {
  const [all, setAll] = useState<Vocab[]>([]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"list" | "flash">("list");

  useEffect(() => {
    (async () => {
      const list = await getSomeVocab(250);
      setAll(list);
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((v) => {
      const hay = `${v.pl} ${v.en} ${v.phon ?? ""} ${(v.tags ?? []).join(" ")} ${v.category ?? ""}`.toLowerCase();
      return hay.includes(s);
    });
  }, [all, q]);

  const first = filtered[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold">Nauka słówek i zwrotów</div>
          <div className="text-sm text-neutral-600">Wpisz po polsku lub angielsku. Wyszukiwarka działa od razu.</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("list")}
            className={["rounded-lg border px-3 py-2 text-sm", mode === "list" ? "bg-black text-white" : "bg-white hover:bg-neutral-50"].join(" ")}
            type="button"
          >
            Lista
          </button>
          <button
            onClick={() => setMode("flash")}
            className={["rounded-lg border px-3 py-2 text-sm", mode === "flash" ? "bg-black text-white" : "bg-white hover:bg-neutral-50"].join(" ")}
            type="button"
          >
            Fiszki
          </button>
        </div>
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Szukaj: pool / basen / excuse me / przepraszam…"
        className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2"
      />

      {mode === "flash" ? (
        first ? <Flashcard item={first} /> : <div className="text-neutral-600">Brak wyników.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white">
          <div className="grid grid-cols-12 border-b bg-neutral-50 px-4 py-2 text-xs font-semibold text-neutral-600">
            <div className="col-span-4">PL</div>
            <div className="col-span-4">EN</div>
            <div className="col-span-4">FON</div>
          </div>

          <div className="divide-y">
            {filtered.slice(0, 200).map((v) => (
              <div key={v.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                <div className="col-span-4 font-medium">{v.pl}</div>
                <div className="col-span-4">{v.en}</div>
                <div className="col-span-4 text-neutral-700">{v.phon ?? "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}