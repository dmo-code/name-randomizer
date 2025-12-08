const $ = (selector) => document.querySelector(selector);

const drawBtn = $("#drawBtn");
const resetBtn = $("#resetBtn");
const saveBtn = $("#saveBtn");
const clearBtn = $("#clearBtn");
const sortCheckbox = $("#sortNames");
const listSelect = $("#listSelect");
const listNameInput = $("#listName");
const newListBtn = $("#newListBtn");
const deleteListBtn = $("#deleteListBtn");
const drawnList = $("#drawnList");
const emptyState = $("#emptyState");
const drawStatus = $("#drawStatus");
const metaInfo = $("#metaInfo");
const remainingBadge = $("#remainingBadge");
const jsonEditor = $("#jsonEditor");
const editorStatus = $("#editorStatus");

const MAX_LISTS = 10;
const STORAGE_KEY = "name-randomizer:lists";

let allNames = [];
let availableNames = [];
let drawnNames = [];
let lists = [];
let activeListId = null;

const setStatus = (el, message, isError = false) => {
  el.textContent = message;
  el.classList.toggle("error", isError);
};

const parseEditorInput = (value) => {
  const cleanupToken = (token) =>
    token
      .replace(/^[\s"'`[{]+/, "")
      .replace(/[\s"'`[\]}]+$/, "")
      .trim();
  const isLikelyName = (token) => /[A-Za-zÀ-ÿ]/.test(token) && !token.includes(":");

  // Versuche zuerst JSON mit Schlüssel "names"
  try {
    const parsed = JSON.parse(value);
    if (parsed && Array.isArray(parsed.names)) {
      return parsed.names;
    }
    // Falls es ein String ist, weiter unten als Text interpretieren
    if (typeof parsed === "string") {
      value = parsed;
    }
  } catch (err) {
    // ignorieren, Fallback folgt
  }
  // Fallback: Komma- oder zeilengetrennte Liste
  const names = value
    .split(/[\n,]/)
    .map(cleanupToken)
    .filter((entry) => entry.length > 0)
    .filter(isLikelyName);
  if (names.length === 0) {
    throw new Error("Keine Namen gefunden. JSON oder Komma-getrennte Liste eingeben.");
  }
  return names;
};

const updateCounts = () => {
  remainingBadge.textContent = `${availableNames.length}/${allNames.length || 0} verfügbar`;
  metaInfo.textContent =
    allNames.length > 0
      ? `${drawnNames.length} gezogen, ${availableNames.length} übrig.`
      : "Keine Daten geladen.";
  drawBtn.disabled = availableNames.length === 0;
};

const renderDrawnList = () => {
  drawnList.innerHTML = "";
  if (drawnNames.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
    drawnNames.forEach((name, index) => {
      const li = document.createElement("li");
      li.textContent = name;
      li.setAttribute("aria-label", `Name ${index + 1}: ${name}`);
      drawnList.appendChild(li);
    });
  }
  updateCounts();
};

const sanitizeName = (name) => {
  // Entfernt potenziell gefährliche Zeichen (Tags/Skripte) und begrenzt die Länge
  const cleaned = name.replace(/[<>]/g, "").trim();
  if (cleaned.length > 100) {
    return cleaned.slice(0, 100);
  }
  return cleaned;
};

const validateNames = (names) => {
  if (!Array.isArray(names)) {
    throw new Error("names muss ein Array sein.");
  }
  const cleaned = names.map((n) => {
    if (typeof n !== "string" || n.trim() === "") {
      throw new Error("Alle Einträge müssen nicht-leere Strings sein.");
    }
    const safe = sanitizeName(n);
    if (!safe) {
      throw new Error("Ungültiger Name nach Bereinigung.");
    }
    return safe;
  });
  return cleaned;
};

const generateId = () => `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const persistLists = () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists, activeListId }));
};

const renderListOptions = () => {
  if (!listSelect) return;
  listSelect.innerHTML = "";
  lists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.id;
    option.textContent = list.name || "Unbenannt";
    listSelect.appendChild(option);
  });
  if (activeListId) {
    listSelect.value = activeListId;
  }
  const listCountEl = document.getElementById("listCount");
  if (listCountEl) {
    listCountEl.textContent = `${lists.length}/${MAX_LISTS}`;
  }
};

const setActiveList = (listId, statusMessage) => {
  const target = lists.find((l) => l.id === listId) || lists[0];
  if (!target) return;
  activeListId = target.id;
  allNames = [...target.names];
  availableNames = [...target.names];
  drawnNames = [];
  jsonEditor.value = target.names.join("\n");
  listSelect.value = target.id;
  if (listNameInput) {
    listNameInput.value = target.name || "";
  }
  renderListOptions();
  renderDrawnList();
  if (statusMessage) {
    setStatus(drawStatus, statusMessage);
  } else {
    setStatus(drawStatus, "Bereit. Liste geladen.");
  }
  setStatus(editorStatus, "");
};

const normalizeStoredData = (raw) => {
  // Altformat: nur Array von Namen
  if (Array.isArray(raw)) {
    const id = generateId();
    return { lists: [{ id, name: "Liste 1", names: validateNames(raw) }], activeId: id };
  }
  // Neues Format erwartet Objekt mit lists
  if (raw && Array.isArray(raw.lists)) {
    const normalized = raw.lists.map((l, idx) => ({
      id: l.id || generateId(),
      name: l.name || `Liste ${idx + 1}`,
      names: validateNames(l.names || []),
    }));
    const activeId = normalized.find((l) => l.id === raw.activeListId)?.id || normalized[0]?.id || null;
    return { lists: normalized, activeId };
  }
  return null;
};

const loadNames = async () => {
  // 1) Versuch: gespeicherte Listen (LocalStorage)
  try {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const normalized = normalizeStoredData(parsed);
      if (normalized && normalized.lists.length > 0) {
        lists = normalized.lists;
        activeListId = normalized.activeId;
        setActiveList(activeListId, "Bereit. Listen aus letzter Sitzung geladen.");
        persistLists();
        return;
      }
    }
  } catch (err) {
    // Ignorieren und Fallback auf Fetch
  }

  // 2) Fallback: names.json laden als Standard-Liste
  try {
    const response = await fetch("names.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const names = validateNames(data.names || []);
    const id = generateId();
    lists = [{ id, name: "Standard-Liste", names }];
    activeListId = id;
    persistLists();
    setActiveList(activeListId, "Bereit. Standard-Liste geladen.");
  } catch (err) {
    setStatus(drawStatus, `Fehler beim Laden: ${err.message}`, true);
  }
};

const drawRandomName = () => {
  if (availableNames.length === 0) {
    setStatus(drawStatus, "Alle Namen wurden bereits gezogen.", true);
    return;
  }
  const index = Math.floor(Math.random() * availableNames.length);
  const [name] = availableNames.splice(index, 1);
  drawnNames.push(name);
  setStatus(drawStatus, `Gezogen: ${name}`);
  renderDrawnList();
  drawBtn.focus();
};

const resetLists = () => {
  availableNames = [...allNames];
  drawnNames = [];
  setStatus(drawStatus, "Liste zurückgesetzt.");
  renderDrawnList();
  drawBtn.focus();
};

const saveFromEditor = () => {
  try {
    const namesInput = parseEditorInput(jsonEditor.value);
    let names = validateNames(namesInput || []);
    if (sortCheckbox.checked) {
      names = [...names].sort((a, b) => a.localeCompare(b, "de", { sensitivity: "base" }));
    }
    const currentName = (listNameInput?.value || listSelect.value || "").trim() || "Unbenannte Liste";
    if (!activeListId) {
      if (lists.length >= MAX_LISTS) {
        setStatus(editorStatus, `Maximal ${MAX_LISTS} Listen möglich.`, true);
        return;
      }
      const newId = generateId();
      lists.push({ id: newId, name: currentName, names });
      activeListId = newId;
    } else {
      const idx = lists.findIndex((l) => l.id === activeListId);
      if (idx >= 0) {
        lists[idx] = { ...lists[idx], name: currentName, names };
      } else {
        if (lists.length >= MAX_LISTS) {
          setStatus(editorStatus, `Maximal ${MAX_LISTS} Listen möglich.`, true);
          return;
        }
        lists.push({ id: activeListId, name: currentName, names });
      }
    }
    allNames = names;
    availableNames = [...names];
    drawnNames = [];
    jsonEditor.value = names.join("\n");
    persistLists();
    renderListOptions();
    setStatus(editorStatus, "Gespeichert. Liste aktualisiert.");
    setStatus(drawStatus, "Bereit. Neue Liste geladen.");
    renderDrawnList();
    drawBtn.focus();
  } catch (err) {
    setStatus(editorStatus, `Fehler: ${err.message}`, true);
  }
};

const handleKeyShortcuts = (event) => {
  const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
  if (isSaveShortcut) {
    event.preventDefault();
    saveFromEditor();
  }
};

const clearList = () => {
  if (!activeListId) return;
  const idx = lists.findIndex((l) => l.id === activeListId);
  if (idx >= 0) {
    lists[idx] = { ...lists[idx], names: [] };
  }
  allNames = [];
  availableNames = [];
  drawnNames = [];
  jsonEditor.value = "";
  persistLists();
  renderDrawnList();
  setStatus(editorStatus, "Liste geleert.");
  setStatus(drawStatus, "Keine Namen in dieser Liste.", true);
  jsonEditor.focus();
};

let pendingDeleteId = null;

const openDeleteModal = (listId) => {
  const overlay = document.getElementById("modalOverlay");
  const messageEl = document.getElementById("modalMessage");
  if (!overlay || !messageEl) return;
  pendingDeleteId = listId;
  const current = lists.find((l) => l.id === listId);
  const nameLabel = current?.name || "Diese Liste";
  messageEl.textContent = `Soll "${nameLabel}" wirklich gelöscht werden?`;
  overlay.setAttribute("aria-hidden", "false");
  overlay.focus();
};

const closeDeleteModal = () => {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.setAttribute("aria-hidden", "true");
  pendingDeleteId = null;
};

const createNewList = () => {
  if (lists.length >= MAX_LISTS) {
    setStatus(editorStatus, `Maximal ${MAX_LISTS} Listen möglich.`, true);
    return;
  }
  const newId = generateId();
  const defaultName = "Neue Liste";
  lists.push({ id: newId, name: defaultName, names: [] });
  activeListId = newId;
  persistLists();
  renderListOptions();
  if (listNameInput) {
    listNameInput.value = defaultName;
  }
  setActiveList(newId, "Neue Liste erstellt. Trage deine Namen ein.");
  jsonEditor.focus();
};

const deleteActiveList = () => {
  if (!activeListId) return;
  openDeleteModal(activeListId);
};

const handleListInput = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return;
  const match = lists.find((l) => l.name === trimmed);
  if (match) {
    setActiveList(match.id, "Liste geladen.");
    return;
  }
  // Kein Match: aktueller Liste einen neuen Namen geben (Inline-Umbenennung)
  if (activeListId) {
    const idx = lists.findIndex((l) => l.id === activeListId);
    if (idx >= 0) {
      lists[idx] = { ...lists[idx], name: trimmed };
      persistLists();
      renderListOptions();
    }
  }
};

drawBtn.addEventListener("click", drawRandomName);
resetBtn.addEventListener("click", resetLists);
saveBtn.addEventListener("click", saveFromEditor);
clearBtn.addEventListener("click", clearList);
newListBtn.addEventListener("click", createNewList);
deleteListBtn.addEventListener("click", deleteActiveList);
listSelect.addEventListener("change", (e) => setActiveList(e.target.value, "Liste geladen."));
listNameInput.addEventListener("input", (e) => handleListInput(e.target.value));
const modalOverlay = document.getElementById("modalOverlay");
const modalConfirm = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");

if (modalCancel) {
  modalCancel.addEventListener("click", () => {
    closeDeleteModal();
    setStatus(drawStatus, "Löschen abgebrochen.");
  });
}

if (modalConfirm) {
  modalConfirm.addEventListener("click", () => {
    if (!pendingDeleteId) {
      closeDeleteModal();
      return;
    }
    const current = lists.find((l) => l.id === pendingDeleteId);
    const nameLabel = current?.name || "Diese Liste";
    if (lists.length === 1) {
      clearList();
      setStatus(editorStatus, `"${nameLabel}" geleert (letzte Liste).`);
    } else {
      lists = lists.filter((l) => l.id !== pendingDeleteId);
      activeListId = lists[0]?.id || null;
      persistLists();
      renderListOptions();
      if (activeListId) {
        setActiveList(activeListId, "Liste gelöscht. Nächste Liste geladen.");
        setStatus(editorStatus, `"${nameLabel}" gelöscht.`);
      } else {
        allNames = [];
        availableNames = [];
        drawnNames = [];
        jsonEditor.value = "";
        renderDrawnList();
        setStatus(drawStatus, "Keine Liste vorhanden.", true);
      }
    }
    pendingDeleteId = null;
    closeDeleteModal();
  });
}

if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      closeDeleteModal();
      setStatus(drawStatus, "Löschen abgebrochen.");
    }
  });
  modalOverlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDeleteModal();
      setStatus(drawStatus, "Löschen abgebrochen.");
    }
  });
}
document.addEventListener("keydown", handleKeyShortcuts);

window.addEventListener("DOMContentLoaded", loadNames);
