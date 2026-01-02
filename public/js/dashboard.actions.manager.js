import { handleAuthError } from "./dashboard.js";

const API_BASE_URL = 'http://localhost:8009/api/zabbix/v1';

const state = {
    dashboardName: '',
    selectedUser: null,
    hostGroups: [],
    selectedHostGroups: [],
    hosts: [],
    selectedHosts: [],
    items: [],
    selectedItems: [],
    currentStep: 1
};

// Add this mode variable at the top
let MODE = 'CREATE'; // or 'EDIT'
let EDIT_DASHBOARD_ID = null;

const modalOverlay = document.getElementById('modalOverlay');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const submitBtn = document.getElementById('submitBtn');
const dashboardNameInput = document.getElementById('dashboardName');
const progressBar = document.getElementById('progressBar');

const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');


const stepElements = [1, 2, 3, 4, 5].map(i => document.getElementById(`step${i}`));
const stepContentElements = [1, 2, 3, 4, 5].map(i => document.getElementById(`step${i}Content`));

const statusElements = {
    name: document.getElementById('nameStatus'),
    user: document.getElementById('userStatus'),
    hostGroups: document.getElementById('hostGroupsStatus'),
    hosts: document.getElementById('hostsStatus'),
    items: document.getElementById('itemsStatus')
};

function init() {
    setupEventListeners();
}

function setupEventListeners() {
    // Modal controls
    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Form controls
    dashboardNameInput.addEventListener('input', handleDashboardNameChange);
    submitBtn.addEventListener('click', handleSubmit);

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // Initialize dropdowns
    initDropdowns();
}

function initDropdowns() {
    // User dropdown
    const userDropdownToggle = document.getElementById('userDropdownToggle');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    userDropdownToggle.addEventListener('click', () => {
        userDropdownMenu.style.display = userDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userDropdownToggle.contains(e.target) && !userDropdownMenu.contains(e.target)) {
            userDropdownMenu.style.display = 'none';
        }
    });

    // Hosts dropdown
    const hostsDropdownToggle = document.getElementById('hostsDropdownToggle');
    const hostsDropdownMenu = document.getElementById('hostsDropdownMenu');

    hostsDropdownToggle.addEventListener('click', () => {
        if (!hostsDropdownToggle.disabled) {
            hostsDropdownMenu.style.display = hostsDropdownMenu.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Items dropdown
    const itemsDropdownToggle = document.getElementById('itemsDropdownToggle');
    const itemsDropdownMenu = document.getElementById('itemsDropdownMenu');

    itemsDropdownToggle.addEventListener('click', () => {
        if (!itemsDropdownToggle.disabled) {
            itemsDropdownMenu.style.display = itemsDropdownMenu.style.display === 'block' ? 'none' : 'block';
        }
    });
}

function openModal() {
    modalOverlay.style.display = 'flex';
    resetForm();
    loadUsers();
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

function resetForm() {
    // Reset state
    state.dashboardName = '';
    state.selectedUser = null;
    state.hostGroups = [];
    state.selectedHostGroups = [];
    state.hosts = [];
    state.selectedHosts = [];
    state.items = [];
    state.selectedItems = [];
    state.currentStep = 1;

    // Reset UI
    dashboardNameInput.value = '';
    document.getElementById('selectedUserText').textContent = 'Select a user';
    document.getElementById('selectedHostsText').textContent = 'Select hosts (multiple allowed)';
    document.getElementById('selectedItemsText').textContent = 'Select items (multiple allowed)';

    // Clear chips
    document.getElementById('hostGroupsChips').innerHTML = '<div class="empty-state">Select a user to load host groups</div>';
    document.getElementById('hostsChips').innerHTML = '';
    document.getElementById('itemsChips').innerHTML = '';

    // Clear dropdowns
    document.getElementById('userDropdownMenu').innerHTML = '<div class="empty-state">Loading users...</div>';
    document.getElementById('hostsDropdownMenu').innerHTML = '<div class="empty-state">Select host groups first</div>';
    document.getElementById('itemsDropdownMenu').innerHTML = '<div class="empty-state">Select hosts first</div>';

    // Clear status messages
    Object.values(statusElements).forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
        el.className = 'status-message';
    });

    // Reset steps
    updateSteps();
    updateProgressBar();

    // Reset buttons
    document.getElementById('userDropdownToggle').disabled = true;
    document.getElementById('hostsDropdownToggle').disabled = true;
    document.getElementById('itemsDropdownToggle').disabled = true;
    submitBtn.disabled = true;

    nextBtn.disabled = true;
    nextBtn.style.display = 'inline-block';
    submitBtn.style.display = 'none';
    backBtn.style.display = 'none';
    nextBtn.textContent = 'Next';
}

function updateSteps() {
    stepElements.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum === state.currentStep) {
            step.classList.add('active');
        } else if (stepNum < state.currentStep) {
            step.classList.add('completed');
        }
    });

    // Show/hide step content
    stepContentElements.forEach((content, index) => {
        content.style.display = (index + 1 === state.currentStep) ? 'block' : 'none';
    });
}

