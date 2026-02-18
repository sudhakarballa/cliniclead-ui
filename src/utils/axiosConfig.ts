import axios from 'axios';
import { getActiveUserToken } from '../others/authUtil';
import LocalStorageUtil from '../others/LocalStorageUtil';
import Constants from '../others/constants';

// Global axios interceptor for authentication
axios.interceptors.request.use(
  (config) => {
    const token = getActiveUserToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling 401/403 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth data
      LocalStorageUtil.removeItem(Constants.USER_LOGGED_IN);
      LocalStorageUtil.removeItem(Constants.ACCESS_TOKEN);
      LocalStorageUtil.removeItem(Constants.TOKEN_EXPIRATION_TIME);
      sessionStorage.clear();
      
      // Check if we're on a subdomain and need to redirect to main application
      const config = (window as any).config;
      
      if (config?.EnableSubdomainRedirect) {
        // Redirect to main application login page
        const homePage = config.HomePage || '';
        const redirectUrl = config.RedirectUri + (homePage === '/' ? '' : homePage) + '/login';
        window.location.href = redirectUrl;
      } else {
        // Local development or already on main domain
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axios;