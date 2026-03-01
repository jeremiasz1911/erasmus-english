import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Vocab } from "@/app/lib/types";

export async function getSomeVocab(n = 200): Promise<Vocab[]> {
  const q = query(collection(db, "vocab"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vocab, "id">) }));
}