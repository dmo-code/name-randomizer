const $ = (selector) => document.querySelector(selector);

const drawBtn = $("#drawBtn");
const resetBtn = $("#resetBtn");
const newRoundBtn = $("#newRoundBtn");
const saveBtn = $("#saveBtn");
const clearBtn = $("#clearBtn");
const sortCheckbox = $("#sortNames");
const listSelect = $("#listSelect");
const listNameInput = $("#listName");
const newListBtn = $("#newListBtn");
const deleteListBtn = $("#deleteListBtn");
const exportListsBtn = $("#exportListsBtn");
const importListsBtn = $("#importListsBtn");
const importFileInput = $("#importFileInput");
const historyBtn = $("#historyBtn");
const historyDrawer = $("#historyDrawer");
const closeHistoryBtn = $("#closeHistoryBtn");
const downloadHistoryBtn = $("#downloadHistoryBtn");
const historyDownloadFormat = $("#historyDownloadFormat");
const historyList = $("#historyList");
const historyEmpty = $("#historyEmpty");
const drawnList = $("#drawnList");
const dataSection = $("#dataSection");
const toggleDataBtn = $("#toggleDataBtn");
const toggleDataLabel = $("#toggleDataLabel");
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
let blockedNames = [];
let lists = [];
let activeListId = null;
let historyByList = {};

const updateDataVisibility = (isVisible) => {
  if (!dataSection || !toggleDataBtn) return;
  dataSection.hidden = !isVisible;
  toggleDataBtn.setAttribute("aria-expanded", String(isVisible));
  const label = isVisible ? "Daten ausblenden" : "Daten anzeigen";
  if (toggleDataLabel) toggleDataLabel.textContent = label;
  else toggleDataBtn.textContent = label;
};

const toggleDataSection = () => {
  if (!dataSection) return;
  updateDataVisibility(dataSection.hidden);
};

const ensureHistoryGroup = (listId, name) => {
  if (!listId) return;
  const label = name || "Unbenannt";
  if (!historyByList[listId]) {
    historyByList[listId] = { name: label, rounds: [{ label: 1, entries: [] }] };
  } else {
    historyByList[listId].name = label;
    if (!Array.isArray(historyByList[listId].rounds) || historyByList[listId].rounds.length === 0) {
      historyByList[listId].rounds = [{ label: 1, entries: [] }];
    }
  }
};

const startNewHistoryRound = (listId) => {
  if (!listId) return;
  if (!historyByList[listId]) {
    ensureHistoryGroup(listId, lists.find((l) => l.id === listId)?.name);
  }
  const group = historyByList[listId];
  if (!group) return;
  const nextLabel = (group.rounds?.length || 0) + 1;
  group.rounds.push({ label: nextLabel, entries: [] });
};

const addHistoryEntry = (listId, name) => {
  const group = historyByList[listId];
  if (!group || !Array.isArray(group.rounds) || group.rounds.length === 0) return;
  const currentRound = group.rounds[group.rounds.length - 1];
  currentRound.entries.push(name);
};

const collectHistoryLines = () => {
  const lines = [];
  const groups = Object.values(historyByList || {});
  if (!groups.length) {
    return ["Keine Ziehungen vorhanden."];
  }
  groups.forEach((group) => {
    lines.push(`${group.name}`);
    if (!group.rounds || group.rounds.length === 0) {
      lines.push("  Keine Runden.");
      return;
    }
    group.rounds.forEach((round) => {
      lines.push(`  Runde ${round.label} (${round.entries.length})`);
      if (round.entries.length === 0) {
        lines.push("    Keine Ziehungen in dieser Runde.");
      } else {
        round.entries.forEach((entry, idx) => {
          lines.push(`    ${idx + 1}. ${entry}`);
        });
      }
    });
  });
  return lines;
};

const downloadHistoryTxt = () => {
  const lines = collectHistoryLines();
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "zieh-verlauf.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadHistoryMarkdown = () => {
  const groups = Object.values(historyByList || {});
  if (!groups.length) {
    downloadBlobAs("zieh-verlauf.md", "Keine Ziehungen vorhanden.\n");
    return;
  }
  const parts = [];
  groups.forEach((group) => {
    parts.push(`## ${group.name}`);
    if (!group.rounds || group.rounds.length === 0) {
      parts.push("- Keine Runden");
      return;
    }
    group.rounds.forEach((round) => {
      parts.push(`### Runde ${round.label} (${round.entries.length})`);
      if (round.entries.length === 0) {
        parts.push("- Keine Ziehungen in dieser Runde.");
      } else {
        round.entries.forEach((entry, idx) => {
          parts.push(`${idx + 1}. ${entry}`);
        });
      }
      parts.push("");
    });
  });
  downloadBlobAs("zieh-verlauf.md", parts.join("\n"));
};

