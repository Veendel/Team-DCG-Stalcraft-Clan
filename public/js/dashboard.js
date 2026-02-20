const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check authentication - redirect and stop execution
if (!token) {
  window.location.href = '/login.html';
  throw new Error('No token'); // Prevent further execution
}

// Validate user object has id
if (!user || !user.id) {
  console.error('Invalid user data in localStorage');
  localStorage.clear();
  window.location.href = '/login.html';
  throw new Error('Invalid user');
}

// Display welcome message
document.getElementById('welcomeMsg').textContent = `Welcome, ${user.username || 'Member'}!`;

// Show admin link if user is admin
if (user.role === 'admin') {
  const adminLink = document.getElementById('adminLink');
  if (adminLink) {
    adminLink.style.display = 'inline';
    adminLink.href = '/admin.html';
  }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  window.location.href = '/login.html';
});

// ============================================
// LOAD PLAYER STATS
// ============================================

async function loadStats() {
  try {
    const response = await fetch(`/api/stats/${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const stats = await response.json();
      document.getElementById('ingameName').value = stats.ingame_name || '';
      document.getElementById('discordName').value = stats.discord_name || '';
      document.getElementById('kills').value = stats.kills || 0;
      document.getElementById('deaths').value = stats.deaths || 0;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// ============================================
// LOAD EQUIPMENT
// ============================================

async function loadEquipment() {
  try {
    const response = await fetch(`/api/equipment/${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const equipment = await response.json();
      document.getElementById('weapons').value = equipment.weapons || '';
      document.getElementById('armors').value = equipment.armors || '';
      document.getElementById('artifactBuilds').value = equipment.artifact_builds || '';
    }
  } catch (error) {
    console.error('Failed to load equipment:', error);
  }
}

// ============================================
// LOAD CONSUMABLES
// ============================================

async function loadConsumables() {
  try {
    const response = await fetch(`/api/consumables/${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const c = await response.json();
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = toInt(val); };
      set('nadePlantain', c.nade_plantain);
      set('nadeNapalm', c.nade_napalm);
      set('nadeThunder', c.nade_thunder);
      set('nadeFrost', c.nade_frost);
      set('nadeTarmac', c.nade_tarmac);
      set('nadeSickness', c.nade_sickness);
      set('nadeStinky', c.nade_stinky);
      set('enhSolyanka', c.enh_solyanka);
      set('enhGarlicSoup', c.enh_garlic_soup);
      set('enhPeaSoup', c.enh_pea_soup);
      set('enhLingonberry', c.enh_lingonberry);
      set('enhFrosty', c.enh_frosty);
      set('enhAlcobull', c.enh_alcobull);
      set('enhGeyserVodka', c.enh_geyser_vodka);
      set('mobGrog', c.mob_grog);
      set('mobStrengthStimulator', c.mob_strength_stimulator);
      set('mobNeurotonic', c.mob_neurotonic);
      set('mobBattery', c.mob_battery);
      set('mobSalt', c.mob_salt);
      set('mobAtlas', c.mob_atlas);
      set('shortPainkiller', c.short_painkiller);
      set('shortSchizoyorsh', c.short_schizoyorsh);
      set('shortMorphine', c.short_morphine);
      set('shortEpinephrine', c.short_epinephrine);
    }
  } catch (error) {
    console.error('Failed to load consumables:', error);
  }
}

// ============================================
// UPDATE STATS
// ============================================

document.getElementById('statsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const stats = {
    ingame_name: document.getElementById('ingameName').value,
    discord_name: document.getElementById('discordName').value,
    kills: parseInt(document.getElementById('kills').value),
    deaths: parseInt(document.getElementById('deaths').value)
  };

  try {
    const response = await fetch(`/api/stats/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stats)
    });

    if (response.ok) {
      showMessage('✓ Stats updated successfully!');
    } else {
      showMessage('❌ Failed to update stats', 'error');
    }
  } catch (error) {
    showMessage('❌ Connection error', 'error');
  }
});

// UPDATE EQUIPMENT (ENHANCED)
document.getElementById('equipmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const equipment = {
    weapons: document.getElementById('weapons').value,
    armors: document.getElementById('armors').value,
    artifact_builds: document.getElementById('artifactBuilds').value
  };

  // Handle image upload
  const imageFile = document.getElementById('artifactImage').files[0];
  
  if (imageFile) {
    // Check file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      showMessage('❌ Image too large! Maximum size is 5MB', 'error');
      return;
    }

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
      showMessage('❌ Please upload an image file', 'error');
      return;
    }

    showMessage('Uploading image...', 'success');

    const reader = new FileReader();
    reader.onload = async function(e) {
      equipment.artifact_image = e.target.result;
      await saveEquipment(equipment);
    };
    reader.onerror = function() {
      showMessage('❌ Failed to read image file', 'error');
    };
    reader.readAsDataURL(imageFile);
  } else {
    await saveEquipment(equipment);
  }
});

