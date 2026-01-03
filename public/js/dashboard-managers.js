import { handleAuthError } from "./dashboard.js";

const API_BASE = "http://localhost:8007/api/zabbix/v1";

class DashboardsManager {
    constructor() {
        this.searchTimeout = null;
        this.currentSearchTerm = '';
        this.isSearching = false;

        setTimeout(() => {
            this.initialize();
        }, 100);
    }

    initialize() {

        this.dashboardsContainer = document.getElementById('dashboardsContainer');
        this.searchInput = document.getElementById('dashboardSearch');
        this.clearSearchBtn = document.getElementById('clearSearch');
        this.searchStats = document.getElementById('searchStats');

        if (!this.dashboardsContainer) {
            return;
        }

        this.setupDashboardFunctionality();
        this.setupSearchFunctionality();
    }

    setupDashboardFunctionality() {
        this.loadDashboards();
    }

    setupSearchFunctionality() {
        if (!this.searchInput || !this.clearSearchBtn) return;

        // Setup search input with debouncing
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // Setup clear search button
        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // Add keyboard shortcuts
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

    }

    setupDashboardFunctionality() {
        this.loadDashboards();
    }

    handleSearchInput(searchTerm) {
        this.currentSearchTerm = searchTerm.trim();

        // Show/hide clear button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.style.display = this.currentSearchTerm ? 'inline-block' : 'none';
        }

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Show searching indicator for longer searches
        if (this.currentSearchTerm.length >= 2) {
            this.isSearching = true;
            this.showSearchLoading();
        }

        // Set new timeout with debouncing (500ms)
        this.searchTimeout = setTimeout(() => {
            this.performSearch();
        }, 500);
    }

    showSearchLoading() {
        if (this.searchStats) {
            this.searchStats.innerHTML = `
                <span class="search-loading">
                    <i class="fas fa-spinner fa-spin"></i> Searching...
                </span>
            `;
        }
    }

    async performSearch() {
        if (this.currentSearchTerm.length < 2 && this.currentSearchTerm.length > 0) {
            // Don't search for single character
            if (this.searchStats) {
                this.searchStats.textContent = 'Type at least 2 characters to search';
            }
            this.isSearching = false;
            return;
        }

        if (this.currentSearchTerm.length === 0) {
            // Load all dashboards if search is cleared
            this.loadDashboards();
            this.isSearching = false;
            return;
        }

        try {
            // Show loading state
            this.dashboardsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Searching dashboards...</p></div>';

            // Build URL with search parameter
            const url = `${API_BASE}/dashboards?search=${encodeURIComponent(this.currentSearchTerm)}`;

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                handleAuthError(response.status);
                throw new Error("Failed to fetch users");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to search dashboards');
            }

            const dashboards = result.data || [];

            // Update search stats
            if (this.searchStats) {
                const count = dashboards.length;
                this.searchStats.textContent = count === 1
                    ? 'Found 1 dashboard'
                    : `Found ${count} dashboards`;
            }

            // Render results
            if (dashboards.length === 0) {
                this.renderNoSearchResults();
            } else {
                this.renderDashboards(dashboards);
            }

        } catch (error) {
            console.error('Error searching dashboards:', error);
            this.dashboardsContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Search Error</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-secondary" onclick="window.dashboardsManager.loadDashboards()">
                        Go Back
                    </button>
                </div>
            `;

            if (this.searchStats) {
                this.searchStats.textContent = 'Search failed';
            }
        } finally {
            this.isSearching = false;
        }
    }

    renderNoSearchResults() {
        this.dashboardsContainer.innerHTML = `
            <div class="search-empty">
                <div class="empty-icon">🔍</div>
                <h3>No dashboards found</h3>
                <p>No dashboards match "<strong>${this.currentSearchTerm}</strong>"</p>
                <p class="search-suggestions">
                    Try searching with different keywords or 
                    <a href="javascript:void(0)" onclick="window.dashboardsManager.clearSearch()">clear search</a> 
                    to see all dashboards.
                </p>
            </div>
        `;
    }

    clearSearch() {
        if (this.searchInput) {
            this.searchInput.value = '';
            this.currentSearchTerm = '';
        }

        if (this.clearSearchBtn) {
            this.clearSearchBtn.style.display = 'none';
        }

        if (this.searchStats) {
            this.searchStats.textContent = '';
        }

        // Clear any existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }

        // Reload all dashboards
        this.loadDashboards();
    }

    async loadDashboards(searchTerm = '') {
        if (!this.dashboardsContainer) return;

        // Update search stats if searching
        if (this.searchStats && searchTerm) {
            this.searchStats.textContent = 'Loading...';
        }

        this.dashboardsContainer.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading dashboards...</p></div>';

        try {
            // Build URL - with or without search
            let url = `${API_BASE}/dashboards`;
            if (searchTerm && searchTerm.trim().length >= 2) {
                url += `?search=${encodeURIComponent(searchTerm.trim())}`;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            if (!response.ok) {
                handleAuthError(response.status);
                throw new Error("Failed to fetch users");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to load dashboards');
            }

            // Clear search stats if not searching
            if (this.searchStats && !searchTerm) {
                this.searchStats.textContent = '';
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
            // Show different message based on whether we're searching
            if (this.currentSearchTerm) {
                this.renderNoSearchResults();
            } else {
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
                        // Open create modal - make sure this function exists
                        if (typeof openModal === 'function') {
                            openModal();
                        } else if (window.openModal) {
                            window.openModal();
                        }
                    });
                }
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
                <th>User Name</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Highlight search term in results
        const highlightSearchTerm = (text) => {
            if (!this.currentSearchTerm || this.currentSearchTerm.length < 2) {
                return text;
            }

            const regex = new RegExp(`(${this.currentSearchTerm})`, 'gi');
            return text.replace(regex, '<mark>$1</mark>');
        };

        dashboards.forEach(dashboard => {
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${dashboard.dashboardId || 'N/A'}</td>
                <td><strong>${highlightSearchTerm(dashboard.name || 'Unnamed')}</strong></td>
                <td>${dashboard.userName}</td>
                <td class="actions-cell">
                    <button class="btn-action delete-btn" data-dashboard-id="${dashboard.dashboardId}" data-dashboard-name="${dashboard.name || 'Unnamed'}" title="Delete">🗑️</button>
                </td>
            `;

            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        this.dashboardsContainer.innerHTML = '';
        this.dashboardsContainer.appendChild(table);

        this.setupDashboardActionListeners();
    }

    setupDashboardActionListeners() {
        // Edit buttons
        // const editButtons = document.querySelectorAll('.edit-btn');
        // editButtons.forEach(btn => {
        //     btn.addEventListener('click', (e) => {
        //         const dashboardId = e.currentTarget.dataset.dashboardId;
        //         const dashboardName = e.currentTarget.dataset.dashboardName;
        //         this.openEditModal(dashboardId, dashboardName);
        //     });
        // });

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

    async openEditModal(dashboardId, dashboardName) {

        // Call the function from create modal file
        if (typeof window.openEditModal === 'function') {
            window.openEditModal(dashboardId, dashboardName);
        } else {
            console.error('Edit modal function not available');
            alert('Edit functionality not loaded yet');
        }

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

            if (!response.ok) {
                handleAuthError(response.status);
                throw new Error("Failed to fetch users");
            }

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
}
window.dashboardsManager = new DashboardsManager();

export { DashboardsManager };