function updateProgressBar() {
    const progress = ((state.currentStep - 1) / 4) * 100;
    progressBar.style.width = `${progress}%`;
}

function handleDashboardNameChange() {
    state.dashboardName = dashboardNameInput.value.trim();

    if (state.dashboardName.length > 0) {
        // Enable user dropdown but don't jump to next step
        document.getElementById('userDropdownToggle').disabled = false;
        // Enable Next button
        nextBtn.disabled = false;
        showStatus('name', 'success', 'Dashboard name is valid');
    } else {
        document.getElementById('userDropdownToggle').disabled = true;
        nextBtn.disabled = true;
        showStatus('name', 'error', 'Please enter a dashboard name');
    }
}

nextBtn.addEventListener('click', goToNextStep);
backBtn.addEventListener('click', goToPreviousStep);

function goToNextStep() {
    if (state.currentStep === 1) {
        // Validate dashboard name
        if (!state.dashboardName.trim()) {
            showStatus('name', 'error', 'Please enter a dashboard name');
            return;
        }
        state.currentStep = 2;
        updateSteps();
        updateProgressBar();
        // Load users if not already loaded
        loadUsers();
    }
    else if (state.currentStep === 2) {
        // Validate user selection
        if (!state.selectedUser) {
            showStatus('user', 'error', 'Please select a user');
            return;
        }
        state.currentStep = 3;
        updateSteps();
        updateProgressBar();
        loadHostGroups(state.selectedUser.userid);
    }
    else if (state.currentStep === 3) {
        // Host groups are auto-selected, so just go to next
        state.currentStep = 4;
        updateSteps();
        updateProgressBar();
        loadHosts();
    }
    else if (state.currentStep === 4) {
        // Validate hosts selection
        if (state.selectedHosts.length === 0) {
            showStatus('hosts', 'error', 'Please select at least one host');
            return;
        }
        state.currentStep = 5;
        updateSteps();
        updateProgressBar();
    }
    else if (state.currentStep === 5) {
        // Validate items selection
        if (state.selectedItems.length === 0) {
            showStatus('items', 'error', 'Please select at least one item');
            return;
        }
        // This should be the last step, so handle submission
        // (This case shouldn't happen with current button logic)
    }

    updateNavigationButtons();
}

function goToPreviousStep() {
    if (state.currentStep > 1) {
        state.currentStep--;
        updateSteps();
        updateProgressBar();
        updateNavigationButtons();
    }
}

function updateNavigationButtons() {
    // Show/hide Back button (show on all steps except step 1)
    backBtn.style.display = state.currentStep > 1 ? 'inline-block' : 'none';

    // Enable/disable Next button based on current step
    if (state.currentStep === 1) {
        // Step 1: Enable Next if dashboard name is entered
        nextBtn.disabled = !state.dashboardName.trim();
    } else if (state.currentStep === 2) {
        // Step 2: Enable Next if user is selected
        nextBtn.disabled = !state.selectedUser;
    } else if (state.currentStep === 3) {
        // Step 3: Host groups are auto-selected, so Next is always enabled
        nextBtn.disabled = false;
    } else if (state.currentStep === 4) {
        // Step 4: Enable Next if at least one host is selected
        nextBtn.disabled = state.selectedHosts.length === 0;
    } else if (state.currentStep === 5) {
        // Step 5: Show Submit button, hide Next button
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
        // Enable Submit button if at least one item is selected
        submitBtn.disabled = state.selectedItems.length === 0;
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }

    // Update Next button text
    if (state.currentStep === 4) {
        nextBtn.textContent = 'Next: Select Items';
    } else if (state.currentStep === 5) {
        nextBtn.textContent = 'Next';
    } else {
        nextBtn.textContent = 'Next';
    }
}

