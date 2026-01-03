import { fetchGroups } from './groups.js';
import { openCreateUserModal, openEditUserModal, loadRoles } from './modals/users.modal.js';
import { deleteUser } from './services/user.service.js';

const API_BASE = "http://localhost:8007/api/zabbix/v1";
const usersTableBody = document.querySelector("#usersTable tbody");

export const handleAuthError = (status) => {
    if (status === 401 || status === 403) {
        window.location.href = "../html/login.html";
    }
};

const tabs = document.querySelectorAll(".nav-item");
const contents = document.querySelectorAll(".tab-content");

export const fetchUsers = async () => {
    usersTableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            handleAuthError(response.status);
            throw new Error("Failed to fetch users");
        }

        const result = await response.json();
        const users = result.data || [];

        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            return;
        }

        usersTableBody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement("tr");

            // ID
            const tdId = document.createElement("td");
            tdId.textContent = user.userid;
            tr.appendChild(tdId);

            // Username
            const tdUsername = document.createElement("td");
            tdUsername.textContent = user.username;
            tr.appendChild(tdUsername);

            // Name
            const tdName = document.createElement("td");
            tdName.textContent = user.name || "-";
            tr.appendChild(tdName);

            // Surname
            const tdSurname = document.createElement("td");
            tdSurname.textContent = user.surname || "-";
            tr.appendChild(tdSurname);

            // Role
            const tdRole = document.createElement("td");
            tdRole.textContent = user.role?.name || "-";
            tr.appendChild(tdRole);

            // Actions
            const tdActions = document.createElement("td");

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                openEditUserModal(user);
            });

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.style.color = "red";
            deleteBtn.style.marginLeft = "8px";
            deleteBtn.addEventListener("click", async () => {
                if (!confirm(`Are you sure you want to delete "${user.username}"?`)) return;

                try {
                    const res = await deleteUser(user.userid);
                    if (!res.ok) {
                        const err = await res.json();
                        alert(err.message || "Failed to delete user");
                        return;
                    }
                    await fetchUsers();
                } catch (err) {
                    console.error(err);
                    alert("Delete failed");
                }
            });

            tdActions.appendChild(editBtn);
            tdActions.appendChild(deleteBtn);
            tr.appendChild(tdActions);

            usersTableBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        usersTableBody.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
    }
};

document.getElementById("addUserBtn").addEventListener("click", openCreateUserModal);

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");

        showHideButtons(tab.dataset.tab);

        if (tab.dataset.tab === "users") {
            fetchUsers();
        }

        if (tab.dataset.tab === "groups") {
            fetchGroups();
        }
        if (tab.dataset.tab === "dashboards") {
            // Dashboard tab clicked - bas yeh line rakho
            initializeDashboardTab();
        }
    });
});

/* ---------- Dashboard Tab Handler ---------- */
function initializeDashboardTab() {

    const createDashboardBtn = document.getElementById('openModalBtn');
    if (createDashboardBtn) {
        createDashboardBtn.style.display = 'inline-block';
    }

    // Check if dashboards manager exists
    if (window.dashboardsManager) {
        window.dashboardsManager.loadDashboards();
    } else {
        console.log("Dashboards manager not available yet");
    }
}

/* ---------- Function to Show/Hide Buttons ---------- */
function showHideButtons(activeTab) {
    const addUserBtn = document.getElementById('addUserBtn');
    const createDashboardBtn = document.getElementById('openModalBtn');
    const createGroupBtn = document.getElementById('createGroupBtn');

    // Reset all buttons to hidden initially
    if (addUserBtn) {
        addUserBtn.style.display = 'none';
    }
    if (createDashboardBtn) {
        createDashboardBtn.style.display = 'none';
    }
    if (createGroupBtn) {
        createGroupBtn.style.display = 'none';
    }

    // Show appropriate button based on active tab
    switch (activeTab) {
        case 'users':
            if (addUserBtn) {
                addUserBtn.style.display = 'inline-block';
            }
            break;

        case 'groups':
            if (createGroupBtn) createGroupBtn.style.display = 'inline-block';
            break;

        case 'dashboards':
            if (createDashboardBtn) {
                createDashboardBtn.style.display = 'inline-block';
            }
            break;

        default:
            // Hide all buttons for other tabs
            break;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initially hide both buttons
    const addUserBtn = document.getElementById('addUserBtn');
    const createDashboardBtn = document.getElementById('openModalBtn');

    if (addUserBtn) addUserBtn.style.display = 'none';
    if (createDashboardBtn) createDashboardBtn.style.display = 'none';

    // Check which tab is active initially and show appropriate button
    const activeTab = document.querySelector('.nav-item.active');
    if (activeTab && activeTab.dataset.tab) {
        showHideButtons(activeTab.dataset.tab);
    }

    // Load initial data
    loadRoles();
    fetchUsers();
});