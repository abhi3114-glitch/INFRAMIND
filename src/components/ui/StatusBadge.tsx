import React from 'react';
import { cn, getStatusColor } from '../../lib/utils';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'running';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'md',
  showIcon = true 
}) => {
  const getIcon = () => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'unhealthy':
        return '✗';
      case 'running':
        return '⟳';
      default:
        return '?';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-3 py-2 text-sm';
      default:
        return 'px-2.5 py-1 text-xs';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      getStatusColor(status),
      getSizeClasses()
    )}>
      {showIcon && <span className="mr-1">{getIcon()}</span>}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};