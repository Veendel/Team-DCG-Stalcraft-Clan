const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check authentication
if (!token) {
  window.location.href = '/login.html';
}

// Display welcome message
document.getElementById('welcomeMsg').textContent = `Welcome, ${user.username}!`;

// Show admin link if user is admin
if (user.role === 'admin') {
  const adminLink = document.getElementById('adminLink');
  adminLink.style.display = 'inline';
  adminLink.href = '/admin.html';
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
      const consumables = await response.json();
      
      // Grenades (UPDATED)
      document.getElementById('nadePlantain').value = consumables.nade_plantain || 0;
      document.getElementById('nadeNapalm').value = consumables.nade_napalm || 0;
      document.getElementById('nadeThunder').value = consumables.nade_thunder || 0;
      document.getElementById('nadeFrost').value = consumables.nade_frost || 0;
      document.getElementById('nadeTarmac').value = consumables.nade_tarmac || 0;
      document.getElementById('nadeSickness').value = consumables.nade_sickness || 0;
      document.getElementById('nadeStinky').value = consumables.nade_stinky || 0;
      
      // Enhancement
      document.getElementById('enhSolyanka').value = consumables.enh_solyanka || 0;
      document.getElementById('enhGarlicSoup').value = consumables.enh_garlic_soup || 0;
      document.getElementById('enhPeaSoup').value = consumables.enh_pea_soup || 0;
      document.getElementById('enhLingonberry').value = consumables.enh_lingonberry || 0;
      document.getElementById('enhFrosty').value = consumables.enh_frosty || 0;
      document.getElementById('enhAlcobull').value = consumables.enh_alcobull || 0;
      document.getElementById('enhGeyserVodka').value = consumables.enh_geyser_vodka || 0;
      
      // Mobility
      document.getElementById('mobGrog').value = consumables.mob_grog || 0;
      document.getElementById('mobStrengthStimulator').value = consumables.mob_strength_stimulator || 0;
      document.getElementById('mobNeurotonic').value = consumables.mob_neurotonic || 0;
      document.getElementById('mobBattery').value = consumables.mob_battery || 0;
      document.getElementById('mobSalt').value = consumables.mob_salt || 0;
      document.getElementById('mobAtlas').value = consumables.mob_atlas || 0;
      
      // Short-term
      document.getElementById('shortPainkiller').value = consumables.short_painkiller || 0;
      document.getElementById('shortSchizoyorsh').value = consumables.short_schizoyorsh || 0;
      document.getElementById('shortMorphine').value = consumables.short_morphine || 0;
      document.getElementById('shortEpinephrine').value = consumables.short_epinephrine || 0;
      
      // Bonus (now countable)
      document.getElementById('bonusStomp').value = consumables.bonus_stomp || 0;
      document.getElementById('bonusStrike').value = consumables.bonus_strike || 0;
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
      // Clear file input
      document.getElementById('artifactImage').value = '';
    } else {
      const error = await response.json();
      showMessage('❌ Failed to update equipment: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Equipment update error:', error);
    showMessage('❌ Connection error', 'error');
  }
}

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
    } else {
      showMessage('❌ Failed to update equipment', 'error');
    }
  } catch (error) {
    showMessage('❌ Connection error', 'error');
  }
}

// ============================================
// UPDATE CONSUMABLES
// ============================================

document.getElementById('consumablesForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const consumables = {
    nade_plantain: parseInt(document.getElementById('nadePlantain').value),
    nade_napalm: parseInt(document.getElementById('nadeNapalm').value),
    nade_thunder: parseInt(document.getElementById('nadeThunder').value),
    nade_frost: parseInt(document.getElementById('nadeFrost').value),
    nade_tarmac: parseInt(document.getElementById('nadeTarmac').value),
    nade_sickness: parseInt(document.getElementById('nadeSickness').value),
    nade_stinky: parseInt(document.getElementById('nadeStinky').value),
    
    enh_solyanka: parseInt(document.getElementById('enhSolyanka').value),
    enh_garlic_soup: parseInt(document.getElementById('enhGarlicSoup').value),
    enh_pea_soup: parseInt(document.getElementById('enhPeaSoup').value),
    enh_lingonberry: parseInt(document.getElementById('enhLingonberry').value),
    enh_frosty: parseInt(document.getElementById('enhFrosty').value),
    enh_alcobull: parseInt(document.getElementById('enhAlcobull').value),
    enh_geyser_vodka: parseInt(document.getElementById('enhGeyserVodka').value),
    
    mob_grog: parseInt(document.getElementById('mobGrog').value),
    mob_strength_stimulator: parseInt(document.getElementById('mobStrengthStimulator').value),
    mob_neurotonic: parseInt(document.getElementById('mobNeurotonic').value),
    mob_battery: parseInt(document.getElementById('mobBattery').value),
    mob_salt: parseInt(document.getElementById('mobSalt').value),
    mob_atlas: parseInt(document.getElementById('mobAtlas').value),
    
    short_painkiller: parseInt(document.getElementById('shortPainkiller').value),
    short_schizoyorsh: parseInt(document.getElementById('shortSchizoyorsh').value),
    short_morphine: parseInt(document.getElementById('shortMorphine').value),
    short_epinephrine: parseInt(document.getElementById('shortEpinephrine').value),
    
    bonus_stomp: parseInt(document.getElementById('bonusStomp').value),
    bonus_strike: parseInt(document.getElementById('bonusStrike').value)
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
    } else {
      showMessage('❌ Failed to update consumables', 'error');
    }
  } catch (error) {
    showMessage('❌ Connection error', 'error');
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function showMessage(msg, type = 'success') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
  messageDiv.className = type;
  messageDiv.style.display = 'block';
  setTimeout(() => messageDiv.style.display = 'none', 4000);
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
  const statusDiv = document.getElementById('clanWarStatus');
  const yesBtn = document.getElementById('registerYes');
  const noBtn = document.getElementById('registerNo');

  if (registered === true) {
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(76, 175, 80, 0.2)';
    statusDiv.style.borderLeft = '4px solid var(--dcg-success)';
    statusDiv.innerHTML = '✅ <strong>Registered:</strong> You\'re IN for today\'s clan war!';
    yesBtn.style.opacity = '1';
    noBtn.style.opacity = '0.5';
  } else if (registered === false) {
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(255, 68, 68, 0.2)';
    statusDiv.style.borderLeft = '4px solid var(--dcg-accent)';
    statusDiv.innerHTML = '❌ <strong>Not Registered:</strong> You\'re sitting out today.';
    yesBtn.style.opacity = '0.5';
    noBtn.style.opacity = '1';
  } else {
    statusDiv.style.display = 'none';
    yesBtn.style.opacity = '1';
    noBtn.style.opacity = '1';
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

// Load clan war status on page load
loadClanWarStatus();
// Load all data on page load
loadStats();
loadEquipment();
loadConsumables();