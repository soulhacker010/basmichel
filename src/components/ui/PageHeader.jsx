import React from 'react';
import { cn } from '@/lib/utils';

export default function PageHeader({ 
  title, 
  description, 
  actions,
  className 
}) {
  return (
    <div className={cn("mb-10", className)}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-400">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}