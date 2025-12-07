// assets/js/modules/suppliers/suppliers.controller.js
import { requireAuth, logout } from "../../guard.js";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./suppliers.service.js";

requireAuth();

// DOM
const btnLogout     = document.getElementById("btnLogout");
const form          = document.getElementById("supplierForm");
const inputId       = document.getElementById("supplierId");
const inputName     = document.getElementById("name");
const inputContacto = document.getElementById("contacto");
const btnReset      = document.getElementById("btnReset");
const formMsg       = document.getElementById("formMsg");

const searchInput   = document.getElementById("searchSupplier");
const tableBody     = document.querySelector("#suppliersTable tbody");
const tableMsg      = document.getElementById("tableMsg");

btnLogout.addEventListener("click", logout);

// Estado
let suppliers = [];

// Helpers
function normalizeText(str) {
  return (str || "").toString().trim().toLowerCase();
}

function resetForm() {
  inputId.value = "";
  inputName.value = "";
  inputContacto.value = "";
  formMsg.textContent = "Formulario listo para crear un nuevo proveedor.";
}

btnReset.addEventListener("click", (e) => {
  e.preventDefault();
  resetForm();
});

// Render tabla
function renderTable() {
  tableBody.innerHTML = "";

  const term = normalizeText(searchInput.value);
  const data = suppliers.filter((s) => {
    const n = normalizeText(s.name);
    const c = normalizeText(s.contacto);
    return !term || n.includes(term) || c.includes(term);
  });

  data.forEach((s) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.id}</td>
      <td>${s.name ?? ""}</td>
      <td>${s.contacto ?? ""}</td>
      <td>
        <button
          class="btn secondary"
          style="padding:4px 8px;font-size:12px"
          data-action="edit"
          data-id="${s.id}"
        >Editar</button>
        <button
          class="btn danger"
          style="padding:4px 8px;font-size:12px;margin-left:4px"
          data-action="delete"
          data-id="${s.id}"
        >Eliminar</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  tableMsg.textContent = data.length
    ? `Mostrando ${data.length} proveedor(es).`
    : "No hay proveedores registrados.";
}

// Búsqueda en vivo
searchInput.addEventListener("input", () => {
  renderTable();
});

// Delegación de eventos para Editar / Eliminar
tableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const proveedor = suppliers.find((s) => s.id === id);
  if (!proveedor) return;

  if (action === "edit") {
    inputId.value = proveedor.id;
    inputName.value = proveedor.name ?? "";
    inputContacto.value = proveedor.contacto ?? "";
    formMsg.textContent = `Editando proveedor #${proveedor.id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "delete") {
    const ok = confirm(
      `¿Seguro que deseas eliminar al proveedor "${proveedor.name}" (#${proveedor.id})?`
    );
    if (!ok) return;

    try {
      formMsg.textContent = "Eliminando proveedor...";
      await deleteSupplier(id);
      suppliers = suppliers.filter((s) => s.id !== id);
      renderTable();
      formMsg.textContent = "Proveedor eliminado correctamente.";
    } catch (err) {
      console.error(err);
      formMsg.textContent = err.message || "Error al eliminar el proveedor.";
    }
  }
});

// Submit (crear / actualizar)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  const idValue   = inputId.value.trim();
  const name      = inputName.value.trim();
  const contacto  = inputContacto.value.trim();

  if (!name) {
    formMsg.textContent = "El nombre es obligatorio.";
    return;
  }
  if (!contacto) {
    formMsg.textContent = "El contacto es obligatorio.";
    return;
  }

  const payload = { name, contacto };

  try {
    if (idValue) {
      // UPDATE
      formMsg.textContent = "Actualizando proveedor...";
      const updated = await updateSupplier(Number(idValue), payload);
      suppliers = suppliers.map((s) =>
        s.id === updated.id ? updated : s
      );
      formMsg.textContent = "Proveedor actualizado correctamente.";
    } else {
      // CREATE
      formMsg.textContent = "Creando proveedor...";
      const created = await createSupplier(payload);
      suppliers.push(created);
      formMsg.textContent = "Proveedor creado correctamente.";
    }

    renderTable();
    resetForm();
  } catch (err) {
    console.error(err);
    formMsg.textContent = err.message || "Error al guardar el proveedor.";
  }
});

// Init
async function init() {
  try {
    console.log("[Suppliers] init() – cargando proveedores...");
    tableMsg.textContent = "Cargando proveedores...";

    const data = await getSuppliers();
    suppliers = Array.isArray(data) ? data : [];

    renderTable();

    if (!suppliers.length) {
      formMsg.textContent = "Empieza creando tu primer proveedor.";
    } else {
      formMsg.textContent = "Puedes crear o editar proveedores.";
    }
  } catch (err) {
    console.error(err);
    tableMsg.textContent = err.message || "Error al cargar proveedores.";
  }
}

init();