async function loadUsers() {
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    showStatus('user', 'loading', 'Loading users...');

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            credentials: "include"
        });
        const data = await response.json();

        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        if (data.success && data.data && data.data.length > 0) {
            userDropdownMenu.innerHTML = '';

            data.data.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = 'dropdown-item';
                userItem.dataset.userId = user.userid;
                userItem.innerHTML = `
                            <strong>${user.name} ${user.surname}</strong><br>
                            <small>${user.username} (${user.role.name})</small>
                        `;

                userItem.addEventListener('click', () => selectUser(user));
                userDropdownMenu.appendChild(userItem);
            });

            showStatus('user', 'info', 'Select a user from the list');
        } else {
            userDropdownMenu.innerHTML = '<div class="empty-state">No users found</div>';
            showStatus('user', 'error', 'No users available');
        }
    } catch (error) {
        userDropdownMenu.innerHTML = '<div class="empty-state">Failed to load users</div>';
        showStatus('user', 'error', `Error loading users: ${error.message}`);
    }
}

async function selectUser(user) {
    state.selectedUser = user;
    document.getElementById('selectedUserText').textContent = `${user.name} ${user.surname}`;
    document.getElementById('userDropdownMenu').style.display = 'none';

    showStatus('user', 'success', `User selected: ${user.name} ${user.surname}`);

    // Move to step 3
    state.currentStep = 3;
    updateSteps();
    updateProgressBar();

    // Load host groups for this user
    await loadHostGroups(user.userid);
    nextBtn.disabled = false;
}

async function loadHostGroups(userId) {
    const hostGroupsChips = document.getElementById('hostGroupsChips');
    showStatus('hostGroups', 'loading', 'Loading host groups...');

    try {
        const response = await fetch(`${API_BASE_URL}/users/host-groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({ userid: userId })
        });

        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            // Clear previous chips
            hostGroupsChips.innerHTML = '';

            // Extract host groups from response
            const hostGroups = [];
            data.data.forEach(userGroup => {
                if (userGroup.hostGroups && userGroup.hostGroups.length > 0) {
                    userGroup.hostGroups.forEach(hostGroup => {
                        hostGroups.push({
                            groupId: hostGroup.groupId,
                            name: hostGroup.name
                        });
                    });
                }
            });

            if (hostGroups.length > 0) {
                state.hostGroups = hostGroups;
                state.selectedHostGroups = [...hostGroups]; // Auto-select all

                // Display as chips
                hostGroups.forEach(hostGroup => {
                    const chip = createChip(hostGroup.name, hostGroup.groupId, 'hostGroup');
                    hostGroupsChips.appendChild(chip);
                });

                showStatus('hostGroups', 'success', `Loaded ${hostGroups.length} host group(s)`);

                // Enable hosts dropdown
                document.getElementById('hostsDropdownToggle').disabled = false;

                // Move to step 4
                state.currentStep = 4;
                updateSteps();
                updateProgressBar();

                // Load hosts for selected host groups
                await loadHosts();
            } else {
                hostGroupsChips.innerHTML = '<div class="empty-state">No host groups found for this user</div>';
                showStatus('hostGroups', 'error', 'No host groups available');
            }
        } else {
            hostGroupsChips.innerHTML = '<div class="empty-state">No host groups found for this user</div>';
            showStatus('hostGroups', 'error', 'No host groups available');
        }
    } catch (error) {
        hostGroupsChips.innerHTML = '<div class="empty-state">Failed to load host groups</div>';
        showStatus('hostGroups', 'error', `Error loading host groups: ${error.message}`);
    }
}

async function loadHosts() {
    const hostsDropdownMenu = document.getElementById('hostsDropdownMenu');
    const hostsChips = document.getElementById('hostsChips');

    if (state.selectedHostGroups.length === 0) {
        showStatus('hosts', 'error', 'No host groups selected');
        return;
    }

    showStatus('hosts', 'loading', 'Loading hosts...');

    try {
        const hostGroupIds = state.selectedHostGroups.map(hg => hg.groupId);
        const response = await fetch(`${API_BASE_URL}/hosts/by-host-groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({ hostGroupIds })
        });

        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            state.hosts = data.data;
            hostsDropdownMenu.innerHTML = '';

            // Create dropdown items for each host
            data.data.forEach(host => {
                const hostItem = document.createElement('div');
                hostItem.className = 'dropdown-item';
                hostItem.innerHTML = `
                            <input type="checkbox" class="multi-select-checkbox" id="host-${host.hostid}" data-host-id="${host.hostid}">
                            <label for="host-${host.hostid}">${host.name}</label>
                        `;

                const checkbox = hostItem.querySelector('input');
                checkbox.addEventListener('change', () => toggleHostSelection(host));

                hostsDropdownMenu.appendChild(hostItem);
            });

            // Clear any previously selected hosts
            state.selectedHosts = [];
            hostsChips.innerHTML = '';

            showStatus('hosts', 'info', `Loaded ${data.data.length} host(s). Select one or more.`);
        } else {
            hostsDropdownMenu.innerHTML = '<div class="empty-state">No hosts found in selected host groups</div>';
            showStatus('hosts', 'error', 'No hosts available in selected host groups');
        }
    } catch (error) {
        hostsDropdownMenu.innerHTML = '<div class="empty-state">Failed to load hosts</div>';
        showStatus('hosts', 'error', `Error loading hosts: ${error.message}`);
    }
}

