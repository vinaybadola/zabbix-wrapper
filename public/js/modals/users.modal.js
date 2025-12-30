import { submitUser } from '../services/user.service.js';
import { fetchUsers } from '../dashboard.js';

let mode = "create";
let roles = [];

const modal = document.getElementById("userModal");
const form = document.getElementById("userForm");
const submitBtn = document.getElementById("submitBtn");
const roleSelect = document.getElementById("roleId");
const cancelBtn = document.querySelector('.actions button[type="button"]');

// Load roles for dropdown
export const loadRoles = async () => {
    try {
        const response = await fetch('http://localhost:8009/api/zabbix/v1/roles', {
            method: "GET",
            credentials: "include"
        });
        
        if (response.ok) {
            roles = await response.json();
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

// Open modal for creating user
export const openCreateUserModal = () => {
    mode = "create";
    form.reset();
    document.getElementById("userid").value = "";
    document.getElementById("passwd").required = true;
    submitBtn.textContent = "Create User";
    modal.classList.remove("hidden");
};

// Open modal for editing user
export const openEditUserModal = (user) => {
    mode = "update";
    
    document.getElementById("userid").value = user.userid;
    document.getElementById("username").value = user.username;
    document.getElementById("name").value = user.name || '';
    document.getElementById("surname").value = user.surname || '';
    document.getElementById("passwd").required = false;
    document.getElementById("passwd").placeholder = "Leave blank to keep current password";
    
    // Set role if available
    if (user.role && user.role.roleid) {
        document.getElementById("roleId").value = user.role.roleid;
    }
    
    submitBtn.textContent = "Update User";
    modal.classList.remove("hidden");
};

// Close modal
export const closeModal = () => {
    modal.classList.add("hidden");
    form.reset();
};

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
        username: document.getElementById("username").value,
        passwd: document.getElementById("passwd").value,
        name: document.getElementById("name").value,
        surname: document.getElementById("surname").value,
        roleId: document.getElementById("roleId").value
    };
    
    // Add userid for update
    if (mode === "update") {
        userData.userid = document.getElementById("userid").value;
        if (!userData.passwd) {
            delete userData.passwd;
        }
    }
    
    try {
        const response = await submitUser(userData, mode);
        
        if (response.ok) {
            closeModal();
            // Refresh the users list
            await fetchUsers();
        } else {
            const error = await response.json();
            alert(`Error: ${error.message || 'Something went wrong'}`);
        }
    } catch (err) {
        console.error('Error submitting user:', err);
        alert('Failed to save user');
    }
});

// Cancel button event
cancelBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

loadRoles();