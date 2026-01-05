import React from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import { GridPreferences, useGridPreferences } from '../hooks/useGridPreferences';
import Util from '../others/util';

interface GridPreferencesButtonProps {
  gridName: string;
  currentPreferences: GridPreferences;
  onPreferencesLoaded?: (preferences: GridPreferences) => void;
  onResetPreferences?: () => void;
}

const GridPreferencesButton: React.FC<GridPreferencesButtonProps> = ({
  gridName,
  currentPreferences,
  onPreferencesLoaded,
  onResetPreferences
}) => {
  console.log('GridPreferencesButton rendering for:', gridName);
  
  const { preferences, savePreferences, resetPreferences, isLoading } = useGridPreferences(gridName);
  const [hasError, setHasError] = React.useState(false);
  
  const isMasterAdmin = Util.isMasterAdmin();

  if (isMasterAdmin) {
    return null;
  }

  // Notify parent when preferences are loaded
  React.useEffect(() => {
    try {
      if (preferences && Object.keys(preferences).length > 0 && onPreferencesLoaded) {
        onPreferencesLoaded(preferences);
      }
    } catch (error) {
      console.error('Error in preferences effect:', error);
      setHasError(true);
    }
  }, [preferences, onPreferencesLoaded]);

  const handleSave = () => {
    try {
      savePreferences(currentPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setHasError(true);
    }
  };

  const handleReset = () => {
    try {
      // Call parent reset handler first if provided
      if (onResetPreferences) {
        onResetPreferences();
      }
      // Then reset preferences in the hook
      resetPreferences();
    } catch (error) {
      console.error('Error resetting preferences:', error);
      setHasError(true);
    }
  };

  // Show fallback UI if there's an error
  if (hasError) {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        <Button size="sm" variant="outline-primary" disabled>
          Save
        </Button>
        <Button size="sm" variant="outline-secondary" disabled>
          Reset
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '4px', border: '1px solid #ddd', padding: '4px', borderRadius: '4px' }}>
      <ButtonGroup size="sm">
        <Button
          variant="outline-primary"
          onClick={handleSave}
          disabled={isLoading}
          title="Save current grid layout"
        >
          <FontAwesomeIcon icon={faSave} />
          {isLoading ? ' Saving...' : ' Save'}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={handleReset}
          disabled={isLoading}
          title="Reset grid to default layout"
        >
          <FontAwesomeIcon icon={faUndo} />
          Reset
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default GridPreferencesButton;