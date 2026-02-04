import "./utils/axiosConfig"; // Import axios configuration
import "./utils/authGate"; // Import auth gate
import "bootstrap/dist/css/bootstrap.min.css";
import moment from "moment";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import "./datagrid-fix.css";
import "./styles/themes.css";
import Login from "./components/login";
import { SideBar } from "./components/sidebar";
import LocalStorageUtil from "./others/LocalStorageUtil";
import Constants from "./others/constants";
import { Container, Spinner } from "react-bootstrap";
import { Content } from "rsuite";
import { HeaderComponent } from "./components/header/header";
import { AppRouter } from "./others/appRouter";
import NotAuthorized from "./others/notAuthorized";
import Util from "./others/util";
import ChangePassword from "./components/profiles/changePassword";
import { UserService } from "./services/UserService";
import { ErrorBoundary } from "react-error-boundary";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ThemeToggle } from "./components/common/ThemeToggle";
import { useSignalR } from "./hooks/useSignalR";
import { checkForUpdates } from "./utils/versionCheck";

function AppContent() {
  const [navItemsLoaded, setNavItemsLoaded] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);
  const userService = new UserService(ErrorBoundary);
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, notifications } = useSignalR();
  const [signalRInitialized, setSignalRInitialized] = useState(false);
  const { setUserProfile, setUserRole, setIsLoggedIn } = useAuthContext();
  
  const clearLocalStorage = () => {
    LocalStorageUtil.removeItem(Constants.USER_LOGGED_IN);
    LocalStorageUtil.removeItem(Constants.ACCESS_TOKEN);
    LocalStorageUtil.removeItem(Constants.TOKEN_EXPIRATION_TIME);
    LocalStorageUtil.removeItem(Constants.USER_PROFILE);
    LocalStorageUtil.removeItem('USER_TENANTS');
    localStorage.removeItem('sys_perm_data');
    localStorage.removeItem('sys_check');
    
    // Clear cross-domain cookies
    const domain = window.location.hostname.includes('cliniclead.app') ? '.cliniclead.app' : window.location.hostname;
    const cookiesToClear = ['sys_perm_data', 'sys_check', 'ACCESS_TOKEN', 'USER_LOGGED_IN', 'USER_PROFILE', 'USER_TENANTS'];
    cookiesToClear.forEach(cookie => {
      document.cookie = `${cookie}=; domain=${domain}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  };
  
  // Handle auto-login from URL parameters - MUST RUN FIRST AND SYNCHRONOUSLY
  const params = new URLSearchParams(window.location.search);
  const authData = params.get('auth');
  
  if (authData && !LocalStorageUtil.getItem(Constants.ACCESS_TOKEN)) {
    try {
      const loginData = JSON.parse(atob(authData));
      const convertTZ = (dateTime: any) => {
        return moment(new Date(Util.toLocalTimeZone(dateTime))).format(
          "MM/DD/YYYY hh:mm:ss a"
        ) as any;
      };
      
      // Set authentication data IMMEDIATELY and SYNCHRONOUSLY
      LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, "true");
      LocalStorageUtil.setItem(Constants.ACCESS_TOKEN, loginData.token);
      LocalStorageUtil.setItem(Constants.User_Name, loginData.user);
      LocalStorageUtil.setItem(Constants.TOKEN_EXPIRATION_TIME, convertTZ(loginData.expires));
      Util.setUserRole(loginData.role || (loginData.isMasterAdmin ? 0 : 1));
      
      // Clear URL immediately
      window.history.replaceState({}, document.title, '/pipeline');
    } catch (error) {
      console.error('Failed to process auth data:', error);
    }
  }
  
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.alert('Session has expired. Please login again.');
          clearLocalStorage();
          window.location.href = window.config?.HomePage || '/login';
        }
        return Promise.reject(error);
      }
    );
    
    return () => axios.interceptors.response.eject(interceptor);
  }, [clearLocalStorage]);
  
  // Additional global error handler
  useEffect(() => {
    const handleGlobalError = (event: any) => {
      if (event.reason?.response?.status === 401 || event.error?.response?.status === 401) {
        window.alert('Session has expired. Please login again.');
        clearLocalStorage();
        window.location.href = window.config?.HomePage || '/login';
      }
    };
    
    window.addEventListener('unhandledrejection', handleGlobalError);
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleGlobalError);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [clearLocalStorage]);
  
  useEffect(() => {
    const initializeApp = async () => {
      // Check for updates on app start
      checkForUpdates();
      
      if (LocalStorageUtil.getItem(Constants.USER_LOGGED_IN) === "true") {
        try {
          const users = await userService.getUsers();
          LocalStorageUtil.setItem('USERS_DATA', JSON.stringify(users));
        } catch (error) {
          console.error('Failed to fetch users:', error);
        }
      }
      setNavItemsLoaded(true);
    };
    
    initializeApp();
    
    // Check for updates every 5 minutes
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize SignalR only once when user is logged in
  useEffect(() => {
    const isLoggedIn = LocalStorageUtil.getItem(Constants.USER_LOGGED_IN) === "true";
    if (isLoggedIn && !signalRInitialized) {
      setSignalRInitialized(true);
    } else if (!isLoggedIn && signalRInitialized) {
      setSignalRInitialized(false);
    }
  }, [location.pathname, signalRInitialized]);
  const [collapsed, setCollapsed] = useState<any>(
    (LocalStorageUtil.getItem(Constants.ISSIDEBAR_EXPANDED) as any) === "false"
      ? false
      : true
  );

  const shouldShowSidebar = () => {
    const { pathname } = location;
    return !["/login", "/signup"].includes(pathname);
  };

  const IsChangePassword = (): boolean => {
    return location.pathname === "/changePassword";
  };

  const IsConfirmEmail = (): boolean => {
    return location.pathname === "/confirm-email";
  };

  const IsNotAuthorized = (): boolean => {
    // Skip authorization check if processing auth data from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth')) {
      return false;
    }
    
    return !Util.isAuthorized(location.pathname.replace(/^\/+/, ""));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authData = params.get('auth');
    
    // Skip redirect if we have auth data (auto-login in progress)
    if (authData) return;
    
    if (
      LocalStorageUtil.getItem(Constants.USER_LOGGED_IN) != "true" &&
      !IsChangePassword()
    ) {
      clearLocalStorage();
      navigate("/login");
    }

    if (IsConfirmEmail()) {
      const queryString = location.search;
    navigate(`/confirm-email${queryString}`);
    }
  }, []);

  const checkSession = () => {
    const currentDateTime = moment().format("MM/DD/YYYY hh:mm:ss a");
    const tokenExpirationTime = LocalStorageUtil.getItem(
      Constants.TOKEN_EXPIRATION_TIME
    );

    if (
      tokenExpirationTime &&
      Date.parse(currentDateTime) > Date.parse(tokenExpirationTime)
    ) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    console.log("Session expired. Logging out...");

    // Clear session data
    clearLocalStorage();

    window.alert("Session has expired");

    // Redirect to login page
    navigate("/login");
  };

  useEffect(() => {
    // Listen to user activity
    const events = ["click", "keydown", "mousemove", "scroll"];

    const activityHandler = () => {
      checkSession();
    };

    events.forEach((event) => window.addEventListener(event, activityHandler));

    return () => {
      // Cleanup event listeners on unmount
      events.forEach((event) =>
        window.removeEventListener(event, activityHandler)
      );
    };
  }, []);

  useEffect(() => {
    LocalStorageUtil.setItem(Constants.ISSIDEBAR_EXPANDED, !collapsed as any);
  }, [collapsed]);

  useEffect(() => {
    toast.dismiss();
  }, [location.pathname]);

  return (
    <>
      {!navItemsLoaded || isProcessingAuth ? (
        <div className="alignCenter">
          <Spinner />
        </div>
      ) : IsChangePassword() ? (
        <ChangePassword />
      ) : IsConfirmEmail() ? (
        <Content className="maincontentinner">
          <AppRouter />
        </Content>
      ) : shouldShowSidebar() ? (
        IsNotAuthorized() ? (
          <NotAuthorized />
        ) : (
          <>
            <div className="mainlayout">
              <SideBar collapsed={collapsed} />
              <div className="maincontent">
                <HeaderComponent
                  onExpandCollapseClick={(e: any) => setCollapsed(!collapsed)}
                  collapsed={collapsed}
                />
                <Content className="maincontentinner">
                  <AppRouter />
                </Content>
              </div>
            </div>
          </>
        )
      ) : (
        <Login />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
        <ThemeToggle />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
