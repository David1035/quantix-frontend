// assets/js/modules/reports/reports.controller.js
import { API_BASE, endpoints, authHeaders } from "../../apiConfig.js";
import { requireAuth, logout } from "../../guard.js";

requireAuth();

// DOM
const datasetSelect = document.getElementById("dataset");
const btnReload     = document.getElementById("btnReload");
const btnCsv        = document.getElementById("btnCsv");
const btnXlsx       = document.getElementById("btnXlsx");
const btnLogout     = document.getElementById("btnLogout");

const kpi1 = document.getElementById("kpi1");
const kpi2 = document.getElementById("kpi2");
const kpi3 = document.getElementById("kpi3");
const kpi4 = document.getElementById("kpi4");

const infoMsg  = document.getElementById("infoMsg");
const errorMsg = document.getElementById("errorMsg");

const tableHead = document.querySelector("#reportTable thead");
const tableBody = document.querySelector("#reportTable tbody");

btnLogout.addEventListener("click", logout);

let currentRows = [];   // filas renderizadas (para export)
let currentTitle = "";  // nombre del dataset actual

// Helper genérico GET
async function apiGet(relativePath) {
  const res = await fetch(`${API_BASE}${relativePath}`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status} al consultar ${relativePath}`);
  }
  return res.json();
}

// Render genérico
function renderTable(columns, rows) {
  // encabezado
  tableHead.innerHTML = "";
  const trHead = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    trHead.appendChild(th);
  });
  tableHead.appendChild(trHead);

  // cuerpo
  tableBody.innerHTML = "";
  rows.forEach(r => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.textContent = r[col] ?? "";
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });

  currentRows = rows;
}

function setKpis(k1, k2, k3, k4) {
  kpi1.textContent = k1;
  kpi2.textContent = k2;
  kpi3.textContent = k3;
  kpi4.textContent = k4;
}

// Utilidades numéricas
function toNumber(value) {
  const n = parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
}

function formatMoney(value) {
  const n = toNumber(value);
  return n.toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-CO");
}

// ------- Loaders por dataset --------

// Créditos
async function loadCredits() {
  currentTitle = "Créditos";
  infoMsg.textContent = "Cargando créditos...";
  errorMsg.textContent = "";

  const [credits, customers] = await Promise.all([
    apiGet(endpoints.credits),
    apiGet(endpoints.customers),
  ]);

  const customerById = new Map(
    customers.map(c => [c.id, `${c.name || ""} ${c.lastName || ""}`.trim()])
  );

  const rows = credits.map(c => {
    const total = toNumber(c.totalAmount);
    return {
      "ID crédito": c.id,
      "Cliente": customerById.get(c.customerId) || `#${c.customerId || "-"}`,
      "Valor total": formatMoney(total),
      "Activo": c.isActive ? "Sí" : "No",
      "Fecha creación": formatDate(c.createdAt),
    };
  });

  const totalCreditos     = credits.length;
  const activos           = credits.filter(c => c.isActive).length;
  const totalMonto        = credits.reduce((acc, c) => acc + toNumber(c.totalAmount), 0);
  const promedio          = totalCreditos ? totalMonto / totalCreditos : 0;

  setKpis(
    `Total créditos: ${totalCreditos}`,
    `Créditos activos: ${activos}`,
    `Monto total: ${formatMoney(totalMonto)}`,
    `Promedio por crédito: ${formatMoney(promedio)}`
  );

  renderTable(
    ["ID crédito", "Cliente", "Valor total", "Activo", "Fecha creación"],
    rows
  );

  infoMsg.textContent = `${rows.length} créditos cargados.`;
}

// Abonos de crédito
async function loadCreditPayments() {
  currentTitle = "Abonos de crédito";
  infoMsg.textContent = "Cargando abonos...";
  errorMsg.textContent = "";

  const [payments, credits] = await Promise.all([
    apiGet(endpoints.creditPayments),
    apiGet(endpoints.credits),
  ]);

  const creditById = new Map(credits.map(c => [c.id, c]));

  const rows = payments.map(p => {
    const credit = creditById.get(p.creditId);
    return {
      "ID abono": p.id,
      "ID crédito": p.creditId,
      "Valor abono": formatMoney(p.paymentsAmount),
      "Crédito activo": credit?.isActive ? "Sí" : "No",
      "Fecha abono": formatDate(p.createdAt),
    };
  });

  const totalAbonos   = payments.length;
  const montoAbonado  = payments.reduce((acc, p) => acc + toNumber(p.paymentsAmount), 0);

  setKpis(
    `Total abonos: ${totalAbonos}`,
    `Monto abonado: ${formatMoney(montoAbonado)}`,
    `Promedio por abono: ${formatMoney(totalAbonos ? montoAbonado / totalAbonos : 0)}`,
    `Créditos con abonos: ${new Set(payments.map(p => p.creditId)).size}`
  );

  renderTable(
    ["ID abono", "ID crédito", "Valor abono", "Crédito activo", "Fecha abono"],
    rows
  );

  infoMsg.textContent = `${rows.length} abonos cargados.`;
}

// Clientes
async function loadCustomers() {
  currentTitle = "Clientes";
  infoMsg.textContent = "Cargando clientes...";
  errorMsg.textContent = "";

  const customers = await apiGet(endpoints.customers);

  const rows = customers.map(c => ({
    "ID cliente": c.id,
    "Nombre": `${c.name || ""} ${c.lastName || ""}`.trim(),
    "Documento": c.document || "",
    "Teléfono": c.phone || "",
    "Tiene crédito": c.estadoCredito ? "Sí" : "No",
    "Fecha creación": formatDate(c.createdAt),
  }));

  const total     = customers.length;
  const conCred   = customers.filter(c => c.estadoCredito).length;

  setKpis(
    `Total clientes: ${total}`,
    `Con crédito activo: ${conCred}`,
    `Sin crédito: ${total - conCred}`,
    `Porcentaje con crédito: ${
      total ? ((conCred / total) * 100).toFixed(1) + "%" : "0%"
    }`
  );

  renderTable(
    ["ID cliente", "Nombre", "Documento", "Teléfono", "Tiene crédito", "Fecha creación"],
    rows
  );

  infoMsg.textContent = `${rows.length} clientes cargados.`;
}

