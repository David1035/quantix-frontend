import { authLogin } from "./authLogin.js";
document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const dataAuth = { email, password };

    console.log(dataAuth)

    // Guardar token en localStorage (o sessionStorage si prefieres)
    localStorage.setItem('token', data.token);

    // Redirigir al dashboard o home
    window.location.href = '/dashboard.html';
  } catch (error) {
    document.getElementById('mensajeError').textContent = error.message;
  }
});
