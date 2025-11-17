// assets/js/apiConfig.js

// Backend base
export const API_BASE = "http://localhost:3000/api/v1";

// Endpoints RELATIVOS (sin /login ni http://)
export const endpoints = {
  auth:           "/auth",
  users:          "/users",
  profiles:       "/profiles",
  customers:      "/customers",
  credits:        "/credits",
  creditPayments: "/creditPayments",
  categories:     "/categories",
  products:       "/products",
  suppliers:      "/suppliers",
  productSuppliers: "/productSuppliers",
  sales:          "/sales",
  detailSales:    "/detailSales",
  invoices:       "/invoices",
};

// Helpers JWT
const TOKEN_KEY = "quantix_token";

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
