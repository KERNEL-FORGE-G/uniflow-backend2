const API_BASE = '/api/v1';
let token = localStorage.getItem('uniflow_admin_token') || null;

let currentTableKey = null;
let currentTableSchema = null;
let currentTableData = null;
let currentPage = 1;
let currentPageSize = 15;
let currentSearch = '';
let editingRecordId = null;

// Group Icons map for sidebar
const GROUP_ICONS = {
  'Identité & Utilisateurs': 'fa-id-card text-blue-400',
  'Structure académique': 'fa-sitemap text-indigo-400',
  'Semestres, UE, Inscriptions': 'fa-book text-purple-400',
  'Planification': 'fa-calendar-days text-amber-400',
  'Présences': 'fa-clock text-cyan-400',
  'Visioconférence': 'fa-video text-rose-400',
  'Notifications': 'fa-bell text-teal-400',
  'Fichiers': 'fa-paperclip text-slate-400',
};

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json.message || json.error?.message || (typeof json.error === 'string' ? json.error : 'Une erreur est survenue');
    throw new Error(errorMsg);
  }
  return json.data !== undefined ? json.data : json;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-box');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-xl shadow-xl text-xs font-semibold text-white flex items-center gap-3 transition-all transform translate-y-2 opacity-0 pointer-events-auto ${
    type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
  }`;

  const icon = document.createElement('i');
  icon.className = `fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'} text-base`;

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function login() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const msgBox = document.getElementById('login-msg');
  const btn = document.getElementById('login-btn');

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    msgBox.innerHTML = `<div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium mt-3">Veuillez remplir l'email et le mot de passe.</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Connexion...</span>`;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || json.message || 'Identifiants invalides');

    const authData = json.data || json;
    token = authData.accessToken;
    localStorage.setItem('uniflow_admin_token', token);

    // Update current user display
    if (authData.user) {
      document.getElementById('user-email').textContent = authData.user.email;
      document.getElementById('user-role').textContent = authData.user.role;
    }

    showToast('Connexion réussie !', 'success');
    boot();
  } catch (err) {
    msgBox.innerHTML = `<div class="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium mt-3">${err.message}</div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Connexion sécurisée</span> <i class="fa-solid fa-arrow-right"></i>`;
  }
}

function logout() {
  localStorage.removeItem('uniflow_admin_token');
  token = null;
  location.reload();
}

async function boot() {
  document.getElementById('login-box').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Verify auth / user details
  try {
    const me = await api('/auth/me');
    if (me) {
      document.getElementById('user-email').textContent = me.email || 'Admin';
      document.getElementById('user-role').textContent = me.role || 'ADMIN';
    }
  } catch (e) {
    console.warn("User info fetch warn:", e);
  }

  try {
    const tables = await api('/admin-tool/tables');
    renderSidebar(tables);
    showDashboard();
  } catch (err) {
    alert('Accès refusé : ' + err.message + ' (Rôle ADMIN ou SUPER_ADMIN requis)');
    logout();
  }
}

function showDashboard() {
  currentTableKey = null;
  document.getElementById('view-dashboard').classList.remove('hidden');
  document.getElementById('view-table').classList.add('hidden');

  document.querySelectorAll('#sidebar button').forEach(b => {
    b.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
    b.classList.add('hover:bg-slate-800', 'text-slate-300');
  });
  const dashBtn = document.getElementById('btn-nav-dashboard');
  if (dashBtn) {
    dashBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-brand-600 text-white shadow-md shadow-brand-600/20 mb-4';
  }

  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const stats = await api('/admin-tool/stats');
    document.getElementById('stat-users').textContent = stats.usersCount ?? 0;
    document.getElementById('stat-students').textContent = stats.studentsCount ?? 0;
    document.getElementById('stat-teachers').textContent = stats.teachersCount ?? 0;
    document.getElementById('stat-ue').textContent = stats.ueCount ?? 0;
    document.getElementById('stat-courses').textContent = stats.coursesCount ?? 0;
    document.getElementById('stat-classrooms').textContent = stats.classroomsCount ?? 0;
    document.getElementById('stat-sessions').textContent = stats.sessionsCount ?? 0;
    document.getElementById('stat-notifications').textContent = stats.notificationsCount ?? 0;
  } catch (e) {
    console.error("Dashboard stats error:", e);
  }
}

