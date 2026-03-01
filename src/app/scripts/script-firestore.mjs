import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

// 1) serviceAccountKey.json daj w root projektu (obok package.json)
const serviceAccountPath = path.join(root, "serviceAccountKey.json");
if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Brak serviceAccountKey.json w root projektu.");
  console.error("👉 Pobierz z Firebase Console -> Project settings -> Service accounts -> Generate new private key");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function now() {
  return Date.now();
}

async function seedCollection(name, items) {
  if (!Array.isArray(items) || !items.length) {
    console.log(`⚠️ Pomijam ${name}, bo brak elementów.`);
    return;
  }

  const batch = db.batch();
  for (const item of items) {
    const ref = db.collection(name).doc();
    batch.set(ref, { ...item, createdAt: now() });
  }
  await batch.commit();
  console.log(`✅ Seeded ${items.length} docs into ${name}`);
}

async function main() {
  const vocabPath = path.join(root, "src/app/scripts/seed/vocab.json");
  const tasksPath = path.join(root, "src/app/scripts/seed/tasks.json");

  if (!fs.existsSync(vocabPath) || !fs.existsSync(tasksPath)) {
    console.error("❌ Brak plików seed.");
    console.error("👉 Upewnij się, że istnieją:");
    console.error("   - src/app/scripts/seed/vocab.json");
    console.error("   - src/app/scripts/seed/tasks.json");
    process.exit(1);
  }

  const vocab = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
  const tasks = JSON.parse(fs.readFileSync(tasksPath, "utf8"));

  await seedCollection("vocab", vocab);
  await seedCollection("tasks", tasks);

  console.log("🎉 Done.");
}

main().catch((e) => {
  console.error("❌ Seed error:", e);
  process.exit(1);
});