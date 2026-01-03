/* ---------- DOM Elements ---------- */
const groupsContainer = document.getElementById("groupsContent");
const createGroupBtn = document.getElementById("createGroupBtn");
const groupModal = document.getElementById("groupModal");
const cancelGroupBtn = document.getElementById("cancelGroupBtn");
const groupForm = document.getElementById("groupForm");
const modalTitle = document.getElementById("modalTitle");
const groupNameInput = document.getElementById("groupName");
const groupIdInput = document.getElementById("groupId");

// Dropdown elements
const usersDropdownHeader = document.getElementById("usersDropdownHeader");
const usersDropdownList = document.getElementById("usersDropdownList");
const usersOptions = document.getElementById("usersOptions");
const searchUsersInput = document.getElementById("searchUsers");
const selectedUsersContainer = document.getElementById("selectedUsers");

const hostsDropdownHeader = document.getElementById("hostsDropdownHeader");
const hostsDropdownList = document.getElementById("hostsDropdownList");
// YEH CHANGE KARNA HAI - dashboard modal ka element groups page mein nahi hai
// const hostsOptions = document.getElementById("hostsOptions");
const searchHostsInput = document.getElementById("searchHosts");
const selectedHostsContainer = document.getElementById("selectedHosts");

// View modal elements
const viewUsersModal = document.getElementById("viewUsersModal");
const viewUsersTitle = document.getElementById("viewUsersTitle");
const groupUsersList = document.getElementById("groupUsersList");
const closeViewUsersBtn = document.getElementById("closeViewUsersBtn");
const closeUsersModalBtn = document.getElementById("closeUsersModalBtn");

/* ---------- GLOBAL STATE ---------- */
let isEditMode = false;
let selectedUserIds = new Set();
let selectedHostIds = new Set();

/* ---------- INITIALIZE MODALS ---------- */
const initializeModals = () => {
  // Close group modal on cancel
  if (cancelGroupBtn) {
    cancelGroupBtn.addEventListener("click", () => {
      groupModal.classList.add("hidden");
      resetGroupForm();
    });
  }

  // Close view users modal
  if (closeViewUsersBtn) {
    closeViewUsersBtn.addEventListener("click", () => {
      viewUsersModal.classList.add("hidden");
    });
  }

  // Close view users modal with footer button
  if (closeUsersModalBtn) {
    closeUsersModalBtn.addEventListener("click", () => {
      viewUsersModal.classList.add("hidden");
    });
  }

  // Close group modal with X button
  const closeGroupModalBtn = document.getElementById("closeGroupModal");
  if (closeGroupModalBtn) {
    closeGroupModalBtn.addEventListener("click", () => {
      groupModal.classList.add("hidden");
      resetGroupForm();
    });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === groupModal) {
      groupModal.classList.add("hidden");
      resetGroupForm();
    }
    if (e.target === viewUsersModal) {
      viewUsersModal.classList.add("hidden");
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      groupModal.classList.add("hidden");
      resetGroupForm();
      viewUsersModal.classList.add("hidden");
    }
  });
};

/* ---------- DROPDOWN FUNCTIONS ---------- */
const initializeDropdowns = () => {
  // Users dropdown
  if (usersDropdownHeader) {
    usersDropdownHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      usersDropdownList.classList.toggle('hidden');
      hostsDropdownList.classList.add('hidden');
    });
  }

  // Hosts dropdown
  if (hostsDropdownHeader) {
    hostsDropdownHeader.addEventListener('click', (e) => {
      e.stopPropagation();
      hostsDropdownList.classList.toggle('hidden');
      usersDropdownList.classList.add('hidden');
    });
  }

  // Search functionality
  if (searchUsersInput) {
    searchUsersInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterOptions(usersOptions, searchTerm);
    });
  }

  if (searchHostsInput) {
    searchHostsInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const hostsOptions = document.getElementById('hostsOptions');
      if (hostsOptions) {
        filterOptions(hostsOptions, searchTerm);
      }
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!usersDropdownHeader?.contains(e.target) && !usersDropdownList?.contains(e.target)) {
      usersDropdownList?.classList.add('hidden');
    }
    if (!hostsDropdownHeader?.contains(e.target) && !hostsDropdownList?.contains(e.target)) {
      hostsDropdownList?.classList.add('hidden');
    }
  });
};

const filterOptions = (container, searchTerm) => {
  if (!container) return;
  const options = container.querySelectorAll('.dropdown-option');
  options.forEach(option => {
    const label = option.querySelector('label').textContent.toLowerCase();
    option.style.display = label.includes(searchTerm) ? 'flex' : 'none';
  });
};

