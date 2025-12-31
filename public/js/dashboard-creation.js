// /* ---------- DASHBOARD CREATION FUNCTIONS ---------- */

// // DOM Elements for Dashboard
// const createDashboardBtn = document.getElementById("createDashboardBtn");
// const dashboardModal = document.getElementById("dashboardModal");
// const dashboardForm = document.getElementById("dashboardForm");
// const dashboardModalTitle = document.getElementById("dashboardModalTitle");
// const cancelDashboardBtn = document.getElementById("cancelDashboardBtn");
// const closeDashboardModal = document.getElementById("closeDashboardModal");

// // Dashboard Dropdown Elements
// const clientUserDropdownHeader = document.getElementById("clientUserDropdownHeader");
// const clientUserDropdownList = document.getElementById("clientUserDropdownList");
// const clientUserOptions = document.getElementById("clientUserOptions");
// const searchClientUsersInput = document.getElementById("searchClientUsers");
// const selectedClientUserContainer = document.getElementById("selectedClientUser");

// const hostGroupsDropdownHeader = document.getElementById("hostGroupsDropdownHeader");
// const hostGroupsDropdownList = document.getElementById("hostGroupsDropdownList");
// const hostGroupsOptions = document.getElementById("hostGroupsOptions");
// const searchHostGroupsInput = document.getElementById("searchHostGroups");
// const selectedHostGroupsContainer = document.getElementById("selectedHostGroups");

// const dashboardNameInput = document.getElementById("dashboardNameInput");

// // Dashboard Global State
// let selectedClientUserId = null;
// let selectedHostGroupIds = new Set();

// /* ---------- INITIALIZE DASHBOARD MODAL ---------- */
// const initializeDashboardModal = () => {
//     // Close modal on cancel
//     if (cancelDashboardBtn) {
//         cancelDashboardBtn.addEventListener("click", () => {
//             dashboardModal.classList.add("hidden");
//             resetDashboardForm();
//         });
//     }

//     // Close modal with X button
//     if (closeDashboardModal) {
//         closeDashboardModal.addEventListener("click", () => {
//             dashboardModal.classList.add("hidden");
//             resetDashboardForm();
//         });
//     }

//     // Close modal when clicking outside
//     window.addEventListener('click', (e) => {
//         if (e.target === dashboardModal) {
//             dashboardModal.classList.add("hidden");
//             resetDashboardForm();
//         }
//     });

//     // Close modal on Escape key
//     document.addEventListener('keydown', (e) => {
//         if (e.key === 'Escape' && !dashboardModal.classList.contains('hidden')) {
//             dashboardModal.classList.add("hidden");
//             resetDashboardForm();
//         }
//     });
// };

// /* ---------- DASHBOARD DROPDOWN FUNCTIONS ---------- */
// const initializeDashboardDropdowns = () => {
//     // Client User Dropdown
//     if (clientUserDropdownHeader) {
//         clientUserDropdownHeader.addEventListener('click', (e) => {
//             e.stopPropagation();
//             clientUserDropdownList.classList.toggle('hidden');
//             hostGroupsDropdownList.classList.add('hidden');
//         });
//     }

//     // Host Groups Dropdown
//     if (hostGroupsDropdownHeader) {
//         hostGroupsDropdownHeader.addEventListener('click', (e) => {
//             e.stopPropagation();
//             hostGroupsDropdownList.classList.toggle('hidden');
//             clientUserDropdownList.classList.add('hidden');
//         });
//     }

//     // Search functionality
//     if (searchClientUsersInput) {
//         searchClientUsersInput.addEventListener('input', (e) => {
//             const searchTerm = e.target.value.toLowerCase();
//             filterDashboardOptions(clientUserOptions, searchTerm);
//         });
//     }

//     if (searchHostGroupsInput) {
//         searchHostGroupsInput.addEventListener('input', (e) => {
//             const searchTerm = e.target.value.toLowerCase();
//             filterDashboardOptions(hostGroupsOptions, searchTerm);
//         });
//     }

