// edit-goal.js
const params   = new URLSearchParams(window.location.search);
const tresorId = parseInt(params.get('id'), 10);

if (!tresorId) window.location.href = 'dashboard.html';

function goBack() {
  window.location.href = `tresor.html?id=${tresorId}`;
}

document.getElementById('backBtn').addEventListener('click', goBack);
document.getElementById('cancelBtn').addEventListener('click', goBack);

function updateDisplay() {
  const h = parseInt(document.getElementById('hoursSlider').value);
  const m = parseInt(document.getElementById('minutesSlider').value);
  document.getElementById('hLabel').textContent     = h + 'h';
  document.getElementById('mLabel').textContent     = m + 'm';
  document.getElementById('timeDisplay').textContent =
    `${h}:${m.toString().padStart(2, '0')}`;
}

document.getElementById('hoursSlider').addEventListener('input', updateDisplay);
document.getElementById('minutesSlider').addEventListener('input', updateDisplay);

async function loadTresor() {
  try {
    const res  = await fetch(`api/tresor.php?id=${tresorId}`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    if (data.status !== 'success') { goBack(); return; }

    const { tresor } = data;
    document.getElementById('tresorEmoji').textContent = tresor.emoji || '📫';

    const h = Math.floor(tresor.goal_minutes / 60);
    const m = tresor.goal_minutes % 60;
    document.getElementById('hoursSlider').value   = h;
    document.getElementById('minutesSlider').value = m;
    updateDisplay();
  } catch (e) {
    console.error(e);
  }
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const h           = parseInt(document.getElementById('hoursSlider').value);
  const m           = parseInt(document.getElementById('minutesSlider').value);
  const goalMinutes = h * 60 + m;

  const btn = document.getElementById('saveBtn');
  btn.disabled    = true;
  btn.textContent = 'Wird gespeichert…';

  try {
    const res    = await fetch('api/update-goal.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tresorId, goal_minutes: goalMinutes }),
    });
    const result = await res.json();
    if (result.status === 'success') {
      goBack();
    } else {
      alert(result.message || 'Fehler beim Speichern.');
      btn.disabled    = false;
      btn.textContent = 'Ziel speichern';
    }
  } catch (e) {
    alert('Etwas ist schiefgelaufen!');
    btn.disabled    = false;
    btn.textContent = 'Ziel speichern';
  }
});

window.addEventListener('load', loadTresor);
