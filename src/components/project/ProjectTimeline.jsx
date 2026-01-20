import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

const eventIcons = {
  created: Calendar,
  rescheduled: MapPin,
  shoot_completed: CheckCircle2,
  editing_started: Clock,
  files_delivered: Upload,
  invoice_created: FileText,
  completed: CheckCircle2,
};

export default function ProjectTimeline({ project }) {
  const events = [];

  // Project created
  if (project.created_date) {
    events.push({
      type: 'created',
      label: 'Project ingepland',
      date: project.created_date,
      icon: eventIcons.created,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    });
  }

  // Shoot executed
  if (project.status === 'shoot_uitgevoerd' || project.status === 'wordt_bewerkt' || project.status === 'klaar') {
    const shootDate = project.shoot_date || project.created_date;
    events.push({
      type: 'shoot_completed',
      label: 'Shoot uitgevoerd',
      date: shootDate,
      icon: eventIcons.shoot_completed,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    });
  }

  // In editing
  if (project.status === 'wordt_bewerkt' || project.status === 'klaar') {
    events.push({
      type: 'editing_started',
      label: 'In bewerking',
      date: project.updated_date,
      icon: eventIcons.editing_started,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    });
  }

  // Files delivered & completed
  if (project.status === 'klaar' && project.completed_date) {
    events.push({
      type: 'files_delivered',
      label: 'Bestanden opgeleverd',
      date: project.completed_date,
      icon: eventIcons.files_delivered,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    });
    events.push({
      type: 'completed',
      label: 'Project afgerond',
      date: project.completed_date,
      icon: eventIcons.completed,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    });
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Projectgeschiedenis</h2>
      
      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={`${event.type}-${index}`} className="flex gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", event.bgColor)}>
                <Icon className={cn("w-5 h-5", event.color)} />
              </div>
              <div className="flex-1 pt-1">
                <p className="font-medium text-gray-900">{event.label}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {format(new Date(event.date), 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}