const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Check authentication
if (!token) {
  window.location.href = '/login.html';
  throw new Error('No token');
}

// Only member and admin can access clan strats; user role goes to user.html
if (user.role === 'user') {
  window.location.href = '/user.html';
  throw new Error('Not a clan member');
}

// Show admin upload section if user is admin
if (user.role === 'admin') {
  document.getElementById('adminUploadSection').style.display = 'block';
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
// LOAD CLAN STRATS
// ============================================

async function loadStrats() {
  try {
    const response = await fetch('/api/clan-strats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const strats = await response.json();
      displayStrats(strats);
    } else {
      showError('Failed to load strategies');
    }
  } catch (error) {
    console.error('Load strats error:', error);
    showError('Connection error');
  }
}

function displayStrats(strats) {
  const gallery = document.getElementById('stratsGallery');

  if (strats.length === 0) {
    gallery.innerHTML = '<p style="text-align: center; color: var(--dcg-text-dim);">No strategies uploaded yet.</p>';
    return;
  }

  gallery.innerHTML = strats.map(strat => `
    <div class="strat-card">
      <img src="${strat.image_data}" alt="${strat.title}" class="strat-image" onclick="viewStratImage('${strat.title}', '${encodeURIComponent(strat.image_data)}')">
      <div class="strat-info">
        <h3>${strat.title}</h3>
        ${strat.description ? `<p>${strat.description}</p>` : ''}
        <div class="strat-meta">
          <span>📤 ${strat.uploaded_by}</span>
          <span>🕐 ${new Date(strat.uploaded_at).toLocaleDateString()}</span>
        </div>
        ${user.role === 'admin' ? `
          <button class="btn btn-danger btn-small delete-strat-btn" data-strat-id="${strat.id}">🗑️ Delete</button>
        ` : ''}
      </div>
    </div>
  `).join('');

  // Attach delete button listeners
  if (user.role === 'admin') {
    document.querySelectorAll('.delete-strat-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const stratId = this.getAttribute('data-strat-id');
        deleteStrat(stratId);
      });
    });
  }
}

// ============================================
// UPLOAD STRAT (ADMIN ONLY)
// ============================================

if (user.role === 'admin') {
  document.getElementById('uploadStratForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('stratTitle').value;
    const description = document.getElementById('stratDescription').value;
    const imageFile = document.getElementById('stratImage').files[0];

    if (!imageFile) {
      showMessage('❌ Please select an image', 'error');
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      showMessage('❌ Image too large! Maximum size is 5MB', 'error');
      return;
    }

    showMessage('Uploading strategy...', 'success');

    const reader = new FileReader();
    reader.onload = async function(e) {
      const image_data = e.target.result;

      try {
        const response = await fetch('/api/clan-strats', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image_data, title, description })
        });

        if (response.ok) {
          showMessage('✓ Strategy uploaded successfully!', 'success');
          document.getElementById('uploadStratForm').reset();
          loadStrats(); // Reload gallery
        } else {
          showMessage('❌ Failed to upload strategy', 'error');
        }
      } catch (error) {
        showMessage('❌ Connection error', 'error');
      }
    };

    reader.readAsDataURL(imageFile);
  });
}

// ============================================
// DELETE STRAT (ADMIN ONLY)
// ============================================

async function deleteStrat(stratId) {
  if (!confirm('⚠️ Delete this strategy? This cannot be undone!')) {
    return;
  }

  try {
    const response = await fetch(`/api/clan-strats/${stratId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      showMessage('✓ Strategy deleted successfully', 'success');
      loadStrats();
    } else {
      showMessage('❌ Failed to delete strategy', 'error');
    }
  } catch (error) {
    showMessage('❌ Connection error', 'error');
  }
}

// ============================================
// VIEW STRAT IMAGE (FULL SCREEN)
// ============================================

function viewStratImage(title, imageData) {
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
  
  const titleDiv = document.createElement('div');
  titleDiv.textContent = title;
  titleDiv.style.cssText = `
    color: white;
    font-size: 1.5em;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 20px;
    text-align: center;
  `;
  
  const img = document.createElement('img');
  img.src = decodeURIComponent(imageData);
  img.style.cssText = 'max-width: 90%; max-height: 80%; border: 3px solid var(--dcg-accent);';
  
  modal.appendChild(titleDiv);
  modal.appendChild(img);
  document.body.appendChild(modal);
  
  modal.onclick = () => modal.remove();
}

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

function showError(msg) {
  showMessage('❌ ' + msg, 'error');
}

// Load strategies on page load
loadStrats();