function toggleHostSelection(host) {
    const hostsChips = document.getElementById('hostsChips');
    const index = state.selectedHosts.findIndex(h => h.hostid === host.hostid);

    if (index === -1) {
        // Add host
        state.selectedHosts.push(host);
        const chip = createChip(host.name, host.hostid, 'host');
        hostsChips.appendChild(chip);
    } else {
        // Remove host
        state.selectedHosts.splice(index, 1);
        // Remove chip
        const chip = document.querySelector(`[data-id="${host.hostid}"][data-type="host"]`);
        if (chip) chip.remove();
    }

    // Update selected hosts text
    const selectedHostsText = document.getElementById('selectedHostsText');
    if (state.selectedHosts.length > 0) {
        selectedHostsText.textContent = `${state.selectedHosts.length} host(s) selected`;

        // Enable items dropdown if not already enabled
        if (!state.selectedItems.length) {
            document.getElementById('itemsDropdownToggle').disabled = false;
        }

        // Load items for selected hosts
        loadItems();
    } else {
        selectedHostsText.textContent = 'Select hosts (multiple allowed)';
        document.getElementById('itemsDropdownToggle').disabled = true;

        // Clear items
        state.items = [];
        state.selectedItems = [];
        document.getElementById('itemsDropdownMenu').innerHTML = '<div class="empty-state">Select hosts first</div>';
        document.getElementById('itemsChips').innerHTML = '';
        document.getElementById('selectedItemsText').textContent = 'Select items (multiple allowed)';
    }

    updateNavigationButtons();


}

