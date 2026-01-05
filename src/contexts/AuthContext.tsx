import React, { createContext, useContext, useState, useEffect } from 'react';
import LocalStorageUtil from '../others/LocalStorageUtil';
import Constants from '../others/constants';
import Util from '../others/util';
import { UserProfile } from '../models/userProfile';
import { UserPreferencesService } from '../services/userPreferencesService';
import { ErrorBoundary } from 'react-error-boundary';

interface UserPreference {
  id: number;
  userId: number;
  gridName: string;
  preferencesJson: string;
  createdDate: string;
  createdBy: number;
  modifiedBy: number;
  modifiedDate: string;
}

interface AuthContextType {
  userRole: number | null;
  setUserRole: (role: number | null) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  userPreferences: UserPreference[];
  setUserPreferences: (preferences: UserPreference[]) => void;
  updateUserPreference: (gridName: string, preferences: any) => void;
  loadUserPreferences: (userId: number) => Promise<void>;
  getPreferencesForGrid: (gridName: string) => UserPreference | null;
  userTenants: any[];
  setUserTenants: (tenants: any[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedInState] = useState(false);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferencesState] = useState<UserPreference[]>([]);
  const [userTenants, setUserTenantsState] = useState<any[]>([]);
  const userPreferencesService = new UserPreferencesService(ErrorBoundary);

  useEffect(() => {
    const loggedIn = LocalStorageUtil.getItem(Constants.USER_LOGGED_IN) === 'true';
    setIsLoggedInState(loggedIn);
    
    // Load obfuscated role from localStorage on app start
    if (loggedIn) {
      const roleNum = Util.getUserRole();
      if (roleNum !== null) {
        setUserRoleState(roleNum);
        Util.loadNavItemsForUser(roleNum);
        console.log('Loaded role on init:', roleNum, 'Nav items:', Util.navItemsList);
      }
      
      // Load user profile from localStorage
      try {
        const storedProfile = LocalStorageUtil.getItemObject(Constants.USER_PROFILE);
        if (storedProfile) {
          const profile = JSON.parse(storedProfile as string);
          setUserProfileState(profile);
          console.log('Loaded userProfile from localStorage:', profile);
          
          // Load user preferences from API on app start
          if (profile.userId) {
            loadUserPreferences(profile.userId);
          }
          
          // Load tenant information from localStorage
          try {
            const storedTenants = LocalStorageUtil.getItemObject('USER_TENANTS');
            if (storedTenants) {
              const tenants = JSON.parse(storedTenants as string);
              setUserTenantsState(tenants);
              console.log('Loaded user tenants from localStorage:', tenants);
            }
          } catch (error) {
            console.error('Error loading user tenants from storage:', error);
          }
        } else {
          // If no stored profile, try to reconstruct from available data
          const userName = LocalStorageUtil.getItem(Constants.User_Name);
          if (userName) {
            // Create a minimal profile - you may need to adjust this based on your needs
            const reconstructedProfile = {
              user: userName,
              userId: 107, // You might need to get this from somewhere else
              role: roleNum
            };
            setUserProfileState(reconstructedProfile as any);
            console.log('Reconstructed userProfile:', reconstructedProfile);
          }
        }
      } catch (error) {
        console.error('Error loading user profile from storage:', error);
      }
    }
  }, []);



  const setUserRole = (role: number | null) => {
    setUserRoleState(role);
    if (role !== null && role !== undefined) {
      // Store obfuscated role in localStorage
      Util.setUserRole(role);
      Util.loadNavItemsForUser(role);
      console.log('Nav items loaded for role:', role, 'Items:', Util.navItemsList);
    }
  };

