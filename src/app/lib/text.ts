import type { TaskToken } from "@/app/lib/types";

export function joinEn(tokens: TaskToken[]) {
  const parts: string[] = [];
  for (const t of tokens) {
    const s = (t.en ?? "").trim();
    if (!s) continue;

    // Punctuation attach
    if (["?", "!", ".", ",", ":"].includes(s)) {
      if (parts.length) parts[parts.length - 1] = parts[parts.length - 1] + s;
      else parts.push(s);
      continue;
    }

    parts.push(s);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}