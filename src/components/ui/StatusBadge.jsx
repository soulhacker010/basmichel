import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Project statuses (new)
  geboekt: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Geboekt' },
  shoot_uitgevoerd: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Shoot uitgevoerd' },
  wordt_bewerkt: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Wordt bewerkt' },
  klaar: { bg: 'bg-green-50', text: 'text-green-700', label: 'Klaar' },
  
  // Legacy statuses
  lead: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Lead' },
  in_behandeling: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'In behandeling' },
  afgerond: { bg: 'bg-green-50', text: 'text-green-700', label: 'Afgerond' },
  
  // Gallery statuses
  concept: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Concept' },
  gepubliceerd: { bg: 'bg-green-50', text: 'text-green-700', label: 'Gepubliceerd' },
  gearchiveerd: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Gearchiveerd' },
  
  // Session statuses
  aanvraag: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Aanvraag' },
  wachten_op_klant: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Wachten op klant' },
  bevestigd: { bg: 'bg-green-50', text: 'text-green-700', label: 'Bevestigd' },
  geannuleerd: { bg: 'bg-red-50', text: 'text-red-700', label: 'Geannuleerd' },
  
  // Contract statuses
  verzonden: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Verzonden' },
  ondertekend: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ondertekend' },
  
  // Questionnaire statuses
  ingevuld: { bg: 'bg-green-50', text: 'text-green-700', label: 'Ingevuld' },
  
  // Quote statuses
  geaccepteerd: { bg: 'bg-green-50', text: 'text-green-700', label: 'Geaccepteerd' },
  afgewezen: { bg: 'bg-red-50', text: 'text-red-700', label: 'Afgewezen' },
  verlopen: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Verlopen' },
};

export default function StatusBadge({ status, className }) {
  const style = statusStyles[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      style.bg,
      style.text,
      className
    )}>
      {style.label}
    </span>
  );
}