//     // Close dropdowns when clicking outside
//     document.addEventListener('click', (e) => {
//         if (!clientUserDropdownHeader?.contains(e.target) && !clientUserDropdownList?.contains(e.target)) {
//             clientUserDropdownList?.classList.add('hidden');
//         }
//         if (!hostGroupsDropdownHeader?.contains(e.target) && !hostGroupsDropdownList?.contains(e.target)) {
//             hostGroupsDropdownList?.classList.add('hidden');
//         }
//     });
// };

// const filterDashboardOptions = (container, searchTerm) => {
//     if (!container) return;
//     const options = container.querySelectorAll('.dropdown-option');
//     options.forEach(option => {
//         const label = option.querySelector('label').textContent.toLowerCase();
//         option.style.display = label.includes(searchTerm) ? 'flex' : 'none';
//     });
// };

// /* ---------- DASHBOARD OPTION ELEMENTS ---------- */
// const createDashboardOptionElement = (id, name, type, isSelected = false) => {
//     const div = document.createElement('div');
//     div.className = 'dropdown-option';

//     if (type === 'clientUser') {
//         // Single select for client user (radio button)
//         const radioId = `client-user-${id}`;
//         div.innerHTML = `
//             <input type="radio" id="${radioId}" name="clientUser" value="${id}" ${isSelected ? 'checked' : ''}>
//             <label for="${radioId}">${name}</label>
//         `;

//         const radio = div.querySelector('input');
//         radio.addEventListener('change', (e) => {
//             if (e.target.checked) {
//                 selectedClientUserId = e.target.value;
//                 const itemName = e.target.nextElementSibling.textContent;
//                 addClientUserTag(e.target.value, itemName, selectedClientUserContainer);
//             }
//         });

//     } else if (type === 'hostGroup') {
//         // Multi select for host groups (checkbox)
//         const checkboxId = `host-group-${id}`;
//         div.innerHTML = `
//             <input type="checkbox" id="${checkboxId}" value="${id}" ${isSelected ? 'checked' : ''}>
//             <label for="${checkboxId}">${name}</label>
//         `;

//         const checkbox = div.querySelector('input');
//         checkbox.addEventListener('change', (e) => {
//             const itemId = e.target.value;
//             const itemName = e.target.nextElementSibling.textContent;

//             if (e.target.checked) {
//                 selectedHostGroupIds.add(itemId);
//                 addHostGroupTag(itemId, itemName, selectedHostGroupsContainer);
//             } else {
//                 selectedHostGroupIds.delete(itemId);
//                 removeDashboardTag(itemId, selectedHostGroupsContainer);
//             }
//         });
//     }

//     return div;
// };

// const addClientUserTag = (id, name, container) => {
//     if (!container) return;
    
//     // Clear previous selection
//     container.innerHTML = '';
    
//     const tag = document.createElement('div');
//     tag.className = 'tag';
//     tag.dataset.id = id;
//     tag.innerHTML = `
//         ${name}
//         <button type="button" class="tag-remove" data-id="${id}">&times;</button>
//     `;

//     container.appendChild(tag);

//     // Add remove functionality
//     tag.querySelector('.tag-remove').addEventListener('click', (e) => {
//         e.stopPropagation();
//         const itemId = e.target.dataset.id;
        
//         removeDashboardTag(itemId, container);
        
//         // Uncheck the corresponding radio button
//         const radio = document.querySelector(`input[value="${itemId}"]`);
//         if (radio) radio.checked = false;
        
//         selectedClientUserId = null;
//     });
// };

// const addHostGroupTag = (id, name, container) => {
//     if (!container) return;

//     // Check if tag already exists
//     if (container.querySelector(`[data-id="${id}"]`)) {
//         return;
//     }

//     const tag = document.createElement('div');
//     tag.className = 'tag';
//     tag.dataset.id = id;
//     tag.innerHTML = `
//         ${name}
//         <button type="button" class="tag-remove" data-id="${id}">&times;</button>
//     `;

