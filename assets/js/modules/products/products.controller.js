// assets/js/modules/products/products.controller.js
import { requireAuth, logout } from "../../guard.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategoriesForProducts,
} from "./products.service.js";

let products = [];
let filteredProducts = [];
let categories = [];

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  wireEvents();
  initData();
});

function wireEvents() {
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);

  const form = document.querySelector("#productCreateForm");
  const searchInput = document.querySelector("#productSearchInput");

  form.addEventListener("submit", onCreateProduct);
  searchInput.addEventListener("input", onSearchChange);
}

async function initData() {
  const errorBox = document.querySelector("#productsTableError");
  errorBox.textContent = "";

  try {
    categories = await getCategoriesForProducts();
    populateCategorySelectCreate();

    products = await getProducts();
    filteredProducts = [...products];
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

function populateCategorySelectCreate() {
  const select = document.querySelector("#productCreateForm select[name='categoryId']");
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Seleccione categoría...";
  select.appendChild(placeholder);

  for (const cat of categories) {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    select.appendChild(opt);
  }
}

function renderTable() {
  const tbody = document.querySelector("#productsTable tbody");
  const emptyMsg = document.querySelector("#productsTableEmpty");

  tbody.innerHTML = "";

  if (!filteredProducts.length) {
    emptyMsg.style.display = "block";
    return;
  }
  emptyMsg.style.display = "none";

  for (const p of filteredProducts) {
    const tr = document.createElement("tr");

    const tdId = document.createElement("td");
    tdId.textContent = p.id;

    const tdName = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.className = "input";
    nameInput.value = p.name || "";
    tdName.appendChild(nameInput);

    const tdCategory = document.createElement("td");
    const categorySelect = document.createElement("select");
    categorySelect.className = "select";

    for (const cat of categories) {
      const opt = document.createElement("option");
      opt.value = cat.id;
      opt.textContent = cat.name;
      if (cat.id === p.categoryId) {
        opt.selected = true;
      }
      categorySelect.appendChild(opt);
    }
    tdCategory.appendChild(categorySelect);

    const tdSalePrice = document.createElement("td");
    const salePriceInput = document.createElement("input");
    salePriceInput.type = "number";
    salePriceInput.className = "input";
    salePriceInput.min = "0";
    salePriceInput.step = "0.01";
    salePriceInput.value = p.salePrice ?? "";
    tdSalePrice.appendChild(salePriceInput);

    const tdStock = document.createElement("td");
    const stockInput = document.createElement("input");
    stockInput.type = "number";
    stockInput.className = "input";
    stockInput.min = "0";
    stockInput.value = p.stock ?? "";
    tdStock.appendChild(stockInput);

    const tdActions = document.createElement("td");
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Guardar";
    saveBtn.className = "btn";
    saveBtn.addEventListener("click", () =>
      onUpdateProduct(p.id, nameInput, categorySelect, salePriceInput, stockInput)
    );

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "btn danger";
    deleteBtn.style.marginLeft = "6px";
    deleteBtn.addEventListener("click", () => onDeleteProduct(p.id));

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdName);
    tr.appendChild(tdCategory);
    tr.appendChild(tdSalePrice);
    tr.appendChild(tdStock);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

function onSearchChange(e) {
  const term = e.target.value.toLowerCase();
  filteredProducts = products.filter((p) => {
    const catName = p.category?.name || "";
    return (
      (p.name || "").toLowerCase().includes(term) ||
      catName.toLowerCase().includes(term)
    );
  });
  renderTable();
}

async function onCreateProduct(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector("#productCreateError");
  errorBox.textContent = "";

  const name = form.name.value.trim();
  const categoryIdRaw = form.categoryId.value;
  const salePriceRaw = form.salePrice.value.trim();
  const stockRaw = form.stock.value.trim();

  if (!name) {
    errorBox.textContent = "El nombre es obligatorio.";
    return;
  }
  if (!categoryIdRaw) {
    errorBox.textContent = "Debes seleccionar una categoría.";
    return;
  }

  const categoryId = Number(categoryIdRaw);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    errorBox.textContent = "Categoría inválida.";
    return;
  }

  let salePrice;
  if (salePriceRaw !== "") {
    const val = Number(salePriceRaw);
    if (!Number.isFinite(val) || val < 0) {
      errorBox.textContent = "El precio de venta debe ser un número mayor o igual a 0.";
      return;
    }
    salePrice = val;
  }

  let stock;
  if (stockRaw !== "") {
    const val = Number.parseInt(stockRaw, 10);
    if (!Number.isFinite(val) || val < 0) {
      errorBox.textContent = "El stock debe ser un entero mayor o igual a 0.";
      return;
    }
    stock = val;
  }

  const payload = {
    name,
    categoryId,
    ...(salePrice !== undefined ? { salePrice } : {}),
    ...(stock !== undefined ? { stock } : {}),
  };

  try {
    await createProduct(payload);
    form.reset();
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onUpdateProduct(id, nameInput, categorySelect, salePriceInput, stockInput) {
  const errorBox = document.querySelector("#productsTableError");
  errorBox.textContent = "";

  const name = nameInput.value.trim();
  const categoryIdRaw = categorySelect.value;
  const salePriceRaw = salePriceInput.value.trim();
  const stockRaw = stockInput.value.trim();

  if (!name) {
    errorBox.textContent = "El nombre es obligatorio.";
    return;
  }
  if (!categoryIdRaw) {
    errorBox.textContent = "Debes seleccionar una categoría.";
    return;
  }

  const categoryId = Number(categoryIdRaw);
  if (!Number.isFinite(categoryId) || categoryId <= 0) {
    errorBox.textContent = "Categoría inválida.";
    return;
  }

  let salePrice;
  if (salePriceRaw !== "") {
    const val = Number(salePriceRaw);
    if (!Number.isFinite(val) || val < 0) {
      errorBox.textContent = "El precio de venta debe ser un número mayor o igual a 0.";
      return;
    }
    salePrice = val;
  }

  let stock = null;
  if (stockRaw !== "") {
    const val = Number.parseInt(stockRaw, 10);
    if (!Number.isFinite(val) || val < 0) {
      errorBox.textContent = "El stock debe ser un entero mayor o igual a 0.";
      return;
    }
    stock = val;
  }
  // stockRaw vacío -> null explícito (allow(null))

  const changes = {
    name,
    categoryId,
    stock,
    ...(salePrice !== undefined ? { salePrice } : {}),
  };

  try {
    await updateProduct(id, changes);
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onDeleteProduct(id) {
  const errorBox = document.querySelector("#productsTableError");
  errorBox.textContent = "";

  if (!confirm("¿Seguro que deseas eliminar este producto?")) return;

  try {
    await deleteProduct(id);
    await initData();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}
