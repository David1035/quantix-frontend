// assets/js/modules/suppliers/suppliers.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const SUPPLIERS_URL = `${API_BASE}${endpoints.suppliers}`;

async function handleResponse(res) {
  if (res.status === 204) {
    // delete sin body
    return { ok: true };
  }

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

// GET /suppliers
export async function getSuppliers() {
  const res = await fetch(SUPPLIERS_URL, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return handleResponse(res);
}

// GET /suppliers/:id (por si lo necesitas)
export async function getSupplierById(id) {
  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return handleResponse(res);
}

// POST /suppliers
export async function createSupplier(payload) {
  const res = await fetch(SUPPLIERS_URL, {
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

// PATCH /suppliers/:id
export async function updateSupplier(id, payload) {
  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
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

// DELETE /suppliers/:id
export async function deleteSupplier(id) {
  const res = await fetch(`${SUPPLIERS_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  return handleResponse(res);
}
