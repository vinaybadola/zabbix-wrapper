const API_BASE = "http://localhost:8009/api/zabbix/v1";

class DashboardsManager {
    constructor() {
        console.log("🚀 DashboardsManager created");
        this.selectedHostGroupId = null;
        this.selectedHostGroupName = null;
        this.selectedHosts = new Map(); // hostid -> {host, selectedItems}
        this.currentTabHostId = null;

        // New properties for user group flow
        this.selectedUserGroupId = null;
        this.selectedUserId = null;
        this.selectedUserName = null;
        this.selectedUserGroups = new Map();
        this.allUserGroups = [];

        // Additional properties
        this.selectedHostGroups = new Map();

        setTimeout(() => {
            this.initialize();
        }, 100);
    }

    initialize() {
        console.log("📦 Initializing dashboard manager...");

        this.dashboardsContainer = document.getElementById('dashboardsContainer');
        this.createDashboardMainBtn = document.getElementById('createDashboardMainBtn');
        this.clearHostGroupBtn = document.getElementById('clearHostGroupBtn');

        if (!this.createDashboardMainBtn || !this.dashboardsContainer) {
            console.log("⚠️ Elements not found yet");
            return;
        }

        console.log("✅ All elements found, setting up...");
        this.setupDashboardFunctionality();
    }

