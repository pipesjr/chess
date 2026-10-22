const STORAGE_KEY = "chess-vision-custom-tactics";

const PIECE_NAMES = { K: "King", Q: "Queen", R: "Rooks", B: "Bishops", N: "Knights", P: "Pawns" };
const PIECE_ORDER = ["K", "Q", "R", "B", "N", "P"];
const GLYPHS = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" },
};
// U+FE0E asks for the text glyph; without it some systems draw the king as a black emoji.
const TEXT_STYLE = "\uFE0E";
const FILES = "abcdefgh";

// ---------- Position parsing ----------

// Returns { pieces: { w: {K: ["g1"], ...}, b: {...} }, turn: "w" | "b" }.
function parseFen(fen) {
  const [placement, turn = "w"] = fen.trim().split(/\s+/);
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("FEN needs 8 ranks separated by '/'.");
  const pieces = { w: {}, b: {} };
  ranks.forEach((row, i) => {
    const rank = 8 - i;
    let file = 0;
    for (const ch of row) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
      } else if (/[kqrbnpKQRBNP]/.test(ch)) {
        if (file > 7) throw new Error(`Rank ${rank} has too many squares.`);
        const color = ch === ch.toUpperCase() ? "w" : "b";
        const type = ch.toUpperCase();
        (pieces[color][type] ||= []).push(FILES[file] + rank);
        file++;
      } else {
        throw new Error(`Unexpected character '${ch}' in FEN.`);
      }
    }
    if (file !== 8) throw new Error(`Rank ${rank} has ${file} squares, expected 8.`);
  });
  if (turn !== "w" && turn !== "b") throw new Error("Side to move must be 'w' or 'b'.");
  return { pieces, turn };
}

// Parses "White: Kg1 Ra1 f2 g2; Black: Kg8 f7" into a FEN string.
function pieceListToFen(text, turn) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const sections = text.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  if (!sections.length) throw new Error("Enter a position.");
  for (const section of sections) {
    const m = section.match(/^(white|black)\s*:?\s*(.*)$/i);
    if (!m) throw new Error(`Start each part with "White:" or "Black:" (got "${section}").`);
    const color = m[1].toLowerCase() === "white" ? "w" : "b";
    for (const token of m[2].split(/[\s,]+/).filter(Boolean)) {
      const t = token.match(/^([KQRBNP]?)([a-h][1-8])$/);
      if (!t) throw new Error(`Can't read "${token}". Use e.g. Kg1, Nf3 or e4.`);
      const type = t[1] || "P";
      const file = FILES.indexOf(t[2][0]);
      const rank = Number(t[2][1]);
      if (board[8 - rank][file]) throw new Error(`Two pieces on ${t[2]}.`);
      board[8 - rank][file] = color === "w" ? type : type.toLowerCase();
    }
  }
  const placement = board
    .map((row) => {
      let out = "";
      let empty = 0;
      for (const sq of row) {
        if (sq) {
          if (empty) out += empty;
          out += sq;
          empty = 0;
        } else {
          empty++;
        }
      }
      return out + (empty || "");
    })
    .join("/");
  return `${placement} ${turn} - - 0 1`;
}

function checkKings(pieces) {
  for (const color of ["w", "b"]) {
    const kings = (pieces[color].K || []).length;
    if (kings !== 1) {
      throw new Error(`${color === "w" ? "White" : "Black"} needs exactly one king (found ${kings}).`);
    }
  }
}

// ---------- Rendering ----------

function sortSquares(squares) {
  return [...squares].sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]);
}

function describeSide(sidePieces) {
  return PIECE_ORDER.filter((type) => sidePieces[type])
    .map((type) => {
      const squares = sortSquares(sidePieces[type]);
      if (type === "K") return `King ${squares[0]}`;
      const name = squares.length === 1 ? PIECE_NAMES[type].replace(/s$/, "") : PIECE_NAMES[type];
      return `${name} ${squares.join(", ")}`;
    })
    .join("; ");
}

function renderDescription(el, pieces) {
  el.innerHTML = "";
  for (const [color, label] of [["w", "White"], ["b", "Black"]]) {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = describeSide(pieces[color]) || "(nothing)";
    el.append(dt, dd);
  }
}

function renderBoard(el, pieces, flipped) {
  const grid = {};
  for (const color of ["w", "b"]) {
    for (const [type, squares] of Object.entries(pieces[color])) {
      for (const sq of squares) grid[sq] = { color, type };
    }
  }
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const files = flipped ? [...FILES].reverse() : [...FILES];
  el.innerHTML = "";
  for (const rank of ranks) {
    el.append(cell("label", rank));
    files.forEach((f) => {
      const sq = f + rank;
      const shade = (FILES.indexOf(f) + rank) % 2 === 1 ? "dark" : "light";
      const piece = grid[sq];
      const div = cell(`sq ${shade}`, piece ? GLYPHS[piece.color][piece.type] + TEXT_STYLE : "");
      div.title = sq;
      el.append(div);
    });
  }
  el.append(cell("label", ""));
  files.forEach((f) => el.append(cell("label", f)));
}

function cell(className, text) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

function formatSolution(solution, turn) {
  const parts = [];
  let moveNo = 1;
  solution.forEach((move, i) => {
    const whiteMoving = (turn === "w") === (i % 2 === 0);
    if (whiteMoving) {
      parts.push(`${moveNo}. ${move}`);
    } else {
      parts.push(i === 0 ? `${moveNo}... ${move}` : move);
      moveNo++;
    }
  });
  return parts.join(" ");
}

