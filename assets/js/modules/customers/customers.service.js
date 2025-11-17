// assets/js/modules/customers/customers.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

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

export async function getCustomers() {
  const res = await fetch(CUSTOMERS_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createCustomer(payload) {
  const res = await fetch(CUSTOMERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateCustomer(id, changes) {
  const res = await fetch(`${CUSTOMERS_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

export async function deleteCustomer(id) {
  const res = await fetch(`${CUSTOMERS_URL}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}