//     container.appendChild(tag);

//     // Add remove functionality
//     tag.querySelector('.tag-remove').addEventListener('click', (e) => {
//         e.stopPropagation();
//         const itemId = e.target.dataset.id;
        
//         removeDashboardTag(itemId, container);
        
//         // Uncheck the corresponding checkbox
//         const checkbox = document.querySelector(`input[value="${itemId}"]`);
//         if (checkbox) checkbox.checked = false;
        
//         selectedHostGroupIds.delete(itemId);
//     });
// };

// const removeDashboardTag = (id, container) => {
//     if (!container) return;
//     const tag = container.querySelector(`[data-id="${id}"]`);
//     if (tag) tag.remove();
// };

// /* ---------- LOAD DASHBOARD DATA ---------- */
// const loadDashboardData = async () => {
//     try {
//         // Load client users
//         const usersRes = await fetch("http://localhost:8009/api/zabbix/v1/users", {
//             credentials: "include"
//         });
//         const allUsers = (await usersRes.json()).data || [];

//         // Load host groups
//         const hostRes = await fetch("http://localhost:8009/api/zabbix/v1/hosts/groups", {
//             credentials: "include"
//         });
//         const allHosts = (await hostRes.json()).data || [];

//         return { users: allUsers, hostGroups: allHosts };
//     } catch (error) {
//         console.error('Error loading dashboard data:', error);
//         return { users: [], hostGroups: [] };
//     }
// };

// /* ---------- POPULATE DASHBOARD FORM ---------- */
// const populateDashboardForm = async () => {
//     console.log('Populating dashboard form...');

//     // Clear previous selections
//     selectedClientUserId = null;
//     selectedHostGroupIds = new Set();

//     if (selectedClientUserContainer) selectedClientUserContainer.innerHTML = '';
//     if (selectedHostGroupsContainer) selectedHostGroupsContainer.innerHTML = '';
//     if (clientUserOptions) clientUserOptions.innerHTML = '';
//     if (hostGroupsOptions) hostGroupsOptions.innerHTML = '';
//     if (dashboardNameInput) dashboardNameInput.value = '';

//     try {
//         const { users, hostGroups } = await loadDashboardData();

//         console.log('Total users:', users.length);
//         console.log('Total host groups:', hostGroups.length);

//         // Populate client users dropdown (show username, send userid)
//         users.forEach(user => {
//             if (!clientUserOptions) return;

//             const option = createDashboardOptionElement(
//                 user.userid,
//                 user.username,
//                 'clientUser',
//                 false
//             );
//             clientUserOptions.appendChild(option);
//         });

//         // Populate host groups dropdown (show name, send groupid)
//         hostGroups.forEach(hostGroup => {
//             if (!hostGroupsOptions) return;

//             const option = createDashboardOptionElement(
//                 hostGroup.groupid,
//                 hostGroup.name,
//                 'hostGroup',
//                 false
//             );
//             hostGroupsOptions.appendChild(option);
//         });

//     } catch (error) {
//         console.error('Error populating dashboard form:', error);
//         alert('Failed to load data. Please try again.');
//     }
// };

// /* ---------- RESET DASHBOARD FORM ---------- */
// const resetDashboardForm = () => {
//     selectedClientUserId = null;
//     selectedHostGroupIds = new Set();
    
//     if (selectedClientUserContainer) selectedClientUserContainer.innerHTML = '';
//     if (selectedHostGroupsContainer) selectedHostGroupsContainer.innerHTML = '';
//     if (dashboardNameInput) dashboardNameInput.value = '';
    
//     // Uncheck all checkboxes and radios
//     document.querySelectorAll('#clientUserOptions input[type="radio"]').forEach(radio => {
//         radio.checked = false;
//     });
    
//     document.querySelectorAll('#hostGroupsOptions input[type="checkbox"]').forEach(checkbox => {
//         checkbox.checked = false;
//     });
// };

