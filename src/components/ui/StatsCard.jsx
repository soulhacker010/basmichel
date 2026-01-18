import React from 'react';
import { cn } from '@/lib/utils';

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon,
  trend,
  className 
}) {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-100 p-6 transition-shadow hover:shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-light text-gray-900">{value}</p>
          {trend && (
            <p className={cn(
              "mt-2 text-xs",
              trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
            )}>
              {trend > 0 ? '+' : ''}{trend}% ten opzichte van vorige maand
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-[#E8EDE5] rounded-lg">
            <Icon className="w-5 h-5 text-[#5C6B52]" />
          </div>
        )}
      </div>
    </div>
  );
}