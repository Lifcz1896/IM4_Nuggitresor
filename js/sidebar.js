// sidebar.js – desktop sidebar navigation
(function () {
  const page = location.pathname.split('/').pop().split('.')[0] || 'dashboard';

  function active(name) {
    if (name === 'dashboard' && (page === 'dashboard' || page === 'tresor')) return true;
    return page === name;
  }

  function link(href, name, label, svg) {
    return `<a href="${href}" class="sidebar-link${active(name) ? ' sidebar-link--active' : ''}">${svg}${label}</a>`;
  }

  const iconDashboard = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`;
  const iconStats    = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="8"/><rect x="10" y="8" width="4" height="12"/><rect x="17" y="4" width="4" height="16"/></svg>`;
  const iconProfile  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  const iconLogout   = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

  const el = document.createElement('aside');
  el.className = 'app-sidebar';
  el.innerHTML = `
    <div class="sidebar-brand">
      <img src="favicon.png" class="sidebar-brand-img" alt="" />
      <span class="sidebar-brand-name">Nuggi-Tresor</span>
    </div>
    <nav class="sidebar-nav">
      ${link('dashboard.html', 'dashboard', 'Dashboard', iconDashboard)}
      ${link('stats.html',     'stats',     'Statistik',  iconStats)}
      ${link('profile.html',   'profile',   'Profil',     iconProfile)}
    </nav>
    <button class="sidebar-logout-btn" id="sidebarLogoutBtn">
      ${iconLogout} Ausloggen
    </button>`;

  document.body.prepend(el);

  document.getElementById('sidebarLogoutBtn').addEventListener('click', async () => {
    try { await fetch('api/logout.php', { credentials: 'include' }); } catch (_) {}
    window.location.href = 'login.html';
  });
})();
