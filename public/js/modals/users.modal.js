import { submitUser } from '../services/user.service.js';
import { fetchUsers } from '../dashboard.js';

let mode = "create";
let roles = [];

const modal = document.getElementById("userModal");
const form = document.getElementById("userForm");
const submitBtn = document.getElementById("submitUserBtn");
const roleSelect = document.getElementById("roleId");
const cancelBtn = document.querySelector('.actions button[type="button"]');

// Load roles
export const loadRoles = async () => {
    try {
        const res = await fetch('http://localhost:8007/api/zabbix/v1/roles', {
            method: "GET",
            credentials: "include"
        });
        if (res.ok) {
            roles = await res.json();
            populateRoleDropdown();
        }
    } catch (err) {
        console.error('Failed to load roles:', err);
    }
};

const populateRoleDropdown = () => {
    roleSelect.innerHTML = '<option value="">Select Role</option>';
    roles.data.forEach(role => {
        const option = document.createElement('option');
        option.value = role.roleid;
        option.textContent = role.name;
        roleSelect.appendChild(option);
    });
};

// Open modal
export const openCreateUserModal = () => {
    mode = "create";
    form.reset();
    document.getElementById("userid").value = "";
    document.getElementById("passwd").required = true;
    submitBtn.textContent = "Create User";
    modal.classList.remove("hidden");
};

export const openEditUserModal = (user) => {
    mode = "update";
    document.getElementById("userid").value = user.userid;
    document.getElementById("username").value = user.username;
    document.getElementById("name").value = user.name || '';
    document.getElementById("surname").value = user.surname || '';
    document.getElementById("passwd").required = false;
    document.getElementById("passwd").placeholder = "Leave blank to keep current password";
    if (user.role?.roleid) roleSelect.value = user.role.roleid;
    submitBtn.textContent = "Update User";
    modal.classList.remove("hidden");
};

// Close modal
export const closeModal = () => {
    modal.classList.add("hidden");
    form.reset();
};

// Submit form
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userData = {
        username: document.getElementById("username").value,
        passwd: document.getElementById("passwd").value,
        name: document.getElementById("name").value,
        surname: document.getElementById("surname").value,
        roleId: roleSelect.value
    };
    if (mode === "update") {
        userData.userid = document.getElementById("userid").value;
        if (!userData.passwd) delete userData.passwd;
    }
    try {
        const res = await submitUser(userData, mode);
        if (res.ok) {
            closeModal();
            await fetchUsers();
        } else {
            const err = await res.json();
            alert(err.message || 'Something went wrong');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to save user');
    }
});

cancelBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

loadRoles();
