import { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from 'react-toastify';
import { UserPreferences } from '../models/userPreferences';
import { UserPreferencesService } from '../services/userPreferencesService';
import { useAuthContext } from '../contexts/AuthContext';

export interface GridPreferences {
  columnOrder?: string[];
  columnWidths?: { [key: string]: number };
  sortModel?: { field: string; sort: 'asc' | 'desc' }[];
  filterModel?: any;
  hiddenColumns?: string[];
}

export const useGridPreferences = (gridName: string) => {
  const { userProfile, userPreferences, setUserPreferences, updateUserPreference, getPreferencesForGrid } = useAuthContext();
  const [preferences, setPreferences] = useState<GridPreferences>({});
  const [originalPreferences, setOriginalPreferences] = useState<GridPreferences>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [hasExistingPreferences, setHasExistingPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const userPreferencesService = new UserPreferencesService(ErrorBoundary);

  // Load preferences from AuthContext
  useEffect(() => {
    const userPref = getPreferencesForGrid(gridName);
    if (userPref?.preferencesJson) {
      try {
        const parsed = JSON.parse(userPref.preferencesJson);
        setPreferences(parsed);
        setOriginalPreferences(parsed);
        setHasExistingPreferences(true);
      } catch (error) {
        console.warn('Failed to parse grid preferences:', error);
      }
    } else {
      setPreferences({});
      setOriginalPreferences({});
      setHasExistingPreferences(false);
    }
    setHasChanges(false);
  }, [userPreferences, gridName, getPreferencesForGrid]);

  // Track changes in preferences
  useEffect(() => {
    const hasChanged = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(hasChanged);
  }, [preferences, originalPreferences]);



  const savePreferences = async (newPreferences: GridPreferences) => {
    if (!userProfile?.userId) {
      toast.error('User session not available');
      return;
    }

    setIsLoading(true);
    try {
      const existingPref = getPreferencesForGrid(gridName);
      const userPrefs = new UserPreferences(
        existingPref?.id || 0,
        userProfile.userId,
        gridName,
        JSON.stringify(newPreferences),
        userProfile.userId,
        userProfile.userId
      );

      const result = await (existingPref?.id 
        ? userPreferencesService.updateUserPreferences(userPrefs)
        : userPreferencesService.addUserPreferences(userPrefs));
      
      // Update context directly instead of fetching all preferences
      if (existingPref?.id) {
        const updated = userPreferences.map(p => 
          p.id === existingPref.id ? { ...p, preferencesJson: JSON.stringify(newPreferences) } : p
        );
        setUserPreferences(updated);
      } else if (result && (result as any).id) {
        setUserPreferences([...userPreferences, {
          id: (result as any).id,
          userId: userProfile.userId,
          gridName,
          preferencesJson: JSON.stringify(newPreferences),
          createdDate: new Date().toISOString(),
          createdBy: userProfile.userId,
          modifiedBy: userProfile.userId,
          modifiedDate: new Date().toISOString()
        }]);
      }
      
      toast.success('Grid preferences saved');
      
      setPreferences(newPreferences);
      setOriginalPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save grid preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPreferences = async () => {
    if (!userProfile?.userId) {
      toast.error('User session not available');
      return;
    }

    const existingPref = getPreferencesForGrid(gridName);
    
    if (existingPref?.id) {
      setIsLoading(true);
      try {
        await userPreferencesService.deleteUserPreferences(existingPref.id);
        
        // Update the context to remove the deleted preference
        const updatedPreferences = userPreferences.filter(p => p.id !== existingPref.id);
        setUserPreferences(updatedPreferences);
        
        // Clear local state immediately
        setPreferences({});
        setOriginalPreferences({});
        setHasExistingPreferences(false);
        
        // Trigger reset for components to listen to
        setResetTrigger(prev => prev + 1);
        
        toast.success('Grid preferences reset to default');
        
      } catch (error) {
        console.error('Failed to reset grid preferences:', error);
        toast.error('Failed to reset preferences');
      } finally {
        setIsLoading(false);
      }
    } else {
      // No existing preferences to delete, just clear local state
      setPreferences({});
      setOriginalPreferences({});
      setHasExistingPreferences(false);
      
      // Trigger reset for components to listen to
      setResetTrigger(prev => prev + 1);
      
      toast.success('Grid preferences reset to default');
    }
  };

  const updatePreferences = (newPreferences: GridPreferences) => {
    setPreferences(newPreferences);
  };

  return {
    preferences,
    savePreferences,
    resetPreferences,
    updatePreferences,
    isLoading,
    hasChanges,
    hasExistingPreferences,
    resetTrigger
  };
};