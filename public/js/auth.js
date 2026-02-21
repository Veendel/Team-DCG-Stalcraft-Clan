// Handle login
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect based on role: admin/member → dashboard, user → user.html
        const role = data.user?.role || 'user';
        window.location.href = (role === 'admin' || role === 'member') ? '/dashboard.html' : '/user.html';
      } else {
        errorDiv.textContent = data.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Connection error. Is the server running?';
      errorDiv.style.display = 'block';
    }
  });
}

// Handle registration
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('error');

    if (password !== confirmPassword) {
      errorDiv.textContent = 'Passwords do not match';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! You can now login.');
        window.location.href = '/login.html';
      } else {
        errorDiv.textContent = data.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Connection error. Is the server running?';
      errorDiv.style.display = 'block';
    }
  });
}