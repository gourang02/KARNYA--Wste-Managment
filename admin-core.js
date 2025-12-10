/**
 * Karnya Admin Core
 * Main JavaScript file for the admin panel
 */

class AdminCore {
    constructor() {
        this.config = window.adminConfig || {};
        this.user = null;
        this.init();
    }

    /**
     * Initialize the admin panel
     */
    init() {
        this.bindEvents();
        this.checkAuth();
        this.loadSidebar();
        this.loadHeader();
        this.loadFooter();
        this.initializePlugins();
        this.setupInterceptors();
    }

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        const token = localStorage.getItem('adminToken');
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.endsWith('login.html');

        if (!token && !isLoginPage) {
            this.redirectToLogin();
            return;
        }

        if (token) {
            this.user = this.getUserFromToken(token);
            
            if (isLoginPage) {
                this.redirectToDashboard();
                return;
            }

            // Check token expiration
            if (this.isTokenExpired(token)) {
                this.logout();
                return;
            }

            // Update UI based on user role
            this.updateUIForUserRole();
        }
    }

    /**
     * Get user data from JWT token
     */
    getUserFromToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(atob(base64));
        } catch (error) {
            console.error('Error parsing token:', error);
            this.logout();
            return null;
        }
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        try {
            const decoded = this.getUserFromToken(token);
            return decoded.exp < Date.now() / 1000;
        } catch (error) {
            return true;
        }
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logoutBtn')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Toggle sidebar
        document.addEventListener('click', (e) => {
            if (e.target.closest('.sidebar-toggle')) {
                document.body.classList.toggle('sidebar-collapsed');
                localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
            }
        });

        // Toggle dark mode
        document.addEventListener('click', (e) => {
            if (e.target.closest('#darkModeToggle')) {
                this.toggleDarkMode();
            }
        });

        // Initialize tooltips
        document.addEventListener('DOMContentLoaded', () => {
            this.initTooltips();
        });
    }

    /**
     * Initialize UI plugins
     */
    initializePlugins() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize select2 if available
        if (typeof $.fn.select2 === 'function') {
            $('.select2').select2({
                theme: 'bootstrap4',
                width: '100%'
            });
        }

        // Initialize datepickers
        if (typeof $.fn.datepicker === 'function') {
            $('.datepicker').datepicker({
                format: 'dd/mm/yyyy',
                autoclose: true,
                todayHighlight: true
            });
        }

        // Initialize datatables
        if (typeof $.fn.DataTable === 'function') {
            $('.datatable').DataTable({
                responsive: true,
                pageLength: this.config.app.defaultPageSize || 10,
                language: {
                    search: "_INPUT_",
                    searchPlaceholder: "Search..."
                },
                dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
                     "<'row'<'col-sm-12'tr>>" +
                     "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>"
            });
        }
    }

    /**
     * Setup AJAX interceptors
     */
    setupInterceptors() {
        // Add CSRF token to all AJAX requests
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content'),
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        // Handle 401 Unauthorized responses
        $(document).ajaxError((event, jqXHR) => {
            if (jqXHR.status === 401) {
                this.redirectToLogin();
            }
        });
    }

    /**
     * Load sidebar navigation
     */
    loadSidebar() {
        const sidebar = document.querySelector('.sidebar-nav');
        if (!sidebar) return;

        const menuItems = [
            {
                title: 'Dashboard',
                icon: 'tachometer-alt',
                url: 'dashboard.html',
                permission: 'dashboard.view'
            },
            {
                title: 'Users',
                icon: 'users',
                url: 'users.html',
                permission: 'users.manage'
            },
            {
                title: 'Roles & Permissions',
                icon: 'user-shield',
                url: 'roles.html',
                permission: 'roles.manage'
            },
            {
                title: 'Content',
                icon: 'file-alt',
                permission: 'content.manage',
                children: [
                    { title: 'Pages', url: 'pages.html', permission: 'pages.manage' },
                    { title: 'Media', url: 'media.html', permission: 'media.manage' },
                    { title: 'Menus', url: 'menus.html', permission: 'menus.manage' },
                    { title: 'Email Templates', url: 'email-templates.html', permission: 'email_templates.manage' }
                ]
            },
            {
                title: 'Waste Management',
                icon: 'trash-alt',
                permission: 'waste.manage',
                children: [
                    { title: 'Pickup Requests', url: 'pickups.html', permission: 'pickups.manage' },
                    { title: 'Waste Categories', url: 'waste-categories.html', permission: 'categories.manage' },
                    { title: 'Disposal Sites', url: 'disposal-sites.html', permission: 'sites.manage' }
                ]
            },
            {
                title: 'Reports',
                icon: 'chart-bar',
                permission: 'reports.view',
                children: [
                    { title: 'User Activity', url: 'reports/activity.html', permission: 'reports.activity' },
                    { title: 'Waste Analytics', url: 'reports/waste.html', permission: 'reports.waste' },
                    { title: 'Financial Reports', url: 'reports/financial.html', permission: 'reports.financial' }
                ]
            },
            {
                title: 'Settings',
                icon: 'cog',
                permission: 'settings.manage',
                children: [
                    { title: 'General', url: 'settings/general.html', permission: 'settings.general' },
                    { title: 'Email', url: 'settings/email.html', permission: 'settings.email' },
                    { title: 'Security', url: 'settings/security.html', permission: 'settings.security' },
                    { title: 'Backup', url: 'settings/backup.html', permission: 'settings.backup' },
                    { title: 'API', url: 'settings/api.html', permission: 'settings.api' },
                    { title: 'System', url: 'settings/system.html', permission: 'settings.system' }
                ]
            }
        ];

        // Filter menu items based on user permissions
        const filteredMenu = this.filterMenuByPermissions(menuItems, this.user?.permissions || []);
        
        // Generate HTML for the menu
        const menuHTML = this.generateMenuHTML(filteredMenu);
        sidebar.innerHTML = menuHTML;

        // Highlight active menu item
        this.highlightActiveMenuItem();
    }

    /**
     * Filter menu items based on user permissions
     */
    filterMenuByPermissions(menuItems, userPermissions) {
        return menuItems.filter(item => {
            // If user has all permissions, show all menu items
            if (userPermissions.includes('*')) return true;
            
            // Check if menu item has children
            if (item.children) {
                // Filter children based on permissions
                item.children = this.filterMenuByPermissions(item.children, userPermissions);
                // Only show parent if it has visible children or has its own permission
                return item.children.length > 0 || 
                       !item.permission || 
                       userPermissions.includes(item.permission);
            }
            
            // Check if user has permission for this menu item
            return !item.permission || userPermissions.includes(item.permission);
        });
    }

    /**
     * Generate HTML for menu items
     */
    generateMenuHTML(menuItems, isSubmenu = false) {
        let html = isSubmenu ? '<ul class="nav nav-pills flex-column sub-menu">' : '<ul class="nav flex-column">';
        
        menuItems.forEach(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = this.isMenuItemActive(item);
            
            html += `
                <li class="nav-item${hasChildren ? ' has-submenu' : ''}${isActive ? ' active' : ''}">
                    <a href="${hasChildren ? '#' : item.url}" class="nav-link${hasChildren ? ' menu-toggle' : ''}">
                        <i class="fas fa-${item.icon || 'circle'} me-2"></i>
                        <span class="menu-title">${item.title}</span>
                        ${hasChildren ? '<i class="menu-arrow"></i>' : ''}
                    </a>
                    ${hasChildren ? this.generateMenuHTML(item.children, true) : ''}
                </li>
            `;
        });
        
        html += '</ul>';
        return html;
    }

    /**
     * Check if a menu item is active
     */
    isMenuItemActive(item) {
        const currentPath = window.location.pathname.split('/').pop();
        
        // Check if current path matches the item's URL
        if (item.url && item.url.endsWith(currentPath)) {
            return true;
        }
        
        // Check children
        if (item.children) {
            return item.children.some(child => this.isMenuItemActive(child));
        }
        
        return false;
    }

    /**
     * Highlight active menu item
     */
    highlightActiveMenuItem() {
        const currentPath = window.location.pathname.split('/').pop();
        const links = document.querySelectorAll('.sidebar-nav a');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.endsWith(currentPath)) {
                link.classList.add('active');
                // Expand parent menu items
                let parent = link.closest('.has-submenu');
                while (parent) {
                    parent.classList.add('active');
                    const toggle = parent.querySelector('> a');
                    if (toggle) toggle.classList.add('active');
                    parent = parent.parentElement.closest('.has-submenu');
                }
            }
        });
    }

    /**
     * Load header
     */
    loadHeader() {
        const header = document.querySelector('.main-header');
        if (!header) return;

        header.innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-light">
                <div class="container-fluid">
                    <button class="btn btn-link sidebar-toggle d-lg-none">
                        <i class="fas fa-bars"></i>
                    </button>
                    
                    <div class="d-flex align-items-center">
                        <div class="d-none d-lg-block">
                            <button class="btn btn-link sidebar-toggle">
                                <i class="fas fa-bars"></i>
                            </button>
                        </div>
                        <div class="search-box ms-3">
                            <div class="position-relative">
                                <input type="text" class="form-control" placeholder="Search...">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex align-items-center">
                        <div class="dropdown me-3 d-none d-lg-block">
                            <a href="#" class="nav-link" data-bs-toggle="dropdown">
                                <i class="fas fa-plus-circle fs-5"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end">
                                <a class="dropdown-item" href="#"><i class="fas fa-user-plus me-2"></i> New User</a>
                                <a class="dropdown-item" href="#"><i class="fas fa-file-alt me-2"></i> New Page</a>
                                <a class="dropdown-item" href="#"><i class="fas fa-trash me-2"></i> New Pickup</a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i> Settings</a>
                            </div>
                        </div>
                        
                        <div class="dropdown me-3">
                            <a href="#" class="nav-link" data-bs-toggle="dropdown">
                                <i class="far fa-bell fs-5"></i>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end notification-dropdown">
                                <div class="dropdown-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">Notifications</h6>
                                    <a href="#" class="text-muted small">Mark all as read</a>
                                </div>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item">
                                    <div class="d-flex align-items-center">
                                        <div class="notification-icon bg-primary text-white rounded-circle me-3">
                                            <i class="fas fa-user-plus"></i>
                                        </div>
                                        <div>
                                            <h6 class="mb-1">New user registered</h6>
                                            <p class="mb-0 text-muted small">5 minutes ago</p>
                                        </div>
                                    </div>
                                </a>
                                <div class="dropdown-divider"></div>
                                <a href="#" class="dropdown-item text-center text-primary">View all notifications</a>
                            </div>
                        </div>
                        
                        <div class="dropdown">
                            <a href="#" class="nav-link" data-bs-toggle="dropdown">
                                <div class="user-avatar">
                                    <img src="https://ui-avatars.com/api/?name=${this.user?.name || 'Admin'}&background=4361ee&color=fff" alt="User" class="rounded-circle" width="36">
                                </div>
                                <span class="d-none d-lg-inline-block ms-2">${this.user?.name || 'Admin'}</span>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end">
                                <div class="dropdown-header">
                                    <h6 class="mb-0">${this.user?.name || 'Administrator'}</h6>
                                    <small class="text-muted">${this.user?.role || 'Admin'}</small>
                                </div>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="profile.html"><i class="fas fa-user me-2"></i> Profile</a>
                                <a class="dropdown-item" href="settings.html"><i class="fas fa-cog me-2"></i> Settings</a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="#" id="darkModeToggle">
                                    <i class="fas fa-moon me-2"></i> Dark Mode
                                    <div class="form-check form-switch d-inline-block ms-2">
                                        <input class="form-check-input" type="checkbox" id="darkModeSwitch">
                                    </div>
                                </a>
                                <div class="dropdown-divider"></div>
                                <a class="dropdown-item" href="#" id="logoutBtn">
                                    <i class="fas fa-sign-out-alt me-2"></i> Logout
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    }

    /**
     * Load footer
     */
    loadFooter() {
        const footer = document.querySelector('.main-footer');
        if (!footer) return;

        const year = new Date().getFullYear();
        footer.innerHTML = `
            <div class="container-fluid">
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-0">&copy; ${year} ${this.config.app?.name || 'Admin Panel'}. All rights reserved.</p>
                    </div>
                    <div class="col-md-6 text-md-end">
                        <p class="mb-0">v${this.config.app?.version || '1.0.0'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Toggle dark mode
     */
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update switch state
        const switchElement = document.getElementById('darkModeSwitch');
        if (switchElement) {
            switchElement.checked = isDarkMode;
        }
        
        // Dispatch event for other components to react to theme change
        const event = new CustomEvent('themeChange', { detail: { darkMode: isDarkMode } });
        document.dispatchEvent(event);
    }

    /**
     * Initialize tooltips
     */
    initTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize custom tooltips
        document.querySelectorAll('[data-toggle="tooltip"]').forEach(el => {
            el.setAttribute('title', el.getAttribute('data-title') || '');
            el.setAttribute('data-bs-toggle', 'tooltip');
            new bootstrap.Tooltip(el);
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show notification`;
        notification.role = 'alert';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('.notification-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.className = 'notification-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(notification);
        } else {
            container.appendChild(notification);
        }
        
        // Auto-remove notification after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * Show loading indicator
     */
    showLoading(show = true) {
        let loader = document.querySelector('.page-loader');
        
        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.className = 'page-loader';
                loader.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                `;
                document.body.appendChild(loader);
            }
            loader.style.display = 'flex';
        } else if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Handle logout
     */
    logout() {
        // Call logout API
        fetch('/api/admin/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'Content-Type': 'application/json'
            }
        })
        .finally(() => {
            // Clear local storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('user');
            
            // Redirect to login page
            this.redirectToLogin();
        });
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = 'login.html';
    }

    /**
     * Redirect to dashboard
     */
    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    /**
     * Make API request
     */
    async apiRequest(url, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        };
        
        const config = {
            method,
            headers,
            credentials: 'same-origin'
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }
        
        try {
            this.showLoading(true);
            const response = await fetch(url, config);
            const responseData = await response.json();
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Something went wrong');
            }
            
            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification(error.message || 'An error occurred', 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Update UI based on user role
     */
    updateUIForUserRole() {
        // Example: Hide admin-only elements
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        const isAdmin = this.user?.role === 'admin' || this.user?.role === 'super_admin';
        
        adminOnlyElements.forEach(el => {
            el.style.display = isAdmin ? '' : 'none';
        });
        
        // Update user-specific UI elements
        const userElements = document.querySelectorAll('.user-name, .user-email');
        userElements.forEach(el => {
            if (el.classList.contains('user-name')) {
                el.textContent = this.user?.name || 'User';
            } else if (el.classList.contains('user-email')) {
                el.textContent = this.user?.email || '';
            }
        });
    }
}

// Initialize AdminCore when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminCore();
});
