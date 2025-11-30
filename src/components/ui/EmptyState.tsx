import React from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4',
      className
    )}>
      {icon && (
        <div className="flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-full mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-secondary-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-secondary-600 text-center mb-6 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};