function renderSidebar(tables) {
  const groups = {};
  tables.forEach(t => {
    (groups[t.group] ||= []).push(t);
  });

  const container = document.getElementById('table-list');
  container.innerHTML = '';

  Object.entries(groups).forEach(([groupName, items]) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'space-y-1';

    const groupHeader = document.createElement('div');
    groupHeader.className = 'text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5 flex items-center gap-2';
    const iconClass = GROUP_ICONS[groupName] || 'fa-folder text-slate-400';
    groupHeader.innerHTML = `<i class="fa-solid ${iconClass} text-xs"></i> <span>${groupName}</span>`;
    groupDiv.appendChild(groupHeader);

    items.forEach(table => {
      const btn = document.createElement('button');
      btn.dataset.key = table.key;
      btn.className = 'w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-between group';
      btn.innerHTML = `<span>${table.label}</span> <i class="fa-solid fa-chevron-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>`;
      btn.addEventListener('click', () => selectTableKey(table.key, btn));
      groupDiv.appendChild(btn);
    });

    container.appendChild(groupDiv);
  });
}

async function selectTableKey(key, btnEl) {
  currentTableKey = key;
  currentPage = 1;
  currentSearch = '';
  document.getElementById('search-input').value = '';

  // Toggle views
  document.getElementById('view-dashboard').classList.add('hidden');
  document.getElementById('view-table').classList.remove('hidden');

  // Highlight active sidebar button
  document.querySelectorAll('#sidebar button').forEach(b => {
    b.classList.remove('bg-brand-600', 'text-white', 'shadow-md');
    b.classList.add('hover:bg-slate-800', 'text-slate-300');
  });

  const activeBtn = btnEl || document.querySelector(`#sidebar button[data-key="${key}"]`);
  if (activeBtn) {
    activeBtn.className = 'w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-between';
  }

  // Fetch schema
  try {
    currentTableSchema = await api(`/admin-tool/tables/${key}/schema`);
    document.getElementById('table-title').textContent = currentTableSchema.label;
    document.getElementById('table-subtitle').textContent = `Gestion des enregistrements de la table ${currentTableSchema.label} (${key})`;
    await loadTableData();
  } catch (err) {
    showToast(`Erreur chargement table: ${err.message}`, 'error');
  }
}

async function loadTableData() {
  if (!currentTableKey) return;
  const tbody = document.getElementById('table-tbody');
  tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-xl text-brand-600 mb-2"></i><div>Chargement des données...</div></td></tr>`;

  try {
    const data = await api(`/admin-tool/tables/${currentTableKey}/data?page=${currentPage}&pageSize=${currentPageSize}&search=${encodeURIComponent(currentSearch)}`);
    currentTableData = data;
    renderTableGrid(data);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-rose-500 font-semibold"><i class="fa-solid fa-triangle-exclamation text-xl mb-2"></i><div>${err.message}</div></td></tr>`;
  }
}

function renderTableGrid(data) {
  const countBadge = document.getElementById('table-record-count');
  countBadge.textContent = `${data.total} enregistrement${data.total > 1 ? 's' : ''}`;

  const fields = currentTableSchema ? currentTableSchema.fields : [];
  const thead = document.getElementById('table-thead');

  // Construct table headers
  let thHtml = '<tr>';
  thHtml += `<th class="p-4 w-12 text-center">#</th>`;
  fields.forEach(f => {
    thHtml += `<th class="p-4">${f.label}</th>`;
  });
  thHtml += `<th class="p-4 font-extrabold">Créé le</th>`;
  thHtml += `<th class="p-4 text-right">Actions</th>`;
  thHtml += '</tr>';
  thead.innerHTML = thHtml;

  const tbody = document.getElementById('table-tbody');
  if (!data.records || data.records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${fields.length + 3}" class="p-8 text-center text-slate-400"><i class="fa-solid fa-folder-open text-2xl mb-2 opacity-50"></i><div>Aucun enregistrement trouvé.</div></td></tr>`;
    updatePaginationUI(data);
    return;
  }

  let rowsHtml = '';
  data.records.forEach((row, idx) => {
    const rowNum = (data.page - 1) * data.pageSize + idx + 1;
    rowsHtml += `<tr class="hover:bg-slate-50/80 transition-colors">`;
    rowsHtml += `<td class="p-4 text-center font-semibold text-slate-400 text-[11px]">${rowNum}</td>`;

    fields.forEach(f => {
      const val = row[f.name];
      rowsHtml += `<td class="p-4">${formatTableCell(val, f, row)}</td>`;
    });

    // CreatedAt
    const createdAtStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    rowsHtml += `<td class="p-4 text-[11px] text-slate-500">${createdAtStr}</td>`;

    // Actions column
    rowsHtml += `<td class="p-4 text-right">
      <div class="flex items-center justify-end gap-1.5">
        <button onclick="openDetailModal('${row.id}')" class="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all" title="Détails">
          <i class="fa-solid fa-eye text-xs"></i>
        </button>
        <button onclick="openEditModal('${row.id}')" class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Éditer">
          <i class="fa-solid fa-pen text-xs"></i>
        </button>
        <button onclick="deleteRecord('${row.id}')" class="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Supprimer">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </div>
    </td>`;

    rowsHtml += `</tr>`;
  });

  tbody.innerHTML = rowsHtml;
  updatePaginationUI(data);
}

