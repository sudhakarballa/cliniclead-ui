// Centralized tooltip configuration for the application
export const TOOLTIPS = {
  // Sidebar Navigation
  SIDEBAR: {
    ADD_PIPELINE: 'Create and manage sales pipelines to track deals through different stages',
    SALES_STAGE: 'View and manage deals organized by sales stages with drag-and-drop functionality',
    ACTIVITIES: 'Track and manage all activities including calls, meetings, tasks, and follow-ups',
    PERSONS: 'Manage contacts and persons with their details, communication history, and relationships',
    USERS: 'Manage user accounts, roles, permissions, and access control for your organization',
    REPORTING: 'View comprehensive reports, analytics, and insights about your sales performance',
    CAMPAIGNS: 'Create, manage, and track email marketing campaigns to engage with your leads',
    TEMPLATE: 'Create and edit reusable email templates for campaigns and communications',
    ADMIN: 'Configure administrative settings including clinics, sources, treatments, and pipeline types',
    CLINIC: 'Manage clinic information, locations, and associated details',
    SOURCE: 'Manage and track lead sources to understand where your leads are coming from',
    TREATMENT: 'Manage treatment types and services offered by your organization',
    PIPELINE_TYPE: 'Configure different pipeline types for various sales processes',
    TENANTS: 'Manage tenant organizations and their configurations (Master Admin only)',
  },
  
  // Common Actions
  ACTIONS: {
    ADD: 'Add new item',
    EDIT: 'Edit this item',
    DELETE: 'Delete this item',
    SAVE: 'Save changes',
    CANCEL: 'Cancel and discard changes',
    REFRESH: 'Refresh data',
    EXPORT: 'Export data to Excel or CSV file',
    IMPORT: 'Import data from file',
    SEARCH: 'Search items',
    FILTER: 'Filter results',
    SORT: 'Sort items',
    VIEW: 'View details',
    DOWNLOAD: 'Download file',
    UPLOAD: 'Upload file',
    COPY: 'Copy to clipboard',
    PRINT: 'Print',
    CLOSE: 'Close',
    MORE_ACTIONS: 'More actions',
    SEND_EMAIL: 'Send email to selected recipients',
    SAVE_SETTINGS: 'Save current grid layout and preferences',
    RESET_SETTINGS: 'Reset grid to default layout',
  },
  
  // Header Actions
  HEADER: {
    NOTIFICATIONS: 'View notifications',
    THEME: 'Change theme',
    PROFILE: 'View profile',
    LOGOUT: 'Sign out',
    EXPAND_SIDEBAR: 'Expand sidebar',
    COLLAPSE_SIDEBAR: 'Collapse sidebar',
  },
  
  // Grid/Table Actions
  GRID: {
    PREFERENCES: 'Customize grid columns and layout',
    RESET_PREFERENCES: 'Reset to default layout',
    COLUMN_VISIBILITY: 'Show/hide columns',
    PAGE_SIZE: 'Items per page',
    FIRST_PAGE: 'Go to first page',
    PREVIOUS_PAGE: 'Go to previous page',
    NEXT_PAGE: 'Go to next page',
    LAST_PAGE: 'Go to last page',
  },
  
  // Deal/Pipeline Actions
  DEAL: {
    ADD_DEAL: 'Create new deal',
    EDIT_DEAL: 'Edit deal details',
    DELETE_DEAL: 'Delete this deal',
    MOVE_STAGE: 'Move to different stage',
    ADD_NOTE: 'Add note to deal',
    ADD_ACTIVITY: 'Add activity to deal',
    MARK_WON: 'Mark deal as won',
    MARK_LOST: 'Mark deal as lost',
    VIEW_HISTORY: 'View deal history',
    ASSIGN_USER: 'Assign to user',
  },
  
  // User Management
  USER: {
    ADD_USER: 'Add new user to the system',
    EDIT_USER: 'Edit user details and permissions',
    DELETE_USER: 'Delete user account permanently',
    ACTIVATE: 'Activate user account',
    DEACTIVATE: 'Deactivate user account',
    RESET_PASSWORD: 'Send password reset email to user',
    RESEND_CONFIRMATION: 'Resend email confirmation link to user',
    CHANGE_ROLE: 'Change user role and permissions',
  },
  
  // Form Fields
  FORM: {
    REQUIRED: 'This field is required',
    OPTIONAL: 'This field is optional',
    EMAIL: 'Enter valid email address',
    PHONE: 'Enter phone number',
    DATE: 'Select date',
    TIME: 'Select time',
    DROPDOWN: 'Select from dropdown',
    MULTISELECT: 'Select multiple options',
  },
  
  // Status Indicators
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    IN_PROGRESS: 'In Progress',
    CANCELLED: 'Cancelled',
  },
};

// Helper function to get tooltip text
export const getTooltip = (category: keyof typeof TOOLTIPS, key: string): string => {
  const categoryTooltips = TOOLTIPS[category] as Record<string, string>;
  return categoryTooltips[key] || '';
};
