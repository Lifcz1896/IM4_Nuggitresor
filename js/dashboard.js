// dashboard.js
function formatDecimalHours(seconds) {
  return (seconds / 3600).toFixed(1) + "h";
}

function formatGoalMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function formatLiveDuration(isoStr) {
  const startMs = new Date(isoStr.replace(" ", "T")).getTime();
  const totalSecs = Math.floor((Date.now() - startMs) / 1000);
  if (totalSecs < 60) return "gerade eben";
  const mins = Math.floor(totalSecs / 60) % 60;
  const hours = Math.floor(totalSecs / 3600);
  if (hours > 0) return `${hours}h ${mins > 0 ? mins + " Min." : ""}`.trim();
  return `${mins} Min.`;
}

function updateTimers() {
  document.querySelectorAll(".session-timer[data-start]").forEach((el) => {
    el.textContent = formatLiveDuration(el.dataset.start);
  });
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
      const sessionStart = nuggiIn && t.current_session_start ? t.current_session_start : null;

      return `
        <div class="card tresor-card" onclick="window.location.href='tresor.html?id=${t.id}'" style="cursor:pointer">
          <div class="tresor-top">
            <div class="avatar">${t.emoji || "📫"}</div>
            <div class="tresor-info">
              <h2>${t.name}</h2>
              <div class="tresor-status">
                <span class="status-dot ${nuggiIn ? "in" : ""}"></span>
                <span>${nuggiIn ? "Nuggi drin" : "Nuggi draußen"}</span>
              </div>
              ${sessionStart ? `<div class="session-live-row"><span class="session-timer-icon">⏱</span><span class="session-timer" data-start="${sessionStart}">${formatLiveDuration(sessionStart)}</span></div>` : ""}
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

  updateTimers();
}

async function loadDashboard() {
  try {
    const response = await fetch("api/dashboard.php", { credentials: "include" });

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

    if (data.day_started) {
      const t = new Date(data.day_start_at.replace(" ", "T"));
      const hh = t.getHours().toString().padStart(2, "0");
      const mm = t.getMinutes().toString().padStart(2, "0");
      document.getElementById("dayStartedInfo").textContent = `🌅 Tag gestartet um ${hh}:${mm} Uhr`;
      document.getElementById("dayStartedInfo").classList.remove("hidden");
      document.getElementById("startDayCard").classList.add("hidden");
    } else {
      document.getElementById("startDayCard").classList.remove("hidden");
      document.getElementById("dayStartedInfo").classList.add("hidden");
    }

    renderTresors(data.tresors);
  } catch (error) {
    console.error("Dashboard load error:", error);
    document.getElementById("tresorList").innerHTML =
      '<p class="empty">Fehler beim Laden. Bitte Seite neu laden.</p>';
  }
}

document.getElementById("startDayBtn").addEventListener("click", async () => {
  const btn = document.getElementById("startDayBtn");
  btn.disabled = true;
  btn.textContent = "Wird gestartet…";
  try {
    const res = await fetch("api/start-day.php", { method: "POST", credentials: "include" });
    const result = await res.json();
    if (result.status === "success") loadDashboard();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Tag starten";
  }
});

document.getElementById("addTresorBtn").addEventListener("click", () => {
  window.location.href = "add-tresor.html";
});

window.addEventListener("load", () => {
  loadDashboard();
  setInterval(updateTimers, 30000);
});
