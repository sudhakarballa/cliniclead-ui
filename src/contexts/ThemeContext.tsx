import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, getThemeById, PREDEFINED_THEMES, DARK_THEME } from '../others/themes';
import { useAuthContext } from './AuthContext';
import { UserPreferencesService } from '../services/userPreferencesService';
import { UserPreferences } from '../models/userPreferences';
import { updateFavicon } from '../others/faviconUtil';

export interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  resetTheme: () => void;
  applyTheme: (theme: Theme) => void;
  availableThemes: Theme[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(PREDEFINED_THEMES[0]);
  const [baseTheme, setBaseTheme] = useState<Theme>(PREDEFINED_THEMES[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const userPreferencesService = new UserPreferencesService(() => {});
  
  // Safely get userProfile with error handling
  let userProfile: any = null;
  try {
    const authContext = useAuthContext();
    userProfile = authContext.userProfile;
  } catch (error) {
    console.log('AuthContext not available in ThemeProvider');
  }

  // Helper function to determine if a color is light
  const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    // Update favicon with theme color
    updateFavicon(theme.primaryColor);
    
    // Set theme-specific CSS custom properties
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--sidebar-color', theme.sidebarColor);
    root.style.setProperty('--header-color', theme.headerColor);
    
    // Apply comprehensive theme variables based on theme type
    if (theme.id === 'dark') {
      // Dark theme variables
      root.style.setProperty('--bg-primary', '#1a1a1a');
      root.style.setProperty('--bg-secondary', '#2d2d2d');
      root.style.setProperty('--bg-tertiary', '#3a3a3a');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--text-muted', '#888888');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--border-light', 'rgba(255, 255, 255, 0.24)');
      root.style.setProperty('--hover-bg', '#404040');
      root.style.setProperty('--modal-bg', '#2d2d2d');
      root.style.setProperty('--input-bg', '#3a3a3a');
      root.style.setProperty('--card-bg', '#2d2d2d');
      root.setAttribute('data-theme', 'dark');
    } else {
      // Light theme variables (default for all other themes)
      root.style.setProperty('--bg-primary', theme.backgroundColor);
      root.style.setProperty('--bg-secondary', theme.sidebarColor);
      root.style.setProperty('--bg-tertiary', '#eaeaea');
      root.style.setProperty('--text-primary', theme.textColor);
      root.style.setProperty('--text-secondary', '#65686f');
      root.style.setProperty('--text-muted', '#999999');
      root.style.setProperty('--border-color', 'rgba(33, 35, 44, 0.12)');
      root.style.setProperty('--border-light', 'rgba(33, 35, 44, 0.24)');
      root.style.setProperty('--hover-bg', '#ececed');
      root.style.setProperty('--modal-bg', theme.backgroundColor);
      root.style.setProperty('--input-bg', theme.backgroundColor);
      root.style.setProperty('--card-bg', theme.backgroundColor);
      root.setAttribute('data-theme', 'light');
    }
    
    // Set theme-specific colors
    root.style.setProperty('--success-color', '#2ffd8a');
    root.style.setProperty('--warning-color', '#f4a261');
    root.style.setProperty('--danger-color', '#dc3545');
    root.style.setProperty('--accent-color', '#3dc2c0');
    
    // Apply body class for theme-specific styling
    document.body.className = theme.name + '-theme';
    
    // Set CSS variables that can be used by any component
    root.style.setProperty('--current-theme-primary', theme.primaryColor);
    root.style.setProperty('--current-theme-header', theme.headerColor);
    root.style.setProperty('--current-theme-sidebar', theme.sidebarColor);
    
    // Inject CSS to override sidebar styles
    let themeStyleElement = document.getElementById('dynamic-theme-styles');
    if (!themeStyleElement) {
      themeStyleElement = document.createElement('style');
      themeStyleElement.id = 'dynamic-theme-styles';
      document.head.appendChild(themeStyleElement);
    }
    
    themeStyleElement.textContent = `
      .ps-sidebar-container,
      .ps-sidebar-root,
      .ps-menu-button {
        background-color: ${theme.primaryColor}1A !important;
      }
      
      .ps-submenu-content,
      .ps-submenu-content .ps-menu-button {
        background-color: ${theme.primaryColor}1A !important;
      }
      
      .sidenavhead {
        background-color: ${theme.headerColor} !important;
      }
      
      /* Active navigation items - text color only, no background */
      .ps-active > .ps-menu-button,
      .ps-menu-button.ps-active,
      .ps-menuitem-root.ps-active > .ps-menu-button,
      .ps-menuitem-root.ps-active .ps-menu-button,
      .rs-nav-item-active a,
      .rs-nav-item-active .ps-menu-button,
      .activetoolbtn,
      .active .ps-menu-button,
      [aria-current="page"],
      .current,
      .selected,
      li.rs-nav-item-active > a,
      .ps-sidebar-root .ps-active .ps-menu-button,
      .ps-sidebar-root .ps-menuitem-root.ps-active > .ps-menu-button,
      .ps-sidebar-root .ps-menuitem-root.ps-active,
      .sidemenu .rs-nav-item-active a,
      .sidemenu li.rs-nav-item-active > a,
      .sidemenu ul > li.rs-nav-item-active > a,
      .rs-sidenav .sidemenu ul > li.rs-nav-item-active > a {
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
        background: transparent !important;
      }
      
      /* Override any conflicting active styles with maximum specificity */
      .rs-sidenav.sidenav .sidemenu ul > li.rs-nav-item-active a,
      .rs-sidenav.sidenav .sidemenu ul > li.rs-nav-item-active > a,
      body .rs-sidenav .sidemenu ul > li.rs-nav-item-active > a,
      html body .rs-sidenav .sidemenu ul > li.rs-nav-item-active > a {
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
        background: transparent !important;
        fill: ${theme.primaryColor} !important;
      }
      
      /* Force override with attribute selector */
      a[class*="rs-nav-item-active"],
      li[class*="rs-nav-item-active"] > a {
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
      }
      
      /* Remove all possible background highlights */
      .rs-nav-item-active a:hover,
      .rs-nav-item-active a:focus,
      .rs-nav-item-active a:active,
      .sidemenu ul > li.rs-nav-item-active > a:hover,
      .sidemenu ul > li.rs-nav-item-active > a:focus,
      .sidemenu ul > li.rs-nav-item-active > a:active {
        background-color: transparent !important;
        background: transparent !important;
        color: ${theme.primaryColor} !important;
      }
      
      /* Override default hover/focus states */
      .rs-sidenav.sidenav .sidemenu ul > li > a:hover,
      .rs-sidenav.sidenav .sidemenu ul > li.rs-nav-item-active a:hover {
        background-color: transparent !important;
        color: ${theme.primaryColor} !important;
      }
      
      /* Remove any Bootstrap/MUI default active states */
      .nav-link.active,
      .nav-item.active .nav-link,
      .list-group-item.active {
        background-color: transparent !important;
        border-color: transparent !important;
        color: ${theme.primaryColor} !important;
      }
      
      .ps-menu-button:hover,
      .rs-nav-item a:hover {
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
      }
      
      /* Parent items with active children - text color only */
      .ps-menuitem-root:has(.ps-active) > .ps-menu-button,
      .ps-menuitem-root.ps-open > .ps-menu-button {
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
      }
      
      /* Icons and arrows in active items */
      .ps-active > .ps-menu-button svg,
      .ps-menu-button.ps-active svg,
      .rs-nav-item-active svg,
      .activetoolbtn svg,
      .ps-active > .ps-menu-button i,
      .ps-menu-button.ps-active i,
      .rs-nav-item-active i,
      .ps-menuitem-root:has(.ps-active) > .ps-menu-button svg,
      .ps-menuitem-root:has(.ps-active) > .ps-menu-button i,
      .ps-active .ps-menu-icon,
      .ps-menu-button.ps-active .ps-menu-icon {
        color: ${theme.primaryColor} !important;
        fill: ${theme.primaryColor} !important;
      }
      
      /* Primary buttons and action buttons */
      .btn-primary,
      .btn.btn-primary,
      button.btn-primary,
      .MuiButton-containedPrimary,
      .rs-btn-primary,
      .primary-btn,
      .save-btn,
      .submit-btn,
      .add-btn,
      .create-btn,
      .update-btn,
      .edit-btn {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        font-weight: 500 !important;
      }
      
      .btn-primary:hover,
      .btn.btn-primary:hover,
      button.btn-primary:hover,
      .MuiButton-containedPrimary:hover,
      .rs-btn-primary:hover,
      .primary-btn:hover,
      .save-btn:hover,
      .submit-btn:hover,
      .add-btn:hover,
      .create-btn:hover,
      .update-btn:hover,
      .edit-btn:hover {
        background-color: ${theme.primaryColor}dd !important;
        border-color: ${theme.primaryColor}dd !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      .btn-primary:focus,
      .btn.btn-primary:focus,
      button.btn-primary:focus,
      .btn-primary:active,
      .btn.btn-primary:active,
      button.btn-primary:active {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        box-shadow: 0 0 0 0.2rem ${theme.primaryColor}33 !important;
      }
      
      .btn-primary:disabled,
      .btn.btn-primary:disabled,
      button.btn-primary:disabled {
        background-color: ${theme.primaryColor}66 !important;
        border-color: ${theme.primaryColor}66 !important;
        color: ${isLightColor(theme.primaryColor) ? '#00000066' : '#ffffff66'} !important;
        text-shadow: none !important;
      }
      
      /* Improve text contrast for all button types */
      .btn,
      button {
        text-shadow: none !important;
      }
      
      .btn-primary *,
      .btn.btn-primary *,
      button.btn-primary * {
        color: inherit !important;
      }
      
      /* Outline buttons */
      .btn-outline-primary,
      .btn.btn-outline-primary,
      button.btn-outline-primary,
      .MuiButton-outlinedPrimary {
        border-color: ${theme.primaryColor} !important;
        color: ${theme.primaryColor} !important;
        background-color: transparent !important;
      }
      
      .btn-outline-primary:hover,
      .btn.btn-outline-primary:hover,
      button.btn-outline-primary:hover,
      .MuiButton-outlinedPrimary:hover {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      /* Links and text buttons */
      .btn-link,
      .text-primary,
      .link-primary,
      a.primary-link,
      .MuiButton-textPrimary {
        color: ${theme.primaryColor} !important;
        text-decoration: none !important;
      }
      
      .btn-link:hover,
      .text-primary:hover,
      .link-primary:hover,
      a.primary-link:hover,
      .MuiButton-textPrimary:hover {
        color: ${theme.primaryColor}dd !important;
        text-decoration: underline !important;
      }
      
      /* Form controls focus states - Remove theme colors */
      .form-control:focus,
      .form-select:focus,
      input:focus,
      textarea:focus,
      select:focus,
      .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline,
      .MuiInput-underline:after {
        border-color: rgba(0, 0, 0, 0.23) !important;
        box-shadow: none !important;
      }
      
      /* Checkboxes and radio buttons */
      .form-check-input:checked,
      .MuiCheckbox-root.Mui-checked,
      .MuiRadio-root.Mui-checked {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
      }
      
      /* Switches */
      .MuiSwitch-switchBase.Mui-checked,
      .form-switch .form-check-input:checked {
        color: ${theme.primaryColor} !important;
      }
      
      .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
        background-color: ${theme.primaryColor} !important;
      }
      
      /* Progress bars */
      .progress-bar,
      .MuiLinearProgress-bar {
        background-color: ${theme.primaryColor} !important;
      }
      
      /* Badges */
      .badge-primary,
      .MuiBadge-colorPrimary {
        background-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      /* Tabs */
      .nav-tabs .nav-link.active,
      .MuiTab-root.Mui-selected {
        color: ${theme.primaryColor} !important;
        border-bottom-color: ${theme.primaryColor} !important;
      }
      
      /* Pagination */
      .page-link:hover,
      .page-item.active .page-link {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      /* Dropdowns */
      .dropdown-item:hover,
      .dropdown-item:focus,
      .dropdown-item.active {
        background-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      /* Cards and panels */
      .card-header,
      .panel-heading {
        background-color: ${theme.primaryColor}22 !important;
        border-bottom-color: ${theme.primaryColor} !important;
      }
      
      /* Alerts */
      .alert-primary {
        background-color: ${theme.primaryColor}22 !important;
        border-color: ${theme.primaryColor} !important;
        color: ${theme.primaryColor} !important;
      }
      
      /* Header notification and icon styling */
      .notification-bell,
      .notification-icon,
      .header-notification,
      .notification-container,
      .notification-wrapper {
        color: ${isLightColor(theme.headerColor) ? '#333333' : '#ffffff'} !important;
        fill: ${isLightColor(theme.headerColor) ? '#333333' : '#ffffff'} !important;
      }
      
      .notification-bell:hover,
      .notification-icon:hover,
      .header-notification:hover {
        color: ${isLightColor(theme.headerColor) ? '#000000' : '#ffffff'} !important;
        fill: ${isLightColor(theme.headerColor) ? '#000000' : '#ffffff'} !important;
      }
      
      .notification-badge,
      .notification-count {
        background-color: #dc3545 !important;
        color: #ffffff !important;
      }
      
      /* Custom buttons with common class names */
      .action-btn,
      .toolbar-btn,
      .header-btn,
      .menu-btn,
      .icon-btn.primary {
        background-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        border-color: ${theme.primaryColor} !important;
        font-weight: 500 !important;
        text-shadow: none !important;
      }
      
      .action-btn:hover,
      .toolbar-btn:hover,
      .header-btn:hover,
      .menu-btn:hover,
      .icon-btn.primary:hover {
        background-color: ${theme.primaryColor}dd !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        text-shadow: none !important;
      }
      
      /* Table headers and active rows */
      .table-primary,
      .table thead th,
      .MuiTableHead-root .MuiTableCell-head {
        background-color: ${theme.primaryColor}22 !important;
        color: ${theme.primaryColor} !important;
      }
      
      /* Loading spinners */
      .spinner-border.text-primary,
      .MuiCircularProgress-colorPrimary {
        color: ${theme.primaryColor} !important;
      }
      
      /* Toast/Toaster Messages */
      .Toastify__toast-container {
        z-index: 9999 !important;
      }
      
      .Toastify__toast {
        background-color: var(--modal-bg) !important;
        color: var(--text-primary) !important;
        border-left: 4px solid ${theme.primaryColor} !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border-radius: 8px !important;
      }
      
      .Toastify__toast--success {
        border-left-color: #2ffd8a !important;
      }
      
      .Toastify__toast--error {
        border-left-color: #dc3545 !important;
      }
      
      .Toastify__toast--warning {
        border-left-color: #f4a261 !important;
      }
      
      .Toastify__toast--info {
        border-left-color: ${theme.primaryColor} !important;
      }
      
      .Toastify__toast-body {
        color: var(--text-primary) !important;
        font-weight: 500 !important;
      }
      
      .Toastify__close-button {
        color: var(--text-secondary) !important;
        opacity: 0.7 !important;
      }
      
      .Toastify__close-button:hover {
        opacity: 1 !important;
      }
      
      .Toastify__progress-bar {
        background: ${theme.primaryColor} !important;
      }
      
      .Toastify__progress-bar--success {
        background: #2ffd8a !important;
      }
      
      .Toastify__progress-bar--error {
        background: #dc3545 !important;
      }
      
      .Toastify__progress-bar--warning {
        background: #f4a261 !important;
      }
      
      /* Custom toast classes */
      .toast,
      .toast-message,
      .notification-toast {
        background-color: var(--modal-bg) !important;
        color: var(--text-primary) !important;
        border: 1px solid ${theme.primaryColor}33 !important;
        border-radius: 8px !important;
      }
      
      .toast-header {
        background-color: ${theme.primaryColor}22 !important;
        color: var(--text-primary) !important;
        border-bottom: 1px solid ${theme.primaryColor}33 !important;
      }
      
      .toast-success {
        border-left: 4px solid #2ffd8a !important;
      }
      
      .toast-error {
        border-left: 4px solid #dc3545 !important;
      }
      
      .toast-warning {
        border-left: 4px solid #f4a261 !important;
      }
      
      .toast-info {
        border-left: 4px solid ${theme.primaryColor} !important;
      }
      
      /* Deal Details Page Specific Styling */
      .deal-details-container,
      .deal-info-section,
      .deal-actions-section {
        background-color: var(--card-bg) !important;
        color: var(--text-primary) !important;
      }
      
      .deal-status-btn,
      .deal-action-btn,
      .deal-edit-btn,
      .deal-delete-btn,
      .deal-save-btn,
      .deal-cancel-btn,
      .stage-btn,
      .pipeline-btn,
      .deal-tab-btn,
      .deal-sidebar-btn,
      .deal-left-action,
      .sidebar-action-btn,
      .left-panel-btn,
      .deal-actions button,
      .deal-sidebar button,
      .left-actions button,
      .action-buttons button,
      .deal-left-panel button,
      .note-btn,
      .email-btn,
      .call-btn,
      .task-btn,
      .add-note-btn,
      .add-email-btn,
      .add-call-btn,
      .add-task-btn,
      button[title="Note"],
      button[title="Email"],
      button[title="Call"],
      button[title="Task"],
      .quick-actions button,
      .quick-action-btn,
      .activity-btn,
      .activity-action,
      .dealicon,
      .appdealblock-iconlist .dealicon,
      button.dealicon {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        font-weight: 500 !important;
        text-shadow: none !important;
      }
      

      
      .deal-status-btn:hover,
      .deal-action-btn:hover,
      .deal-edit-btn:hover,
      .deal-delete-btn:hover,
      .deal-save-btn:hover,
      .deal-cancel-btn:hover,
      .stage-btn:hover,
      .pipeline-btn:hover,
      .deal-tab-btn:hover,
      .deal-sidebar-btn:hover,
      .deal-left-action:hover,
      .sidebar-action-btn:hover,
      .left-panel-btn:hover,
      .deal-actions button:hover,
      .deal-sidebar button:hover,
      .left-actions button:hover,
      .action-buttons button:hover,
      .deal-left-panel button:hover,
      .note-btn:hover,
      .email-btn:hover,
      .call-btn:hover,
      .task-btn:hover,
      .add-note-btn:hover,
      .add-email-btn:hover,
      .add-call-btn:hover,
      .add-task-btn:hover,
      button[title="Note"]:hover,
      button[title="Email"]:hover,
      button[title="Call"]:hover,
      button[title="Task"]:hover,
      .quick-actions button:hover,
      .quick-action-btn:hover,
      .activity-btn:hover,
      .activity-action:hover,
      .dealicon:hover,
      .appdealblock-iconlist .dealicon:hover,
      button.dealicon:hover {
        background-color: ${theme.primaryColor}dd !important;
        border-color: ${theme.primaryColor}dd !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      .deal-section-header,
      .deal-info-header,
      .deal-activity-header {
        background-color: ${theme.primaryColor}22 !important;
        color: ${theme.primaryColor} !important;
        border-bottom: 2px solid ${theme.primaryColor} !important;
        font-weight: 600 !important;
      }
      
      .deal-field-label,
      .deal-info-label {
        color: var(--text-secondary) !important;
        font-weight: 500 !important;
      }
      
      .deal-field-value,
      .deal-info-value {
        color: var(--text-primary) !important;
      }
      
      .deal-tabs .nav-link.active,
      .deal-nav-tabs .nav-link.active {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      .deal-tabs .nav-link,
      .deal-nav-tabs .nav-link {
        color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor}33 !important;
      }
      
      .deal-tabs .nav-link:hover,
      .deal-nav-tabs .nav-link:hover {
        background-color: ${theme.primaryColor}22 !important;
        border-color: ${theme.primaryColor} !important;
      }
      
      /* Deal cards and panels */
      .deal-card,
      .deal-panel,
      .deal-info-card {
        background-color: var(--card-bg) !important;
        border: 1px solid ${theme.primaryColor}33 !important;
        color: var(--text-primary) !important;
      }
      
      .deal-card-header,
      .deal-panel-header {
        background-color: ${theme.primaryColor}11 !important;
        border-bottom: 1px solid ${theme.primaryColor}33 !important;
        color: ${theme.primaryColor} !important;
      }
      
      /* Deal activity and timeline */
      .deal-activity-item,
      .deal-timeline-item {
        border-left: 3px solid ${theme.primaryColor} !important;
        background-color: var(--card-bg) !important;
      }
      
      .deal-activity-icon,
      .deal-timeline-icon {
        background-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      /* Deal form elements */
      .deal-form .form-control,
      .deal-form input,
      .deal-form textarea,
      .deal-form select {
        border-color: ${theme.primaryColor}33 !important;
        background-color: var(--input-bg) !important;
        color: var(--text-primary) !important;
      }
      
      .deal-form .form-control:focus,
      .deal-form input:focus,
      .deal-form textarea:focus,
      .deal-form select:focus {
        border-color: ${theme.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${theme.primaryColor}33 !important;
      }
      
      /* Modal and Dialog Styling */
      .modal-header,
      .modalhead {
        background-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        border-bottom: 1px solid ${theme.primaryColor} !important;
      }
      
      .modal-title,
      .modalheadtitle {
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        font-weight: 600 !important;
      }
      
      .modal-header .btn-close,
      .modal-header .close,
      .modalhead .btn-close,
      .modalhead .close {
        filter: ${isLightColor(theme.primaryColor) ? 'invert(1)' : 'invert(0)'} !important;
        opacity: 0.8 !important;
      }
      
      .modal-header .btn-close:hover,
      .modal-header .close:hover,
      .modalhead .btn-close:hover,
      .modalhead .close:hover {
        opacity: 1 !important;
      }
      
      .modal-content {
        border: 1px solid ${theme.primaryColor}33 !important;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
      }
      
      .modal-body,
      .modal-body .form-group {
        background-color: var(--modal-bg) !important;
      }
      
      .modal-footer,
      .modalfoot {
        background-color: var(--modal-bg) !important;
        border-top: 1px solid ${theme.primaryColor}22 !important;
      }
      
      /* Dialog form elements */
      .DialogForm .form-control,
      .DialogForm input,
      .DialogForm textarea,
      .DialogForm select {
        border-color: ${theme.primaryColor}33 !important;
      }
      
      .DialogForm .form-control:focus,
      .DialogForm input:focus,
      .DialogForm textarea:focus,
      .DialogForm select:focus {
        border-color: ${theme.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${theme.primaryColor}33 !important;
      }
      
      /* Dialog labels */
      .DialogForm label,
      .DialogForm .col-form-label {
        color: var(--text-primary) !important;
        font-weight: 500 !important;
      }
      
      .DialogForm .required::after {
        color: #dc3545 !important;
      }
      
      /* Modal backdrop */
      .modal-backdrop {
        background-color: rgba(0, 0, 0, 0.5) !important;
      }
      
      /* Custom modal classes */
      .modalpopup .modal-content {
        border-radius: 8px !important;
      }
      
      .modalpopupadddeal .modal-header {
        background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryColor}dd) !important;
      }
      
      /* Dialog buttons in footer */
      .modalfootbar .btn-secondary {
        background-color: #6c757d !important;
        border-color: #6c757d !important;
        color: #ffffff !important;
      }
      
      .modalfootbar .btn-secondary:hover {
        background-color: #5a6268 !important;
        border-color: #545b62 !important;
      }
      
      .modalfootbar .btn-primary {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        font-weight: 500 !important;
      }
      
      .modalfootbar .btn-primary:hover {
        background-color: ${theme.primaryColor}dd !important;
        border-color: ${theme.primaryColor}dd !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
      }
      
      .modalfootbar .btn-primary:focus,
      .modalfootbar .btn-primary:active {
        background-color: ${theme.primaryColor} !important;
        border-color: ${theme.primaryColor} !important;
        color: ${isLightColor(theme.primaryColor) ? '#000000' : '#ffffff'} !important;
        box-shadow: 0 0 0 0.2rem ${theme.primaryColor}33 !important;
      }
      
      .modalfootbar .btn-primary:disabled {
        background-color: ${theme.primaryColor}66 !important;
        border-color: ${theme.primaryColor}66 !important;
        color: ${isLightColor(theme.primaryColor) ? '#00000066' : '#ffffff66'} !important;
      }
    `;
    
    // Force update of header and sidebar colors with timeout to ensure DOM is ready
    setTimeout(() => {
      // Try multiple header selectors
      const headerSelectors = ['.header', '#header', 'header'];
      headerSelectors.forEach(selector => {
        const header = document.querySelector(selector);
        if (header) {
          (header as HTMLElement).style.setProperty('background-color', theme.headerColor, 'important');
          (header as HTMLElement).style.setProperty('background', theme.headerColor, 'important');
        }
      });
      
      // Also target any elements with bggradiant class
      const gradientElements = document.querySelectorAll('.bggradiant');
      gradientElements.forEach(element => {
        (element as HTMLElement).style.setProperty('background-color', theme.headerColor, 'important');
        (element as HTMLElement).style.setProperty('background', theme.headerColor, 'important');
      });
      
      // Force update sidebar colors
      const sidebar = document.querySelector('.ps-sidebar-container');
      if (sidebar) {
        (sidebar as HTMLElement).style.setProperty('background-color', theme.primaryColor + '1A', 'important');
      }
      
      const sidebarRoot = document.querySelector('.ps-sidebar-root');
      if (sidebarRoot) {
        (sidebarRoot as HTMLElement).style.setProperty('background-color', theme.primaryColor + '1A', 'important');
      }
      
      // Force update sidebar header
      const sidebarHead = document.querySelector('.sidenavhead');
      if (sidebarHead) {
        (sidebarHead as HTMLElement).style.setProperty('background-color', theme.headerColor, 'important');
      }
      
      // Ensure header icons have proper contrast
      const headerIcons = document.querySelectorAll('.header button, .header svg, .header i, .headicon button, .headicon svg, .headicon i, .sidemenuicon, .headname, .profileicon, .notification-bell, .notification-icon, .header-notification');
      const iconColor = isLightColor(theme.headerColor) ? '#333333' : '#ffffff';
      
      headerIcons.forEach(icon => {
        (icon as HTMLElement).style.setProperty('color', iconColor, 'important');
        (icon as HTMLElement).style.setProperty('fill', iconColor, 'important');
      });
      
      // Force update sidebar submenu colors
      const submenuItems = document.querySelectorAll('.ps-submenu-content, .ps-submenu-content .ps-menu-button');
      submenuItems.forEach(item => {
        (item as HTMLElement).style.setProperty('background-color', theme.primaryColor + '1A', 'important');
      });
      
      // Force update all sidebar menu buttons
      const menuButtons = document.querySelectorAll('.ps-menu-button');
      menuButtons.forEach(button => {
        if (!button.closest('.ps-active') && !button.classList.contains('ps-active')) {
          (button as HTMLElement).style.setProperty('background-color', theme.primaryColor + '1A', 'important');
        }
      });
      
      // Force update active navigation items - text color only
      const activeItemSelectors = [
        '.ps-active .ps-menu-button',
        '.ps-menu-button.ps-active', 
        '.rs-nav-item-active a',
        '.sidemenu ul > li.rs-nav-item-active > a',
        '.rs-sidenav .sidemenu ul > li.rs-nav-item-active > a'
      ];
      
      activeItemSelectors.forEach(selector => {
        const items = document.querySelectorAll(selector);
        items.forEach(item => {
          (item as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (item as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
          (item as HTMLElement).style.setProperty('background', 'transparent', 'important');
        });
      });
      
      // Update icons in active items
      const activeIcons = document.querySelectorAll('.ps-active svg, .ps-menu-button.ps-active svg, .rs-nav-item-active svg, .ps-active i, .ps-menu-button.ps-active i, .rs-nav-item-active i');
      activeIcons.forEach(icon => {
        (icon as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (icon as HTMLElement).style.setProperty('fill', theme.primaryColor, 'important');
      });
    }, 100);
    
    // Clean up existing observer
    if ((window as any).themeObserver) {
      (window as any).themeObserver.disconnect();
    }
    
    // Set up MutationObserver to apply theme to dynamically added elements
    const observer = new MutationObserver((mutations) => {
      setTimeout(() => {
        // Apply theme to active navigation items
        const allActiveSelectors = [
          '.rs-nav-item-active a',
          '.sidemenu ul > li.rs-nav-item-active > a',
          '.rs-sidenav .sidemenu ul > li.rs-nav-item-active > a',
          '.ps-active .ps-menu-button',
          '.ps-menu-button.ps-active'
        ];
        
        allActiveSelectors.forEach(selector => {
          const items = document.querySelectorAll(selector);
          items.forEach(item => {
            (item as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
            (item as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
            (item as HTMLElement).style.setProperty('background', 'transparent', 'important');
          });
        });
        
        // Apply theme to newly added buttons
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Apply theme to primary buttons
              const buttons = element.querySelectorAll('.btn-primary, .MuiButton-containedPrimary, .primary-btn, .save-btn, .submit-btn, .add-btn, .create-btn, .update-btn, .edit-btn');
              buttons.forEach(button => {
                const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
                (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
                (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
                (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
                (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
                (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
              });
              
              // Apply theme to outline buttons
              const outlineButtons = element.querySelectorAll('.btn-outline-primary, .MuiButton-outlinedPrimary');
              outlineButtons.forEach(button => {
                (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
                (button as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
              });
              
              // Apply theme to text links
              const textLinks = element.querySelectorAll('.btn-link, .text-primary, .link-primary, a.primary-link, .MuiButton-textPrimary');
              textLinks.forEach(link => {
                (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
              });
              
              // Apply theme to modal headers
              const modalHeaders = element.querySelectorAll('.modal-header, .modalhead');
              modalHeaders.forEach(header => {
                (header as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
                (header as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
              });
              
              // Apply theme to modal titles
              const modalTitles = element.querySelectorAll('.modal-title, .modalheadtitle');
              modalTitles.forEach(title => {
                const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
                (title as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
                (title as HTMLElement).style.setProperty('font-weight', '600', 'important');
              });
              
              // Apply theme to modal close buttons
              const modalCloseButtons = element.querySelectorAll('.modal-header .btn-close, .modal-header .close, .modalhead .btn-close, .modalhead .close');
              modalCloseButtons.forEach(closeBtn => {
                (closeBtn as HTMLElement).style.setProperty('filter', isLightColor(theme.primaryColor) ? 'invert(1)' : 'invert(0)', 'important');
                (closeBtn as HTMLElement).style.setProperty('opacity', '0.8', 'important');
              });
              
              // Apply theme to notification icons
              const notificationIcons = element.querySelectorAll('.notification-bell, .notification-icon, .header-notification, .notification-container, .notification-wrapper');
              const headerIconColor = isLightColor(theme.headerColor) ? '#333333' : '#ffffff';
              notificationIcons.forEach(icon => {
                (icon as HTMLElement).style.setProperty('color', headerIconColor, 'important');
                (icon as HTMLElement).style.setProperty('fill', headerIconColor, 'important');
              });
              
              // Apply theme to toast messages
              const toastMessages = element.querySelectorAll('.Toastify__toast, .toast, .toast-message, .notification-toast');
              toastMessages.forEach(toast => {
                (toast as HTMLElement).style.setProperty('background-color', 'var(--modal-bg)', 'important');
                (toast as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
              });
              
              const toastBodies = element.querySelectorAll('.Toastify__toast-body');
              toastBodies.forEach(body => {
                (body as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
              });
              
              // Apply theme to dealicon buttons
              const dealIconButtons = element.querySelectorAll('.dealicon, button.dealicon');
              dealIconButtons.forEach(button => {
                const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
                (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
                (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
                (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
                (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
                (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
              });
              

              
              const dealSectionHeaders = element.querySelectorAll('.deal-section-header, .deal-info-header, .deal-activity-header');
              dealSectionHeaders.forEach(header => {
                (header as HTMLElement).style.setProperty('background-color', `${theme.primaryColor}22`, 'important');
                (header as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
                (header as HTMLElement).style.setProperty('border-bottom', `2px solid ${theme.primaryColor}`, 'important');
              });
            }
          });
        });
      }, 10);
    });
    
    // Start observing entire document for changes to apply theme to new elements
    setTimeout(() => {
      const targetNode = document.body;
      if (targetNode) {
        observer.observe(targetNode, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class']
        });
        (window as any).themeObserver = observer;
      }
    }, 300);
    
    // Apply theme to existing elements immediately
    setTimeout(() => {
      // Apply to all existing primary buttons
      const existingButtons = document.querySelectorAll('.btn-primary, .MuiButton-containedPrimary, .primary-btn, .save-btn, .submit-btn, .add-btn, .create-btn, .update-btn, .edit-btn');
      existingButtons.forEach(button => {
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
        (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
        (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
        (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
      });
      
      // Apply to all existing outline buttons
      const existingOutlineButtons = document.querySelectorAll('.btn-outline-primary, .MuiButton-outlinedPrimary');
      existingOutlineButtons.forEach(button => {
        (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
      });
      
      // Apply to all existing text links
      const existingTextLinks = document.querySelectorAll('.btn-link, .text-primary, .link-primary, a.primary-link, .MuiButton-textPrimary');
      existingTextLinks.forEach(link => {
        (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
      });
      
      // Apply to existing modal headers
      const existingModalHeaders = document.querySelectorAll('.modal-header, .modalhead');
      existingModalHeaders.forEach(header => {
        (header as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (header as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
      });
      
      // Apply to existing modal titles
      const existingModalTitles = document.querySelectorAll('.modal-title, .modalheadtitle');
      existingModalTitles.forEach(title => {
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        (title as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
        (title as HTMLElement).style.setProperty('font-weight', '600', 'important');
      });
      
      // Apply to existing modal close buttons
      const existingModalCloseButtons = document.querySelectorAll('.modal-header .btn-close, .modal-header .close, .modalhead .btn-close, .modalhead .close');
      existingModalCloseButtons.forEach(closeBtn => {
        (closeBtn as HTMLElement).style.setProperty('filter', isLightColor(theme.primaryColor) ? 'invert(1)' : 'invert(0)', 'important');
        (closeBtn as HTMLElement).style.setProperty('opacity', '0.8', 'important');
      });
      
      // Apply to existing notification icons
      const existingNotificationIcons = document.querySelectorAll('.notification-bell, .notification-icon, .header-notification, .notification-container, .notification-wrapper');
      const headerIconColor = isLightColor(theme.headerColor) ? '#333333' : '#ffffff';
      existingNotificationIcons.forEach(icon => {
        (icon as HTMLElement).style.setProperty('color', headerIconColor, 'important');
        (icon as HTMLElement).style.setProperty('fill', headerIconColor, 'important');
      });
      
      // Apply to existing toast messages
      const existingToastMessages = document.querySelectorAll('.Toastify__toast, .toast, .toast-message, .notification-toast');
      existingToastMessages.forEach(toast => {
        (toast as HTMLElement).style.setProperty('background-color', 'var(--modal-bg)', 'important');
        (toast as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
      });
      
      const existingToastBodies = document.querySelectorAll('.Toastify__toast-body');
      existingToastBodies.forEach(body => {
        (body as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
      });
      
      // Apply to existing dealicon buttons
      const existingDealIconButtons = document.querySelectorAll('.dealicon, button.dealicon, .appdealblock-iconlist button');
      existingDealIconButtons.forEach(button => {
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
        (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
        (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
      });
      

      
      const existingDealSectionHeaders = document.querySelectorAll('.deal-section-header, .deal-info-header, .deal-activity-header');
      existingDealSectionHeaders.forEach(header => {
        (header as HTMLElement).style.setProperty('background-color', `${theme.primaryColor}22`, 'important');
        (header as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (header as HTMLElement).style.setProperty('border-bottom', `2px solid ${theme.primaryColor}`, 'important');
      });
    }, 500);
    
    // Continuous style override with setInterval for all theme elements
    if ((window as any).themeInterval) {
      clearInterval((window as any).themeInterval);
    }
    
    (window as any).themeInterval = setInterval(() => {
      // Apply theme to active navigation items
      const activeNavItems = document.querySelectorAll('.rs-nav-item-active a, .sidemenu ul > li.rs-nav-item-active > a, .nav-link.active, .active');
      activeNavItems.forEach(item => {
        const computedStyle = window.getComputedStyle(item);
        if (computedStyle.color !== theme.primaryColor || computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          (item as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (item as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
          (item as HTMLElement).style.setProperty('background', 'transparent', 'important');
          (item as HTMLElement).style.setProperty('background-image', 'none', 'important');
        }
      });
      
      // Apply theme to primary buttons that might be dynamically loaded
      const primaryButtons = document.querySelectorAll('.btn-primary, .MuiButton-containedPrimary, .primary-btn, .save-btn, .submit-btn, .add-btn, .create-btn, .update-btn, .edit-btn');
      primaryButtons.forEach(button => {
        const computedStyle = window.getComputedStyle(button);
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        if (computedStyle.backgroundColor !== theme.primaryColor || computedStyle.color !== expectedTextColor) {
          (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
          (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
          (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
        }
      });
      
      // Apply theme to form controls focus states
      const focusedInputs = document.querySelectorAll('.form-control:focus, input:focus, textarea:focus, select:focus');
      focusedInputs.forEach(input => {
        (input as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (input as HTMLElement).style.setProperty('box-shadow', `0 0 0 0.2rem ${theme.primaryColor}33`, 'important');
      });
      
      // Apply theme to checkboxes and switches
      const checkedInputs = document.querySelectorAll('.form-check-input:checked, .MuiCheckbox-root.Mui-checked, .MuiSwitch-switchBase.Mui-checked');
      checkedInputs.forEach(input => {
        (input as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (input as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (input as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
      });
      
      // Apply theme to modal elements that might be dynamically updated
      const modalHeaders = document.querySelectorAll('.modal-header, .modalhead');
      modalHeaders.forEach(header => {
        const computedStyle = window.getComputedStyle(header);
        if (computedStyle.backgroundColor !== theme.primaryColor) {
          (header as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
          (header as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
        }
      });
      
      const modalTitles = document.querySelectorAll('.modal-title, .modalheadtitle');
      modalTitles.forEach(title => {
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        (title as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
        (title as HTMLElement).style.setProperty('font-weight', '600', 'important');
      });
      
      // Apply theme to modal close buttons
      const modalCloseButtons = document.querySelectorAll('.modal-header .btn-close, .modal-header .close, .modalhead .btn-close, .modalhead .close');
      modalCloseButtons.forEach(closeBtn => {
        (closeBtn as HTMLElement).style.setProperty('filter', isLightColor(theme.primaryColor) ? 'invert(1)' : 'invert(0)', 'important');
        (closeBtn as HTMLElement).style.setProperty('opacity', '0.8', 'important');
      });
      
      // Apply theme to header notification icons - comprehensive targeting
      const headerIconColor = isLightColor(theme.headerColor) ? '#333333' : '#ffffff';
      const notificationSelectors = [
        '.headbtnbell .dropdown-toggle',
        '.headbtnbell .dropdown-toggle svg',
        '.headbtnbell button',
        '.headbtnbell button svg',
        '.headicon button',
        '.headicon button svg',
        '.notification-bell',
        '.notification-icon'
      ];
      
      notificationSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          (element as HTMLElement).style.setProperty('color', headerIconColor, 'important');
          (element as HTMLElement).style.setProperty('fill', headerIconColor, 'important');
        });
      });
      
      // Apply theme to toast messages
      const toastMessages = document.querySelectorAll('.Toastify__toast, .toast, .toast-message, .notification-toast');
      toastMessages.forEach(toast => {
        (toast as HTMLElement).style.setProperty('background-color', 'var(--modal-bg)', 'important');
        (toast as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
      });
      
      const toastBodies = document.querySelectorAll('.Toastify__toast-body');
      toastBodies.forEach(body => {
        (body as HTMLElement).style.setProperty('color', 'var(--text-primary)', 'important');
      });
      
      // Apply theme to dealicon buttons specifically
      const dealIconButtons = document.querySelectorAll('.appdealblock-iconlist .dealicon, button.dealicon');
      dealIconButtons.forEach(button => {
        const expectedTextColor = isLightColor(theme.primaryColor) ? '#000000' : '#ffffff';
        (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('color', expectedTextColor, 'important');
        (button as HTMLElement).style.setProperty('font-weight', '500', 'important');
        (button as HTMLElement).style.setProperty('text-shadow', 'none', 'important');
      });
      
      // Apply theme to deal links - comprehensive targeting
      const dealLinks = document.querySelectorAll(
        '.pdstage-description a, .pdstage-descitem a, ' +
        '.deal-list a, .deal-details a, .deallist a, .deal-item a, ' +
        '.deal-title a, .deal-name a, .deal-link a, ' +
        '.table a, .grid a, .list-item a, ' +
        '.treatment-name a, .treatment-link a, ' +
        '.rs-table-cell a, .rs-table a, ' +
        '.table-cell a, td a, ' +
        '.MuiDataGrid-cell a, .MuiDataGrid-cell[data-field="treatmentName"] a, ' +
        '.MuiDataGrid-cell span[style*="cursor: pointer"], ' +
        '.MuiDataGrid-cell[data-field="treatmentName"] span[style*="cursor: pointer"], ' +
        '.back-button a, .back-link a, .breadcrumb a, ' +
        '.deal-details-header a, .deal-header a, ' +
        'a[href*="deal"], a[href*="Deal"], a[href*="treatment"]'
      );
      
      // Apply theme to back button and breadcrumb links specifically
      const backLinks = document.querySelectorAll('a');
      backLinks.forEach(link => {
        const linkText = (link as HTMLElement).textContent?.toLowerCase();
        const linkHref = (link as HTMLAnchorElement).href?.toLowerCase();
        if (linkText?.includes('deals') || linkText?.includes('back') || linkHref?.includes('pipeline')) {
          (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (link as HTMLElement).style.setProperty('text-decoration', 'none', 'important');
        }
        // Apply theme to phone number links
        if (linkHref?.includes('tel:') || /^\d{10,}$/.test(linkText || '')) {
          (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (link as HTMLElement).style.setProperty('text-decoration', 'none', 'important');
        }
      });
      
      // Apply theme to edit icons and clickable elements
      const editIcons = document.querySelectorAll(
        '.edit-icon, .fa-edit, .fa-pencil, ' +
        'svg[data-icon="edit"], svg[data-icon="pencil"], ' +
        '.MuiSvgIcon-root[data-testid="EditIcon"], ' +
        'button[title*="edit"], button[aria-label*="edit"], ' +
        '.editable-field, .edit-button'
      );
      editIcons.forEach(icon => {
        (icon as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (icon as HTMLElement).style.setProperty('fill', theme.primaryColor, 'important');
        (icon as HTMLElement).style.setProperty('cursor', 'pointer', 'important');
      });
      
      // Apply unified theme to pipeline stage indicators
      const pipelineStages = document.querySelectorAll('.pipelinestage');
      const stageArray = Array.from(pipelineStages);
      let currentStageIndex = -1;
      
      // Find current stage index
      stageArray.forEach((stage, index) => {
        if (stage.classList.contains('pipelinestage-current')) {
          currentStageIndex = index;
        }
      });
      
      stageArray.forEach((stage, index) => {
        const isCompletedOrCurrent = index <= currentStageIndex;
        const stageColor = isCompletedOrCurrent ? theme.primaryColor : '#8a8a8a';
        
        // Apply unified color to both circle (via background/border) and text
        (stage as HTMLElement).style.setProperty('background-color', stageColor, 'important');
        (stage as HTMLElement).style.setProperty('border-color', stageColor, 'important');
        (stage as HTMLElement).style.setProperty('color', stageColor, 'important');
        
        // Apply same color to stage label
        const label = stage.querySelector('label');
        if (label) {
          (label as HTMLElement).style.setProperty('color', stageColor, 'important');
          (label as HTMLElement).style.setProperty('font-weight', index === currentStageIndex ? '600' : '400', 'important');
        }
        
        // Style pseudo-elements for circles using CSS custom properties
        (stage as HTMLElement).style.setProperty('--stage-circle-color', stageColor);
      });
      
      // Apply connector line colors
      stageArray.forEach((stage, index) => {
        if (index < stageArray.length - 1) {
          const connectorColor = index < currentStageIndex ? theme.primaryColor : '#8a8a8a';
          (stage as HTMLElement).style.setProperty('--connector-color', connectorColor);
        }
      });
      
      // Apply theme to existing progress bar circles
      const progressCircles = document.querySelectorAll(
        '.progress-circle, .stage-circle, .step-circle, ' +
        '.pipelinestage .circle, .stage-dot, .progress-dot, ' +
        '.MuiStepIcon-root, .step-icon'
      );
      progressCircles.forEach((circle, index) => {
        const isCompletedOrCurrent = index <= currentStageIndex;
        const circleColor = isCompletedOrCurrent ? theme.primaryColor : '#8a8a8a';
        
        (circle as HTMLElement).style.setProperty('background-color', circleColor, 'important');
        (circle as HTMLElement).style.setProperty('border-color', circleColor, 'important');
        (circle as HTMLElement).style.setProperty('color', circleColor, 'important');
        (circle as HTMLElement).style.setProperty('fill', circleColor, 'important');
      });
      
      // Apply theme to progress bar lines
      const progressLines = document.querySelectorAll(
        '.progress-line, .stage-line, .step-line, ' +
        '.progress-connector, .stage-connector'
      );
      progressLines.forEach((line, index) => {
        const lineColor = index < currentStageIndex ? theme.primaryColor : '#8a8a8a';
        (line as HTMLElement).style.setProperty('background-color', lineColor, 'important');
        (line as HTMLElement).style.setProperty('border-color', lineColor, 'important');
      });
      
      // Apply theme to won/lost buttons
      const wonButtons = document.querySelectorAll('.wonbtn, .btn-won, button.wonbtn');
      wonButtons.forEach(button => {
        (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
        (button as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
        
        const icon = button.querySelector('svg');
        if (icon) {
          (icon as unknown as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
          (icon as unknown as HTMLElement).style.setProperty('fill', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
        }
      });
      
      // Apply theme to all possible stage circle selectors
      const allCircleSelectors = [
        '.pipelinestage::before',
        '.stage-circle',
        '.progress-circle', 
        '.step-circle',
        '.stage-dot',
        '.progress-dot',
        '.pipeline-dot',
        '.stage-indicator',
        '.step-indicator'
      ];
      
      // Remove any existing duplicate circle CSS
      const existingStyle = document.getElementById('pipeline-theme-css');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      // Add comprehensive CSS targeting for all circle elements
      const style = document.createElement('style');
      style.id = 'pipeline-theme-css';
      let cssRules = '';
      
      stageArray.forEach((stage, index) => {
        const isCompletedOrCurrent = index <= currentStageIndex;
        const stageColor = isCompletedOrCurrent ? theme.primaryColor : '#8a8a8a';
        
        cssRules += `
          .pipelinestage:nth-child(${index + 1})::before,
          .pipelinestage:nth-child(${index + 1})::after,
          .pipelinestage:nth-child(${index + 1}) .circle,
          .pipelinestage:nth-child(${index + 1}) .dot,
          .pipelinestage:nth-child(${index + 1}) .stage-circle,
          .pipelinestage:nth-child(${index + 1}) .progress-circle {
            background-color: ${stageColor} !important;
            border-color: ${stageColor} !important;
            color: ${stageColor} !important;
            fill: ${stageColor} !important;
          }
        `;
      });
      
      // Global circle styling
      cssRules += `
        .pipelinestage::before,
        .pipelinestage::after,
        .pipelinestage .circle,
        .pipelinestage .dot,
        .stage-circle,
        .progress-circle,
        .step-circle,
        .stage-dot,
        .progress-dot {
          background-color: var(--stage-circle-color, #8a8a8a) !important;
          border-color: var(--stage-circle-color, #8a8a8a) !important;
          color: var(--stage-circle-color, #8a8a8a) !important;
          fill: var(--stage-circle-color, #8a8a8a) !important;
        }
      `;
      
      // Enhanced toggle switch focus and hover states
      cssRules += `
        [role="switch"]:focus {
          outline: none;
          box-shadow: 0 0 0 3px ${theme.primaryColor}33 !important;
        }
        
        [role="switch"]:hover:not([aria-disabled="true"]) {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }
        
        [role="switch"][aria-disabled="true"] {
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
      `;
      
      style.textContent = cssRules;
      document.head.appendChild(style);
      
      // Apply theme to MUI DataGrid treatment name cells that act as links
      const treatmentCells = document.querySelectorAll('.MuiDataGrid-cell[data-field="treatmentName"] span, .MuiDataGrid-cell[data-field="treatmentName"]');
      treatmentCells.forEach(cell => {
        (cell as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (cell as HTMLElement).style.setProperty('cursor', 'pointer', 'important');
      });
      
      // Set up MutationObserver for dynamically loaded DataGrid content
      const observer = new MutationObserver(() => {
        const newTreatmentCells = document.querySelectorAll('.MuiDataGrid-cell[data-field="treatmentName"] span, .MuiDataGrid-cell[data-field="treatmentName"]');
        newTreatmentCells.forEach(cell => {
          (cell as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (cell as HTMLElement).style.setProperty('cursor', 'pointer', 'important');
        });
      });
      
      const dataGridContainer = document.querySelector('.MuiDataGrid-root');
      if (dataGridContainer) {
        observer.observe(dataGridContainer, { childList: true, subtree: true });
        
        // Store observer for cleanup
        (window as any).treatmentCellObserver = observer;
      }
      dealLinks.forEach(link => {
        (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (link as HTMLElement).style.setProperty('text-decoration', 'none', 'important');
      });
      
      // Apply hover effects to deal links
      dealLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
          (link as HTMLElement).style.setProperty('text-decoration', 'underline', 'important');
        });
        link.addEventListener('mouseleave', () => {
          (link as HTMLElement).style.setProperty('text-decoration', 'none', 'important');
        });
      });
      
      const dealSectionHeaders = document.querySelectorAll('.deal-section-header, .deal-info-header, .deal-activity-header');
      dealSectionHeaders.forEach(header => {
        (header as HTMLElement).style.setProperty('background-color', `${theme.primaryColor}22`, 'important');
        (header as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        (header as HTMLElement).style.setProperty('border-bottom', `2px solid ${theme.primaryColor}`, 'important');
      });
      
      // Apply theme to primary buttons (Save, Add New Filter)
      const allButtons = document.querySelectorAll('button');
      allButtons.forEach(button => {
        const buttonText = (button as HTMLElement).textContent?.toLowerCase();
        if ((buttonText?.includes('add') && buttonText?.includes('filter')) || buttonText?.includes('save')) {
          (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
        }
        // Reset buttons styled as secondary buttons (like Cancel buttons)
        if (buttonText?.includes('reset')) {
          (button as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
          (button as HTMLElement).style.setProperty('border', `1px solid ${theme.textColor}`, 'important');
          (button as HTMLElement).style.setProperty('color', theme.textColor, 'important');
        }
      });
      
      // Apply theme to specific button classes
      const specificButtons = document.querySelectorAll(
        '.add-filter-btn, .filter-add-btn, ' +
        '.deal-header button, .dealheader button, ' +
        '.save-btn, .btn-save, .btn-primary'
      );
      specificButtons.forEach(button => {
        const buttonText = (button as HTMLElement).textContent?.toLowerCase();
        if ((buttonText?.includes('add') && buttonText?.includes('filter')) || buttonText?.includes('save')) {
          (button as HTMLElement).style.setProperty('background-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('border-color', theme.primaryColor, 'important');
          (button as HTMLElement).style.setProperty('color', isLightColor(theme.primaryColor) ? '#000000' : '#ffffff', 'important');
        }
      });
      
      // Apply theme to active navigation items immediately
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('a[href]');
      navLinks.forEach(link => {
        const href = (link as HTMLAnchorElement).getAttribute('href');
        if (href && currentPath.includes(href.replace('/', ''))) {
          (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          
          const parentButton = link.closest('.ps-menuitem-root')?.querySelector('.ps-menu-button');
          if (parentButton) {
            (parentButton as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          }
          
          const icons = link.querySelectorAll('svg, .ps-menu-icon svg');
          icons.forEach(icon => {
            (icon as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
            (icon as HTMLElement).style.setProperty('fill', theme.primaryColor, 'important');
          });
        }
      });
      
      // Apply theme to SubMenu icons and titles
      const subMenus = document.querySelectorAll('.ps-submenu-root');
      subMenus.forEach(subMenu => {
        const subMenuButton = subMenu.querySelector('.ps-menu-button');
        const subMenuIcon = subMenu.querySelector('.ps-menu-icon svg');
        const hasActiveChild = subMenu.querySelector('.ps-active');
        
        if (hasActiveChild && subMenuIcon) {
          (subMenuIcon as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
          (subMenuIcon as HTMLElement).style.setProperty('fill', theme.primaryColor, 'important');
        }
        
        if (hasActiveChild && subMenuButton) {
          (subMenuButton as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
        }
      });
    }, 200);
    
    // Set up click listener for navigation items
    const handleNavClick = () => {
      setTimeout(() => {
        // Apply active navigation styles based on current URL
        const currentPath = window.location.pathname;
        
        // Reset all navigation items first
        const allNavItems = document.querySelectorAll('.ps-menu-button, .rs-nav-item a');
        allNavItems.forEach(item => {
          (item as HTMLElement).style.removeProperty('color');
          (item as HTMLElement).style.removeProperty('background-color');
        });
        
        // Find and highlight active navigation item
        const navLinks = document.querySelectorAll('a[href]');
        navLinks.forEach(link => {
          const href = (link as HTMLAnchorElement).getAttribute('href');
          if (href && currentPath.includes(href.replace('/', ''))) {
            // Style the link itself
            (link as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
            
            // Style parent menu button if it exists
            const parentButton = link.closest('.ps-menuitem-root')?.querySelector('.ps-menu-button');
            if (parentButton) {
              (parentButton as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
            }
            
            // Style icons
            const icons = link.querySelectorAll('svg, .ps-menu-icon svg');
            icons.forEach(icon => {
              (icon as HTMLElement).style.setProperty('color', theme.primaryColor, 'important');
              (icon as HTMLElement).style.setProperty('fill', theme.primaryColor, 'important');
            });
          }
        });
      }, 100);
    };
    
    // Add click listeners to all navigation items
    setTimeout(() => {
      const navItems = document.querySelectorAll('.ps-menu-button, .rs-nav-item a');
      navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
      });
      
      // Store cleanup function
      (window as any).navClickCleanup = () => {
        navItems.forEach(item => {
          item.removeEventListener('click', handleNavClick);
        });
      };
    }, 200);
    

  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newDarkMode = !prev;
      if (newDarkMode) {
        const darkTheme = { ...DARK_THEME, primaryColor: baseTheme.primaryColor };
        setCurrentTheme(darkTheme);
        applyTheme(darkTheme);
      } else {
        setCurrentTheme(baseTheme);
        applyTheme(baseTheme);
      }
      return newDarkMode;
    });
  };

  const setTheme = async (themeId: string) => {
    // Store previous theme for rollback
    const previousBaseTheme = baseTheme;
    const previousCurrentTheme = currentTheme;
    
    const theme = getThemeById(themeId) || PREDEFINED_THEMES[0];
    setBaseTheme(theme);
    if (!isDarkMode) {
      setCurrentTheme(theme);
      applyTheme(theme);
    } else {
      const darkTheme = { ...DARK_THEME, primaryColor: theme.primaryColor };
      setCurrentTheme(darkTheme);
      applyTheme(darkTheme);
    }
    
    // Save theme preference if user is logged in
    if (userProfile?.userId) {
      try {
        const existingPrefs = await userPreferencesService.getUserPreferencesByUserId(userProfile.userId);
        const themePrefs = existingPrefs.find((pref: UserPreferences) => pref.gridName === 'theme');
        
        const preferencesData = {
          themeId: themeId
        };
        
        const userPrefs = new UserPreferences(
          themePrefs?.id || 0,
          userProfile.userId,
          'theme',
          JSON.stringify(preferencesData),
          userProfile.userId,
          userProfile.userId
        );

        const response = await (themePrefs?.id 
          ? userPreferencesService.updateUserPreferences(userPrefs)
          : userPreferencesService.addUserPreferences(userPrefs));
        
        // Check if response is successful (status 200)
        if (!response || (response.status && response.status !== 200)) {
          throw new Error('API response not successful');
        }
          
        console.log('Theme preference saved successfully');
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        
        // Revert to previous theme
        setBaseTheme(previousBaseTheme);
        setCurrentTheme(previousCurrentTheme);
        applyTheme(previousCurrentTheme);
        
        throw error;
      }
    }
  };

  const resetTheme = async () => {
    if (!userProfile?.userId) return;
    
    try {
      const existingPrefs = await userPreferencesService.getUserPreferencesByUserId(userProfile.userId);
      const themePrefs = existingPrefs.find((pref: UserPreferences) => pref.gridName === 'theme');
      
      if (themePrefs?.id) {
        await userPreferencesService.deleteUserPreferences(themePrefs.id);
        console.log('Theme preference deleted successfully');
      }
      
      // Apply tenant theme or default theme
      const tenant = (userProfile as any).tenant;
      if (tenant && Array.isArray(tenant) && tenant.length > 0) {
        const tenantId = tenant[0]?.id;
        if (tenantId && tenantId > 0 && tenantId <= PREDEFINED_THEMES.length) {
          const themeIndex = tenantId - 1;
          const theme = PREDEFINED_THEMES[themeIndex];
          setBaseTheme(theme);
          if (!isDarkMode) {
            setCurrentTheme(theme);
            applyTheme(theme);
          }
          return;
        }
      }
      
      // Fallback to default theme
      setBaseTheme(PREDEFINED_THEMES[0]);
      if (!isDarkMode) {
        setCurrentTheme(PREDEFINED_THEMES[0]);
        applyTheme(PREDEFINED_THEMES[0]);
      }
    } catch (error) {
      console.error('Failed to reset theme preference:', error);
      throw error;
    }
  };

  useEffect(() => {
    const loadTheme = async () => {
      console.log('ThemeContext - userProfile changed:', userProfile);
      
      if (userProfile) {
        const isMasterAdmin = (userProfile as any).isMasterAdmin || !(userProfile as any).tenant || (userProfile as any).tenant.length === 0;
        
        if (isMasterAdmin) {
          console.log('Master admin detected - using default theme');
          setBaseTheme(PREDEFINED_THEMES[0]);
          if (!isDarkMode) {
            setCurrentTheme(PREDEFINED_THEMES[0]);
            applyTheme(PREDEFINED_THEMES[0]);
          }
          return;
        }
        
        try {
          // PRIORITY 1: Check user preferences first
          if (userProfile.userId) {
            const userPrefs = await userPreferencesService.getUserPreferencesByUserId(userProfile.userId);
            const themePrefs = userPrefs.find((pref: UserPreferences) => pref.gridName === 'theme');
            
            if (themePrefs?.preferencesJson) {
              const savedTheme = JSON.parse(themePrefs.preferencesJson);
              if (savedTheme.themeId) {
                const theme = getThemeById(savedTheme.themeId) || PREDEFINED_THEMES[0];
                console.log('Applying user preference theme:', theme.displayName);
                setBaseTheme(theme);
                if (!isDarkMode) {
                  setCurrentTheme(theme);
                  applyTheme(theme);
                }
                return;
              }
            }
          }
          
          // PRIORITY 2: Check tenant-based theme
          const tenant = (userProfile as any).tenant;
          console.log('Tenant data:', tenant);
          
          if (tenant && Array.isArray(tenant) && tenant.length > 0) {
            const tenantId = tenant[0]?.id;
            console.log('Tenant ID found:', tenantId);
            
            if (tenantId && tenantId > 0 && tenantId <= PREDEFINED_THEMES.length) {
              const themeIndex = tenantId - 1;
              const theme = PREDEFINED_THEMES[themeIndex];
              console.log(`Applying tenant-based theme: Tenant ID ${tenantId} -> Theme Index ${themeIndex} -> ${theme.displayName}`);
              setBaseTheme(theme);
              if (!isDarkMode) {
                setCurrentTheme(theme);
                applyTheme(theme);
              }
              return;
            }
          }
          
          // PRIORITY 3: Default theme
          console.log('Applying default theme');
          setBaseTheme(PREDEFINED_THEMES[0]);
          if (!isDarkMode) {
            setCurrentTheme(PREDEFINED_THEMES[0]);
            applyTheme(PREDEFINED_THEMES[0]);
          }
        } catch (error) {
          console.error('Failed to load theme:', error);
          setCurrentTheme(PREDEFINED_THEMES[0]);
          applyTheme(PREDEFINED_THEMES[0]);
        }
      }
    };
    
    loadTheme();
  }, [userProfile]);

  useEffect(() => {
    // Apply theme when currentTheme changes
    console.log('Applying theme:', currentTheme);
    applyTheme(currentTheme);
    
    // Cleanup observer on unmount
    return () => {
      if ((window as any).themeObserver) {
        (window as any).themeObserver.disconnect();
      }
      if ((window as any).navClickCleanup) {
        (window as any).navClickCleanup();
      }
      if ((window as any).themeInterval) {
        clearInterval((window as any).themeInterval);
      }
    };
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, resetTheme, applyTheme, availableThemes: PREDEFINED_THEMES, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};