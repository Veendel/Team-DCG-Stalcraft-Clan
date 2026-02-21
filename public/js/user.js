const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// No token - go to login
if (!token) {
  window.location.href = '/login.html';
  throw new Error('No token');
}

// Member or admin - they should use dashboard, redirect them
if (user.role === 'member' || user.role === 'admin') {
  window.location.href = '/dashboard.html';
  throw new Error('Redirect to dashboard');
}

// Display welcome
document.getElementById('welcomeMsg').textContent = `Hi, ${user.username || 'User'}!`;

// Logout handlers
function logout(e) {
  e.preventDefault();
  localStorage.clear();
  window.location.href = '/login.html';
}

document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('logoutBtnHero').addEventListener('click', logout);
