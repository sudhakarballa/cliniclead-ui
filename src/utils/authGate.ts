// Global authentication state
let isAuthProcessing = false;
let authPromise: Promise<void> | null = null;

export const setAuthProcessing = (processing: boolean) => {
  isAuthProcessing = processing;
};

export const getAuthProcessing = () => {
  return isAuthProcessing;
};

export const waitForAuth = (): Promise<void> => {
  if (!isAuthProcessing) {
    return Promise.resolve();
  }
  
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      const checkAuth = () => {
        if (!isAuthProcessing) {
          authPromise = null;
          resolve();
        } else {
          setTimeout(checkAuth, 50);
        }
      };
      checkAuth();
    });
  }
  
  return authPromise;
};

// Process auth data from URL immediately
export const processAuthFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const authData = params.get('auth');
  
  if (authData) {
    setAuthProcessing(true);
    
    try {
      const loginData = JSON.parse(atob(authData));
      
      // Set auth data immediately
      localStorage.setItem('isUserLoggedIn', 'true');
      localStorage.setItem('ACCESS_TOKEN', loginData.token);
      localStorage.setItem('User_Name', loginData.user);
      
      const convertTZ = (dateTime: any) => {
        const date = new Date(dateTime);
        return date.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      };
      
      localStorage.setItem('TOKEN_EXPIRATION_TIME', convertTZ(loginData.expires));
      
      // Clear URL
      window.history.replaceState({}, document.title, '/pipeline');
      
      // Small delay to ensure everything is set
      setTimeout(() => {
        setAuthProcessing(false);
      }, 100);
      
    } catch (error) {
      console.error('Failed to process auth:', error);
      setAuthProcessing(false);
    }
  }
};

// Initialize auth processing on module load
processAuthFromURL();