const downloadBlobAs = (filename, content) => {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleDownloadHistory = () => {
  const format = historyDownloadFormat?.value || "txt";
  if (format === "md") {
    downloadHistoryMarkdown();
  } else {
    downloadHistoryTxt();
  }
};
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

const updateModeCopy = () => {
  if (newRoundBtn) {
    newRoundBtn.disabled = false;
    newRoundBtn.removeAttribute("aria-disabled");
    newRoundBtn.title = "Neue Runde ohne bisherige Namen starten";
  }
};

const refreshAvailability = () => {
  const blockedSet = new Set(blockedNames);
  availableNames = allNames.filter((name) => !blockedSet.has(name));
};

const updateCounts = () => {
  const total = allNames.length || 0;
  remainingBadge.textContent = `${availableNames.length}/${total} verfügbar`;
  metaInfo.textContent =
    total > 0 ? `${blockedNames.length} gezogen, ${availableNames.length} übrig.` : "Keine Daten geladen.";
  drawBtn.disabled = total === 0 || availableNames.length === 0;
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

const renderHistory = () => {
  if (!historyList || !historyEmpty) return;
  historyList.innerHTML = "";
  const groups = Object.values(historyByList || {});
  if (!groups.length) {
    historyEmpty.hidden = false;
    return;
  }
  historyEmpty.hidden = true;
  groups.forEach((group) => {
    if (!group.rounds || group.rounds.length === 0) return;
    const title = document.createElement("li");
    const totalEntries = group.rounds.reduce((sum, r) => sum + (r.entries?.length || 0), 0);
    title.textContent = `${group.name} (${totalEntries})`;
    title.classList.add("history__title");
    historyList.appendChild(title);
    const roundsList = document.createElement("ol");
    roundsList.classList.add("history__list");
    group.rounds.forEach((round) => {
      const roundItem = document.createElement("li");
      const roundHeader = document.createElement("div");
      roundHeader.textContent = `Runde ${round.label} (${round.entries.length})`;
      roundHeader.style.fontWeight = "600";
      roundHeader.style.marginBottom = "15px";
      roundItem.appendChild(roundHeader);

      if (round.entries.length > 0) {
        const entryList = document.createElement("ol");
        entryList.classList.add("history__list");
        round.entries.forEach((entry, idx) => {
          const li = document.createElement("li");
          const label = typeof entry === "string" ? entry : entry?.name;
          li.textContent = `${idx + 1}. ${label ?? ""}`;
          entryList.appendChild(li);
        });
        roundItem.appendChild(entryList);
      } else {
        const emptyNote = document.createElement("p");
        emptyNote.classList.add("helper");
        emptyNote.textContent = "Keine Ziehungen in dieser Runde.";
        roundItem.appendChild(emptyNote);
      }

      roundsList.appendChild(roundItem);
    });
    historyList.appendChild(roundsList);
  });
};

const NAME_PATTERN = /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9'’.\-\s]{0,98}[A-Za-zÀ-ÿ0-9]$/;

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
    if (!safe || !NAME_PATTERN.test(safe)) {
      throw new Error("Ungültiger Name. Erlaubt sind nur Buchstaben, Leerzeichen, Punkt, Apostroph oder Bindestrich.");
    }
    return safe;
  });
  return cleaned;
};