/* ---------- CREATE OPTION ELEMENT ---------- */
const createOptionElement = (id, name, type, isSelected = false) => {
  const div = document.createElement('div');
  div.className = 'dropdown-option';

  const checkboxId = `${type}-${id}`;
  div.innerHTML = `
    <input type="checkbox" id="${checkboxId}" value="${id}" ${isSelected ? 'checked' : ''}>
    <label for="${checkboxId}">${name}</label>
  `;

  const checkbox = div.querySelector('input');
  checkbox.addEventListener('change', (e) => {
    const itemId = e.target.value;
    const itemName = e.target.nextElementSibling.textContent;

    if (e.target.checked) {
      if (type === 'user') {
        selectedUserIds.add(itemId);
        addSelectedTag(itemId, itemName, selectedUsersContainer, 'user');
      } else {
        selectedHostIds.add(itemId);
        addSelectedTag(itemId, itemName, selectedHostsContainer, 'host');
      }
    } else {
      if (type === 'user') {
        selectedUserIds.delete(itemId);
        removeSelectedTag(itemId, selectedUsersContainer);
      } else {
        selectedHostIds.delete(itemId);
        removeSelectedTag(itemId, selectedHostsContainer);
      }
    }
  });

  return div;
};

const addSelectedTag = (id, name, container, type) => {
  if (!container) return;

  // Check if tag already exists
  if (container.querySelector(`[data-id="${id}"]`)) {
    return;
  }

  const tag = document.createElement('div');
  tag.className = 'tag';
  tag.dataset.id = id;
  tag.dataset.type = type;
  tag.innerHTML = `
    ${name}
    <button type="button" class="tag-remove" data-id="${id}" data-type="${type}">&times;</button>
  `;

  container.appendChild(tag);

  // Add remove functionality
  tag.querySelector('.tag-remove').addEventListener('click', (e) => {
    e.stopPropagation();
    const itemId = e.target.dataset.id;
    const itemType = e.target.dataset.type;

    removeSelectedTag(itemId, container);

    // Uncheck the corresponding checkbox
    const checkbox = document.querySelector(`input[value="${itemId}"]`);
    if (checkbox) checkbox.checked = false;

    if (itemType === 'user') {
      selectedUserIds.delete(itemId);
    } else {
      selectedHostIds.delete(itemId);
    }
  });
};

const removeSelectedTag = (id, container) => {
  if (!container) return;
  const tag = container.querySelector(`[data-id="${id}"]`);
  if (tag) tag.remove();
};

/* ---------- RESET GROUP FORM ---------- */
const resetGroupForm = () => {
  // Reset form inputs
  if (groupForm) groupForm.reset();
  if (groupIdInput) groupIdInput.value = "";
  if (groupNameInput) {
    groupNameInput.value = "";
    groupNameInput.disabled = false;
  }

  // Reset selections
  selectedUserIds.clear();
  selectedHostIds.clear();

  // Clear selected tags
  if (selectedUsersContainer) selectedUsersContainer.innerHTML = '';
  if (selectedHostsContainer) selectedHostsContainer.innerHTML = '';

  // Clear dropdown options
  if (usersOptions) usersOptions.innerHTML = '';

  const hostsOptions = document.getElementById('hostsOptions');
  if (hostsOptions) hostsOptions.innerHTML = '';

  // Reset dropdown placeholders
  const usersPlaceholder = document.querySelector('#usersDropdownHeader .dropdown-placeholder');
  const hostsPlaceholder = document.querySelector('#hostsDropdownHeader .dropdown-placeholder');

  if (usersPlaceholder) usersPlaceholder.textContent = 'Select users';
  if (hostsPlaceholder) hostsPlaceholder.textContent = 'Select hosts';

  // Close dropdowns
  if (usersDropdownList) usersDropdownList.classList.add('hidden');
  if (hostsDropdownList) hostsDropdownList.classList.add('hidden');
};

