// stats.js
const MONTHS_DE = ['Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
const DAYS_SHORT = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function toYMD(date) {
  return date.toISOString().split('T')[0];
}

function formatWeekRange(startStr, endStr) {
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  const year = e.getFullYear();
  return `${s.getDate()}. ${MONTHS_DE[s.getMonth()]} - ${e.getDate()}. ${MONTHS_DE[e.getMonth()]} ${year}`;
}

function formatGoalMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatSecondsShort(seconds) {
  if (seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
  return `${m}m`;
}

function renderStats(data) {
  document.getElementById('weekRange').textContent = formatWeekRange(data.week_start, data.week_end);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (data.tresors.length === 0) {
    document.getElementById('tresorStats').innerHTML = '<p class="empty">Noch kein Tresor vorhanden.</p>';
    return;
  }

  document.getElementById('tresorStats').innerHTML = data.tresors.map((tresor) => {
    const goalSec = tresor.goal_minutes * 60;

    const barsHtml = tresor.days.map((day) => {
      const dayDate = new Date(day.date + 'T00:00:00');
      const isToday = dayDate.getTime() === today.getTime();
      const dayLabel = DAYS_SHORT[dayDate.getDay()];
      const pct = goalSec > 0 ? Math.min((day.seconds / goalSec) * 100, 100) : 0;
      const goalReached = day.seconds >= goalSec && goalSec > 0;
      const barClass = day.seconds > 0 ? (goalReached ? 'goal-reached' : 'in-progress') : '';
      const timeLabel = formatSecondsShort(day.seconds);

      return `
        <div class="bar-col">
          <div class="bar-time-label">${timeLabel}</div>
          <div class="bar-container">
            <div class="bar ${barClass}" style="height: ${pct}%"></div>
          </div>
          <div class="bar-day-label ${isToday ? 'today' : ''}">${dayLabel}</div>
        </div>`;
    }).join('');

    return `
      <div class="tresor-stat-section">
        <div class="tresor-stat-header">
          <div class="avatar">${tresor.emoji || '📫'}</div>
          <div>
            <h2>${tresor.name}</h2>
            <p class="goal-label">Ziel: ${formatGoalMinutes(tresor.goal_minutes)} pro Tag</p>
          </div>
        </div>
        <div class="week-bars">${barsHtml}</div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot orange"></span> In Arbeit</span>
          <span class="legend-item"><span class="legend-dot green"></span> Ziel erreicht</span>
        </div>
      </div>`;
  }).join('<hr class="tresor-divider">');

  // Disable next-week button if already on current week
  const currentMonday = getWeekStart(new Date());
  document.getElementById('nextWeekBtn').disabled = toYMD(currentWeekStart) >= toYMD(currentMonday);
}

let currentWeekStart = getWeekStart(new Date());

async function loadStats() {
  try {
    const response = await fetch(`api/stats.php?week=${toYMD(currentWeekStart)}`, {
      credentials: 'include',
    });

    if (response.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await response.json();

    if (data.status !== 'success') {
      document.getElementById('weekRange').textContent = 'Fehler beim Laden';
      document.getElementById('tresorStats').innerHTML = `<p class="empty">${data.message || 'Unbekannter Fehler'}</p>`;
      return;
    }

    renderStats(data);
  } catch (error) {
    console.error('Stats load error:', error);
    document.getElementById('weekRange').textContent = 'Fehler beim Laden';
    document.getElementById('tresorStats').innerHTML = '<p class="empty">Daten konnten nicht geladen werden.</p>';
  }
}

document.getElementById('prevWeekBtn').addEventListener('click', () => {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  loadStats();
});

document.getElementById('nextWeekBtn').addEventListener('click', () => {
  const currentMonday = getWeekStart(new Date());
  if (toYMD(currentWeekStart) < toYMD(currentMonday)) {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    loadStats();
  }
});

window.addEventListener('load', loadStats);
