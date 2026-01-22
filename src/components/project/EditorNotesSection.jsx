import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { FileText } from 'lucide-react';

export default function EditorNotesSection({ projectId }) {
  const { data: editorNotes = [] } = useQuery({
    queryKey: ['editorNotes', projectId],
    queryFn: () => base44.entities.EditorNote.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
  });

  const { data: editors = [] } = useQuery({
    queryKey: ['editors'],
    queryFn: () => base44.entities.Editor.list(),
  });

  if (editorNotes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p>Nog geen notities van editors</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {editorNotes.map(note => {
        const editor = editors.find(e => e.id === note.editor_id);
        return (
          <div key={note.id} className="border border-gray-100 rounded-xl p-6 bg-gray-50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{editor?.name || 'Editor'}</p>
                <p className="text-xs text-gray-400">
                  {format(new Date(note.created_date), 'd MMMM yyyy HH:mm', { locale: nl })}
                </p>
              </div>
              {editor?.specialization && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {editor.specialization.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-3">{note.note}</p>
            {note.images && note.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {note.images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt="" 
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(img, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}