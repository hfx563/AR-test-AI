// Shared utilities
function toast(msg, err = false) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.style.background = err ? 'var(--red)' : 'var(--green-dark)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function fmt(ts) { return ts ? new Date(ts).toLocaleString() : '—'; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString() : '—'; }
function authHeaders() { return { 'Content-Type': 'application/json', 'x-admin-token': sessionStorage.getItem('adminToken') || '' }; }
function isAdmin() { return !!sessionStorage.getItem('adminToken'); }

function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function openModal(id) { document.getElementById(id)?.classList.add('open'); }

// Mark active nav link
document.addEventListener('DOMContentLoaded', () => {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
});
