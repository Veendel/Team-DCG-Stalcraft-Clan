const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check if user is admin
if (!token || user.role !== 'admin') {
  alert('Access denied. Admin only.');
  window.location.href = '/dashboard.html';
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = '/login.html';
});

// Global variable to store all users data
let allUsersData = [];
let currentView = 'stats';

// ============================================
// LOAD ALL USERS WITH COMPLETE DATA
// ============================================

async function loadUsers() {
  // Show loading state
  document.getElementById('statsBody').innerHTML = '<tr><td colspan="14" style="text-align:center;">Loading data...</td></tr>';
  document.getElementById('consumablesBody').innerHTML = '<tr><td colspan="24" style="text-align:center;">Loading data...</td></tr>';

  try {
    const response = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();
    console.log('Loaded users:', users); // Debug log
    
    allUsersData = users;
    
    displayStatsView(users);
    displayConsumablesView(users);
    updateStatistics(users);
  } catch (error) {
    console.error('Load users error:', error);
    showError('Failed to load users: ' + error.message);
    document.getElementById('statsBody').innerHTML = '<tr><td colspan="14" style="text-align:center; color:red;">Error loading data. Check console for details.</td></tr>';
    document.getElementById('consumablesBody').innerHTML = '<tr><td colspan="24" style="text-align:center; color:red;">Error loading data. Check console for details.</td></tr>';
  }
}

// ============================================
// DISPLAY STATS VIEW
// ============================================