const generateId = () => `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const persistLists = () => {
  const storedLists = lists.map((l) => ({
    id: l.id,
    name: l.name,
    names: l.id === activeListId ? allNames : l.names,
    blocked: [], // Sperrungen gelten nur für die aktuelle Sitzung
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ lists: storedLists, activeListId }));
};

const renderListOptions = () => {
  if (!listSelect) return;
  listSelect.innerHTML = "";
  lists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.id;
    const count = Array.isArray(list.names) ? list.names.length : 0;
    const label = list.name || "Unbenannt";
    option.textContent = `${label} (${count})`;
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
  // Bei jedem Laden einer Liste starten wir mit einem frischen Durchgang.
  blockedNames = [];
  drawnNames = [];
  ensureHistoryGroup(activeListId, target.name);
  refreshAvailability();
  jsonEditor.value = target.names.join("\n");
  listSelect.value = target.id;
  if (listNameInput) {
    listNameInput.value = target.name || "";
  }
  renderListOptions();
  renderDrawnList();
  renderHistory();
  updateModeCopy();
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
      blocked: Array.isArray(l.blocked) ? l.blocked.map((n) => sanitizeName(n)).filter(Boolean) : [],
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
        updateModeCopy();
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
    lists = [{ id, name: "Standard-Liste", names, blocked: [] }];
    activeListId = id;
    updateModeCopy();
    persistLists();
    setActiveList(activeListId, "Bereit. Standard-Liste geladen.");
  } catch (err) {
    setStatus(drawStatus, `Fehler beim Laden: ${err.message}`, true);
  }
};

const exportLists = () => {
  if (!lists.length) {
    setStatus(editorStatus, "Keine Listen zum Exportieren.", true);
    return;
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    activeListId,
    lists,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "name-randomizer-lists.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus(editorStatus, "Listen exportiert.");
};

const importListsFromFile = async (file) => {
  try {
    const isJsonType =
      file.type === "application/json" ||
      file.type === "application/x-json" ||
      file.name.toLowerCase().endsWith(".json");
    if (!isJsonType) {
      throw new Error("Nur JSON-Dateien (.json) können importiert werden.");
    }
    const text = await file.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseErr) {
      throw new Error("Ungültiges JSON-Format.");
    }
    const normalized = normalizeStoredData(parsed);
    if (!normalized || !normalized.lists.length) {
      throw new Error("Keine gültigen Listen gefunden.");
    }
    const limitedLists = normalized.lists.slice(0, MAX_LISTS);
    const activeCandidate = limitedLists.find((l) => l.id === normalized.activeId)?.id || limitedLists[0].id;
    historyByList = {};
    lists = limitedLists;
    activeListId = activeCandidate;
    setActiveList(activeListId, "Listen importiert.");
    persistLists();
    setStatus(editorStatus, "Import erfolgreich.");
  } catch (err) {
    setStatus(editorStatus, `Import fehlgeschlagen: ${err.message}`, true);
  } finally {
    if (importFileInput) {
      importFileInput.value = "";
    }
  }
};

const drawRandomName = () => {
  if (availableNames.length === 0) {
    setStatus(drawStatus, "Alle Namen wurden gezogen. Setze die Liste zurück, um neu zu starten.", true);
    return;
  }
  const index = Math.floor(Math.random() * availableNames.length);
  const name = availableNames[index];
  availableNames.splice(index, 1);
  if (!blockedNames.includes(name)) {
    blockedNames.push(name);
  }
  drawnNames.push(name);
  ensureHistoryGroup(activeListId, listNameInput?.value || lists.find((l) => l.id === activeListId)?.name);
  addHistoryEntry(activeListId, name);
  setStatus(drawStatus, `Gezogen: ${name} (ohne Wiederholung)`);
  renderDrawnList();
  renderHistory();
  drawBtn.focus();
  persistLists();
};

const resetLists = () => {
  drawnNames = [];
  blockedNames = [];
  ensureHistoryGroup(activeListId, lists.find((l) => l.id === activeListId)?.name);
  refreshAvailability();
  startNewHistoryRound(activeListId);
  setStatus(drawStatus, "Liste zurückgesetzt.");
  renderDrawnList();
  renderHistory();
  drawBtn.focus();
  persistLists();
};

const startNewRound = () => {
  drawnNames = [];
  ensureHistoryGroup(activeListId, lists.find((l) => l.id === activeListId)?.name);
  refreshAvailability();
  startNewHistoryRound(activeListId);
  renderDrawnList();
  setStatus(drawStatus, "Neue Runde gestartet. Bisher gezogene Namen bleiben gesperrt.");
  renderHistory();
  drawBtn.focus();
  persistLists();
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
      lists.push({ id: newId, name: currentName, names, blocked: [] });
      activeListId = newId;
    } else {
      const idx = lists.findIndex((l) => l.id === activeListId);
      if (idx >= 0) {
        blockedNames = blockedNames.filter((n) => names.includes(n));
        lists[idx] = { ...lists[idx], name: currentName, names, blocked: blockedNames };
      } else {
        if (lists.length >= MAX_LISTS) {
          setStatus(editorStatus, `Maximal ${MAX_LISTS} Listen möglich.`, true);
          return;
        }
        blockedNames = blockedNames.filter((n) => names.includes(n));
        lists.push({ id: activeListId, name: currentName, names, blocked: blockedNames });
      }
    }
    allNames = names;
    drawnNames = [];
    refreshAvailability();
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
    lists[idx] = { ...lists[idx], names: [], blocked: [] };
  }
  allNames = [];
  availableNames = [];
  blockedNames = [];
  drawnNames = [];
  if (historyByList[activeListId]) {
    historyByList[activeListId].rounds = [{ label: 1, entries: [] }];
  }
  jsonEditor.value = "";
  persistLists();
  renderDrawnList();
  renderHistory();
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
  lists.push({ id: newId, name: defaultName, names: [], blocked: [] });
  activeListId = newId;
  ensureHistoryGroup(newId, defaultName);
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
      if (historyByList[activeListId]) {
        historyByList[activeListId].name = trimmed;
      }
      persistLists();
      renderListOptions();
    }
  }
};

const openHistoryDrawer = () => {
  if (!historyDrawer) return;
  historyDrawer.setAttribute("aria-hidden", "false");
  renderHistory();
};

const closeHistoryDrawer = () => {
  if (!historyDrawer) return;
  historyDrawer.setAttribute("aria-hidden", "true");
};

drawBtn.addEventListener("click", drawRandomName);
resetBtn.addEventListener("click", resetLists);
saveBtn.addEventListener("click", saveFromEditor);
clearBtn.addEventListener("click", clearList);
if (toggleDataBtn && dataSection) {
  updateDataVisibility(!dataSection.hidden);
  toggleDataBtn.addEventListener("click", toggleDataSection);
}
newListBtn.addEventListener("click", createNewList);
deleteListBtn.addEventListener("click", deleteActiveList);
listSelect.addEventListener("change", (e) => setActiveList(e.target.value, "Liste geladen."));
listNameInput.addEventListener("input", (e) => handleListInput(e.target.value));
if (newRoundBtn) {
  newRoundBtn.addEventListener("click", startNewRound);
}
if (historyBtn) {
  historyBtn.addEventListener("click", openHistoryDrawer);
}
if (closeHistoryBtn) {
  closeHistoryBtn.addEventListener("click", closeHistoryDrawer);
}
if (downloadHistoryBtn) {
  downloadHistoryBtn.addEventListener("click", handleDownloadHistory);
}
if (exportListsBtn) {
  exportListsBtn.addEventListener("click", exportLists);
}
if (importListsBtn && importFileInput) {
  importListsBtn.addEventListener("click", () => importFileInput.click());
  importFileInput.addEventListener("change", (e) => {
    const [file] = e.target.files || [];
    if (file) {
      importListsFromFile(file);
    }
  });
}
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
    lists = [];
    activeListId = null;
    allNames = [];
    availableNames = [];
    drawnNames = [];
    blockedNames = [];
    historyByList = {};
    jsonEditor.value = "";
    renderListOptions();
    renderDrawnList();
    renderHistory();
    setStatus(editorStatus, `"${nameLabel}" gelöscht (letzte Liste).`);
    setStatus(drawStatus, "Keine Liste vorhanden.", true);
    persistLists();
  } else {
    lists = lists.filter((l) => l.id !== pendingDeleteId);
    delete historyByList[pendingDeleteId];
    activeListId = lists[0]?.id || null;
    renderListOptions();
    if (activeListId) {
      if (!historyByList[activeListId]) {
        historyByList[activeListId] = { name: lists[0].name || "Unbenannt", entries: [] };
      }
      setActiveList(activeListId, "Liste gelöscht. Nächste Liste geladen.");
      setStatus(editorStatus, `"${nameLabel}" gelöscht.`);
      persistLists();
    } else {
      allNames = [];
      availableNames = [];
      drawnNames = [];
      blockedNames = [];
      historyByList = {};
      jsonEditor.value = "";
      renderDrawnList();
      renderHistory();
      setStatus(drawStatus, "Keine Liste vorhanden.", true);
      persistLists();
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
