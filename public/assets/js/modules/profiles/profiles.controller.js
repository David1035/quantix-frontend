// assets/js/modules/profiles/profiles.controller.js
import { requireAuth, logout } from "../../guard.js";
import { getProfiles, createProfile, updateProfile } from "./profiles.service.js";

let profiles = [];
let selectedProfile = null;

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  wireEvents();
  initData();
});

function wireEvents() {
  document.querySelector("#logoutBtn")?.addEventListener("click", logout);

  const createForm = document.querySelector("#profileCreateForm");
  const editForm = document.querySelector("#profileEditForm");
  const userSelect = document.querySelector("#profileUserSelect");

  createForm.addEventListener("submit", onCreateProfile);
  editForm.addEventListener("submit", onEditProfile);
  userSelect.addEventListener("change", onProfileSelectChange);
}

async function initData() {
  const editError = document.querySelector("#profileEditError");
  const editInfo = document.querySelector("#profileEditInfo");
  editError.textContent = "";
  editInfo.textContent = "";

  try {
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const loggedUserId = storedUser?.id || null;

    profiles = await getProfiles();
    populateProfileSelect(loggedUserId);
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      editError.textContent = "No tienes permisos para consultar perfiles.";
      return;
    }
    editError.textContent = err.message;
  }
}

function populateProfileSelect(loggedUserId) {
  const userSelect = document.querySelector("#profileUserSelect");
  const editInfo = document.querySelector("#profileEditInfo");
  const editError = document.querySelector("#profileEditError");

  userSelect.innerHTML = "";
  editInfo.textContent = "";
  editError.textContent = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecciona un usuario con perfil...";
  userSelect.appendChild(placeholder);

  for (const p of profiles) {
    const opt = document.createElement("option");
    opt.value = p.id; // id del perfil
    const email = p.user?.email || "sin-email";
    const fullName = `${p.name || ""} ${p.lastName || ""}`.trim();
    opt.textContent = `${email} ${fullName ? `(${fullName})` : ""}`;
    userSelect.appendChild(opt);
  }

  let defaultProfile = null;

  if (loggedUserId) {
    defaultProfile =
      profiles.find((p) => p.user && p.user.id === loggedUserId) || null;
  }

  if (defaultProfile) {
    userSelect.value = String(defaultProfile.id);
    selectedProfile = defaultProfile;
    fillEditForm(defaultProfile);
    editInfo.textContent = "Perfil del usuario autenticado cargado por defecto.";
  } else {
    selectedProfile = null;
    clearEditForm();
    editInfo.textContent = "Selecciona un perfil para editar.";
  }
}

/** Crear usuario + perfil en un POST /profiles */
async function onCreateProfile(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector("#profileCreateError");
  const infoBox = document.querySelector("#profileCreateInfo");

  errorBox.textContent = "";
  infoBox.textContent = "";

  const email = form.email.value.trim();
  const role = form.role.value.trim() || "vendedor";
  const password = form.password.value.trim();

  const name = form.name.value.trim();
  const lastName = form.lastName.value.trim();
  const documentValue = form.document.value.trim();
  const phone = form.phone.value.trim();

  if (!email || !password || !name || !lastName || !documentValue || !phone) {
    errorBox.textContent = "Todos los campos son obligatorios.";
    return;
  }
  if (password.length < 8) {
    errorBox.textContent = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }
  const documentNumber = Number(documentValue);
  if (!Number.isFinite(documentNumber) || documentNumber <= 0) {
    errorBox.textContent = "El documento debe ser un número válido.";
    return;
  }
  if (phone.length < 10) {
    errorBox.textContent = "El teléfono debe tener al menos 10 dígitos.";
    return;
  }

  const payload = {
    name,
    lastName,
    document: documentNumber,
    phone,
    user: {
      email,
      password,
      role,
    },
  };

  try {
    await createProfile(payload);
    form.reset();
    infoBox.textContent = "Usuario y perfil creados correctamente.";
    // refrescar perfiles
    profiles = await getProfiles();
    const storedUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const loggedUserId = storedUser?.id || null;
    populateProfileSelect(loggedUserId);
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      errorBox.textContent =
        "No autorizado para crear perfiles (requiere rol admin/administrador).";
      return;
    }
    errorBox.textContent = err.message;
  }
}

function onProfileSelectChange(e) {
  const selectedId = e.target.value ? Number(e.target.value) : null;
  const editInfo = document.querySelector("#profileEditInfo");
  const editError = document.querySelector("#profileEditError");

  editInfo.textContent = "";
  editError.textContent = "";

  if (!selectedId) {
    selectedProfile = null;
    clearEditForm();
    editInfo.textContent = "Selecciona un perfil para editar.";
    return;
  }

  const profile = profiles.find((p) => p.id === selectedId) || null;

  if (!profile) {
    selectedProfile = null;
    clearEditForm();
    editError.textContent = "No se encontró el perfil seleccionado.";
    return;
  }

  selectedProfile = profile;
  fillEditForm(profile);
  editInfo.textContent = "Editando perfil seleccionado.";
}

function fillEditForm(profile) {
  const profileIdInput = document.querySelector("#profileId");
  const form = document.querySelector("#profileEditForm");

  profileIdInput.value = profile.id;
  form.name.value = profile.name || "";
  form.lastName.value = profile.lastName || "";
  form.document.value = profile.document || "";
  form.phone.value = profile.phone || "";
}

function clearEditForm() {
  const profileIdInput = document.querySelector("#profileId");
  const form = document.querySelector("#profileEditForm");

  profileIdInput.value = "";
  form.name.value = "";
  form.lastName.value = "";
  form.document.value = "";
  form.phone.value = "";
}

/** Guardar cambios de perfil (PATCH /profiles/:id) */
async function onEditProfile(e) {
  e.preventDefault();
  const errorBox = document.querySelector("#profileEditError");
  const infoBox = document.querySelector("#profileEditInfo");

  errorBox.textContent = "";
  infoBox.textContent = "";

  if (!selectedProfile) {
    errorBox.textContent = "Debes seleccionar un perfil primero.";
    return;
  }

  const form = e.target;
  const name = form.name.value.trim();
  const lastName = form.lastName.value.trim();
  const documentValue = form.document.value.trim();
  const phone = form.phone.value.trim();

  if (!name || !lastName || !documentValue || !phone) {
    errorBox.textContent = "Todos los campos son obligatorios.";
    return;
  }
  const documentNumber = Number(documentValue);
  if (!Number.isFinite(documentNumber) || documentNumber <= 0) {
    errorBox.textContent = "El documento debe ser un número válido.";
    return;
  }
  if (phone.length < 10) {
    errorBox.textContent = "El teléfono debe tener al menos 10 dígitos.";
    return;
  }

  const changes = {
    name,
    lastName,
    document: documentNumber,
    phone,
  };

  try {
    await updateProfile(selectedProfile.id, changes);
    infoBox.textContent = "Perfil actualizado correctamente.";

    // Refrescar datos locales
    profiles = await getProfiles();
    const updated = profiles.find((p) => p.id === selectedProfile.id) || null;
    selectedProfile = updated;
    if (updated) {
      fillEditForm(updated);
    }
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      errorBox.textContent = "No autorizado para actualizar perfiles.";
      return;
    }
    errorBox.textContent = err.message;
  }
}
