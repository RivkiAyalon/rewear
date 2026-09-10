// עמוד מנהלת בלבד
if (!requireAdmin()) throw new Error('not admin');

// ===== רבקי — ניהול משתמשות =====

async function loadUsers() {
  const box = document.getElementById('usersTable');

  try {
    const users = await api('/api/admin/users');
    const me = getUser();

    box.innerHTML = `
      <div class="panel" style="overflow-x:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>City</th>
              <th>Points</th><th>Items</th><th>Orders</th>
              <th>Role</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td class="small muted">${u.email}</td>
                <td class="small">${u.city || '—'}</td>
                <td>${u.points}</td>
                <td>${u.products}</td>
                <td>${u.orders}</td>
                <td>
                  <span class="badge ${u.role === 'admin' ? 'badge-new' : ''}">
                    ${u.role}
                  </span>
                </td>
                <td class="row-actions">
                  ${u._id === me._id ? '<span class="small muted">You</span>' : `
                    <button class="btn btn-ghost btn-sm"
                            onclick="toggleRole('${u._id}', '${u.role}')">
                      Make ${u.role === 'admin' ? 'user' : 'admin'}
                    </button>
                    <button class="btn btn-ghost btn-sm danger-link"
                            onclick="removeUser('${u._id}', '${u.name}')">
                      Delete
                    </button>
                  `}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    box.innerHTML = `<div class="empty"><h3>Could not load users</h3></div>`;
  }
}

async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';

  try {
    await api(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole })
    });
    showToast(`Role changed to ${newRole}`, 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeUser(id, name) {
  if (!confirm(`Delete ${name}? This will also remove their available items.`)) return;

  try {
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    showToast('User deleted', 'success');
    loadUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

loadUsers();