function formatTableCell(val, field, row) {
  if (val === null || val === undefined) return '<span class="text-slate-300 italic">—</span>';

  if (field.type === 'boolean') {
    return val
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]"><i class="fa-solid fa-check"></i> Oui</span>'
      : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold text-[10px]"><i class="fa-solid fa-xmark"></i> Non</span>';
  }

  if (field.type === 'enum') {
    const color = val === 'SUPER_ADMIN' || val === 'ACTIVE' || val === 'VALIDATED' ? 'bg-emerald-100 text-emerald-800'
      : val === 'ADMIN' || val === 'PENDING' ? 'bg-amber-100 text-amber-800'
      : val === 'REJECTED' || val === 'SUSPENDED' ? 'bg-rose-100 text-rose-800'
      : 'bg-blue-100 text-blue-800';
    return `<span class="px-2 py-0.5 rounded-md font-bold text-[10px] ${color}">${val}</span>`;
  }

  if (field.type === 'foreignKey' && field.options) {
    const opt = field.options.find(o => String(o.value) === String(val));
    if (opt) {
      return `<span class="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md text-[11px]">${opt.label}</span>`;
    }
  }

  if (field.type === 'password' || field.type === 'secret') {
    return `<span class="text-slate-400 font-mono text-[10px]">••••••••</span>`;
  }

  if (field.type === 'date' || field.type === 'datetime') {
    return `<span class="text-slate-600 text-[11px]">${new Date(val).toLocaleDateString('fr-FR')}</span>`;
  }

  const str = String(val);
  if (str.length > 35) {
    return `<span title="${str}">${str.substring(0, 35)}...</span>`;
  }
  return `<span class="font-medium text-slate-800">${str}</span>`;
}

function updatePaginationUI(data) {
  const start = data.total === 0 ? 0 : (data.page - 1) * data.pageSize + 1;
  const end = Math.min(data.page * data.pageSize, data.total);
  document.getElementById('pagination-info').textContent = `Affichage ${start} à ${end} sur ${data.total} résultats`;
  document.getElementById('pagination-page-num').textContent = `Page ${data.page} / ${data.totalPages || 1}`;

  document.getElementById('btn-prev-page').disabled = data.page <= 1;
  document.getElementById('btn-next-page').disabled = data.page >= data.totalPages;
}

function changePage(delta) {
  currentPage += delta;
  if (currentPage < 1) currentPage = 1;
  loadTableData();
}

function changePageSize(size) {
  currentPageSize = parseInt(size, 10);
  currentPage = 1;
  loadTableData();
}

function handleSearchKeyUp(event) {
  if (event.key === 'Enter') {
    currentSearch = event.target.value;
    currentPage = 1;
    loadTableData();
  }
}

function reloadCurrentTable() {
  loadTableData();
  showToast('Données actualisées', 'success');
}

// MODAL FORM RENDERING (CREATE & EDIT)
function openCreateModal() {
  if (!currentTableSchema) return;
  editingRecordId = null;
  document.getElementById('modal-form-title').textContent = `Nouveau ${currentTableSchema.label}`;
  renderFormFields({});
  document.getElementById('modal-form').classList.remove('hidden');
}

async function openEditModal(id) {
  if (!currentTableSchema) return;
  editingRecordId = id;
  document.getElementById('modal-form-title').textContent = `Modifier ${currentTableSchema.label} (#${id.substring(0, 8)})`;

  try {
    const record = await api(`/admin-tool/tables/${currentTableKey}/data/${id}`);
    renderFormFields(record);
    document.getElementById('modal-form').classList.remove('hidden');
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  }
}

function closeModalForm() {
  document.getElementById('modal-form').classList.add('hidden');
}