function displayStatsView(users) {
  const tbody = document.getElementById('statsBody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;">No members found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => {
    const kdRatio = user.deaths > 0 ? (user.kills / user.deaths).toFixed(2) : (user.kills || 0);
    const createdDate = new Date(user.created_at).toLocaleDateString();
    
    return `
      <tr data-user-id="${user.id}">
        <td><strong>${user.id}</strong></td>
        <td><strong>${user.username}</strong></td>
        <td>${user.ingame_name || '-'}</td>
        <td>${user.discord_name || '-'}</td>
        <td><span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${user.role}</span></td>
        <td class="text-success"><strong>${user.kills || 0}</strong></td>
        <td class="text-danger"><strong>${user.deaths || 0}</strong></td>
        <td><strong>${kdRatio}</strong></td>
        <td style="max-width: 150px; white-space: normal;">${truncate(user.weapons, 50)}</td>
        <td style="max-width: 150px; white-space: normal;">${truncate(user.armors, 50)}</td>
        <td style="max-width: 150px; white-space: normal;">${truncate(user.artifact_builds, 50)}</td>
        <td>${user.artifact_image ? `<button class="btn btn-small btn-secondary view-image-btn" data-username="${user.username}" data-image="${encodeURIComponent(user.artifact_image)}">📷 View</button>` : '-'}</td>
        <td>${createdDate}</td>
        <td>
          ${user.role !== 'admin' ? 
            `<button class="btn btn-danger btn-small delete-user-btn" data-user-id="${user.id}" data-username="${user.username}">🗑️</button>` 
            : '<span class="text-muted">Protected</span>'}
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners to dynamically created buttons
  attachButtonListeners();
}

// ============================================
// DISPLAY CONSUMABLES VIEW
// ============================================

function displayConsumablesView(users) {
  const tbody = document.getElementById('consumablesBody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="24" style="text-align:center;">No members found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => {
    return `
      <tr>
        <td><strong>${user.username}</strong></td>
        <!-- Grenades -->
        <td>${user.nade_plantain || 0}</td>
        <td>${user.nade_napalm || 0}</td>
        <td>${user.nade_thunder || 0}</td>
        <td>${user.nade_frost || 0}</td>
        <!-- Enhancement -->
        <td>${user.enh_solyanka || 0}</td>
        <td>${user.enh_garlic_soup || 0}</td>
        <td>${user.enh_pea_soup || 0}</td>
        <td>${user.enh_lingonberry || 0}</td>
        <td>${user.enh_frosty || 0}</td>
        <td>${user.enh_alcobull || 0}</td>
        <td>${user.enh_geyser_vodka || 0}</td>
        <!-- Mobility -->
        <td>${user.mob_grog || 0}</td>
        <td>${user.mob_strength_stimulator || 0}</td>
        <td>${user.mob_neurotonic || 0}</td>
        <td>${user.mob_battery || 0}</td>
        <td>${user.mob_salt || 0}</td>
        <td>${user.mob_atlas || 0}</td>
        <!-- Short-term -->
        <td>${user.short_painkiller || 0}</td>
        <td>${user.short_schizoyorsh || 0}</td>
        <td>${user.short_morphine || 0}</td>
        <td>${user.short_epinephrine || 0}</td>
        <!-- Bonus -->
        <td>${user.bonus_stomp ? '✅' : '❌'}</td>
        <td>${user.bonus_strike ? '✅' : '❌'}</td>
      </tr>
    `;
  }).join('');
}

// ============================================
// UPDATE STATISTICS
// ============================================

function updateStatistics(users) {
  const totalUsers = users.length;
  const totalKills = users.reduce((sum, u) => sum + (u.kills || 0), 0);
  const totalDeaths = users.reduce((sum, u) => sum + (u.deaths || 0), 0);
  const avgKD = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : totalKills;

  document.getElementById('statTotalUsers').textContent = totalUsers;
  document.getElementById('statTotalKills').textContent = totalKills.toLocaleString();
  document.getElementById('statTotalDeaths').textContent = totalDeaths.toLocaleString();
  document.getElementById('statAvgKD').textContent = avgKD;
  document.getElementById('totalUsers').textContent = `Total Members: ${totalUsers}`;
}

// ============================================
// TOGGLE VIEWS
// ============================================

function toggleView(view) {
  currentView = view;
  
  if (view === 'stats') {
    document.getElementById('statsView').style.display = 'block';
    document.getElementById('consumablesView').style.display = 'none';
  } else {
    document.getElementById('statsView').style.display = 'none';
    document.getElementById('consumablesView').style.display = 'block';
  }
}

// ============================================
// DELETE USER
// ============================================

async function deleteUser(userId, username) {
  if (!confirm(`⚠️ DELETE MEMBER: ${username}?\n\nThis will permanently remove:\n- Account\n- All stats\n- All equipment\n- All consumables\n\nThis CANNOT be undone!`)) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      showMessage(`✓ Member "${username}" deleted successfully`, 'success');
      loadUsers();
    } else {
      showMessage('Failed to delete member', 'error');
    }
  } catch (error) {
    showMessage('Connection error', 'error');
  }
}

// ============================================
// VIEW ARTIFACT IMAGE
// ============================================

function viewImage(username, imageData) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = imageData;
  img.style.cssText = 'max-width: 90%; max-height: 90%; border: 3px solid var(--dcg-accent);';
  
  const title = document.createElement('div');
  title.textContent = `${username}'s Artifact Build`;
  title.style.cssText = `
    position: absolute;
    top: 20px;
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    text-transform: uppercase;
  `;
  
  modal.appendChild(title);
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.onclick = () => modal.remove();
}

// ============================================
// FILTER TABLES
// ============================================

function filterTable() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#statsBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

function filterConsumablesTable() {
  const searchTerm = document.getElementById('searchInput2').value.toLowerCase();
  const rows = document.querySelectorAll('#consumablesBody tr');

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
}

// ============================================
// EXPORT TO CSV
// ============================================

function exportToCSV() {
  const headers = [
    'ID', 'Username', 'In-Game Name', 'Discord', 'Role', 'Kills', 'Deaths', 'K/D',
    'Weapons', 'Armors', 'Artifact Builds', 'Joined',
    'Plantain', 'Napalm', 'Thunder', 'Frost',
    'Solyanka', 'Garlic Soup', 'Pea Soup', 'Lingonberry', 'Frosty', 'Alcobull', 'Geyser',
    'Grog', 'Strength Stim', 'Neurotonic', 'Battery', 'SALT', 'ATLAS',
    'Painkiller', 'SchizoYorsh', 'Morphine', 'Epinephrine',
    'STOMP', 'Strike'
  ];

  const csvData = allUsersData.map(user => {
    const kdRatio = user.deaths > 0 ? (user.kills / user.deaths).toFixed(2) : (user.kills || 0);
    return [
      user.id,
      user.username,
      user.ingame_name || '',
      user.discord_name || '',
      user.role,
      user.kills || 0,
      user.deaths || 0,
      kdRatio,
      user.weapons || '',
      user.armors || '',
      user.artifact_builds || '',
      new Date(user.created_at).toLocaleDateString(),
      user.nade_plantain || 0,
      user.nade_napalm || 0,
      user.nade_thunder || 0,
      user.nade_frost || 0,
      user.enh_solyanka || 0,
      user.enh_garlic_soup || 0,
      user.enh_pea_soup || 0,
      user.enh_lingonberry || 0,
      user.enh_frosty || 0,
      user.enh_alcobull || 0,
      user.enh_geyser_vodka || 0,
      user.mob_grog || 0,
      user.mob_strength_stimulator || 0,
      user.mob_neurotonic || 0,
      user.mob_battery || 0,
      user.mob_salt || 0,
      user.mob_atlas || 0,
      user.short_painkiller || 0,
      user.short_schizoyorsh || 0,
      user.short_morphine || 0,
      user.short_epinephrine || 0,
      user.bonus_stomp ? 'Yes' : 'No',
      user.bonus_strike ? 'Yes' : 'No'
    ];
  });

  let csv = headers.join(',') + '\n';
  csv += csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `team-dcg-data-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);

  showMessage('✓ Data exported successfully!', 'success');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function truncate(str, length) {
  if (!str) return '-';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

function showMessage(msg, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
  messageDiv.className = type;
  messageDiv.style.display = 'block';
  setTimeout(() => messageDiv.style.display = 'none', 4000);
}
// ============================================
// ATTACH EVENT LISTENERS TO DYNAMIC BUTTONS
// ============================================

function attachButtonListeners() {
  // Delete buttons
  document.querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const userId = this.getAttribute('data-user-id');
      const username = this.getAttribute('data-username');
      deleteUser(userId, username);
    });
  });

  // View image buttons
  document.querySelectorAll('.view-image-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const username = this.getAttribute('data-username');
      const imageData = decodeURIComponent(this.getAttribute('data-image'));
      viewImage(username, imageData);
    });
  });
}

function showError(msg) {
  showMessage('❌ ' + msg, 'error');
}

// Load data on page load
loadUsers();
// ============================================
// EVENT LISTENERS (NO INLINE HANDLERS)
// ============================================

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', loadUsers);

// Export button
document.getElementById('exportBtn').addEventListener('click', exportToCSV);

// View toggle buttons
document.getElementById('statsViewBtn').addEventListener('click', () => toggleView('stats'));
document.getElementById('consumablesViewBtn').addEventListener('click', () => toggleView('consumables'));

// Search inputs
document.getElementById('searchInput').addEventListener('keyup', filterTable);
document.getElementById('searchInput2').addEventListener('keyup', filterConsumablesTable);

// Load data on page load
loadUsers();