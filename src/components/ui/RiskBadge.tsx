import React from 'react';
import { cn, getRiskColor } from '../../lib/utils';

interface RiskBadgeProps {
  risk: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  risk, 
  size = 'md',
  showIcon = true 
}) => {
  const getIcon = () => {
    switch (risk) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
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
      'inline-flex items-center rounded-full font-medium',
      getRiskColor(risk),
      getSizeClasses()
    )}>
      {showIcon && <span className="mr-1">{getIcon()}</span>}
      {risk.charAt(0).toUpperCase() + risk.slice(1)} Risk
    </span>
  );
};