/* ---------- FETCH GROUPS ---------- */
export const fetchGroups = async () => {
  if (!groupsContainer) return;

  groupsContainer.innerHTML = '<div class="loading">Loading groups...</div>';
  try {
    const res = await fetch("http://localhost:8007/api/zabbix/v1/users/groups", {
      credentials: "include"
    });
    const result = await res.json();
    const groups = result.data || [];

    if (!groups.length) {
      groupsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>No Groups Found</h3>
          <p>Create your first group to get started</p>
          <button onclick="document.getElementById('createGroupBtn').click()" class="btn btn-primary">
            Create Group
          </button>
        </div>
      `;
      return;
    }

    const table = document.createElement('table');
    table.className = 'groups-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>ID</th>
          <th>Group Name</th>
          <th>Users</th>
          <th>Hosts</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    groups.forEach(group => {
      const tr = document.createElement('tr');
      const userCount = group.users ? group.users.length : 0;
      const hostCount = group.hostGroupIds ? group.hostGroupIds.length : 0;

      tr.innerHTML = `
        <td>${group.usrgrpid}</td>
        <td><strong>${group.name}</strong></td>
        <td><span class="count-badge users-count">${userCount}</span></td>
        <td><span class="count-badge hosts-count">${hostCount}</span></td>
      `;

      const actionsTd = document.createElement('td');
      actionsTd.className = 'actions-cell';

      // View button
      const viewBtn = document.createElement('button');
      viewBtn.textContent = "View";
      viewBtn.className = "btn-action view-btn";
      viewBtn.title = 'View Details';
      viewBtn.onclick = () => openViewGroupModal(group);

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.textContent = "Edit";
      editBtn.className = "btn-action edit-btn";
      editBtn.title = 'Edit Group';
      editBtn.onclick = () => openEditGroup(group);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "btn-action delete-btn";
      deleteBtn.title = 'Delete Group';
      deleteBtn.onclick = () => deleteGroup(group);

      actionsTd.append(viewBtn, editBtn, deleteBtn);
      tr.appendChild(actionsTd);
      tbody.appendChild(tr);
    });

    groupsContainer.innerHTML = "";
    groupsContainer.appendChild(table);

  } catch (err) {
    console.error("Error loading groups:", err);
    groupsContainer.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3>Error Loading Groups</h3>
        <p>${err.message || "Please check your connection"}</p>
        <button onclick="fetchGroups()" class="btn btn-secondary">
          Retry
        </button>
      </div>
    `;
  }
};

/* ---------- POPULATE FORM ---------- */
const populateGroupForm = async (selectedUsers = [], selectedHosts = []) => {

  // Clear previous selections
  selectedUserIds = new Set(selectedUsers);
  selectedHostIds = new Set(selectedHosts);

  if (selectedUsersContainer) selectedUsersContainer.innerHTML = '';
  if (selectedHostsContainer) selectedHostsContainer.innerHTML = '';

  if (usersOptions) usersOptions.innerHTML = '';

  const hostsOptions = document.getElementById('hostsOptions');
  if (hostsOptions) hostsOptions.innerHTML = '';

  try {
    // Fetch users
    const usersRes = await fetch("http://localhost:8007/api/zabbix/v1/users", {
      credentials: "include"
    });
    const usersResult = await usersRes.json();
    const allUsers = usersResult.data || [];


    // Populate users dropdown
    if (usersOptions) {
      allUsers.forEach(user => {
        const isSelected = selectedUserIds.has(user.userid);
        const option = createOptionElement(user.userid, user.username, 'user', isSelected);
        usersOptions.appendChild(option);

        if (isSelected && selectedUsersContainer) {
          addSelectedTag(user.userid, user.username, selectedUsersContainer, 'user');
        }
      });
    }

    // Fetch host groups
    const hostRes = await fetch("http://localhost:8007/api/zabbix/v1/hosts/groups", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const hostResult = await hostRes.json();
    const allHosts = hostResult.data || [];

    // Populate hosts dropdown
    const hostsOptions = document.getElementById('hostsOptions');
    if (hostsOptions) {
      allHosts.forEach(host => {
        const isSelected = selectedHostIds.has(host.groupid);
        const option = createOptionElement(host.groupid, host.name, 'host', isSelected);
        hostsOptions.appendChild(option);

        if (isSelected && selectedHostsContainer) {
          addSelectedTag(host.groupid, host.name, selectedHostsContainer, 'host');
        }
      });
    }

  } catch (error) {
    console.error('Error loading data:', error);
    alert('Failed to load data. Please try again.');
  }
};

/* ---------- OPEN CREATE GROUP ---------- */
if (createGroupBtn) {
  createGroupBtn.addEventListener("click", async () => {
    isEditMode = false;
    if (modalTitle) modalTitle.textContent = 'Create New Group';

    // Reset form
    resetGroupForm();

    if (groupModal) {
      groupModal.classList.remove("hidden");
      await populateGroupForm([], []);
    }
  });
}

/* ---------- SUBMIT FORM ---------- */
if (groupForm) {
  groupForm.addEventListener("submit", async e => {
    e.preventDefault();

    const name = groupNameInput ? groupNameInput.value.trim() : '';
    const userIds = Array.from(selectedUserIds);
    const hostGroupIds = Array.from(selectedHostIds);

    if (!name) {
      alert('Please enter group name');
      return;
    }

    if (!hostGroupIds.length) {
      alert('Select at least one host group');
      return;
    }

    const submitBtn = groupForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Saving...";
    submitBtn.disabled = true;

    try {
      if (!isEditMode) {
        // CREATE
        const createRes = await fetch("http://localhost:8007/api/zabbix/v1/user/groups/submit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            userIds,
            hostGroupIds
          })
        });

        const createResult = await createRes.json();

        if (!createResult.success) {
          throw new Error(createResult.message || "Create failed");
        }

        alert('Group created successfully!');

      } else {
        // EDIT
        const userGroupId = groupIdInput ? groupIdInput.value : '';

        if (!userGroupId) {
          throw new Error('Group ID is required for edit');
        }

        const updateRes = await fetch("http://localhost:8007/api/zabbix/v1/user/groups/permissions", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGroupId,
            hostGroupIds
          })
        });

        const updateResult = await updateRes.json();

        if (!updateResult.success) {
          throw new Error(updateResult.message || "Update failed");
        }

        alert('Group updated successfully!');
      }

      if (groupModal) groupModal.classList.add("hidden");
      resetGroupForm();
      fetchGroups();

    } catch (err) {
      console.error("Error in form submission:", err);
      alert('Operation failed: ' + (err.message || "Unknown error"));
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

/* ---------- EDIT GROUP ---------- */
const openEditGroup = async (group) => {

  isEditMode = true;

  if (modalTitle) modalTitle.textContent = 'Edit Group';

  // Set group ID and name
  if (groupIdInput) {
    groupIdInput.value = group.usrgrpid;
  }

  if (groupNameInput) {
    groupNameInput.value = group.name || '';
    groupNameInput.disabled = true; // Edit mode mein group name change nahi kar sakte
  }

  // Get users and hosts for this group
  const selectedUsers = (group.users || []).map(u => u.userid);
  const selectedHosts = group.hostGroupIds || [];

  // Show modal first, then populate
  if (groupModal) {
    groupModal.classList.remove("hidden");

    // Clear any existing selections first
    if (selectedUsersContainer) selectedUsersContainer.innerHTML = '';
    if (selectedHostsContainer) selectedHostsContainer.innerHTML = '';

    // Populate form with data
    await populateGroupForm(selectedUsers, selectedHosts);
  }
};

/* ---------- DELETE GROUP (FIXED - WORKING) ---------- */
const deleteGroup = async (group) => {
  if (!confirm(`Are you sure you want to delete group "${group.name}"?`)) return;

  try {
    // Method 1: Try with route parameter first
    const res = await fetch(
      `http://localhost:8007/api/zabbix/v1/user/groups/${group.usrgrpid}/delete`,
      {
        method: "DELETE",
        credentials: "include"
      }
    );

    // Try to parse response
    let result;
    try {
      result = await res.json();
    } catch (e) {
      // If not JSON, try alternative method
      await deleteGroupAlternative(group);
      return;
    }

    if (!result.success) {
      throw new Error(result.message || "Delete failed");
    }

    alert('✅ Group deleted successfully');
    fetchGroups();

  } catch (err) {
    console.error('Delete error:', err);

    // If first method fails, try alternative
    if (err.message.includes('404') || err.message.includes('Not Found')) {
      await deleteGroupAlternative(group);
    } else {
      alert('❌ Failed to delete group: ' + err.message);
    }
  }
};

/* ---------- ALTERNATIVE DELETE METHOD ---------- */
const deleteGroupAlternative = async (group) => {
  try {

    // Method 2: Try with body parameter (same as user delete)
    const res = await fetch("http://localhost:8007/api/zabbix/v1/user/groups/delete", {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        groupId: group.usrgrpid
      })
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Delete failed");
    }

    alert('✅ Group deleted successfully');
    fetchGroups();

  } catch (err) {
    console.error('Alternative delete error:', err);

    // Method 3: Disable group instead
    if (err.message.includes('404') || err.message.includes('Not Found') || err.message.includes('500')) {
      if (confirm(`Delete API not available. Remove all permissions from group "${group.name}" instead?`)) {
        await disableGroup(group);
      }
    } else {
      alert('❌ Failed to delete group: ' + err.message);
    }
  }
};

