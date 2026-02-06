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

// Global variables
let allUsersData = [];
let currentView = 'stats';

// ============================================
// LOAD ALL USERS WITH COMPLETE DATA
// ============================================

async function loadUsers() {
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
    console.log('Loaded users:', users);
    
    allUsersData = users;
    
    displayStatsView(users);
    displayConsumablesView(users);
    updateStatistics(users);
    loadClanWarRegistrations();
  } catch (error) {
    console.error('Load users error:', error);
    showError('Failed to load users: ' + error.message);
    document.getElementById('statsBody').innerHTML = '<tr><td colspan="14" style="text-align:center; color:red;">Error loading data. Check console.</td></tr>';
    document.getElementById('consumablesBody').innerHTML = '<tr><td colspan="24" style="text-align:center; color:red;">Error loading data. Check console.</td></tr>';
  }
}

// ============================================
// DISPLAY STATS VIEW (WITH ROLE MANAGEMENT)
// ============================================

function displayStatsView(users) {
  const tbody = document.getElementById('statsBody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center;">No members found</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(userItem => {
    const kdRatio = userItem.deaths > 0 ? (userItem.kills / userItem.deaths).toFixed(2) : (userItem.kills || 0);
    const createdDate = new Date(userItem.created_at).toLocaleDateString();
    
    return `
      <tr data-user-id="${userItem.id}">
        <td><strong>${userItem.id}</strong></td>
        <td><strong>${userItem.username}</strong></td>
        <td>${truncateText(userItem.ingame_name, 30)}</td>
        <td>${truncateText(userItem.discord_name, 30)}</td>
        <td>
          <select class="role-select" data-user-id="${userItem.id}" data-current-role="${userItem.role}">
            <option value="user" ${userItem.role === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${userItem.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td class="text-success"><strong>${userItem.kills || 0}</strong></td>
        <td class="text-danger"><strong>${userItem.deaths || 0}</strong></td>
        <td><strong>${kdRatio}</strong></td>
        <td>${truncateText(userItem.weapons, 50)}</td>
        <td>${truncateText(userItem.armors, 50)}</td>
        <td>${truncateText(userItem.artifact_builds, 50)}</td>
        <td>${userItem.artifact_image ? `<button class="btn btn-small btn-secondary view-image-btn" data-username="${userItem.username}" data-image="${encodeURIComponent(userItem.artifact_image)}">📷 View</button>` : '-'}</td>
        <td>${createdDate}</td>
        <td>
          ${userItem.role !== 'admin' ? 
            `<button class="btn btn-danger btn-small delete-user-btn" data-user-id="${userItem.id}" data-username="${userItem.username}">🗑️</button>` 
            : '<span class="text-muted">Protected</span>'}
        </td>
      </tr>
    `;
  }).join('');

  attachButtonListeners();
  attachRoleChangeListeners();
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

  tbody.innerHTML = users.map(userItem => {
    return `
      <tr>
        <td><strong>${userItem.username}</strong></td>
        <td>${userItem.nade_plantain || 0}</td>
        <td>${userItem.nade_napalm || 0}</td>
        <td>${userItem.nade_thunder || 0}</td>
        <td>${userItem.nade_frost || 0}</td>
        <td>${userItem.enh_solyanka || 0}</td>
        <td>${userItem.enh_garlic_soup || 0}</td>
        <td>${userItem.enh_pea_soup || 0}</td>
        <td>${userItem.enh_lingonberry || 0}</td>
        <td>${userItem.enh_frosty || 0}</td>
        <td>${userItem.enh_alcobull || 0}</td>
        <td>${userItem.enh_geyser_vodka || 0}</td>
        <td>${userItem.mob_grog || 0}</td>
        <td>${userItem.mob_strength_stimulator || 0}</td>
        <td>${userItem.mob_neurotonic || 0}</td>
        <td>${userItem.mob_battery || 0}</td>
        <td>${userItem.mob_salt || 0}</td>
        <td>${userItem.mob_atlas || 0}</td>
        <td>${userItem.short_painkiller || 0}</td>
        <td>${userItem.short_schizoyorsh || 0}</td>
        <td>${userItem.short_morphine || 0}</td>
        <td>${userItem.short_epinephrine || 0}</td>
        <td>${userItem.bonus_stomp || 0}</td>
        <td>${userItem.bonus_strike || 0}</td>
      </tr>
    `;
  }).join('');
}

// ============================================
// LOAD CLAN WAR REGISTRATIONS (NEW)
// ============================================

async function loadClanWarRegistrations() {
  try {
    const response = await fetch('/api/clan-war/registrations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const registrations = await response.json();
      displayClanWarView(registrations);
    }
  } catch (error) {
    console.error('Failed to load clan war registrations:', error);
  }
}

