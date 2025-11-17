// assets/js/modules/users/users.controller.js
import { requireAuth, logout } from '../../guard.js';
import { getUsers, createUser, updateUser, deleteUser } from './users.service.js';

let users = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  wireEvents();
  loadUsers();
});

function wireEvents() {
  document.querySelector('#logoutBtn')?.addEventListener('click', logout);

  const form = document.querySelector('#userCreateForm');
  const searchInput = document.querySelector('#userSearchInput');

  form.addEventListener('submit', onCreateUser);
  searchInput.addEventListener('input', onSearchChange);
}

async function loadUsers() {
  const errorBox = document.querySelector('#usersTableError');
  errorBox.textContent = '';

  try {
    users = await getUsers();
    filteredUsers = [...users];
    renderTable();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

function renderTable() {
  const tbody = document.querySelector('#usersTable tbody');
  const emptyMsg = document.querySelector('#usersTableEmpty');

  tbody.innerHTML = '';

  if (!filteredUsers.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  for (const user of filteredUsers) {
    const tr = document.createElement('tr');

    // ID
    const tdId = document.createElement('td');
    tdId.textContent = user.id;

    // Email
    const tdEmail = document.createElement('td');
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'input';
    emailInput.value = user.email || '';
    tdEmail.appendChild(emailInput);

    // Rol
    const tdRole = document.createElement('td');
    const roleInput = document.createElement('input');
    roleInput.className = 'input';
    roleInput.value = user.role || '';
    tdRole.appendChild(roleInput);

    // Nueva contraseña opcional
    const tdPass = document.createElement('td');
    const passInput = document.createElement('input');
    passInput.type = 'password';
    passInput.className = 'input';
    passInput.placeholder = 'Dejar vacío para no cambiar';
    tdPass.appendChild(passInput);

    // Acciones
    const tdActions = document.createElement('td');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Guardar';
    saveBtn.className = 'btn';
    saveBtn.addEventListener('click', () => onUpdateUser(user.id, emailInput, roleInput, passInput));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.className = 'btn danger';
    deleteBtn.style.marginLeft = '6px';
    deleteBtn.addEventListener('click', () => onDeleteUser(user.id));

    tdActions.appendChild(saveBtn);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdId);
    tr.appendChild(tdEmail);
    tr.appendChild(tdRole);
    tr.appendChild(tdPass);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  }
}

function onSearchChange(e) {
  const term = e.target.value.toLowerCase();
  filteredUsers = users.filter((u) =>
    (u.email || '').toLowerCase().includes(term) ||
    (u.role || '').toLowerCase().includes(term)
  );
  renderTable();
}

async function onCreateUser(e) {
  e.preventDefault();
  const form = e.target;
  const errorBox = document.querySelector('#userCreateError');
  errorBox.textContent = '';

  const email = form.email.value.trim();
  const role = form.role.value.trim() || 'vendedor';
  const password = form.password.value.trim();

  if (!email || !password) {
    errorBox.textContent = 'Email y contraseña son obligatorios.';
    return;
  }
  if (password.length < 8) {
    errorBox.textContent = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }

  try {
    await createUser({ email, role, password });
    form.reset();
    await loadUsers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onUpdateUser(id, emailInput, roleInput, passInput) {
  const errorBox = document.querySelector('#usersTableError');
  errorBox.textContent = '';

  const email = emailInput.value.trim();
  const role = roleInput.value.trim() || 'vendedor';
  const newPassword = passInput.value.trim();

  if (!email) {
    errorBox.textContent = 'El email es obligatorio.';
    return;
  }

  const changes = { email, role };
  if (newPassword) {
    if (newPassword.length < 8) {
      errorBox.textContent = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }
    changes.password = newPassword;
  }

  try {
    await updateUser(id, changes);
    passInput.value = '';
    await loadUsers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}

async function onDeleteUser(id) {
  const errorBox = document.querySelector('#usersTableError');
  errorBox.textContent = '';

  if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;

  try {
    await deleteUser(id);
    await loadUsers();
  } catch (err) {
    console.error(err);
    if (err.code === 401) {
      logout();
      return;
    }
    errorBox.textContent = err.message;
  }
}