// /* ---------- OPEN DASHBOARD CREATION MODAL ---------- */
// if (createDashboardBtn) {
//     createDashboardBtn.addEventListener("click", async () => {
//         console.log('Opening dashboard creation modal');
        
//         if (dashboardModalTitle) dashboardModalTitle.textContent = 'Create New Dashboard';
        
//         if (dashboardModal) {
//             dashboardModal.classList.remove("hidden");
//             await populateDashboardForm();
//         }
//     });
// }

// /* ---------- SUBMIT DASHBOARD FORM ---------- */
// if (dashboardForm) {
//     dashboardForm.addEventListener("submit", async e => {
//         e.preventDefault();

//         const dashboardName = dashboardNameInput ? dashboardNameInput.value.trim() : '';
//         const clientUserId = selectedClientUserId;
//         const hostGroupIds = Array.from(selectedHostGroupIds);

//         console.log('Dashboard form submission:', { 
//             dashboardName, 
//             clientUserId, 
//             hostGroupIds 
//         });

//         // Validation
//         if (!clientUserId) {
//             alert('Please select a client user');
//             return;
//         }

//         if (!dashboardName) {
//             alert('Please enter dashboard name');
//             return;
//         }

//         if (!hostGroupIds.length) {
//             alert('Select at least one host group');
//             return;
//         }

//         const submitBtn = dashboardForm.querySelector('button[type="submit"]');
//         const originalText = submitBtn.textContent;
//         submitBtn.textContent = "Creating...";
//         submitBtn.disabled = true;

//         try {
//             console.log('Creating dashboard...');
            
//             // Note: We're using the first host group ID for now
//             // You can modify this to handle multiple host groups
//             const firstHostGroupId = hostGroupIds[0];
            
//             const createRes = await fetch("http://localhost:8009/api/zabbix/v1/dashboards/client-traffic", {
//                 method: "POST",
//                 credentials: "include",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     clientUserId,
//                     hostGroupId: firstHostGroupId,
//                     dashboardName
//                 })
//             });

//             const createResult = await createRes.json();
//             console.log('Create dashboard response:', createResult);

//             if (!createResult.success) {
//                 throw new Error(createResult.message || "Dashboard creation failed");
//             }

//             // Show success message
//             alert(`✅ Dashboard created successfully!\nDashboard ID: ${createResult.data.dashboardId}`);

//             // Close modal and reset form
//             if (dashboardModal) dashboardModal.classList.add("hidden");
//             resetDashboardForm();

//             // Refresh dashboards list
//             fetchDashboards();

//         } catch (err) {
//             console.error("Error in dashboard creation:", err);
//             alert('Dashboard creation failed: ' + (err.message || "Unknown error"));
//         } finally {
//             submitBtn.textContent = originalText;
//             submitBtn.disabled = false;
//         }
//     });
// }

// /* ---------- FETCH AND DISPLAY DASHBOARDS ---------- */
// export const fetchDashboards = async () => {
//     const dashboardsList = document.getElementById("dashboardsList");
//     if (!dashboardsList) return;

//     dashboardsList.innerHTML = '<div class="dashboard-loading">Loading dashboards...</div>';

//     try {
//         // Fetch all dashboards (you might want to add user filtering later)
//         const res = await fetch("http://localhost:8009/api/zabbix/v1/dashboards", {
//             credentials: "include"
//         });

//         let dashboards = [];
        
//         try {
//             const result = await res.json();
//             dashboards = result.data || [];
//         } catch {
//             // If no dashboards endpoint exists yet, show empty state
//             dashboardsList.innerHTML = `
//                 <div class="dashboard-empty">
//                     <div class="empty-icon">📊</div>
//                     <h3>No Dashboards Yet</h3>
//                     <p>Create your first dashboard to get started</p>
//                 </div>
//             `;
//             return;
//         }

