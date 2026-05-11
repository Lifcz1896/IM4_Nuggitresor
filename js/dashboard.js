// dashboard.js
function formatDecimalHours(seconds) {
  return (seconds / 3600).toFixed(1) + "h";
}

function formatGoalMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function renderTresors(tresors) {
  const list = document.getElementById("tresorList");

  if (tresors.length === 0) {
    list.innerHTML = '<p class="empty">Noch kein Tresor vorhanden.<br>Füge deinen ersten hinzu!</p>';
    return;
  }

  list.innerHTML = tresors
    .map((t) => {
      const seconds = parseInt(t.today_seconds, 10);
      const nuggiIn = parseInt(t.nuggi_in, 10) === 1;
      const goalSec = (t.goal_minutes || 240) * 60;
      const fillPct = Math.min((seconds / goalSec) * 100, 100).toFixed(1);

      return `
        <div class="card tresor-card">
          <div class="tresor-top">
            <div class="avatar">${t.emoji || '📫'}</div>
            <div class="tresor-info">
              <h2>${t.name}</h2>
              <div class="tresor-status">
                <span class="status-dot ${nuggiIn ? "in" : ""}"></span>
                ${nuggiIn ? "Nuggi drin" : "Nuggi draußen"}
              </div>
            </div>
          </div>
          <div class="tresor-bottom">
            <div class="tresor-time-row">
              <span>Heute</span>
              <span>${formatDecimalHours(seconds)} / ${formatGoalMinutes(t.goal_minutes || 240)}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${fillPct}%"></div>
            </div>
          </div>
        </div>`;
    })
    .join("");
}

async function loadDashboard() {
  try {
    const response = await fetch("api/dashboard.php", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "login.html";
      return;
    }

    const data = await response.json();

    const name =
      data.user.firstname && data.user.lastname
        ? `Hallo, ${data.user.firstname} ${data.user.lastname}!`
        : `Hallo, ${data.user.email}!`;
    document.getElementById("userName").textContent = name;

    renderTresors(data.tresors);
  } catch (error) {
    console.error("Dashboard load error:", error);
    document.getElementById("tresorList").innerHTML =
      '<p class="empty">Fehler beim Laden. Bitte Seite neu laden.</p>';
  }
}

document.getElementById("addTresorBtn").addEventListener("click", () => {
  window.location.href = "add-tresor.html";
});

window.addEventListener("load", loadDashboard);
