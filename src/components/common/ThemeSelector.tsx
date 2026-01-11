import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faChevronDown, faCheck, faUndo } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import './ThemeSelector.css';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, resetTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleThemeChange = async (themeId: string) => {
    try {
      await setTheme(themeId);
      const selectedTheme = availableThemes.find(t => t.id === themeId);
      toast.success(`Theme changed to ${selectedTheme?.displayName}`);
    } catch (error) {
      toast.error('Failed to save theme preference');
    }
    setIsOpen(false);
  };

  const handleResetTheme = async () => {
    try {
      await resetTheme();
      toast.success('Theme reset to default');
    } catch (error) {
      toast.error('Failed to reset theme');
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="theme-selector" ref={dropdownRef}>
      <button 
        className="theme-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Change Theme"
      >
        <FontAwesomeIcon icon={faPalette} />
        <FontAwesomeIcon icon={faChevronDown} className="dropdown-arrow" />
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          {availableThemes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-option ${currentTheme.id === theme.id ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <div 
                className="theme-color-preview" 
                style={{ backgroundColor: theme.primaryColor }}
              ></div>
              <span>{theme.displayName}</span>
              {currentTheme.id === theme.id && (
                <FontAwesomeIcon icon={faCheck} className="theme-selected-icon" />
              )}
            </div>
          ))}
          <div className="theme-divider"></div>
          <div
            className="theme-option theme-reset"
            onClick={handleResetTheme}
          >
            <FontAwesomeIcon icon={faUndo} className="theme-reset-icon" />
            <span>Reset to Default</span>
          </div>
        </div>
      )}
    </div>
  );
};