function renderFormFields(initialData = {}) {
  const form = document.getElementById('dynamic-form');
  form.innerHTML = '';

  currentTableSchema.fields.forEach(f => {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'space-y-1';

    const label = document.createElement('label');
    label.className = 'block text-xs font-bold uppercase tracking-wider text-slate-700';
    label.innerHTML = `${f.label} ${f.required ? '<span class="text-rose-500">*</span>' : '<span class="text-slate-400 text-[10px] font-normal">(Optionnel)</span>'}`;
    fieldWrapper.appendChild(label);

    let input;
    const existingVal = initialData[f.name];

    if (f.type === 'foreignKey') {
      input = document.createElement('select');
      input.name = f.name;
      input.className = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

      const placeholderOpt = document.createElement('option');
      placeholderOpt.value = '';
      placeholderOpt.textContent = '— Choisir un enregistrement —';
      input.appendChild(placeholderOpt);

      (f.options || []).forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        if (existingVal !== undefined && String(existingVal) === String(opt.value)) {
          optionEl.selected = true;
        }
        input.appendChild(optionEl);
      });

      if (!f.options || f.options.length === 0) {
        placeholderOpt.textContent = 'Aucune donnée disponible dans la table liée';
      }
    } else if (f.type === 'enum') {
      input = document.createElement('select');
      input.name = f.name;
      input.className = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

      (f.enumValues || []).forEach(v => {
        const optionEl = document.createElement('option');
        optionEl.value = v;
        optionEl.textContent = v;
        if (existingVal === v || (!existingVal && v === f.defaultValue)) {
          optionEl.selected = true;
        }
        input.appendChild(optionEl);
      });
    } else if (f.type === 'boolean') {
      input = document.createElement('select');
      input.name = f.name;
      input.className = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

      const optTrue = document.createElement('option');
      optTrue.value = 'true'; optTrue.textContent = 'Oui (Vrai)';
      const optFalse = document.createElement('option');
      optFalse.value = 'false'; optFalse.textContent = 'Non (Faux)';

      input.appendChild(optTrue);
      input.appendChild(optFalse);

      const boolVal = existingVal !== undefined ? existingVal : f.defaultValue;
      if (boolVal === true || boolVal === 'true') optTrue.selected = true;
      else optFalse.selected = true;
    } else if (f.type === 'text') {
      input = document.createElement('textarea');
      input.name = f.name;
      input.rows = 3;
      input.className = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';
      if (existingVal !== undefined) input.value = existingVal;
    } else {
      input = document.createElement('input');
      input.name = f.name;
      input.className = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500';

      input.type = (f.type === 'password' || f.type === 'secret') ? 'password'
        : f.type === 'int' ? 'number'
        : f.type === 'date' ? 'date'
        : f.type === 'datetime' ? 'datetime-local'
        : 'text';

      if (editingRecordId && (f.type === 'password' || f.type === 'secret')) {
        input.placeholder = 'Laissez vide pour conserver le secret actuel';
      } else if (existingVal !== undefined) {
        if (f.type === 'date' && existingVal) {
          input.value = new Date(existingVal).toISOString().split('T')[0];
        } else {
          input.value = existingVal;
        }
      } else if (f.defaultValue !== undefined) {
        input.value = f.defaultValue;
      }
    }

    if (f.required && !editingRecordId) input.required = true;
    fieldWrapper.appendChild(input);
    form.appendChild(fieldWrapper);
  });
}

async function submitModalForm() {
  const form = document.getElementById('dynamic-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    if (editingRecordId) {
      await api(`/admin-tool/tables/${currentTableKey}/data/${editingRecordId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      showToast('Enregistrement mis à jour avec succès', 'success');
    } else {
      await api(`/admin-tool/tables/${currentTableKey}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showToast('Enregistrement créé avec succès', 'success');
    }
    closeModalForm();
    loadTableData();
  } catch (err) {
    showToast(`Échec : ${err.message}`, 'error');
  }
}

async function deleteRecord(id) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer cet enregistrement (#${id.substring(0, 8)}) ?`)) return;

  try {
    await api(`/admin-tool/tables/${currentTableKey}/data/${id}`, { method: 'DELETE' });
    showToast('Enregistrement supprimé avec succès', 'success');
    loadTableData();
  } catch (err) {
    showToast(`Erreur : ${err.message}`, 'error');
  }
}

async function openDetailModal(id) {
  const container = document.getElementById('modal-detail-content');
  container.innerHTML = '<div class="text-center p-6 text-slate-400"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>Chargement des détails...</div></div>';
  document.getElementById('modal-detail').classList.remove('hidden');

  try {
    const record = await api(`/admin-tool/tables/${currentTableKey}/data/${id}`);
    let html = '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
    Object.entries(record).forEach(([key, val]) => {
      let displayVal = val;
      if (val === null || val === undefined) displayVal = '<span class="text-slate-300 italic">null</span>';
      else if (typeof val === 'object') displayVal = `<pre class="bg-slate-900 text-emerald-400 p-2 rounded-lg text-[10px] overflow-x-auto">${JSON.stringify(val, null, 2)}</pre>`;
      else if (typeof val === 'boolean') displayVal = val ? 'True' : 'False';

      html += `<div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${key}</div>
        <div class="text-xs font-medium text-slate-800 mt-1 break-all">${displayVal}</div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div class="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">${err.message}</div>`;
  }
}

function closeModalDetail() {
  document.getElementById('modal-detail').classList.add('hidden');
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('logout-btn').addEventListener('click', logout);

  // Press Enter to login
  ['login-email', 'login-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') login();
    });
  });

  if (token) {
    boot();
  }
});
