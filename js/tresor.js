// tresor.js
const params  = new URLSearchParams(window.location.search);
const tresorId = parseInt(params.get('id'), 10);

if (!tresorId) window.location.href = 'dashboard.html';

function formatTime(datetimeStr) {
  return new Date(datetimeStr).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m}min`;
}

function formatDecimal(seconds) {
  return (seconds / 3600).toFixed(1) + 'h';
}

function formatGoalMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function render(data) {
  const { tresor, sessions } = data;

  document.title = `${tresor.name}'s Tresor`;
  document.getElementById('tresorTitle').textContent = `${tresor.name}'s Tresor`;
  document.getElementById('tresorEmoji').textContent = tresor.emoji || '📫';

  // Status
  const statusCard = document.getElementById('statusCard');
  if (tresor.nuggi_in) {
    statusCard.classList.add('nuggi-in');
    document.getElementById('statusTitle').textContent   = 'Nuggi ist drin! 🎉';
    document.getElementById('statusSubtitle').textContent = 'Weiter so – toll gemacht!';
  } else {
    statusCard.classList.add('nuggi-out');
    document.getElementById('statusTitle').textContent   = 'Nuggi ist draußen';
    document.getElementById('statusSubtitle').textContent = 'Lege den Nuggi in den Tresor';
  }

  // Goal
  const goalSec    = tresor.goal_minutes * 60;
  const todaySec   = tresor.today_seconds;
  const fillPct    = goalSec > 0 ? Math.min((todaySec / goalSec) * 100, 100) : 0;
  const remainSec  = Math.max(goalSec - todaySec, 0);

  document.getElementById('goalNumbers').textContent =
    `${formatDecimal(todaySec)} / ${formatGoalMinutes(tresor.goal_minutes)}`;
  document.getElementById('progressFill').style.width = fillPct.toFixed(1) + '%';

  if (remainSec <= 0) {
    document.getElementById('remainingPill').textContent = '🎉 Tagesziel erreicht!';
    document.getElementById('remainingPill').classList.add('goal-reached');
  } else {
    document.getElementById('remainingPill').textContent =
      `⏱ Noch ${formatDuration(remainSec)} bis zum Ziel`;
  }

  // Sessions
  if (sessions.length === 0) {
    document.getElementById('sessionList').innerHTML =
      '<p class="empty" style="margin:0">Heute noch keine Einträge.</p>';
  } else {
    document.getElementById('sessionList').innerHTML = sessions.map((s) => {
      const start    = formatTime(s.start_time);
      const end      = s.end_time ? formatTime(s.end_time) : 'läuft noch';
      const durSec   = s.end_time
        ? (new Date(s.end_time) - new Date(s.start_time)) / 1000
        : (Date.now() - new Date(s.start_time)) / 1000;
      return `
        <div class="session-row">
          <span class="session-time">${start} – ${end}</span>
          <span class="session-dur">${formatDuration(durSec)}</span>
        </div>`;
    }).join('');
  }
}

async function loadTresor() {
  try {
    const res = await fetch(`api/tresor.php?id=${tresorId}`, { credentials: 'include' });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    const data = await res.json();
    if (data.status !== 'success') { window.location.href = 'dashboard.html'; return; }
    render(data);
  } catch (e) {
    console.error(e);
  }
}

// Verlauf toggle
document.getElementById('verlaufBtn').addEventListener('click', () => {
  const card = document.getElementById('verlaufCard');
  const btn  = document.getElementById('verlaufBtn');
  const open = card.classList.toggle('hidden');
  btn.textContent = open ? '📊  Verlauf ansehen' : '📊  Verlauf schliessen';
});

// Delete
document.getElementById('deleteBtn').addEventListener('click', async () => {
  if (!confirm(`Tresor wirklich löschen? Alle gespeicherten Daten gehen verloren.`)) return;

  try {
    const res = await fetch('api/delete-tresor.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tresorId }),
    });
    const result = await res.json();
    if (result.status === 'success') {
      window.location.href = 'dashboard.html';
    } else {
      alert(result.message || 'Fehler beim Löschen.');
    }
  } catch (e) {
    alert('Etwas ist schiefgelaufen!');
  }
});

document.getElementById('settingsBtn').addEventListener('click', () => {
  window.location.href = `edit-goal.html?id=${tresorId}`;
});

window.addEventListener('load', loadTresor);
