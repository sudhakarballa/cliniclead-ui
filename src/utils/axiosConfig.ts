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
      // Clear auth data and redirect to login
      LocalStorageUtil.removeItem(Constants.USER_LOGGED_IN);
      LocalStorageUtil.removeItem(Constants.ACCESS_TOKEN);
      LocalStorageUtil.removeItem(Constants.TOKEN_EXPIRATION_TIME);
      sessionStorage.clear();
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axios;