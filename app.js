// CuidArte guard calendar front-end
// Simple, self-contained state management with localStorage persistence

const STORAGE_KEY = "cuidarte-state";
const shiftLabels = {
  morning: "Matutino",
  afternoon: "Vespertino",
  night: "Nocturno",
};

const state = {
  nurses: [],
  patients: [],
  guards: [],
};

const nurseForm = document.getElementById("nurse-form");
const patientForm = document.getElementById("patient-form");
const guardForm = document.getElementById("guard-form");
const guardMessage = document.getElementById("guard-message");

const nurseList = document.getElementById("nurse-list");
const patientList = document.getElementById("patient-list");
const nurseCount = document.getElementById("nurse-count");
const patientCount = document.getElementById("patient-count");

const guardPatientSelect = guardForm.querySelector("select[name='patientId']");
const guardNurseSelect = guardForm.querySelector("select[name='nurseId']");
const calendarEntitySelect = document.getElementById("calendar-entity");
const calendarWeekInput = document.getElementById("calendar-week");
const financeWeekInput = document.getElementById("finance-week");
const calendarContainer = document.getElementById("calendar");

const patientFinancesContainer = document.getElementById("patient-finances");
const nurseFinancesContainer = document.getElementById("nurse-finances");
const totalChargesEl = document.getElementById("total-charges");
const totalPayoutsEl = document.getElementById("total-payouts");

const viewModeRadios = Array.from(document.querySelectorAll("input[name='view-mode']"));
const prevWeekBtn = document.getElementById("prev-week");
const nextWeekBtn = document.getElementById("next-week");

const uid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      Object.assign(state, data);
      return;
    } catch {
      // ignore invalid data
    }
  }
  seedDemoData();
  saveState();
};

function seedDemoData() {
  state.nurses = [
    { id: uid(), name: "Alejandra Vidal", contact: "555-0101", active: true },
    { id: uid(), name: "Carlos Pinto", contact: "carlos@example.com", active: true },
  ];
  state.patients = [
    { id: uid(), name: "Diego Méndez", morningRate: 900, afternoonRate: 950, nightRate: 1100, nurseShare: 65, active: true },
    { id: uid(), name: "Lucía Ortega", morningRate: 950, afternoonRate: 1000, nightRate: 1200, nurseShare: 70, active: true },
  ];
  const today = new Date();
  const base = startOfWeek(today);
  state.guards = [
    { id: uid(), patientId: state.patients[0].id, nurseId: state.nurses[0].id, date: toISO(addDays(base, 1)), shift: "morning" },
    { id: uid(), patientId: state.patients[0].id, nurseId: state.nurses[1].id, date: toISO(addDays(base, 1)), shift: "night" },
    { id: uid(), patientId: state.patients[1].id, nurseId: state.nurses[0].id, date: toISO(addDays(base, 3)), shift: "afternoon" },
  ];
}

const toISO = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return d.toISOString().slice(0, 10);
};
const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sunday
  d.setDate(d.getDate() - day);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const formatCurrency = (value) =>
  value.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

function renderNurses() {
  nurseList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  state.nurses.forEach((nurse) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const text = document.createElement("div");
    text.className = "list-item__text";
    text.innerHTML = `<span class="list-item__title">${nurse.name}</span><span class="hint">${nurse.contact || "Sin contacto"}</span>`;
    const actions = document.createElement("div");
    actions.className = "actions";
    const badge = document.createElement("span");
    badge.className = nurse.active ? "badge success" : "badge muted";
    badge.textContent = nurse.active ? "Activo" : "Inactivo";
    const toggle = document.createElement("button");
    toggle.className = "btn ghost small";
    toggle.textContent = nurse.active ? "Dar de baja" : "Reactivar";
    toggle.addEventListener("click", () => {
      nurse.active = !nurse.active;
      saveState();
      renderAll();
    });
    actions.append(badge, toggle);
    li.append(text, actions);
    fragment.appendChild(li);
  });
  nurseList.appendChild(fragment);
  const activeCount = state.nurses.filter((n) => n.active).length;
  nurseCount.textContent = `${activeCount} activos`;
}

