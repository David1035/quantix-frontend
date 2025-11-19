// assets/js/modules/ingresos/ingresos.controller.js

import { requireAuth, logout } from "../../guard.js";
import {
  getSuppliers,
  getProducts,
  getProductSuppliers,
  createProductSupplier,
  getProductById,
  updateProduct,
} from "./ingresos.service.js";

console.log("[Ingresos] controlador cargado");

requireAuth();

// --- DOM --- //
const btnLogout       = document.getElementById("btnLogout");
const ingresoForm     = document.getElementById("ingresoForm");
const selectSupplier  = document.getElementById("supplierId");
const selectProduct   = document.getElementById("productId");
const inputCantidad   = document.getElementById("cantidad");
const inputPrecioComp = document.getElementById("precioCompra");
const inputPrecioVent = document.getElementById("precioVenta");
const stockInfo       = document.getElementById("stockInfo");
const formMsg         = document.getElementById("formMsg");

const filterIngresos  = document.getElementById("filterIngresos");
const ingresosTbody   = document.querySelector("#ingresosTable tbody");
const ingresosMsg     = document.getElementById("ingresosMsg");

// 🔎 Validación básica de DOM para evitar que el script muera en silencio
(function validateDom() {
  const missing = [];
  if (!btnLogout)      missing.push("btnLogout");
  if (!ingresoForm)    missing.push("ingresoForm");
  if (!selectSupplier) missing.push("supplierId");
  if (!selectProduct)  missing.push("productId");
  if (!inputCantidad)  missing.push("cantidad");
  if (!inputPrecioComp)missing.push("precioCompra");
  if (!inputPrecioVent)missing.push("precioVenta");
  if (!stockInfo)      missing.push("stockInfo");
  if (!formMsg)        missing.push("formMsg");
  if (!filterIngresos) missing.push("filterIngresos");
  if (!ingresosTbody)  missing.push("ingresosTable > tbody");
  if (!ingresosMsg)    missing.push("ingresosMsg");

  if (missing.length) {
    console.warn("[Ingresos] Faltan elementos en el DOM:", missing);
    if (ingresosMsg) {
      ingresosMsg.textContent =
        "Error de plantilla: faltan elementos en el DOM: " + missing.join(", ");
    }
  } else {
    console.log("[Ingresos] Todos los elementos del DOM están OK");
  }
})();

if (btnLogout) {
  btnLogout.addEventListener("click", logout);
}

// Estado en memoria
let suppliers = [];
let products = [];
let productSupLinks = []; // registros de product_supplier

let ingresosSesion = []; // { idTmp, fecha, supplierName, productName, qty, unitCost, total, stockBefore, stockAfter }

// Helpers
function buildMap(arr, key = "id") {
  const map = {};
  for (const item of arr) {
    map[item[key]] = item;
  }
  return map;
}

function formatCurrency(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  });
}

// Render selects
function renderSelects() {
  if (!selectSupplier || !selectProduct) return;

  // proveedores
  selectSupplier.innerHTML = `<option value="">Seleccione proveedor...</option>`;
  suppliers.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name || `Proveedor #${s.id}`;
    selectSupplier.appendChild(opt);
  });

  // productos
  selectProduct.innerHTML = `<option value="">Seleccione producto...</option>`;
  products.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name || `Producto #${p.id}`;
    opt.dataset.salePrice = p.salePrice ?? "";
    selectProduct.appendChild(opt);
  });
}

// Mostrar stock cuando se selecciona producto
if (selectProduct) {
  selectProduct.addEventListener("change", () => {
    const id = Number(selectProduct.value);
    const prod = products.find((p) => p.id === id);
    if (!prod) {
      if (stockInfo) stockInfo.textContent = "Stock actual: —";
      return;
    }
    const stock = prod.stock ?? 0;
    if (stockInfo) stockInfo.textContent = `Stock actual: ${stock}`;
    if (prod.salePrice != null && prod.salePrice !== "" && inputPrecioVent) {
      inputPrecioVent.value = Number(prod.salePrice);
    }
  });
}

// Filtro de tabla de ingresos
if (filterIngresos) {
  filterIngresos.addEventListener("input", () => {
    renderIngresosTable();
  });
}