// Ventas
async function loadSales() {
  currentTitle = "Ventas";
  infoMsg.textContent = "Cargando ventas...";
  errorMsg.textContent = "";

  const [sales, customers, users] = await Promise.all([
    apiGet(endpoints.sales),
    apiGet(endpoints.customers),
    apiGet(endpoints.users),
  ]);

  const customerById = new Map(
    customers.map(c => [c.id, `${c.name || ""} ${c.lastName || ""}`.trim()])
  );
  const userById = new Map(
    users.map(u => [u.id, u.email])
  );

  const rows = sales.map(s => {
    const total = toNumber(s.total);
    return {
      "ID venta": s.id,
      "Cliente": customerById.get(s.customerId) || `#${s.customerId || "-"}`,
      "Vendedor": userById.get(s.userId) || `#${s.userId || "-"}`,
      "Total venta": formatMoney(total),
      "Fecha venta": formatDate(s.fecha),
    };
  });

  const totalVentas = sales.length;
  const montoTotal  = sales.reduce((acc, s) => acc + toNumber(s.total), 0);
  const promedio    = totalVentas ? montoTotal / totalVentas : 0;

  setKpis(
    `Total ventas: ${totalVentas}`,
    `Monto facturado: ${formatMoney(montoTotal)}`,
    `Promedio por venta: ${formatMoney(promedio)}`,
    `Clientes únicos: ${new Set(sales.map(s => s.customerId).filter(Boolean)).size}`
  );

  renderTable(
    ["ID venta", "Cliente", "Vendedor", "Total venta", "Fecha venta"],
    rows
  );

  infoMsg.textContent = `${rows.length} ventas cargadas.`;
}

// Inventario (Productos)
async function loadInventory() {
  currentTitle = "Inventario";
  infoMsg.textContent = "Cargando inventario...";
  errorMsg.textContent = "";

  const [products, categories] = await Promise.all([
    apiGet(endpoints.products),
    apiGet(endpoints.categories),
  ]);

  const categoryById = new Map(categories.map(c => [c.id, c.name]));

  const rows = products.map(p => {
    const stock  = p.stock ?? 0;
    const price  = toNumber(p.salePrice);
    const value  = stock * price;

    return {
      "ID producto": p.id,
      "Nombre": p.name || "",
      "Categoría": p.category?.name || categoryById.get(p.categoryId) || "",
      "Precio venta": formatMoney(p.salePrice),
      "Stock": stock,
      "Valor inventario": formatMoney(value),
      "Fecha creación": formatDate(p.createdAt),
    };
  });

  const totalProductos  = products.length;
  const totalStock      = products.reduce((acc, p) => acc + (p.stock ?? 0), 0);
  const valorInventario = products.reduce((acc, p) => {
    const stock = p.stock ?? 0;
    const price = toNumber(p.salePrice);
    return acc + (stock * price);
  }, 0);

  setKpis(
    `Productos: ${totalProductos}`,
    `Unidades en stock: ${totalStock}`,
    `Valor inventario: ${formatMoney(valorInventario)}`,
    `Precio promedio: ${formatMoney(totalProductos ? valorInventario / totalProductos : 0)}`
  );

  renderTable(
    ["ID producto", "Nombre", "Categoría", "Precio venta", "Stock", "Valor inventario", "Fecha creación"],
    rows
  );

  infoMsg.textContent = `${rows.length} productos cargados.`;
}

// Dispatcher principal
async function loadCurrentDataset() {
  const dataset = datasetSelect.value;
  errorMsg.textContent = "";
  infoMsg.textContent = "";

  try {
    if (dataset === "credits") {
      await loadCredits();
    } else if (dataset === "creditPayments") {
      await loadCreditPayments();
    } else if (dataset === "customers") {
      await loadCustomers();
    } else if (dataset === "sales") {
      await loadSales();
    } else if (dataset === "inventory") {
      await loadInventory();
    }
  } catch (err) {
    console.error(err);
    errorMsg.textContent = err.message || "Error al cargar el reporte.";
  }
}

// -------- Exportar --------
function exportCsv() {
  if (!currentRows.length) {
    alert("No hay datos para exportar.");
    return;
  }
  const columns = Object.keys(currentRows[0]);
  const lines = [];
  lines.push(columns.join(";"));

  currentRows.forEach(row => {
    const line = columns.map(c => {
      const v = row[c] ?? "";
      // escapamos comillas y separador
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    }).join(";");
    lines.push(line);
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `reporte_${currentTitle || "datos"}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportXlsx() {
  if (typeof XLSX === "undefined") {
    alert("La librería XLSX no está cargada.");
    return;
  }
  if (!currentRows.length) {
    alert("No hay datos para exportar.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(currentRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Reporte");
  XLSX.writeFile(wb, `reporte_${currentTitle || "datos"}.xlsx`);
}

// Eventos
datasetSelect.addEventListener("change", loadCurrentDataset);
btnReload.addEventListener("click", loadCurrentDataset);
btnCsv.addEventListener("click", exportCsv);
btnXlsx.addEventListener("click", exportXlsx);

// Carga inicial
loadCurrentDataset();
