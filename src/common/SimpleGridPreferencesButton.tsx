import React, { useState } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faUndo } from '@fortawesome/free-solid-svg-icons';
import { GridPreferences, useGridPreferences } from '../hooks/useGridPreferences';
import { DeleteDialog } from './deleteDialog';
import Util from '../others/util';

interface SimpleGridPreferencesButtonProps {
  gridName?: string;
  currentPreferences?: GridPreferences;
  getCurrentPreferences?: () => GridPreferences;
  onSave?: () => void;
  onReset?: () => void;
  hasChanges?: boolean;
  hasExistingPreferences?: boolean;
}

const SimpleGridPreferencesButton: React.FC<SimpleGridPreferencesButtonProps> = ({
  gridName = 'default-grid',
  currentPreferences = {},
  getCurrentPreferences,
  onSave,
  onReset,
  hasChanges = false,
  hasExistingPreferences = false
}) => {
  const { savePreferences, resetPreferences, updatePreferences, isLoading } = useGridPreferences(gridName);
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const isMasterAdmin = Util.isMasterAdmin();

  if (isMasterAdmin) {
    return null;
  }



  const handleSave = () => {
    if (onSave) {
      onSave();
    } else {
      const prefsToSave = getCurrentPreferences ? getCurrentPreferences() : currentPreferences;
      savePreferences(prefsToSave);
    }
  };

  const handleReset = () => {
    setShowResetDialog(true);
  };

  const confirmReset = () => {
    setShowResetDialog(false);
    if (onReset) {
      onReset();
    } else {
      resetPreferences();
    }
  };

  // Consistent button style to match toolbar buttons
  const buttonStyle: React.CSSProperties = {
    minWidth: 80,
    minHeight: 40,
    fontWeight: 500,
    padding: '0 16px',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };

  return (
    <>
      <DeleteDialog
        itemType="Grid Preferences"
        itemName="preferences"
        dialogIsOpen={showResetDialog}
        closeDialog={() => setShowResetDialog(false)}
        onConfirm={confirmReset}
        isPromptOnly={false}
        actionType="Reset"
      />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button
        variant="outline-success"
        size="sm"
        onClick={handleSave}
        disabled={isLoading || !hasChanges}
        title={hasChanges ? "Save current grid layout" : "No changes to save"}
        style={buttonStyle}
      >
        <FontAwesomeIcon icon={faSave} size="sm" />
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
      <Button
        variant="outline-warning"
        size="sm"
        onClick={handleReset}
        disabled={isLoading || (!hasChanges && !hasExistingPreferences)}
        title={hasExistingPreferences ? "Reset grid to default layout" : "No preferences to reset"}
        style={buttonStyle}
      >
        <FontAwesomeIcon icon={faUndo} size="sm" />
        Reset
      </Button>
      </div>
    </>
  );
};

export default SimpleGridPreferencesButton;