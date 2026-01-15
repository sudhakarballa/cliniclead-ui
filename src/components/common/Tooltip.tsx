import React, { ReactNode } from 'react';
import { Tooltip as MuiTooltip, TooltipProps } from '@mui/material';

interface CustomTooltipProps {
  title: string;
  children: ReactNode;
  placement?: TooltipProps['placement'];
  arrow?: boolean;
}

export const Tooltip: React.FC<CustomTooltipProps> = ({ 
  title, 
  children, 
  placement = 'top',
  arrow = true 
}) => {
  if (!title) return <>{children}</>;
  
  return (
    <MuiTooltip 
      title={title} 
      placement={placement}
      arrow={arrow}
      enterDelay={300}
      leaveDelay={0}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {children}
      </span>
    </MuiTooltip>
  );
};
