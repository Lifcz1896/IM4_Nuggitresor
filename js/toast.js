// toast.js – shared notification utilities

function showToast(message, type = 'error') {
  const existing = document.getElementById('app-toast');
  if (existing) {
    clearTimeout(existing._hideTimer);
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `app-toast app-toast--${type}`;
  toast.innerHTML = `
    <span class="app-toast__icon">${type === 'success' ? '✓' : '!'}</span>
    <span class="app-toast__msg">${message}</span>`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('app-toast--show'));
  });

  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('app-toast--show');
    setTimeout(() => toast.remove(), 380);
  }, 3200);
}

function showConfirm(message, onConfirm) {
  const existing = document.getElementById('app-confirm');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'app-confirm';
  overlay.className = 'app-confirm-overlay';
  overlay.innerHTML = `
    <div class="app-confirm-sheet">
      <div class="app-confirm-handle"></div>
      <p class="app-confirm-msg">${message}</p>
      <div class="app-confirm-actions">
        <button class="app-confirm-btn app-confirm-btn--delete">Löschen</button>
        <button class="app-confirm-btn app-confirm-btn--cancel">Abbrechen</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => overlay.classList.add('app-confirm--show'));
  });

  function close() {
    overlay.classList.remove('app-confirm--show');
    setTimeout(() => overlay.remove(), 360);
  }

  overlay.querySelector('.app-confirm-btn--cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  overlay.querySelector('.app-confirm-btn--delete').addEventListener('click', () => {
    close();
    onConfirm();
  });
}
