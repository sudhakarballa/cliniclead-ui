import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  Chip,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  TrackChanges as TrackChangesIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

interface CreateButtonProps {
  onSelect: (type: string) => void;
}

const CreateButton: React.FC<CreateButtonProps> = ({ onSelect }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (type: string) => {
    onSelect(type);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleClick}
        sx={{
          backgroundColor: '#22C55E',
          '&:hover': {
            backgroundColor: '#16A34A',
          },
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '8px',
          width: '100%',
          marginBottom: '15px'
        }}
      >
        Create
      </Button>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            minWidth: 240,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem 
          onClick={() => handleSelect('report')}
          sx={{ 
            padding: '8px 16px',
            minHeight: 'auto'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            gap: '12px'
          }}>
            <BarChartIcon sx={{ color: '#000', fontSize: '20px' }} />
            <Box sx={{ fontSize: '14px' }}>Report</Box>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleSelect('dashboard')}
          sx={{ 
            padding: '8px 16px',
            minHeight: 'auto'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            width: '100%',
            gap: '12px'
          }}>
            <DashboardIcon sx={{ color: '#000', fontSize: '20px' }} />
            <Box sx={{ fontSize: '14px' }}>Dashboard</Box>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CreateButton;