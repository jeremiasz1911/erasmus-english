import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seedDir = path.join(root, "src/app/scripts/seed");
const outTasks = path.join(seedDir, "tasks.json");
const outVocab = path.join(seedDir, "vocab.json");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function t(pl, en, phon = "", category = "travel", tags = []) {
  return { pl, en, phon, category, tags };
}

function joinEn(tokens) {
  const parts = [];
  for (const x of tokens) {
    const s = (x.en ?? "").trim();
    if (!s) continue;
    if (["?", "!", ".", ",", ":"].includes(s)) {
      if (parts.length) parts[parts.length - 1] += s;
      else parts.push(s);
      continue;
    }
    parts.push(s);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function isPunct(s) {
  return ["?", "!", ".", ",", ":"].includes(String(s ?? "").trim());
}
function joinPhon(tokens) {
  const parts = [];
  for (const x of tokens) {
    const s = (x.phon ?? "").trim();
    const en = (x.en ?? "").trim();
    if (!en) continue;
    if (["?", "!", ".", ",", ":"].includes(en)) {
      if (parts.length) parts[parts.length - 1] += en;
      else parts.push(en);
      continue;
    }
    if (!s) continue;
    parts.push(s);
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function mkTask({ plPrompt, tokens, category, level = 1 }) {
  const answerEn = joinEn(tokens);
  const answerPhon = joinPhon(tokens);
  return {
    pl: `Zadaj pytanie: ${plPrompt}`,
    tokens: [...tokens, { pl: "?", en: "?", phon: "" }],
    answerEn: answerEn.endsWith("?") ? answerEn : `${answerEn}?`,
    answerPhon: answerPhon ? (answerPhon.endsWith("?") ? answerPhon : `${answerPhon}?`) : "",
    category,
    level,
  };
}

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --- SŁOWNIK “klocków” (bez osobnego "the" żeby nie mieszać PL/EN) ---
const K = {
  // ogólne pytania
  where_is: () => [t("Gdzie jest", "Where is", "łer iz", "grammar", ["question"])],
  where_are: () => [t("Gdzie są", "Where are", "łer ar", "grammar", ["question"])],
  is_there: () => [t("Czy jest", "Is there", "iz der", "grammar", ["question"])],
  are_there: () => [t("Czy są", "Are there", "ar der", "grammar", ["question"])],
  how_much_is: () => [t("Ile kosztuje", "How much is", "hał macz iz", "money", ["price"])],
  how_much_are: () => [t("Ile kosztują", "How much are", "hał macz ar", "money", ["price"])],
  what_time_open: () => [t("O której otwiera się", "What time does", "łot tajm daz", "travel", ["time"]), t("", "open", "ołpen", "travel", ["time"])],
  what_time_close: () => [t("O której zamyka się", "What time does", "łot tajm daz", "travel", ["time"]), t("", "close", "klołz", "travel", ["time"])],
  can_i: () => [t("Czy mogę", "Can I", "ken aj", "phrases", ["polite"])],
  could_you: () => [t("Czy mógłbyś", "Could you", "kud ju", "phrases", ["polite"])],
  do_you_have: () => [t("Czy macie", "Do you have", "du ju hav", "phrases", ["restaurant"])],
  can_i_have: () => [t("Czy mogę prosić", "Can I have", "ken aj hav", "phrases", ["restaurant"])],
  i_would_like: () => [t("Chciałbym", "I'd like", "ajd lajk", "phrases", ["restaurant"])],
  excuse_me: () => [t("Przepraszam", "Excuse me", "ikskju:z mi", "phrases", ["polite"])],
  please: () => [t("Proszę", "please", "pliz", "phrases", ["polite"])],

  // miejsca
  the_hotel: () => [t("hotel", "the hotel", "de hołtel", "travel", ["hotel"])],
  the_museum: () => [t("muzeum", "the museum", "de mjuzijem", "travel", ["museum"])],
  the_restaurant: () => [t("restauracja", "the restaurant", "de restorant", "food", ["eat"])],
  the_bus_stop: () => [t("przystanek autobusowy", "the bus stop", "de bas stop", "transport", ["bus"])],
  the_train_station: () => [t("dworzec", "the train station", "de trejn stejszyn", "transport", ["train"])],
  the_city_center: () => [t("centrum", "the city centre", "de siti senta", "travel", ["city"])],
  the_toilet: () => [t("toaleta", "the toilet", "de tojlet", "travel", ["bathroom"])],
  the_atm: () => [t("bankomat", "an ATM", "en ej-ti-em", "money", ["cash"])],
  the_pharmacy: () => [t("apteka", "a pharmacy", "e farmasy", "travel", ["health"])],

  // jedzenie / menu
  the_menu: () => [t("menu", "the menu", "de menu", "food", ["restaurant"])],
  starters: () => [t("przystawki", "starters", "starterz", "food", ["restaurant"])],
  vegetarian: () => [t("opcje wegetariańskie", "vegetarian options", "wedżeterian opszync", "food", ["restaurant"])],
  the_bill: () => [t("rachunek", "the bill", "de bil", "money", ["restaurant"])],
  tap_water: () => [t("woda z kranu", "tap water", "tap łoter", "food", ["drink"])],
  a_glass_of_water: () => [t("szklankę wody", "a glass of water", "e glas ew łoter", "food", ["drink"])],
  coffee: () => [t("kawę", "a coffee", "e kofi", "food", ["drink"])],
  tea: () => [t("herbatę", "a tea", "e ti", "food", ["drink"])],
  juice: () => [t("sok", "a juice", "e dżus", "food", ["drink"])],

  // transport / bilety
  a_ticket: () => [t("bilet", "a ticket", "e tiket", "transport", ["ticket"])],
  tickets: () => [t("bilety", "tickets", "tikets", "transport", ["ticket"])],
  by_bus: () => [t("autobusem", "by bus", "baj bas", "transport", ["bus"])],
  by_train: () => [t("pociągiem", "by train", "baj trejn", "transport", ["train"])],
  to_the_museum: () => [t("do muzeum", "to the museum", "tu de mjuzijem", "travel", ["museum"])],
  from_the_hotel: () => [t("z hotelu", "from the hotel", "from de hołtel", "travel", ["hotel"])],
  to_the_hotel: () => [t("do hotelu", "to the hotel", "tu de hołtel", "travel", ["hotel"])],
  the_bus: () => [t("autobus", "the bus", "de bas", "transport", ["bus"])],
  the_bus_ticket: () => [t("bilet autobusowy", "a bus ticket", "e bas tiket", "transport", ["bus"])],
  free: () => [t("darmowy", "free", "fri", "money", ["price"])],
  paid: () => [t("płatny", "paid", "pejd", "money", ["price"])],
  student_discount: () => [t("zniżka studencka", "a student discount", "e stjudent diskount", "money", ["discount"])],

  // nawigacja / trasa
  how_do_i_get: () => [t("Jak dojdę", "How do I get", "hał du aj get", "travel", ["directions"])],
  to: () => [t("do", "to", "tu", "grammar", [])],
  from: () => [t("z", "from", "from", "grammar", [])],
  the_shortest_route: () => [t("najkrótsza trasa", "the shortest route", "de szortest rut", "travel", ["directions"])],
  how_long_take: () => [t("Ile to zajmie", "How long does it take", "hał long daz it tejk", "travel", ["time"])],
  on_the_map: () => [t("na mapie", "on the map", "on de map", "travel", ["directions"])],
};

// --- GENEROWANIE 100 PYTAŃ ---
function buildQuestions() {
  const tasks = [];

  // Muzeum / wejście / godziny / zdjęcia / bilety
  tasks.push(mkTask({
    plPrompt: "Czy mogę wejść do muzeum",
    tokens: [...K.can_i(), t("wejść", "enter", "enter", "travel", ["museum"]), ...K.the_museum()],
    category: "museum",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "O której otwiera się muzeum",
    tokens: [t("O której", "What time does", "łot tajm daz", "travel", ["time"]), ...K.the_museum(), t("otwiera się", "open", "ołpen", "travel", ["time"])],
    category: "museum",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "O której zamyka się muzeum",
    tokens: [t("O której", "What time does", "łot tajm daz", "travel", ["time"]), ...K.the_museum(), t("zamyka się", "close", "klołz", "travel", ["time"])],
    category: "museum",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Czy jest zniżka studencka do muzeum",
    tokens: [...K.is_there(), ...K.student_discount(), t("do muzeum", "for the museum", "for de mjuzijem", "money", ["museum"])],
    category: "museum",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Czy mogę robić zdjęcia w muzeum",
    tokens: [...K.can_i(), t("robić zdjęcia", "take photos", "tejk fołtos", "museum", ["rules"]), t("w muzeum", "in the museum", "in de mjuzijem", "museum", ["rules"])],
    category: "museum",
    level: 2
  }));

  // Trasa hotel -> muzeum
  tasks.push(mkTask({
    plPrompt: "Jak dojdę do muzeum z hotelu",
    tokens: [...K.how_do_i_get(), ...K.to_the_museum(), ...K.from_the_hotel()],
    category: "directions",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Jaka jest najkrótsza trasa z hotelu do muzeum",
    tokens: [t("Jaka jest", "What is", "łot iz", "grammar", ["question"]), ...K.the_shortest_route(), ...K.from_the_hotel(), ...K.to_the_museum()],
    category: "directions",
    level: 3
  }));

  tasks.push(mkTask({
    plPrompt: "Ile to zajmie z hotelu do muzeum",
    tokens: [...K.how_long_take(), ...K.from_the_hotel(), ...K.to_the_museum()],
    category: "directions",
    level: 3
  }));

  tasks.push(mkTask({
    plPrompt: "Czy możesz mi pokazać trasę na mapie",
    tokens: [...K.could_you(), t("pokazać mi trasę", "show me the way", "szoł mi de łej", "travel", ["directions"]), ...K.on_the_map()],
    category: "directions",
    level: 3
  }));

  // Transport: bus, bilety, płatny/darmowy
  tasks.push(mkTask({
    plPrompt: "Gdzie jest przystanek autobusowy",
    tokens: [...K.where_is(), ...K.the_bus_stop()],
    category: "transport",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy ten autobus jedzie do muzeum",
    tokens: [t("Czy ten", "Does this", "daz dis", "grammar", ["question"]), ...K.the_bus(), t("jedzie", "go", "goł", "transport", ["bus"]), ...K.to_the_museum()],
    category: "transport",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Czy autobus jest płatny",
    tokens: [t("Czy", "Is", "iz", "grammar", ["question"]), ...K.the_bus(), t("płatny", "paid", "pejd", "money", ["price"])],
    category: "transport",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy autobus jest darmowy",
    tokens: [t("Czy", "Is", "iz", "grammar", ["question"]), ...K.the_bus(), ...K.free()],
    category: "transport",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Gdzie mogę kupić bilet autobusowy",
    tokens: [...K.where_is(), t("gdzie mogę kupić", "where can I buy", "łer ken aj baj", "transport", ["ticket"]), ...K.the_bus_ticket()],
    category: "transport",
    level: 3
  }));

  tasks.push(mkTask({
    plPrompt: "Ile kosztuje bilet autobusowy",
    tokens: [...K.how_much_is(), ...K.the_bus_ticket()],
    category: "transport",
    level: 2
  }));

  // Hotel / rzeczy
  tasks.push(mkTask({
    plPrompt: "Gdzie jest hotel",
    tokens: [...K.where_is(), ...K.the_hotel()],
    category: "hotel",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Gdzie jest toaleta",
    tokens: [...K.where_is(), ...K.the_toilet()],
    category: "hotel",
    level: 1
  }));

  // Pieniądze / płatność
  tasks.push(mkTask({
    plPrompt: "Gdzie jest bankomat",
    tokens: [...K.where_is(), ...K.the_atm()],
    category: "money",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy mogę zapłacić kartą",
    tokens: [...K.can_i(), t("zapłacić kartą", "pay by card", "pej baj kard", "money", ["payment"])],
    category: "money",
    level: 2
  }));

  // Restauracja / menu / napoje
  tasks.push(mkTask({
    plPrompt: "Czy mogę zobaczyć menu",
    tokens: [...K.can_i(), t("zobaczyć", "see", "si", "food", ["restaurant"]), ...K.the_menu()],
    category: "food",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy macie przystawki",
    tokens: [...K.do_you_have(), ...K.starters()],
    category: "food",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy macie opcje wegetariańskie",
    tokens: [...K.do_you_have(), ...K.vegetarian()],
    category: "food",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Czy mogę prosić o rachunek",
    tokens: [...K.can_i_have(), ...K.the_bill(), ...K.please()],
    category: "food",
    level: 2
  }));

  tasks.push(mkTask({
    plPrompt: "Czy mogę prosić szklankę wody",
    tokens: [...K.can_i_have(), ...K.a_glass_of_water(), ...K.please()],
    category: "food",
    level: 1
  }));

  tasks.push(mkTask({
    plPrompt: "Czy woda z kranu jest darmowa",
    tokens: [t("Czy", "Is", "iz", "grammar", ["question"]), ...K.tap_water(), t("darmowa", "free", "fri", "money", ["price"])],
    category: "food",
    level: 2
  }));

  // --- Rozszerzanie: miejsca + wzorce -> łatwo dobić do 100 ---
  const places = [
    { key: "museum", pl: "muzeum", en: "the museum", phon: "de mjuzijem", category: "museum" },
    { key: "city", pl: "centrum", en: "the city centre", phon: "de siti senta", category: "travel" },
    { key: "station", pl: "dworzec", en: "the train station", phon: "de trejn stejszyn", category: "transport" },
    { key: "pharmacy", pl: "apteka", en: "a pharmacy", phon: "e farmasy", category: "travel" },
    { key: "restaurant", pl: "restauracja", en: "the restaurant", phon: "de restorant", category: "food" },
    { key: "hotel", pl: "hotel", en: "the hotel", phon: "de hołtel", category: "hotel" },
  ];

  const drinkItems = [
    { pl: "kawę", en: "a coffee", phon: "e kofi" },
    { pl: "herbatę", en: "a tea", phon: "e ti" },
    { pl: "sok", en: "a juice", phon: "e dżus" },
    { pl: "wodę", en: "water", phon: "łoter" },
  ];

  // Wzorce “Where is … ?”
  for (const p of places) {
    tasks.push(mkTask({
      plPrompt: `Gdzie jest ${p.pl}`,
      tokens: [...K.where_is(), t(p.pl, p.en, p.phon, p.category, [p.key])],
      category: p.category,
      level: 1
    }));
  }

  // “Is there … near the hotel?”
  for (const p of places) {
    if (p.key === "hotel") continue;
    tasks.push(mkTask({
      plPrompt: `Czy jest ${p.pl} blisko hotelu`,
      tokens: [...K.is_there(), t(p.pl, p.en.replace(/^the /, "a "), p.phon, p.category, [p.key]), t("blisko hotelu", "near the hotel", "niar de hołtel", "travel", ["hotel"])],
      category: "travel",
      level: 2
    }));
  }

  // “How do I get to PLACE?”
  for (const p of places) {
    if (p.key === "hotel") continue;
    tasks.push(mkTask({
      plPrompt: `Jak dojdę do ${p.pl}`,
      tokens: [...K.how_do_i_get(), t(`do ${p.pl}`, `to ${p.en}`, `tu ${p.phon}`, p.category, [p.key])],
      category: "directions",
      level: 2
    }));
  }

  // “Can I have DRINK please?”
  for (const d of drinkItems) {
    tasks.push(mkTask({
      plPrompt: `Czy mogę prosić ${d.pl}`,
      tokens: [...K.can_i_have(), t(d.pl, d.en, d.phon, "food", ["drink"]), ...K.please()],
      category: "food",
      level: 1
    }));
  }

  // Dodatkowe praktyczne pytania (doklejamy ręcznie aż będzie bogato)
  const extras = [
    mkTask({
      plPrompt: "Czy jest Wi-Fi w hotelu",
      tokens: [...K.is_there(), t("Wi-Fi", "Wi-Fi", "łaj faj", "hotel", ["wifi"]), t("w hotelu", "in the hotel", "in de hołtel", "hotel", ["hotel"])],
      category: "hotel",
      level: 2
    }),
    mkTask({
      plPrompt: "Czy mogę dostać mapę miasta",
      tokens: [...K.can_i_have(), t("mapę miasta", "a city map", "e siti map", "travel", ["map"]), ...K.please()],
      category: "travel",
      level: 2
    }),
    mkTask({
      plPrompt: "Czy jest wycieczka z przewodnikiem po angielsku",
      tokens: [...K.is_there(), t("wycieczka z przewodnikiem", "a guided tour", "e gajdid tur", "travel", ["tour"]), t("po angielsku", "in English", "in inglisz", "travel", ["language"])],
      category: "travel",
      level: 3
    }),
    mkTask({
      plPrompt: "Ile kosztuje wycieczka",
      tokens: [...K.how_much_is(), t("wycieczka", "the tour", "de tur", "travel", ["tour"])],
      category: "travel",
      level: 2
    }),
    mkTask({
      plPrompt: "Czy mogę zapłacić gotówką",
      tokens: [...K.can_i(), t("zapłacić gotówką", "pay in cash", "pej in kesz", "money", ["payment"])],
      category: "money",
      level: 2
    }),
    mkTask({
      plPrompt: "Gdzie jest najbliższa apteka",
      tokens: [t("Gdzie jest", "Where is", "łer iz", "grammar", ["question"]), t("najbliższa apteka", "the nearest pharmacy", "de niaryst farmasy", "travel", ["health"])],
      category: "travel",
      level: 3
    }),
    mkTask({
      plPrompt: "Czy potrzebuję rezerwacji do muzeum",
      tokens: [t("Czy potrzebuję", "Do I need", "du aj nid", "travel", ["question"]), t("rezerwacji", "a reservation", "e rezarwejszyn", "travel", ["booking"]), t("do muzeum", "for the museum", "for de mjuzijem", "museum", ["museum"])],
      category: "museum",
      level: 3
    }),
    mkTask({
      plPrompt: "Czy to jest właściwy autobus do centrum",
      tokens: [t("Czy to", "Is this", "iz dis", "grammar", ["question"]), t("właściwy autobus", "the right bus", "de rajt bas", "transport", ["bus"]), t("do centrum", "to the city centre", "tu de siti senta", "travel", ["city"])],
      category: "transport",
      level: 2
    }),
  ];

  tasks.push(...extras);

  // Dobić do 100: mieszamy, deduplikujemy po answerEn
  const unique = new Map();
  for (const task of tasks) {
    unique.set(task.answerEn, task);
  }
  const all = shuffle([...unique.values()]);

  // jeśli nadal mniej niż 100, powielimy warianty “How much is … ?” dla miejsc/biletów
  while (all.length < 100) {
    all.push(mkTask({
      plPrompt: "Ile kosztuje bilet",
      tokens: [...K.how_much_is(), ...K.a_ticket()],
      category: "transport",
      level: 1
    }));
  }

  return all.slice(0, 100);
}

function buildVocabFromTasks(tasks) {
  const map = new Map();

  for (const task of tasks) {
    for (const tok of task.tokens) {
      const en = (tok.en ?? "").trim();
      const pl = (tok.pl ?? "").trim();
      if (!en || isPunct(en)) continue;

      const key = `${en}|||${pl}`;
      if (!map.has(key)) {
        map.set(key, {
          pl,
          en,
          phon: tok.phon ?? "",
          category: tok.category ?? "travel",
          tags: tok.tags ?? [],
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => (a.pl > b.pl ? 1 : -1));
}

function main() {
  ensureDir(seedDir);

  const tasks = buildQuestions();
  const vocab = buildVocabFromTasks(tasks);

  fs.writeFileSync(outTasks, JSON.stringify(tasks, null, 2), "utf8");
  fs.writeFileSync(outVocab, JSON.stringify(vocab, null, 2), "utf8");

  console.log(`✅ Wygenerowano: ${tasks.length} pytań -> ${outTasks}`);
  console.log(`✅ Wygenerowano: ${vocab.length} słówek -> ${outVocab}`);
}

main();