// ---------- Storage ----------

function loadCustom() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCustom(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    alert("Couldn't save to this browser's storage. Use 'Copy as code' instead.");
  }
}

function allTactics() {
  return [
    ...TACTICS.map((t) => ({ ...t, custom: false })),
    ...loadCustom().map((t) => ({ ...t, custom: true })),
  ];
}

// ---------- Practice view ----------

const $ = (id) => document.getElementById(id);
let tactics = allTactics();
let current = 0;

function populateSelect() {
  const select = $("tactic-select");
  select.innerHTML = "";
  tactics.forEach((t, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `${i + 1}. ${t.title} (${t.goal})${t.custom ? " ★" : ""}`;
    select.append(opt);
  });
}

function show(index) {
  if (!tactics.length) return;
  current = (index + tactics.length) % tactics.length;
  const t = tactics[current];
  const { pieces, turn } = parseFen(t.fen);
  $("tactic-select").value = current;
  $("goal").textContent = t.goal;
  $("to-move").textContent = `${turn === "w" ? "White" : "Black"} to move`;
  renderDescription($("description"), pieces);
  renderBoard($("board"), pieces, turn === "b");
  $("solution").textContent = formatSolution(t.solution, turn);
  $("explanation").textContent = t.explanation || "";
  $("delete").classList.toggle("hidden", !t.custom);
  hideAnswer();
}

function hideAnswer() {
  $("answer").classList.add("hidden");
  $("solution").parentElement.classList.remove("hidden");
  $("reveal").textContent = "Show answer";
}

$("reveal").addEventListener("click", () => {
  const hidden = $("answer").classList.contains("hidden");
  $("answer").classList.toggle("hidden", !hidden);
  $("solution").parentElement.classList.remove("hidden");
  $("reveal").textContent = hidden ? "Hide answer" : "Show answer";
});

$("peek").addEventListener("click", () => {
  // Show only the board, keep the solution hidden.
  $("answer").classList.remove("hidden");
  $("solution").parentElement.classList.add("hidden");
  $("reveal").textContent = "Show answer";
});

$("prev").addEventListener("click", () => show(current - 1));
$("next").addEventListener("click", () => show(current + 1));
$("random").addEventListener("click", () => {
  if (tactics.length < 2) return show(0);
  let i;
  do i = Math.floor(Math.random() * tactics.length);
  while (i === current);
  show(i);
});
$("tactic-select").addEventListener("change", (e) => show(Number(e.target.value)));

$("delete").addEventListener("click", () => {
  const t = tactics[current];
  if (!t.custom || !confirm(`Delete "${t.title}"?`)) return;
  const customIndex = current - TACTICS.length;
  const list = loadCustom();
  list.splice(customIndex, 1);
  saveCustom(list);
  refresh(current - 1);
});

function refresh(index) {
  tactics = allTactics();
  populateSelect();
  show(index);
}

document.addEventListener("keydown", (e) => {
  if (!$("practice").classList.contains("active") || e.target.matches("input, textarea, select")) return;
  if (e.key === "ArrowRight") show(current + 1);
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === " ") {
    e.preventDefault();
    $("reveal").click();
  }
});

// ---------- Tabs ----------

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === tab.dataset.view));
  })
);

// ---------- Add view ----------

function readForm() {
  const data = new FormData($("add-form"));
  const turn = data.get("turn");
  const position = data.get("position").trim();
  const fen = position.includes("/")
    ? `${position.split(/\s+/)[0]} ${turn} - - 0 1`
    : pieceListToFen(position, turn);
  const { pieces } = parseFen(fen);
  checkKings(pieces);
  const solution = data.get("solution").replace(/\d+\.(\.\.)?/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!solution.length) throw new Error("Enter at least one solution move.");
  const tactic = {
    title: data.get("title").trim(),
    goal: data.get("goal").trim(),
    fen,
    solution,
  };
  const explanation = data.get("explanation").trim();
  if (explanation) tactic.explanation = explanation;
  return { tactic, pieces };
}

$("preview-btn").addEventListener("click", () => {
  $("add-error").textContent = "";
  try {
    const { pieces } = readForm();
    renderDescription($("preview-description"), pieces);
    renderBoard($("preview-board"), pieces, false);
    $("preview").classList.remove("hidden");
  } catch (err) {
    $("add-error").textContent = err.message;
  }
});

$("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  $("add-error").textContent = "";
  try {
    const { tactic } = readForm();
    const list = loadCustom();
    list.push(tactic);
    saveCustom(list);
    $("add-form").reset();
    $("preview").classList.add("hidden");
    refresh(TACTICS.length + list.length - 1);
    document.querySelector('.tab[data-view="practice"]').click();
  } catch (err) {
    $("add-error").textContent = err.message;
  }
});

$("copy-code").addEventListener("click", async () => {
  const list = loadCustom();
  const out = $("code-output");
  out.classList.remove("hidden");
  if (!list.length) {
    out.textContent = "You haven't added any tactics yet.";
    return;
  }
  const code = list.map((t) => `  ${JSON.stringify(t, null, 2).replace(/\n/g, "\n  ")},`).join("\n");
  out.textContent = code;
  try {
    await navigator.clipboard.writeText(code);
    $("copy-code").textContent = "Copied!";
    setTimeout(() => ($("copy-code").textContent = "Copy as code"), 1500);
  } catch {
    // Clipboard may be blocked; the code is shown above to copy by hand.
  }
});

// ---------- Start ----------

populateSelect();
show(0);
