// assets/js/modules/categories/categories.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const CATEGORIES_URL = `${API_BASE}${endpoints.categories}`;

async function handleResponse(res) {
  if (res.status === 401) {
    throw Object.assign(new Error("No autorizado"), { code: 401 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "Error en la petición");
  }
  return data;
}

export async function getCategories() {
  const res = await fetch(CATEGORIES_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createCategory(payload) {
  const res = await fetch(CATEGORIES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateCategory(id, changes) {
  const res = await fetch(`${CATEGORIES_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

export async function deleteCategory(id) {
  const res = await fetch(`${CATEGORIES_URL}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(res); // backend devuelve JSON { id, message }
}
