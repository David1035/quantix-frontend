// assets/js/modules/products/products.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const PRODUCTS_URL = `${API_BASE}${endpoints.products}`;
const CATEGORIES_URL = `${API_BASE}${endpoints.categories}`;

async function handleResponse(res) {
  if (res.status === 401) {
    throw Object.assign(new Error("No autorizado"), { code: 401 });
  }
  // DELETE /products devuelve 204 sin body, manejamos eso:
  if (res.status === 204) {
    return {};
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Error en la petición");
  }
  return data;
}

export async function getProducts() {
  const res = await fetch(PRODUCTS_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createProduct(payload) {
  const res = await fetch(PRODUCTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateProduct(id, changes) {
  const res = await fetch(`${PRODUCTS_URL}/${id}`, {
    method: "PUT", // tu backend soporta PUT y PATCH
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

export async function deleteProduct(id) {
  const res = await fetch(`${PRODUCTS_URL}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(res); // maneja 204
}

export async function getCategoriesForProducts() {
  const res = await fetch(CATEGORIES_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}