  const setIsLoggedIn = (loggedIn: boolean) => {
    setIsLoggedInState(loggedIn);
    LocalStorageUtil.setItem(Constants.USER_LOGGED_IN, loggedIn.toString());
    if (!loggedIn) {
      setUserRoleState(null);
      setUserProfileState(null);
      LocalStorageUtil.removeItem(Constants.USER_LOGGED_IN);
      LocalStorageUtil.removeItem(Constants.ACCESS_TOKEN);
      LocalStorageUtil.removeItem(Constants.TOKEN_EXPIRATION_TIME);
      LocalStorageUtil.removeItem(Constants.USER_PROFILE);
      LocalStorageUtil.removeItem('USER_TENANTS');
      localStorage.removeItem('sys_perm_data');
      localStorage.removeItem('sys_check');
    }
  };

  const setUserProfile = (profile: UserProfile | null) => {
    setUserProfileState(profile);
    if (profile) {
      LocalStorageUtil.setItemObject(Constants.USER_PROFILE, JSON.stringify(profile));
      // Extract and store user preferences from login response
      if ((profile as any).userpresence && Array.isArray((profile as any).userpresence)) {
        console.log('Loading user preferences from login response:', (profile as any).userpresence);
        setUserPreferencesState((profile as any).userpresence);
      } else if (profile.userId) {
        // Load preferences from API if not in login response
        loadUserPreferences(profile.userId);
      }
      // Extract and store tenant information from login response
      if ((profile as any).tenant && Array.isArray((profile as any).tenant)) {
        console.log('Loading user tenants from login response:', (profile as any).tenant);
        setUserTenantsState((profile as any).tenant);
        LocalStorageUtil.setItemObject('USER_TENANTS', JSON.stringify((profile as any).tenant));
      }
    } else {
      LocalStorageUtil.removeItem(Constants.USER_PROFILE);
      setUserPreferencesState([]);
      setUserTenantsState([]);
    }
  };

  const setUserPreferences = (preferences: UserPreference[]) => {
    console.log('Setting user preferences:', preferences);
    setUserPreferencesState(preferences);
  };

  const setUserTenants = (tenants: any[]) => {
    setUserTenantsState(tenants);
    LocalStorageUtil.setItemObject('USER_TENANTS', JSON.stringify(tenants));
  };

  const loadUserPreferences = async (userId: number) => {
    try {
      const storedProfile = LocalStorageUtil.getItemObject(Constants.USER_PROFILE);
      if (storedProfile) {
        const profile = JSON.parse(storedProfile as string);
        if (profile.isMasterAdmin || !profile.tenant || profile.tenant.length === 0) {
          console.log('Skipping user preferences for master admin');
          return;
        }
      }
      
      const response = await userPreferencesService.getUserPreferencesByUserId(userId);
      if (Array.isArray(response)) {
        setUserPreferencesState(response);
        console.log('Loaded user preferences:', response);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const getPreferencesForGrid = (gridName: string): UserPreference | null => {
    return userPreferences.find(p => p.gridName === gridName) || null;
  };

  const updateUserPreference = (gridName: string, preferences: any) => {
    setUserPreferencesState(prev => {
      const existing = prev.find(p => p.gridName === gridName);
      if (existing) {
        return prev.map(p => 
          p.gridName === gridName 
            ? { ...p, preferencesJson: JSON.stringify(preferences) }
            : p
        );
      } else {
        return [...prev, {
          id: 0,
          userId: userProfile?.userId || 0,
          gridName,
          preferencesJson: JSON.stringify(preferences),
          createdDate: new Date().toISOString(),
          createdBy: userProfile?.userId || 0,
          modifiedBy: userProfile?.userId || 0,
          modifiedDate: new Date().toISOString()
        }];
      }
    });
  };

  return (
    <AuthContext.Provider value={{ 
      userRole, 
      setUserRole, 
      isLoggedIn, 
      setIsLoggedIn, 
      userProfile, 
      setUserProfile, 
      userPreferences, 
      setUserPreferences, 
      updateUserPreference,
      loadUserPreferences,
      getPreferencesForGrid,
      userTenants,
      setUserTenants
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};