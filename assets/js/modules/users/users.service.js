// assets/js/modules/users/users.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const USERS_URL = `${API_BASE}${endpoints.users}`; // http://localhost:3000/api/v1/users

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

export async function getUsers() {
  const res = await fetch(USERS_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createUser(payload) {
  const res = await fetch(USERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateUser(id, changes) {
  const res = await fetch(`${USERS_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

export async function deleteUser(id) {
  const res = await fetch(`${USERS_URL}/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });

  if (res.status === 401) {
    throw Object.assign(new Error("No autorizado"), { code: 401 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "No se pudo eliminar el usuario");
  }
  return data;
}
