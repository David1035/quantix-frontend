// assets/js/modules/credits/credits.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const CREDITS_URL = `${API_BASE}${endpoints.credits}`;
const CUSTOMERS_URL = `${API_BASE}${endpoints.customers}`;

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

export async function getCredits() {
  const res = await fetch(CREDITS_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createCredit(payload) {
  const res = await fetch(CREDITS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateCredit(id, changes) {
  const res = await fetch(`${CREDITS_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

export async function deleteCredit(id) {
  const res = await fetch(`${CREDITS_URL}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function getCustomersForCredits() {
  const res = await fetch(CUSTOMERS_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}
