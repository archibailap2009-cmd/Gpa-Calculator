// Шкала оценок (4.0). Если у вас другая — поменяйте значения здесь.
const GRADES = [
  { label: "A",  value: 4.0 },
  { label: "A-", value: 3.67 },
  { label: "B+", value: 3.33 },
  { label: "B",  value: 3.0 },
  { label: "B-", value: 2.67 },
  { label: "C+", value: 2.33 },
  { label: "C",  value: 2.0 },
  { label: "C-", value: 1.67 },
  { label: "D+", value: 1.33 },
  { label: "D",  value: 1.0 },
  { label: "F",  value: 0 },
];

// Предметы по умолчанию. Добавить или поменять кредиты можно прямо здесь.
const DEFAULT_COURSES = [
  { id: "eng",   name: "English Composition", credits: 6 },
  { id: "avd",   name: "АВД",                 credits: 6 },
  { id: "arv",   name: "АРВ",                 credits: 3 },
  { id: "up",    name: "УП",                  credits: 3 },
  { id: "bm",    name: "БМ",                  credits: 3 },
  { id: "km",    name: "КМ",                  credits: 3 },
  { id: "innov", name: "Инновации",           credits: 3 },
  { id: "sel",   name: "СЭЛ",                 credits: 3 },
  { id: "micro", name: "Микроэкономика",      credits: 3 },
  { id: "dm",    name: "ДМ",                  credits: 4 },
];

const STORAGE_KEY = "gpa-calculator-v1";

const $ = (id) => document.getElementById(id);
const listEl = $("list");

let state = load();

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.courses)) return saved;
  } catch (e) { /* localStorage недоступен — работаем без сохранения */ }
  return { courses: DEFAULT_COURSES.map((c) => ({ ...c })), grades: {} };
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function creditsWord(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "кредит";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "кредита";
  return "кредитов";
}

function render() {
  listEl.innerHTML = "";

  state.courses.forEach((course) => {
    const li = document.createElement("li");
    const grade = state.grades[course.id];
    li.className = "row" + (grade ? " graded" : "");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = course.name;

    const credits = document.createElement("span");
    credits.className = "credits";
    credits.textContent = `${course.credits} ${creditsWord(course.credits)}`;

    const pick = document.createElement("div");
    pick.className = "pick";

    const select = document.createElement("select");
    select.setAttribute("aria-label", `Оценка: ${course.name}`);
    select.innerHTML =
      `<option value="">Оценка</option>` +
      GRADES.map((g) => `<option value="${g.label}">${g.label}</option>`).join("");
    select.value = grade || "";
    select.addEventListener("change", () => {
      if (select.value) state.grades[course.id] = select.value;
      else delete state.grades[course.id];
      save();
      li.classList.toggle("graded", !!select.value);
      update();
    });
    pick.appendChild(select);

    // Кнопка удаления только у добавленных вручную предметов
    if (!DEFAULT_COURSES.some((d) => d.id === course.id)) {
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove";
      rm.setAttribute("aria-label", `Удалить ${course.name}`);
      rm.textContent = "×";
      rm.addEventListener("click", () => {
        state.courses = state.courses.filter((c) => c.id !== course.id);
        delete state.grades[course.id];
        save();
        render();
      });
      pick.appendChild(rm);
    }

    li.append(name, credits, pick);
    listEl.appendChild(li);
  });

  update();
}

function update() {
  let points = 0, counted = 0, total = 0;

  state.courses.forEach((c) => {
    total += c.credits;
    const label = state.grades[c.id];
    const g = GRADES.find((x) => x.label === label);
    if (g) {
      counted += c.credits;
      points += g.value * c.credits;
    }
  });

  const gpa = counted ? points / counted : null;

  $("gpa").textContent = gpa === null ? "—" : gpa.toFixed(2);
  $("counted").textContent = counted;
  $("total").textContent = total;
  $("points").textContent = points.toFixed(2);
  $("bar-fill").style.width = gpa === null ? "0%" : `${(gpa / 4) * 100}%`;
}

$("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("add-name").value.trim();
  const credits = parseInt($("add-credits").value, 10);
  if (!name || !credits || credits < 1) return;

  state.courses.push({ id: "c" + Date.now(), name, credits });
  save();
  $("add-name").value = "";
  render();
});

$("reset").addEventListener("click", () => {
  state.grades = {};
  save();
  render();
});

render();