/* ---------- DISABLE GROUP (FALLBACK) ---------- */
const disableGroup = async (group) => {
  try {
    const res = await fetch("http://localhost:8007/api/zabbix/v1/user/groups/permissions", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userGroupId: group.usrgrpid,
        hostGroupIds: []
      })
    });

    const result = await res.json();

    if (!result.success) {
      throw new Error(result.message || "Disable failed");
    }

    alert('✅ Group permissions removed. Group is now disabled.');
    fetchGroups();

  } catch (err) {
    console.error('Disable error:', err);
    alert('❌ Failed to disable group: ' + err.message);
  }
};

/* ---------- VIEW GROUP MODAL ---------- */
const openViewGroupModal = async (group) => {
  if (!viewUsersTitle || !groupUsersList) return;

  viewUsersTitle.textContent = `Group: ${group.name}`;

  // Show loading
  groupUsersList.innerHTML = '<div class="loading">Loading details...</div>';

  if (viewUsersModal) {
    viewUsersModal.classList.remove("hidden");
  }

  try {
    const userCount = group.users ? group.users.length : 0;
    const hostCount = group.hostGroupIds ? group.hostGroupIds.length : 0;

    // Fetch host names
    let hostGroups = [];
    if (hostCount > 0) {
      try {
        const hostRes = await fetch("http://localhost:8007/api/zabbix/v1/hosts/groups", {
          credentials: "include"
        });
        const hostResult = await hostRes.json();
        hostGroups = hostResult.data || [];
      } catch (error) {
        console.error('Error fetching host groups:', error);
      }
    }

    let content = `
      <div class="group-overview">
        <div class="overview-item">
          <strong>Group ID:</strong> ${group.usrgrpid}
        </div>
        <div class="overview-item">
          <strong>Users:</strong> <span class="badge">${userCount}</span>
        </div>
        <div class="overview-item">
          <strong>Host Groups:</strong> <span class="badge">${hostCount}</span>
        </div>
      </div>
      
      <div class="sections">
    `;

    // USERS SECTION
    content += `
      <div class="section">
        <h4>Users (${userCount})</h4>
    `;

    if (userCount > 0) {
      content += `<ul class="users-list">`;
      group.users.forEach(user => {
        content += `
          <li>
            <strong>${user.username}</strong>
            ${user.name || user.surname ? ` - ${user.name || ''} ${user.surname || ''}` : ''}
          </li>
        `;
      });
      content += `</ul>`;
    } else {
      content += `<p class="no-data">No users in this group</p>`;
    }

    content += `</div>`;

    // HOSTS SECTION
    content += `
      <div class="section">
        <h4>Host Groups (${hostCount})</h4>
    `;

    if (hostCount > 0) {
      if (hostGroups.length > 0) {
        const assignedHosts = hostGroups.filter(host =>
          group.hostGroupIds.includes(host.groupid)
        );

        if (assignedHosts.length > 0) {
          content += `<ul class="hosts-list">`;
          assignedHosts.forEach(host => {
            content += `<li><strong>${host.name}</strong> (ID: ${host.groupid})</li>`;
          });
          content += `</ul>`;
        } else {
          content += `
            <div class="host-ids">
              <p>Host Group IDs:</p>
              <div class="ids">
                ${group.hostGroupIds.map(id => `<span class="id-tag">${id}</span>`).join('')}
              </div>
            </div>
          `;
        }
      } else {
        content += `
          <div class="host-ids">
            <p>Host Group IDs:</p>
            <div class="ids">
              ${group.hostGroupIds.map(id => `<span class="id-tag">${id}</span>`).join('')}
            </div>
          </div>
        `;
      }
    } else {
      content += `<p class="no-data">No host groups assigned</p>`;
    }

    content += `</div>`;
    content += `</div>`;

    groupUsersList.innerHTML = content;

  } catch (error) {
    console.error('Error loading view:', error);
    groupUsersList.innerHTML = `
      <div class="error">
        <p>Error loading group details</p>
      </div>
    `;
  }
};

/* ---------- INITIALIZE EVERYTHING ---------- */
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing groups page...');

  // Initialize modals first
  initializeModals();

  // Initialize dropdowns
  initializeDropdowns();

  // Load groups
  fetchGroups();

  console.log('Groups page initialized');
});