// assets/js/modules/customers/customers.controller.js
import { requireAuth, logout } from "../../guard.js";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "./customers.service.js";

let customers = [];
let filteredCustomers = [];

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  wireEvents();
  loadCustomers();
});

function wireEvents() {
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);
  document
    .querySelector("#customerCreateForm")
    .addEventListener("submit", onCreateCustomer);
  document
    .querySelector("#customerSearchInput")
    .addEventListener("input", onSearchChange);
}

async function loadCustomers() {
  const errorBox = document.querySelector("#customersTableError");
  errorBox.textContent = "";

  try {
    customers = await getCustomers();
    filteredCustomers = [...customers];
    renderTable();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

function renderTable() {
  const tbody = document.querySelector("#customersTable tbody");
  const emptyMsg = document.querySelector("#customersTableEmpty");

  tbody.innerHTML = "";
  if (!filteredCustomers.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  for (const c of filteredCustomers) {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = c.id;

    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.className = "input";
    nameInput.value = `${c.name || ""} ${c.lastName || ""}`.trim();
    tdName.appendChild(nameInput);

    const tdDoc = document.createElement("td");
    const docInput = document.createElement("input");
    docInput.type = "number";
    docInput.className = "input";
    docInput.value = c.document ?? "";
    tdDoc.appendChild(docInput);

    const tdPhone = document.createElement("td");
    const phoneInput = document.createElement("input");
    phoneInput.className = "input";
    phoneInput.value = c.phone || "";
    tdPhone.appendChild(phoneInput);

    const tdEstado = document.createElement("td");
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = !!c.estadoCredito;
    tdEstado.appendChild(chk);

    const tdActions = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Guardar";
    saveBtn.className = "btn";
    saveBtn.addEventListener("click", () =>
      onUpdateCustomer(c.id, nameInput, docInput, phoneInput, chk)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "btn danger";
    deleteBtn.style.marginLeft = "6px";
    deleteBtn.addEventListener("click", () => onDeleteCustomer(c.id));

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdDoc);
    tr.appendChild(tdPhone);
    tr.appendChild(tdEstado);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

function onSearchChange(e) {
  const term = e.target.value.toLowerCase();
  filteredCustomers = customers.filter((c) => {
    const fullName = `${c.name || ""} ${c.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(term) ||
      String(c.document || "").includes(term)
    );
  });
  renderTable();
}

async function onCreateCustomer(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector("#customerCreateError");
  errorBox.textContent = "";

  const name = form.name.value.trim();
  const lastName = form.lastName.value.trim();
  const documentValue = form.document.value.trim();
  const phone = form.phone.value.trim();
  const estadoCredito = form.estadoCredito.checked;

  if (!name || !lastName || !documentValue || !phone) {
    errorBox.textContent = "Todos los campos son obligatorios.";
    return;
  }

  const documentNumber = Number(documentValue);
  if (!Number.isFinite(documentNumber)) {
    errorBox.textContent = "Documento inválido.";
    return;
  }

  const payload = {
    name,
    lastName,
    document: documentNumber,
    phone,
    estadoCredito,
  };

  try {
    await createCustomer(payload);
    form.reset();
    await loadCustomers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

async function onUpdateCustomer(id, nameInput, docInput, phoneInput, chk) {
  const errorBox = document.querySelector("#customersTableError");
  errorBox.textContent = "";

  const fullName = nameInput.value.trim();
  const [name, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ").trim();

  const documentValue = docInput.value.trim();
  const phone = phoneInput.value.trim();
  const estadoCredito = chk.checked;

  if (!name || !lastName || !documentValue || !phone) {
    errorBox.textContent = "Todos los campos son obligatorios.";
    return;
  }

  const documentNumber = Number(documentValue);
  if (!Number.isFinite(documentNumber)) {
    errorBox.textContent = "Documento inválido.";
    return;
  }

  const changes = {
    name,
    lastName,
    document: documentNumber,
    phone,
    estadoCredito,
  };

  try {
    await updateCustomer(id, changes);
    await loadCustomers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}

async function onDeleteCustomer(id) {
  const errorBox = document.querySelector("#customersTableError");
  errorBox.textContent = "";

  if (!confirm("¿Seguro que deseas eliminar este cliente?")) return;

  try {
    await deleteCustomer(id);
    await loadCustomers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) return logout();
    errorBox.textContent = err.message;
  }
}