async function loadItems() {
    const itemsDropdownMenu = document.getElementById('itemsDropdownMenu');

    if (state.selectedHosts.length === 0) {
        showStatus('items', 'error', 'No hosts selected');
        return;
    }

    showStatus('items', 'loading', 'Loading items...');

    try {
        const hostIds = state.selectedHosts.map(h => h.hostid);
        const response = await fetch(`${API_BASE_URL}/hosts/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: "include",
            body: JSON.stringify({ hostIds })
        });
        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
            state.items = data.data;
            itemsDropdownMenu.innerHTML = '';

            // Create dropdown items for each item
            data.data.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'dropdown-item';
                itemElement.innerHTML = `
                            <input type="checkbox" class="multi-select-checkbox" id="item-${item.itemid}" data-item-id="${item.itemid}">
                            <label for="item-${item.itemid}"><strong>${item.name}</strong><br><small>${item.key_}</small></label>
                        `;

                const checkbox = itemElement.querySelector('input');
                checkbox.addEventListener('change', () => toggleItemSelection(item));

                itemsDropdownMenu.appendChild(itemElement);
            });

            showStatus('items', 'info', `Loaded ${data.data.length} item(s). Select one or more.`);

            // Enable submit button if we have selections
            if (state.selectedItems.length > 0) {
                submitBtn.disabled = false;
            }
        } else {
            itemsDropdownMenu.innerHTML = '<div class="empty-state">No items found for selected hosts</div>';
            showStatus('items', 'error', 'No items available for selected hosts');
        }
    } catch (error) {
        itemsDropdownMenu.innerHTML = '<div class="empty-state">Failed to load items</div>';
        showStatus('items', 'error', `Error loading items: ${error.message}`);
    }
}

function toggleItemSelection(item) {
    const itemsChips = document.getElementById('itemsChips');
    const index = state.selectedItems.findIndex(i => i.itemid === item.itemid);

    if (index === -1) {
        // Add item
        state.selectedItems.push(item);
        const chip = createChip(item.name, item.itemid, 'item');
        itemsChips.appendChild(chip);
    } else {
        // Remove item
        state.selectedItems.splice(index, 1);
        // Remove chip
        const chip = document.querySelector(`[data-id="${item.itemid}"][data-type="item"]`);
        if (chip) chip.remove();
    }

    // Update selected items text
    const selectedItemsText = document.getElementById('selectedItemsText');
    if (state.selectedItems.length > 0) {
        selectedItemsText.textContent = `${state.selectedItems.length} item(s) selected`;

        // Enable submit button
        submitBtn.disabled = false;
    } else {
        selectedItemsText.textContent = 'Select items (multiple allowed)';
        submitBtn.disabled = true;
    }
    submitBtn.disabled = state.selectedItems.length === 0;

    updateNavigationButtons();
}

function createChip(text, id, type) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.dataset.id = id;
    chip.dataset.type = type;

    chip.innerHTML = `
                ${text}
                <button class="chip-remove" type="button">&times;</button>
            `;

    // Add remove event
    const removeBtn = chip.querySelector('.chip-remove');
    removeBtn.addEventListener('click', () => removeChip(id, type));

    return chip;
}

function removeChip(id, type) {
    if (type === 'hostGroup') {
        // Can't remove auto-selected host groups
        showStatus('hostGroups', 'info', 'Host groups are auto-selected and cannot be removed');
        return;
    } else if (type === 'host') {
        // Remove host from selection
        const index = state.selectedHosts.findIndex(h => h.hostid === id);
        if (index !== -1) {
            state.selectedHosts.splice(index, 1);

            // Uncheck checkbox in dropdown
            const checkbox = document.querySelector(`#host-${id}`);
            if (checkbox) checkbox.checked = false;

            // Update UI
            const selectedHostsText = document.getElementById('selectedHostsText');
            if (state.selectedHosts.length > 0) {
                selectedHostsText.textContent = `${state.selectedHosts.length} host(s) selected`;
            } else {
                selectedHostsText.textContent = 'Select hosts (multiple allowed)';
                document.getElementById('itemsDropdownToggle').disabled = true;
                state.currentStep = 4;
                updateSteps();
                updateProgressBar();
            }

            // Clear items if no hosts selected
            if (state.selectedHosts.length === 0) {
                state.items = [];
                state.selectedItems = [];
                document.getElementById('itemsDropdownMenu').innerHTML = '<div class="empty-state">Select hosts first</div>';
                document.getElementById('itemsChips').innerHTML = '';
                document.getElementById('selectedItemsText').textContent = 'Select items (multiple allowed)';
                submitBtn.disabled = true;
            } else {
                // Reload items for remaining hosts
                loadItems();
            }
        }
    } else if (type === 'item') {
        // Remove item from selection
        const index = state.selectedItems.findIndex(i => i.itemid === id);
        if (index !== -1) {
            state.selectedItems.splice(index, 1);

            // Uncheck checkbox in dropdown
            const checkbox = document.querySelector(`#item-${id}`);
            if (checkbox) checkbox.checked = false;

            // Update UI
            const selectedItemsText = document.getElementById('selectedItemsText');
            if (state.selectedItems.length > 0) {
                selectedItemsText.textContent = `${state.selectedItems.length} item(s) selected`;
            } else {
                selectedItemsText.textContent = 'Select items (multiple allowed)';
                submitBtn.disabled = true;
            }
        }
    }
}

