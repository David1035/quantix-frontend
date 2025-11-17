// assets/js/modules/profiles/profiles.service.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";

const PROFILES_URL = `${API_BASE}${endpoints.profiles}`; // http://localhost:3000/api/v1/profiles

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

export async function getProfiles() {
  const res = await fetch(PROFILES_URL, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

export async function createProfile(payload) {
  const res = await fetch(PROFILES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateProfile(id, changes) {
  const res = await fetch(`${PROFILES_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}