//         if (!dashboards.length) {
//             dashboardsList.innerHTML = `
//                 <div class="dashboard-empty">
//                     <div class="empty-icon">📊</div>
//                     <h3>No Dashboards Yet</h3>
//                     <p>Create your first dashboard to get started</p>
//                 </div>
//             `;
//             return;
//         }

//         // Display dashboards
//         let content = '<div class="dashboard-grid">';
        
//         dashboards.forEach(dashboard => {
//             content += `
//                 <div class="dashboard-card">
//                     <h4>${dashboard.name || 'Unnamed Dashboard'}</h4>
//                     <div class="meta">
//                         <span>👤 User: ${dashboard.userId || 'Unknown'}</span>
//                         <span>🆔 ID: ${dashboard.dashboardId || 'N/A'}</span>
//                         <span>${dashboard.private ? '🔒 Private' : '🌐 Public'}</span>
//                     </div>
//                     <div class="dashboard-actions">
//                         <button onclick="viewDashboard('${dashboard.dashboardId}')" class="btn-action view-btn">
//                             View
//                         </button>
//                         <button onclick="editDashboard('${dashboard.dashboardId}')" class="btn-action edit-btn">
//                             Edit
//                         </button>
//                         <button onclick="deleteDashboard('${dashboard.dashboardId}')" class="btn-action delete-btn">
//                             Delete
//                         </button>
//                     </div>
//                 </div>
//             `;
//         });

//         content += '</div>';
//         dashboardsList.innerHTML = content;

//     } catch (err) {
//         console.error("Error loading dashboards:", err);
//         dashboardsList.innerHTML = `
//             <div class="dashboard-error">
//                 <h3>Error Loading Dashboards</h3>
//                 <p>${err.message || "Please check your connection"}</p>
//                 <button onclick="fetchDashboards()" class="btn btn-secondary mt-2">
//                     Retry
//                 </button>
//             </div>
//         `;
//     }
// };

// /* ---------- DASHBOARD ACTIONS ---------- */
// window.viewDashboard = async (dashboardId) => {
//     try {
//         // Open dashboard in new tab or show details
//         const res = await fetch(`http://localhost:8009/api/zabbix/v1/dashboards/${dashboardId}`, {
//             credentials: "include"
//         });
//         const dashboard = await res.json();
        
//         // Show dashboard details in modal
//         alert(`Dashboard Details:\nName: ${dashboard.data.name}\nID: ${dashboard.data.dashboardId}\nUser: ${dashboard.data.userId}`);
//     } catch (err) {
//         console.error("Error viewing dashboard:", err);
//         alert("Failed to view dashboard details");
//     }
// };

// window.editDashboard = async (dashboardId) => {
//     // You can implement edit functionality here
//     alert(`Edit dashboard ${dashboardId} - Feature coming soon!`);
// };

// window.deleteDashboard = async (dashboardId) => {
//     if (!confirm('Are you sure you want to delete this dashboard?')) return;

//     try {
//         const res = await fetch(`http://localhost:8009/api/zabbix/v1/dashboards/${dashboardId}`, {
//             method: "DELETE",
//             credentials: "include"
//         });

//         const result = await res.json();
        
//         if (result.success) {
//             alert('✅ Dashboard deleted successfully');
//             fetchDashboards();
//         } else {
//             throw new Error(result.message);
//         }
//     } catch (err) {
//         console.error("Error deleting dashboard:", err);
//         alert('❌ Failed to delete dashboard: ' + err.message);
//     }
// };

// /* ---------- INITIALIZE DASHBOARD PAGE ---------- */
// const initializeDashboardPage = () => {
//     console.log('Initializing dashboard page...');

//     // Initialize modal
//     initializeDashboardModal();

//     // Initialize dropdowns
//     initializeDashboardDropdowns();

//     // Load dashboards on page load
//     fetchDashboards();

//     console.log('Dashboard page initialized');
// };

// // Export functions for use in main dashboard.js
// export { 
//     initializeDashboardPage, 
//     fetchDashboards 
// };