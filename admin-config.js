// Admin Panel Configuration
const adminConfig = {
    // API Endpoints
    api: {
        baseUrl: '/api/admin',
        endpoints: {
            login: '/auth/login',
            logout: '/auth/logout',
            dashboard: '/dashboard',
            users: '/users',
            roles: '/roles',
            permissions: '/permissions',
            settings: '/settings',
            activityLogs: '/activity-logs',
            backup: '/backup',
            media: '/media',
            pages: '/pages',
            menus: '/menus',
            emailTemplates: '/email-templates',
            systemStatus: '/system/status',
            systemUpdates: '/system/updates',
            apiKeys: '/api-keys'
        },
        getUrl: function(endpoint, params = '') {
            return `${this.baseUrl}${this.endpoints[endpoint] || endpoint}${params ? `/${params}` : ''}`;
        }
    },
    
    // Theme Configuration
    theme: {
        primaryColor: '#4361ee',
        secondaryColor: '#3f37c9',
        successColor: '#4bb543',
        warningColor: '#f9c74f',
        dangerColor: '#ef476f',
        infoColor: '#4895ef',
        darkColor: '#212529',
        lightColor: '#f8f9fa',
        sidebarWidth: '250px',
        headerHeight: '60px',
        footerHeight: '50px'
    },
    
    // App Settings
    app: {
        name: 'Karnya Admin',
        version: '1.0.0',
        environment: 'development',
        debug: true,
        defaultPageSize: 10,
        dateFormat: 'DD/MM/YYYY',
        dateTimeFormat: 'DD/MM/YYYY HH:mm:ss',
        timezone: 'Asia/Kolkata'
    },
    
    // Features Flags
    features: {
        darkMode: true,
        rtlSupport: false,
        multiLanguage: true,
        emailVerification: true,
        twoFactorAuth: true,
        auditLogs: true,
        backup: true,
        apiAccess: true,
        notifications: true
    },
    
    // Default User Roles and Permissions
    roles: {
        super_admin: {
            name: 'Super Admin',
            permissions: ['*']
        },
        admin: {
            name: 'Administrator',
            permissions: [
                'users.manage',
                'roles.manage',
                'settings.manage',
                'content.manage',
                'media.manage'
            ]
        },
        editor: {
            name: 'Editor',
            permissions: [
                'content.manage',
                'media.manage'
            ]
        },
        viewer: {
            name: 'Viewer',
            permissions: [
                'content.view',
                'reports.view'
            ]
        }
    },
    
    // Default Settings
    defaultSettings: {
        siteTitle: 'Karnya',
        siteDescription: 'Waste Management System',
        siteLogo: '/images/logo.png',
        siteFavicon: '/favicon.ico',
        itemsPerPage: 10,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: 'HH:mm',
        timezone: 'Asia/Kolkata',
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        defaultUserRole: 'user',
        emailVerification: true,
        twoFactorAuth: false
    },
    
    // Notification Settings
    notifications: {
        position: 'top-right',
        duration: 5000,
        maxNotifications: 5,
        types: {
            success: {
                icon: 'check-circle',
                color: 'success'
            },
            error: {
                icon: 'times-circle',
                color: 'danger'
            },
            warning: {
                icon: 'exclamation-triangle',
                color: 'warning'
            },
            info: {
                icon: 'info-circle',
                color: 'info'
            }
        }
    },
    
    // API Documentation
    apiDocs: {
        baseUrl: '/api-docs',
        versions: ['v1'],
        defaultVersion: 'v1',
        authTypes: ['bearer', 'api_key'],
        rateLimiting: {
            enabled: true,
            maxRequests: 100,
            perMinutes: 15
        }
    },
    
    // Initialize the admin panel
    init: function() {
        console.log(`${this.app.name} v${this.app.version} initialized`);
        // Additional initialization code can go here
    }
};

// Initialize the admin panel when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    adminConfig.init();
});
