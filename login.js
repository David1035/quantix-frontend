document.getElementById('loginForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Credenciales incorrectas');
    }

    const data = await response.json();
    // Suponiendo que el backend responde con { token, user }

    // Guardar token en localStorage (o sessionStorage si prefieres)
    localStorage.setItem('token', data.token);

    // Redirigir al dashboard o home
    window.location.href = '/dashboard.html';
  } catch (error) {
    document.getElementById('mensajeError').textContent = error.message;
  }
});
