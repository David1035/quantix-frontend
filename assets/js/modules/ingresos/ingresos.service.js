// assets/js/modules/ingresos/ingresos.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const SUPPLIERS_URL       = `${API_BASE}${endpoints.suppliers}`;
const PRODUCTS_URL        = `${API_BASE}${endpoints.products}`;
const PRODUCT_SUP_URL     = `${API_BASE}${endpoints.productSuppliers}`;

async function handleResponse(res) {
  if (!res.ok) {
    let msg = `Error HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data.message || data.error || msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// --- Catálogos ---

export async function getSuppliers() {
  const res = await fetch(SUPPLIERS_URL, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getProducts() {
  const res = await fetch(PRODUCTS_URL, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

// --- ProductSupplier (para asegurar la relación producto–proveedor) ---

export async function getProductSuppliers() {
  const res = await fetch(PRODUCT_SUP_URL, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createProductSupplier(payload) {
  const res = await fetch(PRODUCT_SUP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

// --- Producto individual (para stock) ---

export async function getProductById(id) {
  const res = await fetch(`${PRODUCTS_URL}/${id}`, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  return handleResponse(res);
}

export async function updateProduct(id, payload) {
  const res = await fetch(`${PRODUCTS_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
