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
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || 0; };
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
      set('bonusStomp', c.bonus_stomp);
      set('bonusStrike', c.bonus_strike);
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

document.getElementById('consumablesForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const consumables = {
    nade_plantain: parseInt(document.getElementById('nadePlantain').value) || 0,
    nade_napalm: parseInt(document.getElementById('nadeNapalm').value) || 0,
    nade_thunder: parseInt(document.getElementById('nadeThunder').value) || 0,
    nade_frost: parseInt(document.getElementById('nadeFrost').value) || 0,
    nade_tarmac: parseInt(document.getElementById('nadeTarmac').value) || 0,
    nade_sickness: parseInt(document.getElementById('nadeSickness').value) || 0,
    nade_stinky: parseInt(document.getElementById('nadeStinky').value) || 0,
    
    enh_solyanka: parseInt(document.getElementById('enhSolyanka').value) || 0,
    enh_garlic_soup: parseInt(document.getElementById('enhGarlicSoup').value) || 0,
    enh_pea_soup: parseInt(document.getElementById('enhPeaSoup').value) || 0,
    enh_lingonberry: parseInt(document.getElementById('enhLingonberry').value) || 0,
    enh_frosty: parseInt(document.getElementById('enhFrosty').value) || 0,
    enh_alcobull: parseInt(document.getElementById('enhAlcobull').value) || 0,
    enh_geyser_vodka: parseInt(document.getElementById('enhGeyserVodka').value) || 0,
    
    mob_grog: parseInt(document.getElementById('mobGrog').value) || 0,
    mob_strength_stimulator: parseInt(document.getElementById('mobStrengthStimulator').value) || 0,
    mob_neurotonic: parseInt(document.getElementById('mobNeurotonic').value) || 0,
    mob_battery: parseInt(document.getElementById('mobBattery').value) || 0,
    mob_salt: parseInt(document.getElementById('mobSalt').value) || 0,
    mob_atlas: parseInt(document.getElementById('mobAtlas').value) || 0,
    
    short_painkiller: parseInt(document.getElementById('shortPainkiller').value) || 0,
    short_schizoyorsh: parseInt(document.getElementById('shortSchizoyorsh').value) || 0,
    short_morphine: parseInt(document.getElementById('shortMorphine').value) || 0,
    short_epinephrine: parseInt(document.getElementById('shortEpinephrine').value) || 0,
    
    // CRITICAL: Make sure these are integers, not booleans!
    bonus_stomp: parseInt(document.getElementById('bonusStomp').value) || 0,
    bonus_strike: parseInt(document.getElementById('bonusStrike').value) || 0
  };

  console.log('Saving STOMP:', consumables.bonus_stomp); // Debug
  console.log('Saving STRIKE:', consumables.bonus_strike); // Debug

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