// Render tabla de ingresos de la sesión
function renderIngresosTable() {
  if (!ingresosTbody) return;

  ingresosTbody.innerHTML = "";
  const term = (filterIngresos?.value || "").trim().toLowerCase();

  const datos = ingresosSesion.filter((ing) => {
    const sup = (ing.supplierName || "").toLowerCase();
    const prod = (ing.productName || "").toLowerCase();
    return !term || sup.includes(term) || prod.includes(term);
  });

  datos.forEach((ing) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ing.fecha}</td>
      <td>${ing.supplierName}</td>
      <td>${ing.productName}</td>
      <td>${ing.qty}</td>
      <td>${formatCurrency(ing.unitCost)}</td>
      <td>${formatCurrency(ing.total)}</td>
      <td>${ing.stockBefore}</td>
      <td>${ing.stockAfter}</td>
    `;
    ingresosTbody.appendChild(tr);
  });

  if (ingresosMsg) {
    ingresosMsg.textContent = datos.length
      ? `Mostrando ${datos.length} ingreso(s) en esta sesión`
      : "Aún no se han registrado ingresos en esta sesión.";
  }
}

// Verificar o crear relación product–supplier
async function ensureProductSupplierRelation(productId, supplierId) {
  const exists = productSupLinks.some(
    (l) => l.productId === productId && l.supplierId === supplierId
  );
  if (exists) return;

  const created = await createProductSupplier({ productId, supplierId });
  productSupLinks.push(created);
}

// Submit de ingreso
if (ingresoForm) {
  ingresoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (formMsg) formMsg.textContent = "";

    const supplierId = Number(selectSupplier?.value);
    const productId  = Number(selectProduct?.value);
    const qty        = Number(inputCantidad?.value);
    const unitCost   = Number(inputPrecioComp?.value);
    const salePrice  =
      !inputPrecioVent || inputPrecioVent.value === ""
        ? null
        : Number(inputPrecioVent.value);

    if (!supplierId) {
      if (formMsg) formMsg.textContent = "Debe seleccionar un proveedor.";
      return;
    }
    if (!productId) {
      if (formMsg) formMsg.textContent = "Debe seleccionar un producto.";
      return;
    }
    if (!qty || qty <= 0) {
      if (formMsg) formMsg.textContent = "La cantidad debe ser mayor a 0.";
      return;
    }
    if (isNaN(unitCost) || unitCost < 0) {
      if (formMsg) formMsg.textContent = "El precio unitario (compra) es inválido.";
      return;
    }
    if (inputPrecioVent && inputPrecioVent.value !== "" && (isNaN(salePrice) || salePrice < 0)) {
      if (formMsg) formMsg.textContent = "El precio de venta ingresado es inválido.";
      return;
    }

    try {
      if (formMsg) formMsg.textContent = "Registrando ingreso...";
      console.log("[Ingresos] Enviando ingreso", { supplierId, productId, qty, unitCost, salePrice });

      const product = await getProductById(productId);
      const stockBefore = product.stock != null ? Number(product.stock) : 0;
      const stockAfter  = stockBefore + qty;

      const updatePayload = { stock: stockAfter };
      if (salePrice != null) {
        updatePayload.salePrice = salePrice;
      }
      const updatedProduct = await updateProduct(productId, updatePayload);

      products = products.map((p) => (p.id === productId ? updatedProduct : p));

      await ensureProductSupplierRelation(productId, supplierId);

      const sup = suppliers.find((s) => s.id === supplierId);
      const fechaStr = new Date().toLocaleString();

      const ingreso = {
        idTmp: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        fecha: fechaStr,
        supplierName: sup?.name || `Proveedor #${supplierId}`,
        productName: updatedProduct.name || `Producto #${productId}`,
        qty,
        unitCost: unitCost,
        total: qty * unitCost,
        stockBefore,
        stockAfter,
      };

      ingresosSesion.unshift(ingreso);
      renderIngresosTable();

      if (inputCantidad)   inputCantidad.value   = "";
      if (inputPrecioComp) inputPrecioComp.value = "";
      if (stockInfo)       stockInfo.textContent = `Stock actual: ${stockAfter}`;

      if (formMsg) formMsg.textContent = "Ingreso registrado correctamente.";
    } catch (err) {
      console.error("[Ingresos] Error en submit:", err);
      if (formMsg) formMsg.textContent = err.message || "Error al registrar el ingreso.";
    }
  });
}

// Init
async function init() {
  if (!ingresosMsg) return;
  try {
    ingresosMsg.textContent = "Cargando catálogos...";
    console.log("[Ingresos] init() → trayendo catálogos");

    const [s, p, ps] = await Promise.all([
      getSuppliers(),
      getProducts(),
      getProductSuppliers(),
    ]);

    suppliers       = Array.isArray(s) ? s : [];
    products        = Array.isArray(p) ? p : [];
    productSupLinks = Array.isArray(ps) ? ps : [];

    console.log("[Ingresos] proveedores:", suppliers.length);
    console.log("[Ingresos] productos:", products.length);
    console.log("[Ingresos] productSupLinks:", productSupLinks.length);

    renderSelects();
    renderIngresosTable();

    ingresosMsg.textContent = "Listo. Registra un nuevo ingreso.";
  } catch (err) {
    console.error("[Ingresos] Error en init():", err);
    ingresosMsg.textContent = err.message || "Error al cargar catálogos.";
  }
}

init();