async function saveEquipment(equipment) {
  try {
    const response = await fetch(`/api/equipment/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(equipment)
    });

    if (response.ok) {
      showMessage('✓ Equipment updated successfully!');
      document.getElementById('artifactImage').value = '';
    } else {
      const errData = await response.json().catch(() => ({}));
      showMessage('❌ Failed to update equipment: ' + (errData.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Equipment update error:', error);
    showMessage('❌ Connection error', 'error');
  }
}

// ============================================
// UPDATE CONSUMABLES
// ============================================

// Ensures value is always an integer (never boolean)
function toInt(val) {
  if (val === true) return 1;
  if (val === false || val === null || val === undefined) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

document.getElementById('consumablesForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const consumables = {
    nade_plantain: toInt(document.getElementById('nadePlantain').value),
    nade_napalm: toInt(document.getElementById('nadeNapalm').value),
    nade_thunder: toInt(document.getElementById('nadeThunder').value),
    nade_frost: toInt(document.getElementById('nadeFrost').value),
    nade_tarmac: toInt(document.getElementById('nadeTarmac').value),
    nade_sickness: toInt(document.getElementById('nadeSickness').value),
    nade_stinky: toInt(document.getElementById('nadeStinky').value),
    
    enh_solyanka: toInt(document.getElementById('enhSolyanka').value),
    enh_garlic_soup: toInt(document.getElementById('enhGarlicSoup').value),
    enh_pea_soup: toInt(document.getElementById('enhPeaSoup').value),
    enh_lingonberry: toInt(document.getElementById('enhLingonberry').value),
    enh_frosty: toInt(document.getElementById('enhFrosty').value),
    enh_alcobull: toInt(document.getElementById('enhAlcobull').value),
    enh_geyser_vodka: toInt(document.getElementById('enhGeyserVodka').value),
    
    mob_grog: toInt(document.getElementById('mobGrog').value),
    mob_strength_stimulator: toInt(document.getElementById('mobStrengthStimulator').value),
    mob_neurotonic: toInt(document.getElementById('mobNeurotonic').value),
    mob_battery: toInt(document.getElementById('mobBattery').value),
    mob_salt: toInt(document.getElementById('mobSalt').value),
    mob_atlas: toInt(document.getElementById('mobAtlas').value),
    
    short_painkiller: toInt(document.getElementById('shortPainkiller').value),
    short_schizoyorsh: toInt(document.getElementById('shortSchizoyorsh').value),
    short_morphine: toInt(document.getElementById('shortMorphine').value),
    short_epinephrine: toInt(document.getElementById('shortEpinephrine').value)
  };

  try {
    const response = await fetch(`/api/consumables/${user.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consumables)
    });

    if (response.ok) {
      showMessage('✓ Consumables updated successfully!');
      console.log('Save successful!'); // Debug
    } else {
      const error = await response.json();
      console.error('Save failed:', error); // Debug
      showMessage('❌ Failed to update consumables', 'error');
    }
  } catch (error) {
    console.error('Connection error:', error); // Debug
    showMessage('❌ Connection error', 'error');
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function showMessage(msg, type = 'success') {
  const el = document.getElementById('message');
  el.textContent = msg;
  el.className = 'dashboard-toast dashboard-toast--visible dashboard-toast--' + (type === 'error' ? 'error' : 'success');
  el.setAttribute('aria-live', 'polite');
  setTimeout(() => el.classList.remove('dashboard-toast--visible'), 4500);
}

// ============================================
// CLAN WAR REGISTRATION (NEW)
// ============================================

async function loadClanWarStatus() {
  try {
    const response = await fetch(`/api/clan-war/status/${user.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      updateClanWarUI(data.registered);
    }
  } catch (error) {
    console.error('Failed to load clan war status:', error);
  }
}

function updateClanWarUI(registered) {
  const statusEl = document.getElementById('clanWarStatus');
  const yesBtn = document.getElementById('registerYes');
  const noBtn = document.getElementById('registerNo');
  if (!statusEl || !yesBtn || !noBtn) return;

  if (registered === true) {
    statusEl.textContent = '✅ You\'re IN for clan war!';
    statusEl.className = 'clan-war-status clan-war-status--yes';
    yesBtn.classList.add('active');
    noBtn.classList.remove('active');
  } else if (registered === false) {
    statusEl.textContent = '❌ Sitting out today';
    statusEl.className = 'clan-war-status clan-war-status--no';
    noBtn.classList.add('active');
    yesBtn.classList.remove('active');
  } else {
    statusEl.textContent = '';
    statusEl.className = 'clan-war-status';
    yesBtn.classList.remove('active');
    noBtn.classList.remove('active');
  }
}

document.getElementById('registerYes').addEventListener('click', async () => {
  await registerForClanWar(true);
});

document.getElementById('registerNo').addEventListener('click', async () => {
  await registerForClanWar(false);
});

async function registerForClanWar(registered) {
  try {
    const response = await fetch('/api/clan-war/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ registered })
    });

    if (response.ok) {
      updateClanWarUI(registered);
      showMessage(registered ? 
        '✓ You\'re registered for clan war!' : 
        '✓ Registration cancelled', 
        'success'
      );
    } else {
      showMessage('❌ Failed to update registration', 'error');
    }
  } catch (error) {
    showMessage('❌ Connection error', 'error');
  }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dashboard-tab').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.classList.add('active');
  });
});

// Load clan war status on page load
loadClanWarStatus();
loadStats();
loadEquipment();
loadConsumables();