function showStatus(type, status, message) {
    const element = statusElements[type];
    if (!element) return;

    element.textContent = message;
    element.className = `status-message status-${status}`;
    element.style.display = 'block';

    // Auto-hide success messages after 3 seconds
    if (status === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

// EDIT CHANGES 

window.openEditModal = function (dashboardId, dashboardName) {
    MODE = 'EDIT';
    EDIT_DASHBOARD_ID = dashboardId;

    const modalTitle = document.querySelector('.modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Edit Dashboard: ${dashboardName}`;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.textContent = 'Update Dashboard';
    }

    openModal();
    loadDashboardData(dashboardId);
}

async function loadDashboardData(dashboardId) {
    try {
        showStatus('items', 'loading', 'Loading dashboard data...');

        // Fetch dashboard details from API
        const response = await fetch(`${API_BASE_URL}/dashboards/single/${dashboardId}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        if (data.success && data.data) {
            const dashboard = data.data;

            // Pre-fill the form with dashboard data
            prefillForm(dashboard);
        } else {
            throw new Error(data.message || 'Failed to load dashboard data');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showStatus('items', 'error', `Failed to load dashboard: ${error.message}`);
        setTimeout(() => closeModal(), 2000);
    }
}

function prefillForm(dashboard) {
    if (dashboardNameInput) {
        dashboardNameInput.value = dashboard.name || '';
        state.dashboardName = dashboard.name || '';
        handleDashboardNameChange(); // Trigger validation
    }

    // 2. Set user selection (you need to fetch user details)
    // This might require additional API calls
    // ...

    // 3. Load host groups for the user
    // 4. Select hosts that are in the dashboard
    // 5. Select items that are in the dashboard

    showStatus('items', 'success', 'Dashboard data loaded');
}

async function handleSubmit() {

    submitBtn.disabled = true;
    submitBtn.textContent = MODE === 'CREATE' ? 'Creating...' : 'Updating...';

    showStatus('items', 'loading', MODE === 'CREATE' ? 'Creating dashboard...' : 'Updating dashboard...');

    // Validate all required data
    if (!state.dashboardName.trim()) {
        showStatus('name', 'error', 'Dashboard name is required');
        state.currentStep = 1;
        updateSteps();
        updateProgressBar();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';
        return;
    }

    if (!state.selectedUser) {
        showStatus('user', 'error', 'Please select a user');
        state.currentStep = 2;
        updateSteps();
        updateProgressBar();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';
        return;
    }

    if (state.selectedHostGroups.length === 0) {
        showStatus('hostGroups', 'error', 'No host groups selected');
        state.currentStep = 3;
        updateSteps();
        updateProgressBar();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';
        return;
    }

    if (state.selectedHosts.length === 0) {
        showStatus('hosts', 'error', 'Please select at least one host');
        state.currentStep = 4;
        updateSteps();
        updateProgressBar();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';
        return;
    }

    if (state.selectedItems.length === 0) {
        showStatus('items', 'error', 'Please select at least one item');
        state.currentStep = 5;
        updateSteps();
        updateProgressBar();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';
        return;
    }

    // Prepare payload
    const payload = {
        dashboardName: state.dashboardName,
        userId: state.selectedUser.userid,
        hostGroupIds: state.selectedHostGroups.map(hg => hg.groupId),
        hostIds: state.selectedHosts.map(h => h.hostid),
        itemIds: state.selectedItems.map(i => i.itemid)
    };

    console.log('Dashboard Creation Payload:', JSON.stringify(payload, null, 2));

    try {
        let url = `${API_BASE_URL}/dashboards/client/new`;
        let method = 'POST';

        if (MODE === 'EDIT' && EDIT_DASHBOARD_ID) {
            url = `${API_BASE_URL}/dashboards/${EDIT_DASHBOARD_ID}`;
            method = 'PUT'; // or 'PATCH' depending on your API
            payload.dashboardId = EDIT_DASHBOARD_ID;
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: "include",
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            showStatus('items', 'success', `Dashboard "${state.dashboardName}" created successfully!`);

            alert(`✅ Dashboard "${state.dashboardName}" created successfully!\n\nDashboard ID: ${data.dashboardId || 'N/A'}`);

            setTimeout(() => {
                closeModal();
            }, 1500);

        } else {
            throw new Error(data.message || 'Failed to create dashboard');
        }

    } catch (error) {
        console.error('Error creating dashboard:', error);

        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Dashboard';

        showStatus('items', 'error', `Failed to create dashboard: ${error.message}`);
        alert(`❌ Error creating dashboard:\n\n${error.message}\n\nPlease check your selections and try again.`);
    }
}

document.addEventListener('DOMContentLoaded', init);