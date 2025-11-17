// assets/js/modules/credits/credits.controller.js
import { requireAuth, logout } from "../../guard.js";
import {
  getCredits,
  createCredit,
  updateCredit,
  deleteCredit,
  getCustomersForCredits,
} from "./credits.service.js";

let credits = [];
let filteredCredits = [];
let customers = [];

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  wireEvents();
  initData();
});

function wireEvents() {
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);
  document
    .querySelector("#creditCreateForm")
    .addEventListener("submit", onCreateCredit);
  document
    .querySelector("#creditSearchInput")
    .addEventListener("input", onSearchChange);
}

async function initData() {
  const errorBox = document.querySelector("#creditsTableError");
  errorBox.textContent = "";

  try {
    customers = await getCustomersForCredits();
    populateCustomerSelectCreate();

    credits = await getCredits();
    filteredCredits = [...credits];
    renderTable();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

function populateCustomerSelectCreate() {
  const select = document.querySelector(
    "#creditCreateForm select[name='customerId']"
  );
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccione cliente...";
  select.appendChild(placeholder);

  for (const c of customers) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name || ""} ${c.lastName || ""}`.trim() || c.document;
    select.appendChild(opt);
  }
}

function customerLabelById(id) {
  const c = customers.find((x) => x.id === id);
  if (!c) return `ID ${id}`;
  const name = `${c.name || ""} ${c.lastName || ""}`.trim();
  return name || `Doc ${c.document}`;
}

function renderTable() {
  const tbody = document.querySelector("#creditsTable tbody");
  const emptyMsg = document.querySelector("#creditsTableEmpty");

  tbody.innerHTML = "";
  if (!filteredCredits.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  for (const cr of filteredCredits) {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = cr.id;

    const tdCustomer = document.createElement("td");
    const customerSelect = document.createElement("select");
    customerSelect.className = "select";

    for (const c of customers) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.name || ""} ${c.lastName || ""}`.trim() || c.document;
      if (c.id === cr.customerId) opt.selected = true;
      customerSelect.appendChild(opt);
    }
    tdCustomer.appendChild(customerSelect);

    const tdAmount = document.createElement("td");
    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.className = "input";
    amountInput.min = "0";
    amountInput.step = "0.01";
    amountInput.value = cr.totalAmount ?? "";
    tdAmount.appendChild(amountInput);

    const tdActive = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!cr.isActive;
    tdActive.appendChild(chk);

    const tdActions = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Guardar";
    saveBtn.className = "btn";
    saveBtn.addEventListener("click", () =>
      onUpdateCredit(cr.id, customerSelect, amountInput, chk)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "btn danger";
    deleteBtn.style.marginLeft = "6px";
    deleteBtn.addEventListener("click", () => onDeleteCredit(cr.id));

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdCustomer);
    tr.appendChild(tdAmount);
    tr.appendChild(tdActive);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

function onSearchChange(e) {
  const term = e.target.value.toLowerCase();
  filteredCredits = credits.filter((cr) =>
    customerLabelById(cr.customerId).toLowerCase().includes(term)
  );
  renderTable();
}

async function onCreateCredit(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector("#creditCreateError");
  errorBox.textContent = "";

  const customerIdRaw = form.customerId.value;
  const totalAmountRaw = form.totalAmount.value.trim();
  const isActive = form.isActive.checked;

  if (!customerIdRaw || !totalAmountRaw) {
    errorBox.textContent = "Cliente y valor total son obligatorios.";
    return;
  }

  const customerId = Number(customerIdRaw);
  const totalAmount = Number(totalAmountRaw);

  if (!Number.isFinite(customerId) || customerId <= 0) {
    errorBox.textContent = "Cliente inválido.";
    return;
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    errorBox.textContent = "El valor total debe ser mayor que 0.";
    return;
  }

  const payload = { customerId, totalAmount, isActive };

  try {
    await createCredit(payload);
    form.reset();
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

async function onUpdateCredit(id, customerSelect, amountInput, chk) {
  const errorBox = document.querySelector("#creditsTableError");
  errorBox.textContent = "";

  const customerIdRaw = customerSelect.value;
  const totalAmountRaw = amountInput.value.trim();
  const isActive = chk.checked;

  if (!customerIdRaw || !totalAmountRaw) {
    errorBox.textContent = "Cliente y valor total son obligatorios.";
    return;
  }

  const customerId = Number(customerIdRaw);
  const totalAmount = Number(totalAmountRaw);

  if (!Number.isFinite(customerId) || customerId <= 0) {
    errorBox.textContent = "Cliente inválido.";
    return;
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    errorBox.textContent = "El valor total debe ser mayor que 0.";
    return;
  }

  const changes = { customerId, totalAmount, isActive };

  try {
    await updateCredit(id, changes);
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

async function onDeleteCredit(id) {
  const errorBox = document.querySelector("#creditsTableError");
  errorBox.textContent = "";

  if (!confirm("¿Seguro que deseas eliminar este crédito?")) return;

  try {
    await deleteCredit(id);
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}
