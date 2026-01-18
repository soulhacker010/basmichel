import React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function DataTable({ 
  columns, 
  data, 
  onRowClick,
  emptyState,
  className 
}) {
  if (!data || data.length === 0) {
    return emptyState || null;
  }

  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
            {columns.map((column, index) => (
              <TableHead 
                key={index} 
                className={cn(
                  "text-xs font-medium text-gray-500 uppercase tracking-wider",
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow 
              key={row.id || rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-gray-50"
              )}
            >
              {columns.map((column, colIndex) => (
                <TableCell key={colIndex} className={cn("py-4", column.cellClassName)}>
                  {column.cell ? column.cell(row) : row[column.accessor]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}