function displayClanWarView(registrations) {
  const tbody = document.getElementById('clanWarBody');
  
  // Calculate stats
  const yesCount = registrations.filter(r => r.registered === true).length;
  const noCount = registrations.filter(r => r.registered === false).length;
  const noResponseCount = allUsersData.length - registrations.length;

  document.getElementById('warYesCount').textContent = yesCount;
  document.getElementById('warNoCount').textContent = noCount;
  document.getElementById('warNoResponseCount').textContent = noResponseCount;

  // Display all users with their registration status
  const allUsers = allUsersData.map(userItem => {
    const reg = registrations.find(r => r.id === userItem.id);
    return {
      username: userItem.username,
      ingame_name: userItem.ingame_name || '-',
      registered: reg ? reg.registered : null,
      registered_at: reg ? reg.registered_at : null
    };
  });

  if (allUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No data available</td></tr>';
    return;
  }

  tbody.innerHTML = allUsers.map(u => {
    let status, statusClass;
    
    if (u.registered === true) {
      status = '✅ YES';
      statusClass = 'text-success';
    } else if (u.registered === false) {
      status = '❌ NO';
      statusClass = 'text-danger';
    } else {
      status = '⏳ No Response';
      statusClass = 'text-muted';
    }

    const time = u.registered_at ? new Date(u.registered_at).toLocaleTimeString() : '-';

    return `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.ingame_name}</td>
        <td class="${statusClass}"><strong>${status}</strong></td>
        <td>${time}</td>
      </tr>
    `;
  }).join('');
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

// ============================================
// ROLE CHANGE LISTENERS (NEW)
// ============================================

function attachRoleChangeListeners() {
  document.querySelectorAll('.role-select').forEach(select => {
    select.addEventListener('change', async function() {
      const userId = this.getAttribute('data-user-id');
      const newRole = this.value;
      const currentRole = this.getAttribute('data-current-role');

      if (newRole === currentRole) {
        return; // No change
      }

      if (!confirm(`⚠️ Change this user's role to ${newRole.toUpperCase()}?`)) {
        this.value = currentRole; // Revert selection
        return;
      }

      try {
        const response = await fetch(`/api/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: newRole })
        });

        if (response.ok) {
          showMessage(`✓ Role updated to ${newRole}`, 'success');
          this.setAttribute('data-current-role', newRole);
          loadUsers(); // Reload to update display
        } else {
          showMessage('❌ Failed to update role', 'error');
          this.value = currentRole; // Revert
        }
      } catch (error) {
        showMessage('❌ Connection error', 'error');
        this.value = currentRole; // Revert
      }
    });
  });
}

// ============================================
// UPDATE STATISTICS
// ============================================

function updateStatistics(users) {
  const totalUsers = users.length - 1;
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
  
  // Hide all views
  document.getElementById('statsView').style.display = 'none';
  document.getElementById('consumablesView').style.display = 'none';
  document.getElementById('clanWarView').style.display = 'none';
  
  // Show selected view
  if (view === 'stats') {
    document.getElementById('statsView').style.display = 'block';
  } else if (view === 'consumables') {
    document.getElementById('consumablesView').style.display = 'block';
  } else if (view === 'clanwar') {
    document.getElementById('clanWarView').style.display = 'block';
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
    background: rgba(0,0,0,0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    cursor: pointer;
    flex-direction: column;
  `;
  
  const title = document.createElement('div');
  title.textContent = `${username}'s Artifact Build`;
  title.style.cssText = `
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 20px;
  `;
  
  const img = document.createElement('img');
  img.src = imageData;
  img.style.cssText = 'max-width: 90%; max-height: 80%; border: 3px solid var(--dcg-accent);';
  
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
    'STOMP', 'Strike', 'Clan War (Today)'
  ];

  const csvData = allUsersData.map(userItem => {
    const kdRatio = userItem.deaths > 0 ? (userItem.kills / userItem.deaths).toFixed(2) : (userItem.kills || 0);
    return [
      userItem.id,
      userItem.username,
      userItem.ingame_name || '',
      userItem.discord_name || '',
      userItem.role,
      userItem.kills || 0,
      userItem.deaths || 0,
      kdRatio,
      userItem.weapons || '',
      userItem.armors || '',
      userItem.artifact_builds || '',
      new Date(userItem.created_at).toLocaleDateString(),
      userItem.nade_plantain || 0,
      userItem.nade_napalm || 0,
      userItem.nade_thunder || 0,
      userItem.nade_frost || 0,
      userItem.enh_solyanka || 0,
      userItem.enh_garlic_soup || 0,
      userItem.enh_pea_soup || 0,
      userItem.enh_lingonberry || 0,
      userItem.enh_frosty || 0,
      userItem.enh_alcobull || 0,
      userItem.enh_geyser_vodka || 0,
      userItem.mob_grog || 0,
      userItem.mob_strength_stimulator || 0,
      userItem.mob_neurotonic || 0,
      userItem.mob_battery || 0,
      userItem.mob_salt || 0,
      userItem.mob_atlas || 0,
      userItem.short_painkiller || 0,
      userItem.short_schizoyorsh || 0,
      userItem.short_morphine || 0,
      userItem.short_epinephrine || 0,
      userItem.bonus_stomp || 0,
      userItem.bonus_strike || 0,
      userItem.clan_war_registered === true ? 'YES' : userItem.clan_war_registered === false ? 'NO' : 'No Response'
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

function truncateText(str, length) {
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

function showError(msg) {
  showMessage('❌ ' + msg, 'error');
}

// ============================================
// EVENT LISTENERS (NO INLINE HANDLERS)
// ============================================

document.getElementById('refreshBtn').addEventListener('click', loadUsers);
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('statsViewBtn').addEventListener('click', () => toggleView('stats'));
document.getElementById('consumablesViewBtn').addEventListener('click', () => toggleView('consumables'));
document.getElementById('clanWarViewBtn').addEventListener('click', () => toggleView('clanwar'));
document.getElementById('searchInput').addEventListener('keyup', filterTable);
document.getElementById('searchInput2').addEventListener('keyup', filterConsumablesTable);

// Load data on page load

loadUsers();