function renderPatients() {
  patientList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  state.patients.forEach((patient) => {
    const li = document.createElement("li");
    li.className = "list-item";
    const text = document.createElement("div");
    text.className = "list-item__text";
    text.innerHTML = `<span class="list-item__title">${patient.name}</span><span class="hint">Tarifas $${patient.morningRate}/${patient.afternoonRate}/${patient.nightRate} · Enfermero ${patient.nurseShare}%</span>`;
    const actions = document.createElement("div");
    actions.className = "actions";
    const badge = document.createElement("span");
    badge.className = patient.active ? "badge success" : "badge muted";
    badge.textContent = patient.active ? "Activo" : "Inactivo";
    const toggle = document.createElement("button");
    toggle.className = "btn ghost small";
    toggle.textContent = patient.active ? "Dar de baja" : "Reactivar";
    toggle.addEventListener("click", () => {
      patient.active = !patient.active;
      saveState();
      renderAll();
    });
    actions.append(badge, toggle);
    li.append(text, actions);
    fragment.appendChild(li);
  });
  patientList.appendChild(fragment);
  const activeCount = state.patients.filter((p) => p.active).length;
  patientCount.textContent = `${activeCount} activos`;
}

function renderSelects() {
  guardPatientSelect.innerHTML = "";
  guardNurseSelect.innerHTML = "";
  const previousCalendarSelection = calendarEntitySelect.value;
  calendarEntitySelect.innerHTML = "";

  const addOption = (select, item, labelExtra = "") => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name}${labelExtra}`;
    return opt;
  };

  const activePatients = state.patients.filter((p) => p.active);
  const activeNurses = state.nurses.filter((n) => n.active);

  if (activePatients.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Sin pacientes activos";
    opt.disabled = true;
    opt.selected = true;
    guardPatientSelect.appendChild(opt);
  } else {
    activePatients.forEach((patient) => guardPatientSelect.appendChild(addOption(guardPatientSelect, patient)));
  }

  if (activeNurses.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Sin enfermeros activos";
    opt.disabled = true;
    opt.selected = true;
    guardNurseSelect.appendChild(opt);
  } else {
    activeNurses.forEach((nurse) => guardNurseSelect.appendChild(addOption(guardNurseSelect, nurse)));
  }

  const viewMode = getViewMode();
  const items = viewMode === "patient" ? state.patients : state.nurses;
  items.forEach((item) => {
    const extra = item.active ? "" : " (inactivo)";
    calendarEntitySelect.appendChild(addOption(calendarEntitySelect, item, extra));
  });
  const hasPrev = Array.from(calendarEntitySelect.options).some((opt) => opt.value === previousCalendarSelection);
  if (hasPrev) {
    calendarEntitySelect.value = previousCalendarSelection;
  } else if (calendarEntitySelect.options.length > 0) {
    calendarEntitySelect.selectedIndex = 0;
  }
}

function getViewMode() {
  const selected = viewModeRadios.find((r) => r.checked);
  return selected ? selected.value : "patient";
}

function renderCalendar() {
  const entityId = calendarEntitySelect.value;
  if (!entityId) {
    calendarContainer.innerHTML = "<p class='hint'>Registra un enfermero o paciente para ver el calendario.</p>";
    return;
  }

  const reference = calendarWeekInput.value ? new Date(calendarWeekInput.value) : new Date();
  const weekStart = startOfWeek(reference);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const viewMode = getViewMode();

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = `<th>Turno</th>${days
    .map(
      (d) =>
        `<th><div>${d.toLocaleDateString("es-MX", { weekday: "short" })}</div><div class="weekday">${toISO(d)}</div></th>`
    )
    .join("")}`;
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  ["morning", "afternoon", "night"].forEach((shift) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="shift">${shiftLabels[shift]}</td>`;
    days.forEach((day) => {
      const cell = document.createElement("td");
      cell.className = "cell";
      const guard = state.guards.find(
        (g) => g.shift === shift && g.date === toISO(day) && g[viewMode === "patient" ? "patientId" : "nurseId"] === entityId
      );
      if (guard) {
        const nurse = state.nurses.find((n) => n.id === guard.nurseId);
        const patient = state.patients.find((p) => p.id === guard.patientId);
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.innerHTML =
          viewMode === "patient"
            ? `<strong>${nurse?.name || "Enfermero"}</strong><small>${shiftLabels[shift]}</small>`
            : `<strong>${patient?.name || "Paciente"}</strong><small>${shiftLabels[shift]}</small>`;
        cell.appendChild(slot);
      } else {
        const free = document.createElement("div");
        free.className = "free";
        free.textContent = "Libre";
        cell.appendChild(free);
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  calendarContainer.innerHTML = "";
  calendarContainer.appendChild(table);
}

function renderFinances() {
  const reference = financeWeekInput.value ? new Date(financeWeekInput.value) : new Date();
  const weekStart = startOfWeek(reference);
  const weekEnd = addDays(weekStart, 6);

  const withinWeek = (dateStr) => {
    const d = new Date(dateStr);
    return d >= weekStart && d <= weekEnd;
  };

  const patientTotals = new Map();
  const nurseTotals = new Map();

  state.guards.filter((g) => withinWeek(g.date)).forEach((guard) => {
    const patient = state.patients.find((p) => p.id === guard.patientId);
    const nurse = state.nurses.find((n) => n.id === guard.nurseId);
    if (!patient || !nurse) return;

    const rate =
      guard.shift === "morning"
        ? patient.morningRate
        : guard.shift === "afternoon"
        ? patient.afternoonRate
        : patient.nightRate;
    const payout = Math.round((rate * patient.nurseShare) / 100);

    if (!patientTotals.has(patient.id)) {
      patientTotals.set(patient.id, { name: patient.name, total: 0, rows: [] });
    }
    if (!nurseTotals.has(nurse.id)) {
      nurseTotals.set(nurse.id, { name: nurse.name, total: 0, rows: [] });
    }

    patientTotals.get(patient.id).total += rate;
    patientTotals.get(patient.id).rows.push({ date: guard.date, shift: guard.shift, amount: rate, nurse: nurse.name });

    nurseTotals.get(nurse.id).total += payout;
    nurseTotals.get(nurse.id).rows.push({ date: guard.date, shift: guard.shift, amount: payout, patient: patient.name });
  });

  renderFinanceList(patientFinancesContainer, patientTotals, "Cobro", "nurse");
  renderFinanceList(nurseFinancesContainer, nurseTotals, "Pago", "patient");

  const totalCharges = Array.from(patientTotals.values()).reduce((sum, entry) => sum + entry.total, 0);
  const totalPayouts = Array.from(nurseTotals.values()).reduce((sum, entry) => sum + entry.total, 0);

  totalChargesEl.textContent = formatCurrency(totalCharges);
  totalPayoutsEl.textContent = formatCurrency(totalPayouts);
}

function renderFinanceList(container, totalsMap, label, counterpartKey) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const entries = Array.from(totalsMap.values()).sort((a, b) => b.total - a.total);

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "finance-card";
    const header = document.createElement("header");
    header.innerHTML = `<strong>${entry.name}</strong><span class="badge">${formatCurrency(entry.total)}</span>`;
    const rows = document.createElement("div");
    rows.className = "finance-rows";
    entry.rows
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((row) => {
        const span = document.createElement("span");
        const counterpart = counterpartKey === "nurse" ? row.nurse : row.patient;
        span.textContent = `${shiftLabels[row.shift]} · ${row.date} · ${counterpart}`;
        const amount = document.createElement("strong");
        amount.textContent = formatCurrency(row.amount);
        span.appendChild(amount);
        rows.appendChild(span);
      });
    card.append(header, rows);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function renderAll() {
  renderNurses();
  renderPatients();
  renderSelects();
  renderCalendar();
  renderFinances();
}

function attachEvents() {
  nurseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(nurseForm);
    const name = formData.get("name").trim();
    const contact = formData.get("contact").trim();
    if (!name) return;
    state.nurses.push({ id: uid(), name, contact, active: true });
    nurseForm.reset();
    saveState();
    renderAll();
  });

  patientForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(patientForm);
    const name = formData.get("name").trim();
    if (!name) return;
    const patient = {
      id: uid(),
      name,
      morningRate: Number(formData.get("morningRate")) || 0,
      afternoonRate: Number(formData.get("afternoonRate")) || 0,
      nightRate: Number(formData.get("nightRate")) || 0,
      nurseShare: Number(formData.get("nurseShare")) || 0,
      active: true,
    };
    state.patients.push(patient);
    patientForm.reset();
    saveState();
    renderAll();
  });

  guardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(guardForm);
    const patientId = formData.get("patientId");
    const nurseId = formData.get("nurseId");
    const date = formData.get("date");
    const shift = formData.get("shift");
    guardMessage.textContent = "";
    guardMessage.classList.remove("warn", "success");

    if (!patientId || !nurseId || !date || !shift) {
      guardMessage.textContent = "Completa todos los campos.";
      guardMessage.classList.add("warn");
      return;
    }

    const patient = state.patients.find((p) => p.id === patientId && p.active);
    const nurse = state.nurses.find((n) => n.id === nurseId && n.active);
    if (!patient) {
      guardMessage.textContent = "Selecciona un paciente activo.";
      guardMessage.classList.add("warn");
      return;
    }
    if (!nurse) {
      guardMessage.textContent = "Selecciona un enfermero activo.";
      guardMessage.classList.add("warn");
      return;
    }

    const nurseConflict = state.guards.some((g) => g.nurseId === nurseId && g.date === date && g.shift === shift);
    if (nurseConflict) {
      guardMessage.textContent = "El enfermero ya tiene una guardia en ese turno.";
      guardMessage.classList.add("warn");
      return;
    }
    const patientConflict = state.guards.some((g) => g.patientId === patientId && g.date === date && g.shift === shift);
    if (patientConflict) {
      guardMessage.textContent = "El paciente ya tiene enfermero asignado en ese turno.";
      guardMessage.classList.add("warn");
      return;
    }

    state.guards.push({ id: uid(), patientId, nurseId, date, shift });
    guardMessage.textContent = "Guardia asignada correctamente.";
    guardMessage.classList.add("success");
    saveState();
    renderAll();
  });

  viewModeRadios.forEach((radio) =>
    radio.addEventListener("change", () => {
      renderSelects();
      renderCalendar();
    })
  );

  calendarEntitySelect.addEventListener("change", renderCalendar);
  calendarWeekInput.addEventListener("change", () => {
    renderCalendar();
    financeWeekInput.value = calendarWeekInput.value;
    renderFinances();
  });
  financeWeekInput.addEventListener("change", renderFinances);

  prevWeekBtn.addEventListener("click", () => moveWeek(-7));
  nextWeekBtn.addEventListener("click", () => moveWeek(7));
}

function moveWeek(delta) {
  const current = calendarWeekInput.value ? new Date(calendarWeekInput.value) : new Date();
  const newDate = addDays(current, delta);
  calendarWeekInput.value = toISO(newDate);
  financeWeekInput.value = toISO(newDate);
  renderCalendar();
  renderFinances();
}

function setDefaultDates() {
  const today = new Date();
  const start = startOfWeek(today);
  const iso = toISO(start);
  calendarWeekInput.value = iso;
  financeWeekInput.value = iso;
  const guardDateInput = guardForm.querySelector("input[name='date']");
  if (guardDateInput) guardDateInput.value = toISO(today);
}

function init() {
  loadState();
  setDefaultDates();
  attachEvents();
  renderAll();
}

init();