    setupDashboardFunctionality() {
        // Bind create button
        this.createDashboardMainBtn.addEventListener('click', () => {
            this.openCreateModal();
        });

        // Bind clear host group button
        if (this.clearHostGroupBtn) {
            this.clearHostGroupBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.clearHostGroup();
            });
        }

        this.setupModals();
        this.setupDropdowns();

        // Load dashboards on init
        this.loadDashboards();

        console.log("✅ Dashboard functionality ready");
    }

    setupModals() {
        // Create/Edit Modal
        this.dashboardModal = document.getElementById('dashboardModal');
        this.dashboardForm = document.getElementById('dashboardForm');

        if (this.dashboardForm) {
            this.dashboardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveDashboard();
            });
        }

        // View Modal
        this.viewModal = document.getElementById('viewDashboardModal');

        // Close buttons
        const closeDashboardModal = document.getElementById('closeDashboardModal');
        const cancelDashboardBtn = document.getElementById('cancelDashboardBtn');
        const closeViewModal = document.getElementById('closeViewModal');
        const closeViewBtn = document.getElementById('closeViewBtn');

        if (closeDashboardModal) {
            closeDashboardModal.addEventListener('click', () => {
                this.closeCreateModal();
            });
        }

        if (cancelDashboardBtn) {
            cancelDashboardBtn.addEventListener('click', () => {
                this.closeCreateModal();
            });
        }

        if (closeViewModal) {
            closeViewModal.addEventListener('click', () => {
                this.closeViewModal();
            });
        }

        if (closeViewBtn) {
            closeViewBtn.addEventListener('click', () => {
                this.closeViewModal();
            });
        }
    }

    setupDropdowns() {
        // Host Groups Dropdown
        const hostGroupsHeader = document.getElementById('hostGroupsDropdownHeader');
        if (hostGroupsHeader) {
            hostGroupsHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('hostGroupsDropdownList');
            });
        }

        // Hosts Dropdown
        const hostsHeader = document.getElementById('hostsDropdownHeader');
        if (hostsHeader) {
            hostsHeader.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown('hostsDropdownList');
            });
        }

        // Search functionality
        const searchHostGroups = document.getElementById('searchHostGroups');
        const searchHosts = document.getElementById('searchHosts');

        if (searchHostGroups) {
            searchHostGroups.addEventListener('input', (e) => {
                this.searchOptions('hostGroupsOptions', e.target.value);
            });
        }

        if (searchHosts) {
            searchHosts.addEventListener('input', (e) => {
                this.searchOptions('hostsOptions', e.target.value);
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            const dropdowns = ['hostGroupsDropdownList', 'hostsDropdownList'];
            dropdowns.forEach(id => {
                const dropdown = document.getElementById(id);
                if (dropdown && !dropdown.contains(e.target)) {
                    const headerId = id.replace('DropdownList', 'DropdownHeader');
                    const header = document.getElementById(headerId);
                    if (header && !header.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                }
            });
        });
    }

    toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('hidden');
            // Close other dropdowns
            const otherIds = dropdownId === 'hostGroupsDropdownList' ? ['hostsDropdownList'] : ['hostGroupsDropdownList'];
            otherIds.forEach(id => {
                const otherDropdown = document.getElementById(id);
                if (otherDropdown) otherDropdown.classList.add('hidden');
            });
        }
    }

    searchOptions(containerId, searchTerm) {
        const options = document.querySelectorAll(`#${containerId} .dropdown-option`);
        const term = searchTerm.toLowerCase();

        options.forEach(option => {
            const label = option.querySelector('label')?.textContent.toLowerCase() || '';
            option.style.display = label.includes(term) ? 'flex' : 'none';
        });
    }

    async loadDashboards() {
        if (!this.dashboardsContainer) return;

        this.dashboardsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading dashboards...</p></div>';

        try {
            const response = await fetch(`${API_BASE}/dashboards`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load dashboards');
            }

            this.renderDashboards(result.data || []);

        } catch (error) {
            console.error('Error loading dashboards:', error);
            this.dashboardsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Dashboards</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" id="retryLoadDashboards">
                        Retry
                    </button>
                </div>
            `;

            // Add event listener to retry button
            const retryBtn = document.getElementById('retryLoadDashboards');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.loadDashboards();
                });
            }
        }
    }

    renderDashboards(dashboards) {
        if (!dashboards || dashboards.length === 0) {
            this.dashboardsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No Dashboards Found</h3>
                    <p>Create your first dashboard to get started</p>
                    <button class="btn btn-primary" id="createDashboardFromEmpty">
                        Create Dashboard
                    </button>
                </div>
            `;

            // Add event listener for empty state button
            const createBtn = document.getElementById('createDashboardFromEmpty');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    this.openCreateModal();
                });
            }

            return;
        }

        const table = document.createElement('table');
        table.className = 'dashboards-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>User ID</th>
                <th>Privacy</th>
                <th>Hosts</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        dashboards.forEach(dashboard => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${dashboard.dashboardId || 'N/A'}</td>
                <td><strong>${dashboard.name || 'Unnamed'}</strong></td>
                <td>${dashboard.userId || 'N/A'}</td>
                <td>
                    <span class="privacy-badge ${dashboard.private === '1' ? 'private' : 'public'}">
                        ${dashboard.private === '1' ? '🔒 Private' : '🌐 Public'}
                    </span>
                </td>
                <td>${this.getDashboardHostCount(dashboard)}</td>
                <td class="actions-cell">
                    <button class="btn-action view-btn" data-dashboard-id="${dashboard.dashboardId}" title="View">👁️</button>
                    <button class="btn-action edit-btn" data-dashboard-id="${dashboard.dashboardId}" data-dashboard-name="${dashboard.name || 'Unnamed'}" title="Edit">✏️</button>
                    <button class="btn-action delete-btn" data-dashboard-id="${dashboard.dashboardId}" data-dashboard-name="${dashboard.name || 'Unnamed'}" title="Delete">🗑️</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        this.dashboardsContainer.innerHTML = '';
        this.dashboardsContainer.appendChild(table);

        // Add event listeners to action buttons
        this.setupDashboardActionListeners();
    }

    setupDashboardActionListeners() {
        // View buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dashboardId = e.currentTarget.dataset.dashboardId;
                this.viewDashboard(dashboardId);
            });
        });

        // Edit buttons
        const editButtons = document.querySelectorAll('.edit-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dashboardId = e.currentTarget.dataset.dashboardId;
                const dashboardName = e.currentTarget.dataset.dashboardName;
                this.openEditModal(dashboardId, dashboardName);
            });
        });

        // Delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dashboardId = e.currentTarget.dataset.dashboardId;
                const dashboardName = e.currentTarget.dataset.dashboardName;
                this.deleteDashboard(dashboardId, dashboardName);
            });
        });
    }

    getDashboardHostCount(dashboard) {
        if (!dashboard.pages || !dashboard.pages.length) return '0';

        const hosts = new Set();
        dashboard.pages.forEach(page => {
            page.widgets?.forEach(widget => {
                widget.fields?.forEach(field => {
                    if (field.name === 'ds.0.hosts.0') {
                        hosts.add(field.value);
                    }
                });
            });
        });

        return hosts.size.toString();
    }

    async openCreateModal() {
        console.log("📝 Opening create modal...");

        this.resetForm();

        // Load user groups instead of individual users
        await this.loadUserGroupsDropdown();

        // Hide original host groups dropdown completely
        const originalHostGroupsSection = document.querySelector('.form-group:nth-child(3)');
        if (originalHostGroupsSection) {
            originalHostGroupsSection.style.display = 'none';
        }

        // Also hide the original host groups dropdown header
        const hostGroupsDropdownHeader = document.getElementById('hostGroupsDropdownHeader');
        if (hostGroupsDropdownHeader) {
            hostGroupsDropdownHeader.style.display = 'none';
        }

        // Show modal
        const dashboardModal = document.getElementById('dashboardModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitBtn');

        if (dashboardModal) dashboardModal.classList.remove('hidden');
        if (modalTitle) modalTitle.textContent = 'Create New Dashboard';
        if (submitBtn) submitBtn.textContent = 'Create Dashboard';
    }

    async openEditModal(dashboardId, dashboardName) {
        console.log("✏️ Opening edit modal for dashboard:", dashboardId);

        try {
            // Load dashboard details
            const response = await fetch(`${API_BASE}/dashboards/${dashboardId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load dashboard');
            }

            const dashboard = result.data;

            // Reset form
            this.resetForm();

            // Set dashboard ID
            const editDashboardIdInput = document.getElementById('editDashboardId');
            if (editDashboardIdInput) editDashboardIdInput.value = dashboardId;

            // Load form data
            const dashboardNameInput = document.getElementById('dashboardNameInput');
            const userSelect = document.getElementById('userSelect');

            if (dashboardNameInput) dashboardNameInput.value = dashboard.name || '';
            if (userSelect) userSelect.value = dashboard.userId || '';

            // Set modal title
            const modalTitle = document.getElementById('modalTitle');
            const submitBtn = document.getElementById('submitBtn');

            if (modalTitle) modalTitle.textContent = `Edit Dashboard: ${dashboard.name || dashboardName}`;
            if (submitBtn) submitBtn.textContent = 'Update Dashboard';

            // Show modal
            const dashboardModal = document.getElementById('dashboardModal');
            if (dashboardModal) dashboardModal.classList.remove('hidden');

        } catch (error) {
            console.error('Error loading dashboard for edit:', error);
            alert(`❌ Failed to load dashboard: ${error.message}`);
        }
    }

    // ========== USER GROUPS FLOW ==========

    async loadUserGroupsDropdown() {
        const userSelect = document.getElementById('userSelect');
        if (!userSelect) return;

        userSelect.innerHTML = '<option value="">Select Client User Group</option>';

        try {
            const response = await fetch(`${API_BASE}/users/groups`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data) {
                // Store all groups data for reference
                this.allUserGroups = result.data;

                // Filter groups that have users
                const groupsWithUsers = result.data.filter(group =>
                    group.users && group.users.length > 0
                );

                if (groupsWithUsers.length === 0) {
                    userSelect.innerHTML = '<option value="">No user groups found</option>';
                    return;
                }

                groupsWithUsers.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.usrgrpid;
                    option.textContent = `${group.name} (${group.users.length} users)`;
                    userSelect.appendChild(option);
                });

                // Add event listener for group selection
                userSelect.addEventListener('change', (e) => {
                    const selectedGroupId = e.target.value;
                    if (selectedGroupId) {
                        this.onUserGroupSelected(selectedGroupId);
                    } else {
                        // Clear user selection section if group is deselected
                        const usersSection = document.getElementById('usersSelectionSection');
                        if (usersSection) usersSection.remove();
                    }
                });
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
            userSelect.innerHTML = '<option value="">Error loading user groups</option>';
        }
    }

    async onUserGroupSelected(userGroupId) {
        console.log('User Group selected:', userGroupId);

        // Find the selected group
        const selectedGroup = this.allUserGroups?.find(group =>
            group.usrgrpid === userGroupId
        );

        if (!selectedGroup) {
            alert('User group not found');
            return;
        }

        // Store selected user group
        this.selectedUserGroupId = userGroupId;

        // Remove previous users section if exists
        const existingSection = document.getElementById('usersSelectionSection');
        if (existingSection) {
            existingSection.remove();
        }

        // Remove previous host group section if exists
        const existingHostGroupSection = document.getElementById('hostGroupSelectionSection');
        if (existingHostGroupSection) {
            existingHostGroupSection.remove();
        }

        // Show users selection section
        const usersSelectionDiv = document.createElement('div');
        usersSelectionDiv.id = 'usersSelectionSection';
        usersSelectionDiv.className = 'form-group';
        usersSelectionDiv.innerHTML = `
            <label class="form-label">
                <span class="label-number">2</span> Select User from Group *
            </label>
            <div class="users-grid" id="usersGrid">
                Loading users...
            </div>
            <div class="selected-users-container" id="selectedUsersContainer"></div>
        `;

        // Insert after user select dropdown
        const userSelect = document.getElementById('userSelect');
        userSelect.parentNode.insertBefore(usersSelectionDiv, userSelect.nextSibling);

        // Load users for this group
        await this.loadUsersForGroup(selectedGroup);
    }

    async loadUsersForGroup(group) {
        const usersGrid = document.getElementById('usersGrid');
        if (!usersGrid) return;

        usersGrid.innerHTML = '';

        if (!group.users || group.users.length === 0) {
            usersGrid.innerHTML = '<div class="no-data">No users in this group</div>';
            return;
        }

        // Clear previous selections
        this.selectedUserId = null;
        this.selectedUserName = null;

        // Create user selection cards (radio buttons - single selection)
        group.users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <input type="radio" 
                       name="selectedUser"
                       class="user-radio" 
                       id="user-${user.userid}"
                       value="${user.userid}"
                       data-username="${user.username}">
                <label for="user-${user.userid}">
                    <div class="user-name">${user.username}</div>
                    <div class="user-details">
                        ${user.name || ''} ${user.surname || ''}
                    </div>
                </label>
            `;

            usersGrid.appendChild(userCard);

            // Add event listener
            const radio = userCard.querySelector('.user-radio');
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.onUserSelected(user.userid, user.username);
                }
            });
        });
    }

    onUserSelected(userId, username) {
        this.selectedUserId = userId;
        this.selectedUserName = username;

        const selectedUsersContainer = document.getElementById('selectedUsersContainer');
        selectedUsersContainer.innerHTML = '';

        // Show selected user
        const tag = document.createElement('div');
        tag.className = 'user-tag';
        tag.innerHTML = `
            ✅ Selected: ${username}
            <button type="button" class="tag-remove" id="changeUserBtn">Change</button>
        `;
        selectedUsersContainer.appendChild(tag);

        // Add change button functionality
        tag.querySelector('#changeUserBtn').addEventListener('click', () => {
            // Uncheck all radios
            document.querySelectorAll('.user-radio').forEach(radio => {
                radio.checked = false;
            });
            selectedUsersContainer.innerHTML = '';
            this.selectedUserId = null;

            // Remove host group section if exists
            const hostGroupSection = document.getElementById('hostGroupSelectionSection');
            if (hostGroupSection) {
                hostGroupSection.remove();
            }
        });

        // Automatically load host groups for this user
        this.loadHostGroupsForUser(userId);
    }

    async loadHostGroupsForUser(userId) {
        try {
            // Remove existing host group section if exists
            const existingSection = document.getElementById('hostGroupSelectionSection');
            if (existingSection) {
                existingSection.remove();
            }

            // Get user's groups with host permissions
            const userGroupsResponse = await fetch(`${API_BASE}/users/${userId}/groups`, {
                credentials: 'include'
            });

            const userGroupsResult = await userGroupsResponse.json();

            if (userGroupsResult.success && userGroupsResult.data) {
                const userGroups = userGroupsResult.data;

                // Collect all host group IDs from all user groups
                const allHostGroupIds = new Set();
                userGroups.forEach(group => {
                    if (group.hostGroupIds && group.hostGroupIds.length > 0) {
                        group.hostGroupIds.forEach(id => allHostGroupIds.add(id));
                    }
                });

                if (allHostGroupIds.size === 0) {
                    alert('Selected user has no host groups assigned. Please assign host groups first.');
                    return;
                }

                // Show host group selection
                await this.showHostGroupSelection(Array.from(allHostGroupIds));
            }
        } catch (error) {
            console.error('Error loading user host groups:', error);
            alert('Error loading host groups for selected user');
        }
    }

    async showHostGroupSelection(hostGroupIds) {
        // Remove existing section if exists
        const existingSection = document.getElementById('hostGroupSelectionSection');
        if (existingSection) {
            existingSection.remove();
        }

        // Create host group selection section
        const hostGroupSection = document.createElement('div');
        hostGroupSection.id = 'hostGroupSelectionSection';
        hostGroupSection.className = 'form-group';
        hostGroupSection.innerHTML = `
            <label class="form-label">
                <span class="label-number">3</span> Select Host Group *
            </label>
            <div class="host-groups-grid" id="hostGroupsGrid">
                Loading host groups...
            </div>
            <div class="selected-host-groups-container" id="selectedHostGroupsContainer"></div>
        `;

        // Insert after users selection
        const usersSection = document.getElementById('usersSelectionSection');
        if (usersSection) {
            usersSection.parentNode.insertBefore(hostGroupSection, usersSection.nextSibling);
        }

        // Load available host groups
        await this.loadAvailableHostGroups(hostGroupIds);
    }

    async loadAvailableHostGroups(hostGroupIds) {
        const hostGroupsGrid = document.getElementById('hostGroupsGrid');
        if (!hostGroupsGrid) return;

        try {
            // Get all host groups
            const response = await fetch(`${API_BASE}/hosts/groups`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data) {
                hostGroupsGrid.innerHTML = '';

                // Filter only those host groups that are in user's permissions
                const availableGroups = result.data.filter(group =>
                    hostGroupIds.includes(group.groupid)
                );

                if (availableGroups.length === 0) {
                    hostGroupsGrid.innerHTML = '<div class="no-data">No accessible host groups found</div>';
                    return;
                }

                // Clear previous selection
                this.selectedHostGroupId = null;
                this.selectedHostGroupName = null;

                // Create host group selection cards (RADIO buttons - single selection)
                availableGroups.forEach(group => {
                    const groupCard = document.createElement('div');
                    groupCard.className = 'host-group-card';
                    groupCard.innerHTML = `
                        <input type="radio" 
                               name="selectedHostGroup"
                               class="host-group-radio" 
                               id="hostgroup-${group.groupid}"
                               value="${group.groupid}"
                               data-name="${group.name}">
                        <label for="hostgroup-${group.groupid}">
                            <div class="group-name">${group.name}</div>
                            <div class="group-id">ID: ${group.groupid}</div>
                        </label>
                    `;

                    hostGroupsGrid.appendChild(groupCard);

                    // Add event listener
                    const radio = groupCard.querySelector('.host-group-radio');
                    radio.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            this.onHostGroupSelected(group.groupid, group.name);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading host groups:', error);
            hostGroupsGrid.innerHTML = '<div class="error">Error loading host groups</div>';
        }
    }

    onHostGroupSelected(groupId, groupName) {
        this.selectedHostGroupId = groupId;
        this.selectedHostGroupName = groupName;

        const container = document.getElementById('selectedHostGroupsContainer');
        container.innerHTML = '';

        // Show selected host group
        const tag = document.createElement('div');
        tag.className = 'host-group-tag';
        tag.innerHTML = `
            ✅ Selected: ${groupName}
            <button type="button" class="tag-remove" id="changeHostGroupBtn">Change</button>
        `;
        container.appendChild(tag);

        // Add change button functionality
        tag.querySelector('#changeHostGroupBtn').addEventListener('click', () => {
            // Uncheck all radios
            document.querySelectorAll('.host-group-radio').forEach(radio => {
                radio.checked = false;
            });
            container.innerHTML = '';
            this.selectedHostGroupId = null;

            // Hide host selection section
            const hostSelectionGroup = document.getElementById('hostSelectionGroup');
            if (hostSelectionGroup) {
                hostSelectionGroup.style.display = 'none';
            }
        });

        // Automatically show host selection section
        this.showHostSelectionSection();
    }

    showHostSelectionSection() {
        // Show the existing host selection group
        const hostSelectionGroup = document.getElementById('hostSelectionGroup');
        if (hostSelectionGroup) {
            hostSelectionGroup.style.display = 'block';

            // Load hosts for selected group
            if (this.selectedHostGroupId) {
                this.loadHostsForGroup(this.selectedHostGroupId);
            }
        }
    }

    // ========== EXISTING FUNCTIONS (updated) ==========

    async loadHostsForGroup(groupId) {
        const optionsContainer = document.getElementById('hostsOptions');
        if (!optionsContainer) return;

        optionsContainer.innerHTML = '<div class="loading-options">Loading hosts...</div>';

        try {
            const response = await fetch(`${API_BASE}/hosts/groups/${groupId}/hosts`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success && result.data) {
                optionsContainer.innerHTML = '';

                if (result.data.length === 0) {
                    optionsContainer.innerHTML = '<div class="no-options">No hosts found in this group</div>';
                    return;
                }

                // Clear previous host selections
                this.selectedHosts.clear();

                result.data.forEach(host => {
                    const option = this.createHostOption(host);
                    optionsContainer.appendChild(option);
                });
            } else {
                optionsContainer.innerHTML = '<div class="error-option">Error loading hosts</div>';
            }
        } catch (error) {
            console.error('Error loading hosts:', error);
            optionsContainer.innerHTML = '<div class="error-option">Failed to load hosts</div>';
        }
    }

    createHostOption(host) {
        const div = document.createElement('div');
        div.className = 'dropdown-option';

        const hostName = host.name || host.host || `Host ${host.hostid}`;
        const checkboxId = `host-${host.hostid}`;

        div.innerHTML = `
        <input type="checkbox" id="${checkboxId}" value="${host.hostid}">
        <label for="${checkboxId}">${hostName} (ID: ${host.hostid})</label>
    `;

        const checkbox = div.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                console.log(`✅ Host selected: ${hostName} (ID: ${host.hostid})`);
                this.addHost(host);
            } else {
                console.log(`❌ Host deselected: ${hostName} (ID: ${host.hostid})`);
                this.removeHost(host.hostid);
            }
        });

        // Check if already selected
        if (this.selectedHosts.has(host.hostid)) {
            checkbox.checked = true;
        }

        return div;
    }

    addHost(host) {
        const hostId = host.hostid;
        const hostName = host.name || host.host || `Host ${hostId}`;

        console.log(`➕ Adding host: ${hostName} (${hostId})`);

        if (!this.selectedHosts.has(hostId)) {
            this.selectedHosts.set(hostId, {
                host: host,
                selectedItems: [],
                hostItems: []
            });

            console.log(`✅ Host added to selectedHosts:`, this.selectedHosts.get(hostId));

            // Update selected hosts UI
            this.updateSelectedHostsUI();

            // Load items for this host
            this.loadItemsForHost(hostId);
        } else {
            console.log(`⚠️ Host already selected: ${hostName}`);
        }
    }

    removeHost(hostId) {
        if (this.selectedHosts.delete(hostId)) {
            // Update UI
            this.updateSelectedHostsUI();

            // Remove tab if exists
            this.removeHostTab(hostId);

            // Update items summary
            this.updateSelectedItemsSummary();
        }
    }

    updateSelectedHostsUI() {
        const container = document.getElementById('selectedHostsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.selectedHosts.size === 0) {
            const itemSelectionGroup = document.getElementById('itemSelectionGroup');
            if (itemSelectionGroup) itemSelectionGroup.style.display = 'none';
            return;
        }

        // Show item selection
        const itemSelectionGroup = document.getElementById('itemSelectionGroup');
        if (itemSelectionGroup) itemSelectionGroup.style.display = 'block';

        // Create tags for each selected host
        this.selectedHosts.forEach((data, hostId) => {
            const hostName = data.host.name || data.host.host || `Host ${hostId}`;
            const tag = document.createElement('div');
            tag.className = 'host-tag';
            tag.innerHTML = `
                ${hostName}
                <button type="button" class="tag-remove" data-hostid="${hostId}">×</button>
            `;
            container.appendChild(tag);

            // Add event listener for remove button
            const removeBtn = tag.querySelector('.tag-remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const hostIdToRemove = e.currentTarget.dataset.hostid;
                this.removeHost(hostIdToRemove);
            });
        });
    }

    // ========== RESET FORM (updated) ==========

    resetForm() {
        // Reset all selections
        this.selectedUserGroupId = null;
        this.selectedUserId = null;
        this.selectedUserName = null;
        this.selectedHostGroupId = null;
        this.selectedHostGroupName = null;
        this.selectedHosts.clear();
        this.currentTabHostId = null;
        this.selectedUserGroups = new Map();
        this.selectedHostGroups = new Map();

        // Clear form inputs
        const editDashboardId = document.getElementById('editDashboardId');
        const dashboardNameInput = document.getElementById('dashboardNameInput');
        const userSelect = document.getElementById('userSelect');

        if (editDashboardId) editDashboardId.value = '';
        if (dashboardNameInput) dashboardNameInput.value = '';
        if (userSelect) userSelect.value = '';

        // Remove dynamically added sections
        const sectionsToRemove = [
            'usersSelectionSection',
            'hostGroupSelectionSection'
        ];

        sectionsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });

        // Show original host groups dropdown again
        const originalHostGroupsSection = document.querySelector('.form-group:nth-child(3)');
        if (originalHostGroupsSection) {
            originalHostGroupsSection.style.display = 'block';
        }

        // Show original host groups dropdown header
        const hostGroupsDropdownHeader = document.getElementById('hostGroupsDropdownHeader');
        if (hostGroupsDropdownHeader) {
            hostGroupsDropdownHeader.style.display = 'block';
        }

        // Clear other UI sections
        const sections = [
            'selectedGroupInfo',
            'hostSelectionGroup',
            'itemSelectionGroup',
            'selectedItemsSummary',
            'selectedHostsContainer',
            'hostTabs',
            'hostTabsContent'
        ];

        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'selectedGroupInfo' || id === 'itemSelectionGroup' || id === 'selectedItemsSummary') {
                    element.style.display = 'none';
                } else if (id === 'hostSelectionGroup') {
                    element.style.display = 'none';
                } else {
                    element.innerHTML = '';
                }
            }
        });

        // Reset dropdown placeholders
        const hostGroupPlaceholder = document.querySelector('#hostGroupsDropdownHeader .dropdown-placeholder');
        const hostsPlaceholder = document.querySelector('#hostsDropdownHeader .dropdown-placeholder');

        if (hostGroupPlaceholder) hostGroupPlaceholder.textContent = 'Click to select host group';
        if (hostsPlaceholder) hostsPlaceholder.textContent = 'Click to select hosts';

        // Clear dropdown options
        const hostsOptions = document.getElementById('hostsOptions');
        if (hostsOptions) hostsOptions.innerHTML = '<div class="loading-options">Select host group first</div>';

        // Close all dropdowns
        document.querySelectorAll('.dropdown-list').forEach(d => d.classList.add('hidden'));
    }

    clearHostGroup() {
        this.selectedHostGroupId = null;
        this.selectedHostGroupName = null;
        this.selectedHosts.clear();

        const selectedGroupInfo = document.getElementById('selectedGroupInfo');
        const hostSelectionGroup = document.getElementById('hostSelectionGroup');
        const itemSelectionGroup = document.getElementById('itemSelectionGroup');
        const selectedItemsSummary = document.getElementById('selectedItemsSummary');
        const selectedHostsContainer = document.getElementById('selectedHostsContainer');
        const hostGroupPlaceholder = document.querySelector('#hostGroupsDropdownHeader .dropdown-placeholder');
        const hostsOptions = document.getElementById('hostsOptions');

        if (selectedGroupInfo) selectedGroupInfo.style.display = 'none';
        if (hostSelectionGroup) hostSelectionGroup.style.display = 'none';
        if (itemSelectionGroup) itemSelectionGroup.style.display = 'none';
        if (selectedItemsSummary) selectedItemsSummary.style.display = 'none';
        if (selectedHostsContainer) selectedHostsContainer.innerHTML = '';
        if (hostGroupPlaceholder) hostGroupPlaceholder.textContent = 'Click to select host group';
        if (hostsOptions) hostsOptions.innerHTML = '<div class="loading-options">Select host group first</div>';

        // Clear tabs
        const hostTabs = document.getElementById('hostTabs');
        const hostTabsContent = document.getElementById('hostTabsContent');
        if (hostTabs) hostTabs.innerHTML = '';
        if (hostTabsContent) hostTabsContent.innerHTML = '';
    }

    // ========== DASHBOARD CREATION (updated) ==========

    async saveDashboard() {
        const editDashboardId = document.getElementById('editDashboardId')?.value;
        const dashboardName = document.getElementById('dashboardNameInput')?.value.trim();

        // Validation
        if (!dashboardName) {
            alert('Please enter a dashboard name');
            return;
        }

        if (!this.selectedUserId) {
            alert('Please select a user');
            return;
        }

        if (!this.selectedHostGroupId) {
            alert('Please select a host group');
            return;
        }

        if (this.selectedHosts.size === 0) {
            alert('Please select at least one host');
            return;
        }

        // Check if each selected host has at least one item
        let allHostsHaveItems = true;
        this.selectedHosts.forEach((data, hostId) => {
            if (data.selectedItems.length === 0) {
                allHostsHaveItems = false;
                alert(`Please select at least one item for host: ${data.host.name || data.host.host || hostId}`);
            }
        });

        if (!allHostsHaveItems) return;

        const submitBtn = document.getElementById('submitBtn');
        if (!submitBtn) return;

        const originalText = submitBtn.textContent;
        submitBtn.textContent = editDashboardId ? 'Updating...' : 'Creating...';
        submitBtn.disabled = true;

        try {
            // Prepare hostsData for backend
            const hostsData = {};
            this.selectedHosts.forEach((data, hostId) => {
                hostsData[hostId] = data.selectedItems;
            });

            // Determine which endpoint to use based on number of hosts
            const isMultiHost = this.selectedHosts.size > 1;
            const endpoint = isMultiHost
                ? `${API_BASE}/dashboards/multi-host`
                : `${API_BASE}/dashboards/client-traffic`;

            const method = editDashboardId ? 'PUT' : 'POST';

            const requestBody = {
                clientUserId: this.selectedUserId,
                hostGroupId: this.selectedHostGroupId,
                dashboardName
            };

            // Add data based on endpoint
            if (isMultiHost) {
                requestBody.hostsData = hostsData;
            } else {
                // For single host, take first host's first two items
                const firstHost = Array.from(this.selectedHosts.values())[0];
                if (firstHost.selectedItems.length >= 2) {
                    requestBody.bitsInItemId = firstHost.selectedItems[0];
                    requestBody.bitsOutItemId = firstHost.selectedItems[1];
                } else if (firstHost.selectedItems.length === 1) {
                    // If only one item selected, use it for both
                    requestBody.bitsInItemId = firstHost.selectedItems[0];
                    requestBody.bitsOutItemId = firstHost.selectedItems[0];
                } else {
                    throw new Error('No items selected for the host');
                }
            }

            console.log('Sending request to:', endpoint, requestBody);

            const response = await fetch(endpoint, {
                method: method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();

            if (result.success) {
                alert(`✅ Dashboard ${editDashboardId ? 'updated' : 'created'} successfully!\nHosts: ${result.hostCount || 1}\nWidgets: ${result.widgetCount || 1}`);
                this.closeCreateModal();
                this.loadDashboards();
            } else {
                throw new Error(result.message || 'Failed to create dashboard');
            }

        } catch (error) {
            console.error('Error saving dashboard:', error);
            alert(`❌ Failed to create dashboard: ${error.message}`);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // ========== EXISTING FUNCTIONS (keep as is) ==========

    async loadItemsForHost(hostId) {
        console.log(`🔍 loadItemsForHost called for hostId: ${hostId}`);

        // Check if host exists in selectedHosts
        if (!this.selectedHosts.has(hostId)) {
            console.log(`❌ Host ${hostId} not found in selectedHosts`);
            return;
        }

        const hostData = this.selectedHosts.get(hostId);
        console.log(`✅ Host data found:`, hostData);

        // Create tab for this host
        this.createHostTab(hostId);

        // Show loading in tab content
        const tabContent = document.getElementById(`tab-content-${hostId}`);
        if (tabContent) {
            tabContent.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading items...</p></div>';
        }

        try {
            console.log(`📡 Fetching items for host ${hostId}...`);

            // DIRECT API call - no search term
            const response = await fetch(`${API_BASE}/hosts/${hostId}/items`, {
                credentials: 'include'
            });

            const result = await response.json();
            console.log(`📦 API response for host ${hostId}:`, result);

            if (result.success && result.data) {
                const items = result.data;
                console.log(`✅ Found ${items.length} items for host ${hostId}`);

                // Store items for this host
                hostData.hostItems = items;
                console.log(`💾 Stored ${items.length} items in hostData`);

                // Display items
                this.displayItemsForHost(hostId, items);
            } else {
                console.log(`❌ No items found or API error for host ${hostId}`);
                throw new Error(result.message || 'No items found');
            }

        } catch (error) {
            console.error(`❌ Error loading items for host ${hostId}:`, error);
            const tabContent = document.getElementById(`tab-content-${hostId}`);
            if (tabContent) {
                tabContent.innerHTML = `
                <div class="error-state">
                    <h4>❌ Error Loading Items</h4>
                    <p>${error.message}</p>
                    <p>This host may not have monitoring items configured.</p>
                    <button onclick="window.dashboardsManager.retryLoadItems('${hostId}')" class="btn btn-secondary btn-sm mt-2">
                        Retry
                    </button>
                </div>
            `;
            }
        }
    }


    retryLoadItems(hostId) {
        this.loadItemsForHost(hostId);
    }

    // displayItemsForHost mein debug:
    displayItemsForHost(hostId, items) {
        console.log(`🎨 Displaying ${items.length} items for host ${hostId}`);

        const tabContent = document.getElementById(`tab-content-${hostId}`);
        if (!tabContent) {
            console.log(`❌ Tab content not found for host ${hostId}`);
            return;
        }

        const hostData = this.selectedHosts.get(hostId);
        if (!hostData) {
            console.log(`❌ Host data not found for host ${hostId}`);
            return;
        }

        const hostName = hostData.host.name || hostData.host.host || `Host ${hostId}`;

        if (items.length === 0) {
            console.log(`📭 No items to display for host ${hostId}`);
            tabContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <h4>No Monitoring Items Found</h4>
                <p>No monitoring items found for <strong>${hostName}</strong></p>
                <p class="small">This host may not have any items configured in Zabbix.</p>
            </div>
        `;
            return;
        }

        console.log(`📋 Creating item cards for ${items.length} items`);

        let html = `
        <div class="items-section">
            <h4>📡 Monitoring Items for <strong>${hostName}</strong></h4>
            <p class="form-hint">Select one or more items to include in the dashboard</p>
            <div class="items-grid">
    `;

        // Display ALL items, not filtered
        items.forEach((item, index) => {
            const isSelected = hostData.selectedItems.includes(item.itemid);
            console.log(`📦 Item ${index + 1}: ${item.name} (ID: ${item.itemid})`);
            html += this.createItemCardHTML(item, hostId, isSelected);
        });

        html += `
            </div>
            <div class="selected-host-items" id="selected-items-${hostId}" style="margin-top: 20px; display: ${hostData.selectedItems.length > 0 ? 'block' : 'none'}">
                <h5>✅ Selected for this host: ${hostData.selectedItems.length} items</h5>
            </div>
        </div>
    `;

        tabContent.innerHTML = html;
        console.log(`✅ Items displayed for host ${hostId}`);

        // Add event listeners
        this.setupItemSelectionListeners(hostId);
    }



    createItemCardHTML(item, hostId, isSelected = false) {
        const checkboxId = `item-${hostId}-${item.itemid}`;
        const itemName = item.name || 'Unnamed Item';
        const itemKey = item.key_ || 'N/A';
        const itemUnits = item.units || '';
        const itemType = this.getItemTypeName(item.value_type);

        return `
        <div class="item-card ${isSelected ? 'selected' : ''}">
            <div class="item-card-header">
                <div class="item-card-title">${itemName}</div>
                <input type="checkbox" 
                       class="item-checkbox" 
                       id="${checkboxId}"
                       data-hostid="${hostId}"
                       data-itemid="${item.itemid}"
                       data-name="${itemName}"
                       data-key="${itemKey}"
                       ${isSelected ? 'checked' : ''}>
            </div>
            <div class="item-details">
                <div><strong>ID:</strong> <code>${item.itemid}</code></div>
                <div><strong>Key:</strong> <span class="item-key">${itemKey}</span></div>
                ${itemUnits ? `<div><strong>Units:</strong> ${itemUnits}</div>` : ''}
                ${itemType ? `<div><strong>Type:</strong> ${itemType}</div>` : ''}
            </div>
        </div>
    `;
    }

    // Helper function for item type
    getItemTypeName(valueType) {
        const types = {
            0: 'Numeric Float',
            1: 'Character',
            2: 'Log',
            3: 'Numeric Unsigned',
            4: 'Text'
        };
        return types[valueType] || `Type ${valueType}`;
    }
    createHostTab(hostId) {
        const tabsHeader = document.getElementById('hostTabs');
        const tabsContent = document.getElementById('hostTabsContent');

        if (!tabsHeader || !tabsContent) return;

        const hostData = this.selectedHosts.get(hostId);
        if (!hostData) return;

        const hostName = hostData.host.name || hostData.host.host || `Host ${hostId}`;

        // Create tab button
        const tabButton = document.createElement('button');
        tabButton.type = 'button';
        tabButton.className = 'tab-button';
        tabButton.id = `tab-btn-${hostId}`;
        tabButton.textContent = hostName;
        tabButton.addEventListener('click', () => this.switchTab(hostId));

        // Create tab content
        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';
        tabContent.id = `tab-content-${hostId}`;

        // Add to DOM
        tabsHeader.appendChild(tabButton);
        tabsContent.appendChild(tabContent);

        // Switch to this tab if it's the first one
        if (this.selectedHosts.size === 1) {
            this.switchTab(hostId);
        }
    }

    removeHostTab(hostId) {
        // Remove tab button
        const tabBtn = document.getElementById(`tab-btn-${hostId}`);
        if (tabBtn) tabBtn.remove();

        // Remove tab content
        const tabContent = document.getElementById(`tab-content-${hostId}`);
        if (tabContent) tabContent.remove();

        // Switch to another tab if available
        if (this.currentTabHostId === hostId) {
            const remainingHosts = Array.from(this.selectedHosts.keys());
            if (remainingHosts.length > 0) {
                this.switchTab(remainingHosts[0]);
            } else {
                this.currentTabHostId = null;
            }
        }
    }

    switchTab(hostId) {
        // Update current tab
        this.currentTabHostId = hostId;

        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`tab-btn-${hostId}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Update tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const activeContent = document.getElementById(`tab-content-${hostId}`);
        if (activeContent) activeContent.classList.add('active');
    }

    setupItemSelectionListeners(hostId) {
        console.log(`🎯 Setting up listeners for host ${hostId}`);

        const checkboxes = document.querySelectorAll(`input[data-hostid="${hostId}"].item-checkbox`);
        console.log(`🎯 Found ${checkboxes.length} checkboxes for host ${hostId}`);

        checkboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', (e) => {
                console.log(`🔘 Checkbox ${index + 1} changed for host ${hostId}`);
                const hostId = e.target.dataset.hostid;
                const itemId = e.target.dataset.itemid;
                const itemName = e.target.dataset.name;

                const hostData = this.selectedHosts.get(hostId);
                if (!hostData) {
                    console.log(`❌ No host data found for ${hostId}`);
                    return;
                }

                if (e.target.checked) {
                    // Add item
                    hostData.selectedItems.push(itemId);
                    console.log(`✅ Added item ${itemId} to host ${hostId}`);

                    // Update card UI
                    const itemCard = e.target.closest('.item-card');
                    if (itemCard) itemCard.classList.add('selected');

                    // Show selected count for this host
                    const selectedDiv = document.getElementById(`selected-items-${hostId}`);
                    if (selectedDiv) {
                        selectedDiv.style.display = 'block';
                        selectedDiv.innerHTML = `<h5>✅ Selected for this host: ${hostData.selectedItems.length} items</h5>`;
                    }
                } else {
                    // Remove item
                    const index = hostData.selectedItems.indexOf(itemId);
                    if (index > -1) {
                        hostData.selectedItems.splice(index, 1);
                        console.log(`❌ Removed item ${itemId} from host ${hostId}`);
                    }

                    // Update card UI
                    const itemCard = e.target.closest('.item-card');
                    if (itemCard) itemCard.classList.remove('selected');

                    // Update selected count
                    const selectedDiv = document.getElementById(`selected-items-${hostId}`);
                    if (selectedDiv) {
                        if (hostData.selectedItems.length > 0) {
                            selectedDiv.innerHTML = `<h5>✅ Selected for this host: ${hostData.selectedItems.length} items</h5>`;
                        } else {
                            selectedDiv.style.display = 'none';
                        }
                    }
                }

                // Update overall summary
                this.updateSelectedItemsSummary();
            });
        });
    }
    updateSelectedItemsSummary() {
        const summaryDiv = document.getElementById('selectedItemsSummary');
        const itemsListDiv = document.getElementById('selectedItemsList');

        if (!summaryDiv || !itemsListDiv) return;

        // Count total selected items
        let totalItems = 0;
        this.selectedHosts.forEach(data => {
            totalItems += data.selectedItems.length;
        });

        if (totalItems > 0) {
            summaryDiv.style.display = 'block';

            let html = '<div class="selected-items-list">';

            this.selectedHosts.forEach((data, hostId) => {
                if (data.selectedItems.length > 0) {
                    const hostName = data.host.name || data.host.host || `Host ${hostId}`;

                    data.selectedItems.forEach(itemId => {
                        // Find item name from the data
                        const itemName = this.getItemName(hostId, itemId) || `Item ${itemId}`;

                        html += `
                            <div class="selected-item-row">
                                <span class="host-name">${hostName}</span>
                                <span class="item-name">${itemName}</span>
                                <button class="remove-item" data-hostid="${hostId}" data-itemid="${itemId}">×</button>
                            </div>
                        `;
                    });
                }
            });

            html += `</div><div class="mt-3 text-success"><strong>Total: ${totalItems} items selected</strong></div>`;

            itemsListDiv.innerHTML = html;

            // Add event listeners to all remove buttons
            const removeButtons = itemsListDiv.querySelectorAll('.remove-item');
            removeButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const hostId = e.currentTarget.dataset.hostid;
                    const itemId = e.currentTarget.dataset.itemid;
                    this.removeItem(hostId, itemId);
                });
            });
        } else {
            summaryDiv.style.display = 'none';
        }
    }

    getItemName(hostId, itemId) {
        const hostData = this.selectedHosts.get(hostId);
        if (hostData && hostData.hostItems) {
            const item = hostData.hostItems.find(i => i.itemid === itemId);
            return item ? item.name : null;
        }
        return null;
    }

    removeItem(hostId, itemId) {
        const hostData = this.selectedHosts.get(hostId);
        if (hostData) {
            const index = hostData.selectedItems.indexOf(itemId);
            if (index > -1) {
                hostData.selectedItems.splice(index, 1);

                // Update checkbox
                const checkbox = document.querySelector(`input[data-hostid="${hostId}"][data-itemid="${itemId}"]`);
                if (checkbox) {
                    checkbox.checked = false;
                    const itemCard = checkbox.closest('.item-card');
                    if (itemCard) itemCard.classList.remove('selected');
                }

                // Update summary
                this.updateSelectedItemsSummary();
            }
        }
    }

    async viewDashboard(dashboardId) {
        try {
            const response = await fetch(`${API_BASE}/dashboards/${dashboardId}`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load dashboard');
            }

            const dashboard = result.data;
            this.displayDashboardDetails(dashboard);

        } catch (error) {
            console.error('Error viewing dashboard:', error);
            alert(`❌ Failed to load dashboard: ${error.message}`);
        }
    }

    displayDashboardDetails(dashboard) {
        const content = document.getElementById('viewDashboardContent');
        if (!content) return;

        let html = `
            <div class="dashboard-details">
                <div class="detail-row">
                    <div class="detail-label">Dashboard ID:</div>
                    <div class="detail-value"><code>${dashboard.dashboardId || 'N/A'}</code></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Name:</div>
                    <div class="detail-value"><strong>${dashboard.name || 'Unnamed'}</strong></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">User ID:</div>
                    <div class="detail-value">${dashboard.userId || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Privacy:</div>
                    <div class="detail-value">
                        <span class="privacy-badge ${dashboard.private === '1' || dashboard.private === 1 ? 'private' : 'public'}">
                            ${dashboard.private === '1' || dashboard.private === 1 ? '🔒 Private' : '🌐 Public'}
                        </span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Created:</div>
                    <div class="detail-value">${new Date().toLocaleDateString()}</div>
                </div>
            </div>
        `;

        content.innerHTML = html;

        // Show modal
        const viewModal = document.getElementById('viewDashboardModal');
        if (viewModal) viewModal.classList.remove('hidden');
    }

    async deleteDashboard(dashboardId, dashboardName) {
        if (!confirm(`Are you sure you want to delete dashboard "${dashboardName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/dashboards/${dashboardId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Dashboard deleted successfully!');
                this.loadDashboards();
            } else {
                throw new Error(result.message || 'Failed to delete dashboard');
            }

        } catch (error) {
            console.error('Error deleting dashboard:', error);
            alert(`❌ Failed to delete dashboard: ${error.message}`);
        }
    }

    closeCreateModal() {
        const dashboardModal = document.getElementById('dashboardModal');
        if (dashboardModal) dashboardModal.classList.add('hidden');
        this.resetForm();
    }

    closeViewModal() {
        const viewModal = document.getElementById('viewDashboardModal');
        if (viewModal) viewModal.classList.add('hidden');
    }

    // Missing functions that were referenced but not defined
    createHostGroupOption(id, name) {
        const div = document.createElement('div');
        div.className = 'dropdown-option';

        div.innerHTML = `
            <input type="radio" name="hostGroup" id="host-group-${id}" value="${id}">
            <label for="host-group-${id}">${name}</label>
        `;

        const radio = div.querySelector('input');
        radio.addEventListener('change', async (e) => {
            if (e.target.checked) {
                this.selectedHostGroupId = e.target.value;
                this.selectedHostGroupName = e.target.nextElementSibling.textContent;

                // Update UI
                const hostGroupPlaceholder = document.querySelector('#hostGroupsDropdownHeader .dropdown-placeholder');
                const selectedGroupName = document.getElementById('selectedGroupName');
                const selectedGroupInfo = document.getElementById('selectedGroupInfo');

                if (hostGroupPlaceholder) hostGroupPlaceholder.textContent = this.selectedHostGroupName;
                if (selectedGroupName) selectedGroupName.textContent = this.selectedHostGroupName;
                if (selectedGroupInfo) selectedGroupInfo.style.display = 'block';

                // Close dropdown
                const dropdownList = document.getElementById('hostGroupsDropdownList');
                if (dropdownList) dropdownList.classList.add('hidden');

                // Show host selection
                const hostSelectionGroup = document.getElementById('hostSelectionGroup');
                if (hostSelectionGroup) hostSelectionGroup.style.display = 'block';

                // Load hosts for this group
                await this.loadHostsForGroup(id);
            }
        });

        return div;
    }
}

// Create global instance
window.dashboardsManager = new DashboardsManager();

// Export for use
export { DashboardsManager };