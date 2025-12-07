// assets/js/modules/categories/categories.controller.js
import { requireAuth, logout } from "../../guard.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./categories.service.js";

let categories = [];
let filteredCategories = [];

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  wireEvents();
  loadCategories();
});

function wireEvents() {
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);

  const form = document.querySelector("#categoryCreateForm");
  const searchInput = document.querySelector("#categorySearchInput");

  form.addEventListener("submit", onCreateCategory);
  searchInput.addEventListener("input", onSearchChange);
}

async function loadCategories() {
  const errorBox = document.querySelector("#categoriesTableError");
  errorBox.textContent = "";

  try {
    categories = await getCategories();
    filteredCategories = [...categories];
    renderTable();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

function renderTable() {
  const tbody = document.querySelector("#categoriesTable tbody");
  const emptyMsg = document.querySelector("#categoriesTableEmpty");

  tbody.innerHTML = "";

  if (!filteredCategories.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  for (const cat of filteredCategories) {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = cat.id;

    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.className = "input";
    nameInput.value = cat.name || "";
    tdName.appendChild(nameInput);

    const tdDesc = document.createElement("td");
    const descInput = document.createElement("input");
    descInput.className = "input";
    descInput.value = cat.description || "";
    tdDesc.appendChild(descInput);

    const tdActions = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Guardar";
    saveBtn.className = "btn";
    saveBtn.addEventListener("click", () =>
      onUpdateCategory(cat.id, nameInput, descInput)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "btn danger";
    deleteBtn.style.marginLeft = "6px";
    deleteBtn.addEventListener("click", () => onDeleteCategory(cat.id));

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdDesc);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

function onSearchChange(e) {
  const term = e.target.value.toLowerCase();
  filteredCategories = categories.filter((c) =>
    (c.name || "").toLowerCase().includes(term)
  );
  renderTable();
}

async function onCreateCategory(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector("#categoryCreateError");
  errorBox.textContent = "";

  const name = form.name.value.trim();
  const description = form.description.value.trim();

  if (!name || name.length < 3) {
    errorBox.textContent =
      "El nombre es obligatorio y debe tener al menos 3 caracteres.";
    return;
  }
  if (description.length > 255) {
    errorBox.textContent = "La descripción no puede superar 255 caracteres.";
    return;
  }

  const payload = {
    name,
    ...(description ? { description } : {}),
  };

  try {
    await createCategory(payload);
    form.reset();
    await loadCategories();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onUpdateCategory(id, nameInput, descInput) {
  const errorBox = document.querySelector("#categoriesTableError");
  errorBox.textContent = "";

  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name || name.length < 3) {
    errorBox.textContent =
      "El nombre es obligatorio y debe tener al menos 3 caracteres.";
    return;
  }
  if (description.length > 255) {
    errorBox.textContent = "La descripción no puede superar 255 caracteres.";
    return;
  }

  const changes = {
    name,
    description: description || null,
  };

  try {
    await updateCategory(id, changes);
    await loadCategories();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onDeleteCategory(id) {
  const errorBox = document.querySelector("#categoriesTableError");
  errorBox.textContent = "";

  if (!confirm("¿Seguro que deseas eliminar esta categoría?")) return;

  try {
    await deleteCategory(id);
    await loadCategories();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}
