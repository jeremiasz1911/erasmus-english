import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Task } from "@/app/lib/types";

export async function getSomeTasks(n = 30): Promise<Task[]> {
  const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, "id">) }));
}

export async function getRandomTask(): Promise<Task | null> {
  const list = await getSomeTasks(40);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}