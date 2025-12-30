const API_BASE = "http://localhost:8009/api/zabbix/v1";
import { openCreateUserModal, openEditUserModal } from './modals/users.modal.js';

/* ---------- Auth Guard ---------- */
const handleAuthError = (status) => {
    if (status === 401 || status === 403) {
        window.location.href = "../html/login.html";
    }
};

/* ---------- Tabs ---------- */
const tabs = document.querySelectorAll(".nav-item");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        contents.forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab).classList.add("active");

        if (tab.dataset.tab === "users") {
            fetchUsers();
        }
    });
});

/* ---------- Users ---------- */
const usersTableBody = document.querySelector("#usersTable tbody");

// Make fetchUsers available globally for the modal to refresh table
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

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener('click', () => {
                openEditUserModal(user);
            });

            const td = document.createElement("td");
            td.appendChild(editButton);

            tr.innerHTML = `
                <td>${user.userid}</td>
                <td>${user.username}</td>
                <td>${user.name || "-"}</td>
                <td>${user.surname || "-"}</td>
                <td>${user.role?.name || "-"}</td>
            `;

            tr.appendChild(td);
            usersTableBody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        usersTableBody.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
    }
};

/* ---------- Add User Button ---------- */
document.getElementById("addUserBtn").addEventListener("click", openCreateUserModal);

/* ---------- Initial Load ---------- */
fetchUsers();